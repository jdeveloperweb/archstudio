package com.mjolnix.archstudio.settings.dto;

import jakarta.validation.constraints.NotBlank;

public final class SettingsDtos {
    private SettingsDtos() {}

    public record SettingsResponse(String provider, String model, String baseUrl, boolean hasKey) {}

    public record SaveSettingsRequest(
            @NotBlank(message = "Escolha um provedor") String provider,
            String model,
            String baseUrl,
            String apiKey) {}
}
