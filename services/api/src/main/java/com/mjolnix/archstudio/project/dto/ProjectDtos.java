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

    public record ProjectFull(String id, String name, JsonNode doc, Instant updatedAt) {}

    public record SaveProjectRequest(String name, JsonNode doc) {}
}
