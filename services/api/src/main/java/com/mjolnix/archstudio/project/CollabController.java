package com.mjolnix.archstudio.project;

import com.mjolnix.archstudio.domain.Project;
import com.mjolnix.archstudio.project.dto.ProjectDtos.CollabDoc;
import com.mjolnix.archstudio.web.ApiException;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * Public entry point for the invite link. No auth: whoever holds the token may
 * open the shared diagram (that is the chosen sharing model). The live editing
 * then happens over the {@code /ws/collab} WebSocket, also gated by the token.
 */
@RestController
@RequestMapping("/api/v1/collab")
public class CollabController {

    private final ProjectService service;

    public CollabController(ProjectService service) {
        this.service = service;
    }

    /** Bootstrap the shared diagram (id + name + current doc) for anyone with the link. */
    @GetMapping("/{token}")
    public CollabDoc open(@PathVariable String token) {
        Project p = service.byShareToken(token)
                .orElseThrow(() -> new ApiException("NOT_FOUND", HttpStatus.NOT_FOUND,
                        "Este link de colaboração não é válido ou foi revogado."));
        return new CollabDoc(p.getId().toString(), p.getName(), service.parseDoc(p));
    }
}
