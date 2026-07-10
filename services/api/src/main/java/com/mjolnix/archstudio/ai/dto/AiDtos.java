package com.mjolnix.archstudio.ai.dto;

import com.fasterxml.jackson.databind.JsonNode;
import jakarta.validation.constraints.NotEmpty;

import java.util.List;

public final class AiDtos {
    private AiDtos() {}

    public record Msg(String role, String content) {}

    public record ChatRequest(
            @NotEmpty(message = "Envie ao menos uma mensagem") List<Msg> messages,
            JsonNode diagram) {}

    public record ChatResponse(String reply, JsonNode spec) {}
}
