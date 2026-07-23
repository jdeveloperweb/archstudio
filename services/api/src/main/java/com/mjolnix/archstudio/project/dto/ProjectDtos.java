package com.mjolnix.archstudio.project.dto;

import com.fasterxml.jackson.databind.JsonNode;
import com.mjolnix.archstudio.domain.Project;

import java.time.Instant;

public final class ProjectDtos {
    private ProjectDtos() {}

    public record ProjectMeta(String id, String name, Instant updatedAt) {
        public static ProjectMeta from(Project p) {
            return new ProjectMeta(p.getId().toString(), p.getName(), p.getUpdatedAt());
        }
    }

    public record ProjectFull(String id, String name, JsonNode doc, Instant updatedAt, String shareToken) {}

    public record SaveProjectRequest(String name, JsonNode doc) {}

    /** Returned to the owner when the invite link is created/queried. */
    public record ShareInfo(String token) {}

    /** Public bootstrap for anyone opening an invite link (no auth). */
    public record CollabDoc(String projectId, String name, JsonNode doc) {}
}
