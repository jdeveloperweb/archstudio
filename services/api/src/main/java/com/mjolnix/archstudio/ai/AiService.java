package com.mjolnix.archstudio.ai;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.mjolnix.archstudio.ai.dto.AiDtos.ChatRequest;
import com.mjolnix.archstudio.ai.dto.AiDtos.ChatResponse;
import com.mjolnix.archstudio.settings.SettingsService;
import com.mjolnix.archstudio.settings.SettingsService.ResolvedProvider;
import com.mjolnix.archstudio.web.ApiException;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

import java.util.UUID;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Service
public class AiService {

    private static final Pattern FENCE_ARCH =
            Pattern.compile("```\\s*archstudio\\s*([\\s\\S]*?)```", Pattern.CASE_INSENSITIVE);
    private static final Pattern FENCE_ANY =
            Pattern.compile("```(?:json)?\\s*([\\s\\S]*?)```", Pattern.CASE_INSENSITIVE);

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
        String system = SystemPrompt.build(diagramJson);

        String text = client.complete(p, system, req.messages());

        JsonNode spec = extractSpec(text);
        String reply = stripFences(text).trim();
        if (reply.isEmpty()) {
            reply = spec != null ? "Pronto — atualizei o desenho no canvas." : text.trim();
        }
        return new ChatResponse(reply, spec);
    }

    private JsonNode extractSpec(String text) {
        if (text == null) {
            return null;
        }
        Matcher m = FENCE_ARCH.matcher(text);
        if (m.find()) {
            JsonNode n = tryParse(m.group(1));
            if (n != null) {
                return n;
            }
        }
        // fallback: any fenced block that looks like an ArchStudio spec
        Matcher any = FENCE_ANY.matcher(text);
        while (any.find()) {
            JsonNode n = tryParse(any.group(1));
            if (n != null && (n.has("nodes") || n.has("boxes"))) {
                return n;
            }
        }
        return null;
    }

    private JsonNode tryParse(String raw) {
        try {
            JsonNode n = mapper.readTree(raw.trim());
            return n.isObject() ? n : null;
        } catch (Exception e) {
            return null;
        }
    }

    private String stripFences(String text) {
        if (text == null) {
            return "";
        }
        return text.replaceAll("```\\s*archstudio[\\s\\S]*?```", "").trim();
    }
}
