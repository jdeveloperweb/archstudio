package com.mjolnix.archstudio.settings;

import com.mjolnix.archstudio.domain.UserSettings;
import com.mjolnix.archstudio.repo.UserSettingsRepository;
import com.mjolnix.archstudio.service.CryptoService;
import com.mjolnix.archstudio.settings.dto.SettingsDtos.SaveSettingsRequest;
import com.mjolnix.archstudio.settings.dto.SettingsDtos.SettingsResponse;
import com.mjolnix.archstudio.web.ApiException;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;
import java.util.UUID;

@Service
public class SettingsService {

    private final UserSettingsRepository repo;
    private final CryptoService crypto;

    public SettingsService(UserSettingsRepository repo, CryptoService crypto) {
        this.repo = repo;
        this.crypto = crypto;
    }

    public SettingsResponse get(UUID userId) {
        UserSettings s = repo.findById(userId).orElse(null);
        if (s == null) {
            Providers.Def d = Providers.def("openai");
            return new SettingsResponse("openai", d.defaultModel(), "", false);
        }
        return new SettingsResponse(s.getProvider(), s.getModel(), s.getBaseUrl(), s.getApiKeyEnc() != null);
    }

    @Transactional
    public SettingsResponse save(UUID userId, SaveSettingsRequest req) {
        if (!Providers.isValid(req.provider())) {
            throw new ApiException("BAD_PROVIDER", HttpStatus.BAD_REQUEST, "Provedor não suportado.");
        }
        UserSettings s = repo.findById(userId).orElseGet(() -> new UserSettings(userId));
        s.setProvider(req.provider());
        String model = (req.model() == null || req.model().isBlank())
                ? Providers.def(req.provider()).defaultModel() : req.model().trim();
        s.setModel(model);
        String baseUrl = req.baseUrl() == null ? null : req.baseUrl().trim();
        if ("custom".equals(req.provider()) && baseUrl != null && !baseUrl.isBlank()) {
            com.mjolnix.archstudio.web.SsrfGuard.checkPublicHttpUrl(baseUrl);
        }
        s.setBaseUrl(baseUrl);
        if (req.apiKey() != null && !req.apiKey().isBlank()) {
            s.setApiKeyEnc(crypto.encrypt(req.apiKey().trim()));
        }
        repo.save(s);
        return new SettingsResponse(s.getProvider(), s.getModel(), s.getBaseUrl(), s.getApiKeyEnc() != null);
    }

    public record ResolvedProvider(String provider, String model, String baseUrl, String apiKey, String style) {}

    /** Returns the provider config with the decrypted key, or empty if no key configured. */
    public Optional<ResolvedProvider> resolve(UUID userId) {
        UserSettings s = repo.findById(userId).orElse(null);
        if (s == null || s.getApiKeyEnc() == null) {
            return Optional.empty();
        }
        Providers.Def d = Providers.def(s.getProvider());
        String baseUrl = (s.getBaseUrl() != null && !s.getBaseUrl().isBlank()) ? s.getBaseUrl().trim() : d.baseUrl();
        String model = (s.getModel() != null && !s.getModel().isBlank()) ? s.getModel() : d.defaultModel();
        return Optional.of(new ResolvedProvider(s.getProvider(), model, baseUrl, crypto.decrypt(s.getApiKeyEnc()), d.style()));
    }
}
