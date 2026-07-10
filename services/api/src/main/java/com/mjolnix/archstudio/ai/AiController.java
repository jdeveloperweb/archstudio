package com.mjolnix.archstudio.ai;

import com.mjolnix.archstudio.ai.dto.AiDtos.ChatRequest;
import com.mjolnix.archstudio.ai.dto.AiDtos.ChatResponse;
import com.mjolnix.archstudio.security.CurrentUser;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/ai")
public class AiController {

    private final AiService ai;

    public AiController(AiService ai) {
        this.ai = ai;
    }

    @PostMapping("/chat")
    public ChatResponse chat(@Valid @RequestBody ChatRequest req) {
        return ai.chat(CurrentUser.get().id(), req);
    }
}
