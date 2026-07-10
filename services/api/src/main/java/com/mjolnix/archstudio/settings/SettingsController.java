package com.mjolnix.archstudio.settings;

import com.mjolnix.archstudio.security.CurrentUser;
import com.mjolnix.archstudio.settings.dto.SettingsDtos.SaveSettingsRequest;
import com.mjolnix.archstudio.settings.dto.SettingsDtos.SettingsResponse;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/settings")
public class SettingsController {

    private final SettingsService service;

    public SettingsController(SettingsService service) {
        this.service = service;
    }

    @GetMapping
    public SettingsResponse get() {
        return service.get(CurrentUser.get().id());
    }

    @PutMapping
    public SettingsResponse save(@Valid @RequestBody SaveSettingsRequest req) {
        return service.save(CurrentUser.get().id(), req);
    }
}
