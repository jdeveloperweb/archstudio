package com.mjolnix.archstudio.project;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.mjolnix.archstudio.domain.Project;
import com.mjolnix.archstudio.repo.ProjectRepository;
import com.mjolnix.archstudio.web.ApiException;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
public class ProjectService {

    private final ProjectRepository repo;
    private final ObjectMapper mapper;

    public ProjectService(ProjectRepository repo, ObjectMapper mapper) {
        this.repo = repo;
        this.mapper = mapper;
    }

    public List<Project> list(UUID userId) {
        return repo.findByUserIdOrderByUpdatedAtDesc(userId);
    }

    @Transactional
    public Project create(UUID userId, String name, JsonNode doc) {
        String n = (name == null || name.isBlank()) ? "Novo diagrama" : name.trim();
        Project p = new Project(userId, n.substring(0, Math.min(n.length(), 200)), toJson(doc));
        return repo.save(p);
    }

    public Project get(UUID userId, UUID id) {
        return repo.findByIdAndUserId(id, userId)
                .orElseThrow(() -> new ApiException("NOT_FOUND", HttpStatus.NOT_FOUND, "Diagrama não encontrado."));
    }

    @Transactional
    public Project update(UUID userId, UUID id, String name, JsonNode doc) {
        Project p = get(userId, id);
        if (name != null && !name.isBlank()) {
            p.setName(name.trim().substring(0, Math.min(name.trim().length(), 200)));
        }
        if (doc != null && !doc.isNull()) {
            p.setDoc(doc.toString());
        }
        return repo.save(p);
    }

    @Transactional
    public void delete(UUID userId, UUID id) {
        Project p = get(userId, id);
        repo.delete(p);
    }

    public JsonNode parseDoc(Project p) {
        try {
            return mapper.readTree(p.getDoc() == null || p.getDoc().isBlank() ? "{}" : p.getDoc());
        } catch (Exception e) {
            return mapper.createObjectNode();
        }
    }

    private String toJson(JsonNode doc) {
        return (doc == null || doc.isNull()) ? "{}" : doc.toString();
    }
}
