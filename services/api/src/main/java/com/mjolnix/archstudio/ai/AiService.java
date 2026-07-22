package com.mjolnix.archstudio.ai;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.mjolnix.archstudio.ai.dto.AiDtos.ChatRequest;
import com.mjolnix.archstudio.ai.dto.AiDtos.ChatResponse;
import com.mjolnix.archstudio.ai.dto.AiDtos.Msg;
import com.mjolnix.archstudio.settings.SettingsService;
import com.mjolnix.archstudio.settings.SettingsService.ResolvedProvider;
import com.mjolnix.archstudio.web.ApiException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Service
public class AiService {

    private static final Logger log = LoggerFactory.getLogger(AiService.class);

    private static final Pattern FENCE_ARCH =
            Pattern.compile("```\\s*archstudio\\s*([\\s\\S]*?)```", Pattern.CASE_INSENSITIVE);
    private static final Pattern FENCE_ANY =
            Pattern.compile("```(?:json)?\\s*([\\s\\S]*?)```", Pattern.CASE_INSENSITIVE);
    private static final Pattern FENCE_ARCH_OPEN =
            Pattern.compile("```\\s*archstudio\\s*", Pattern.CASE_INSENSITIVE);

    /** Verbos/termos que indicam que o usuário espera uma mudança no desenho. */
    private static final Pattern DRAW_INTENT = Pattern.compile(
            "(?iu)desenh|diagram|arquitetur|adicion|inclu|coloc|cri[ae]|remov|apag|tir[ae]|delet"
                    + "|conect|lig[aou]|mud[ae]|alter|atualiz|troc|substitu|renome|mont[ae]|ger[ae]"
                    + "|evolu|insir|bote|acrescent|refa[cç]|redesenh|ajust|melhor|otimiz|suger"
                    + "|sugest|recomend|fortalec|resilien|seguran|observabil|escala|custo");

    private static final String NUDGE =
            "Sua resposta anterior não trouxe o bloco ```archstudio. Como Ari, responda AGORA apenas com o "
                    + "bloco ```archstudio contendo a spec JSON completa e atualizada do diagrama — "
                    + "nenhum texto fora do bloco, e feche o bloco com ```.";

    private final SettingsService settings;
    private final ProviderClient client;
    private final ObjectMapper mapper;

    public AiService(SettingsService settings, ProviderClient client, ObjectMapper mapper) {
        this.settings = settings;
        this.client = client;
        this.mapper = mapper;
    }

    public ChatResponse chat(UUID userId, ChatRequest req) {
        ResolvedProvider p = settings.resolve(userId).orElseThrow(() ->
                new ApiException("NO_API_KEY", HttpStatus.BAD_REQUEST,
                        "Configure sua chave de API em Configurações para usar o assistente."));

        String diagramJson = req.diagram() == null || req.diagram().isNull() ? null : req.diagram().toString();
        String outline = DiagramContext.describe(req.diagram());
        String system = SystemPrompt.build(outline, diagramJson);

        String text = client.complete(p, system, req.messages());
        Extraction ex = extract(text);

        // O usuário pediu desenho e o modelo não mandou o bloco (ou veio truncado):
        // cobra o bloco uma vez antes de devolver só texto.
        // Se a Ari terminou perguntando (ex.: "ligo o Redis na API ou no Worker?"), respeite:
        // ela está esclarecendo onde conectar antes de desenhar — não force o bloco.
        if (ex.spec() == null && wantsDrawing(req.messages()) && !endsWithQuestion(ex.reply())) {
            log.info("ai.chat sem spec para pedido de desenho — solicitando o bloco novamente");
            List<Msg> retryMsgs = new ArrayList<>(req.messages());
            retryMsgs.add(new Msg("assistant", text));
            retryMsgs.add(new Msg("user", NUDGE));
            try {
                Extraction ex2 = extract(client.complete(p, system, retryMsgs));
                if (ex2.spec() != null) {
                    ex = new Extraction(ex2.spec(), ex.reply().isBlank() ? ex2.reply() : ex.reply());
                }
            } catch (ApiException e) {
                log.warn("ai.chat retry do bloco falhou: {}", e.getMessage());
            }
        }

        String reply = ex.reply().trim();
        if (reply.isEmpty()) {
            reply = ex.spec() != null ? "Pronto — atualizei o desenho no canvas." : text.trim();
        }
        return new ChatResponse(reply, ex.spec());
    }

    /** A última linha não vazia termina com "?" — sinal de pergunta de esclarecimento deliberada. */
    static boolean endsWithQuestion(String reply) {
        if (reply == null || reply.isBlank()) {
            return false;
        }
        String[] lines = reply.trim().split("\\R");
        for (int i = lines.length - 1; i >= 0; i--) {
            String l = lines[i].trim();
            if (!l.isEmpty()) {
                return l.endsWith("?");
            }
        }
        return false;
    }

    private boolean wantsDrawing(List<Msg> messages) {
        for (int i = messages.size() - 1; i >= 0; i--) {
            if ("user".equals(messages.get(i).role())) {
                String c = messages.get(i).content();
                return c != null && DRAW_INTENT.matcher(c).find();
            }
        }
        return false;
    }

    record Extraction(JsonNode spec, String reply) {}

    /**
     * Extrai a spec do texto do modelo tolerando os defeitos comuns:
     * bloco ```archstudio fechado, bloco ```json, fence sem fechamento
     * (resposta truncada) e JSON solto no meio do texto. A resposta visível
     * sai sem o bloco.
     */
    Extraction extract(String text) {
        if (text == null) {
            return new Extraction(null, "");
        }
        Matcher m = FENCE_ARCH.matcher(text);
        if (m.find()) {
            JsonNode n = tryParse(balancedJson(m.group(1)));
            if (n != null) {
                return new Extraction(n, text.replace(m.group(0), " "));
            }
        }
        Matcher any = FENCE_ANY.matcher(text);
        while (any.find()) {
            JsonNode n = tryParse(balancedJson(any.group(1)));
            if (isSpec(n)) {
                return new Extraction(n, text.replace(any.group(0), " "));
            }
        }
        Matcher open = FENCE_ARCH_OPEN.matcher(text);
        if (open.find()) {
            JsonNode n = tryParse(balancedJson(text.substring(open.end())));
            if (isSpec(n)) {
                return new Extraction(n, text.substring(0, open.start()));
            }
        }
        int idx = 0;
        while ((idx = text.indexOf('{', idx)) >= 0) {
            String bal = balancedJson(text.substring(idx));
            if (bal == null) {
                idx++;
                continue;
            }
            JsonNode n = tryParse(bal);
            if (isSpec(n)) {
                return new Extraction(n, text.substring(0, idx) + text.substring(idx + bal.length()));
            }
            idx += Math.max(1, bal.length());
        }
        return new Extraction(null, dropDanglingFence(text));
    }

    /** Devolve o objeto JSON balanceado que começa no primeiro '{', ou null se nunca fecha. */
    static String balancedJson(String s) {
        if (s == null) {
            return null;
        }
        int start = s.indexOf('{');
        if (start < 0) {
            return null;
        }
        boolean inStr = false;
        boolean esc = false;
        int depth = 0;
        for (int i = start; i < s.length(); i++) {
            char c = s.charAt(i);
            if (esc) {
                esc = false;
                continue;
            }
            if (inStr) {
                if (c == '\\') {
                    esc = true;
                } else if (c == '"') {
                    inStr = false;
                }
                continue;
            }
            if (c == '"') {
                inStr = true;
            } else if (c == '{') {
                depth++;
            } else if (c == '}' && --depth == 0) {
                return s.substring(start, i + 1);
            }
        }
        return null;
    }

    private boolean isSpec(JsonNode n) {
        return n != null && n.isObject() && (n.has("nodes") || n.has("boxes"));
    }

    private JsonNode tryParse(String raw) {
        if (raw == null) {
            return null;
        }
        try {
            JsonNode n = mapper.readTree(raw.trim());
            return n.isObject() ? n : null;
        } catch (Exception e) {
            return null;
        }
    }

    /** Tira do texto visível um fence que abriu e nunca fechou (resposta truncada). */
    private String dropDanglingFence(String text) {
        return text.replaceAll("(?is)```\\s*(?:archstudio|json)?\\s*\\{[\\s\\S]*$", "").trim();
    }
}
