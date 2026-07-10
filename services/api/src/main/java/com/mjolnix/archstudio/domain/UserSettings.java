package com.mjolnix.archstudio.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;

import java.time.Instant;
import java.util.UUID;

/**
 * Per-user AI provider configuration. Shares its primary key with
 * {@code users.id} (one row per user). {@code apiKeyEnc} holds the AES-256-GCM
 * encrypted provider API key produced by {@code CryptoService} — never the
 * plaintext key.
 */
@Entity
@Table(name = "user_settings")
public class UserSettings {

    @Id
    @Column(name = "user_id", nullable = false, updatable = false)
    private UUID userId;

    @Column(name = "provider", nullable = false, length = 32)
    private String provider = "openai";

    @Column(name = "model", length = 160)
    private String model;

    @Column(name = "base_url", length = 500)
    private String baseUrl;

    @Column(name = "api_key_enc", columnDefinition = "text")
    private String apiKeyEnc;

    @Column(name = "updated_at", nullable = false, columnDefinition = "timestamptz")
    private Instant updatedAt;

    public UserSettings() {
    }

    public UserSettings(UUID userId) {
        this.userId = userId;
    }

    @PrePersist
    @PreUpdate
    void touch() {
        updatedAt = Instant.now();
    }

    public UUID getUserId() {
        return userId;
    }

    public void setUserId(UUID userId) {
        this.userId = userId;
    }

    public String getProvider() {
        return provider;
    }

    public void setProvider(String provider) {
        this.provider = provider;
    }

    public String getModel() {
        return model;
    }

    public void setModel(String model) {
        this.model = model;
    }

    public String getBaseUrl() {
        return baseUrl;
    }

    public void setBaseUrl(String baseUrl) {
        this.baseUrl = baseUrl;
    }

    public String getApiKeyEnc() {
        return apiKeyEnc;
    }

    public void setApiKeyEnc(String apiKeyEnc) {
        this.apiKeyEnc = apiKeyEnc;
    }

    public Instant getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(Instant updatedAt) {
        this.updatedAt = updatedAt;
    }
}
