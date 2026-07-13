package com.mjolnix.archstudio.ai;

import com.fasterxml.jackson.databind.JsonNode;
import com.mjolnix.archstudio.ai.dto.AiDtos.Msg;
import com.mjolnix.archstudio.settings.Providers;
import com.mjolnix.archstudio.settings.SettingsService.ResolvedProvider;
import com.mjolnix.archstudio.web.ApiException;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.web.reactive.function.client.WebClientResponseException;

import java.time.Duration;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

/** Calls the user's chosen LLM provider and returns the assistant's text. */
@Service
public class ProviderClient {

    private final WebClient http = WebClient.builder()
            .codecs(c -> c.defaultCodecs().maxInMemorySize(4 * 1024 * 1024))
            .build();
    private static final Duration TIMEOUT = Duration.ofSeconds(90);
    private static final double TEMPERATURE = 0.35;
    private static final int MAX_OUTPUT_TOKENS = 8000;

    public String complete(ResolvedProvider p, String system, List<Msg> messages) {
        try {
            return switch (p.style()) {
                case Providers.STYLE_ANTHROPIC -> anthropic(p, system, messages);
                case Providers.STYLE_GOOGLE -> google(p, system, messages);
                default -> openai(p, system, messages);
            };
        } catch (WebClientResponseException e) {
            throw new ApiException("AI_PROVIDER", HttpStatus.BAD_GATEWAY,
                    "O provedor de IA recusou a requisição (" + e.getStatusCode().value()
                            + "). Verifique a chave/modelo em Configurações.");
        } catch (ApiException e) {
            throw e;
        } catch (Exception e) {
            throw new ApiException("AI_PROVIDER", HttpStatus.BAD_GATEWAY,
                    "Não foi possível falar com o provedor de IA.");
        }
    }

    private String openai(ResolvedProvider p, String system, List<Msg> messages) {
        List<Map<String, String>> msgs = new ArrayList<>();
        msgs.add(Map.of("role", "system", "content", system));
        for (Msg m : messages) {
            msgs.add(Map.of("role", "assistant".equals(m.role()) ? "assistant" : "user", "content", m.content()));
        }
        Map<String, Object> body = Map.of(
                "model", p.model(),
                "messages", msgs,
                "temperature", TEMPERATURE,
                "max_tokens", MAX_OUTPUT_TOKENS);
        JsonNode res = http.post().uri(p.baseUrl() + "/chat/completions")
                .header("Authorization", "Bearer " + p.apiKey())
                .bodyValue(body).retrieve().bodyToMono(JsonNode.class).block(TIMEOUT);
        return text(res == null ? null : res.at("/choices/0/message/content"));
    }

    private String anthropic(ResolvedProvider p, String system, List<Msg> messages) {
        List<Map<String, String>> msgs = new ArrayList<>();
        for (Msg m : messages) {
            msgs.add(Map.of("role", "assistant".equals(m.role()) ? "assistant" : "user", "content", m.content()));
        }
        Map<String, Object> body = Map.of(
                "model", p.model(),
                "max_tokens", MAX_OUTPUT_TOKENS,
                "temperature", TEMPERATURE,
                "system", system,
                "messages", msgs);
        JsonNode res = http.post().uri(p.baseUrl() + "/messages")
                .header("x-api-key", p.apiKey())
                .header("anthropic-version", "2023-06-01")
                .bodyValue(body).retrieve().bodyToMono(JsonNode.class).block(TIMEOUT);
        return text(res == null ? null : res.at("/content/0/text"));
    }

    private String google(ResolvedProvider p, String system, List<Msg> messages) {
        List<Map<String, Object>> contents = new ArrayList<>();
        for (Msg m : messages) {
            contents.add(Map.of(
                    "role", "assistant".equals(m.role()) ? "model" : "user",
                    "parts", List.of(Map.of("text", m.content()))));
        }
        Map<String, Object> body = Map.of(
                "systemInstruction", Map.of("parts", List.of(Map.of("text", system))),
                "contents", contents,
                "generationConfig", Map.of(
                        "temperature", TEMPERATURE,
                        "maxOutputTokens", MAX_OUTPUT_TOKENS));
        String url = p.baseUrl() + "/models/" + p.model() + ":generateContent?key=" + p.apiKey();
        JsonNode res = http.post().uri(url)
                .bodyValue(body).retrieve().bodyToMono(JsonNode.class).block(TIMEOUT);
        return text(res == null ? null : res.at("/candidates/0/content/parts/0/text"));
    }

    private String text(JsonNode node) {
        if (node == null || node.isMissingNode() || node.isNull()) {
            throw new ApiException("AI_EMPTY", HttpStatus.BAD_GATEWAY, "O provedor de IA não retornou resposta.");
        }
        return node.asText();
    }
}
