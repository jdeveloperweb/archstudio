package com.mjolnix.archstudio.project;

import com.mjolnix.archstudio.domain.Project;
import com.mjolnix.archstudio.project.dto.ProjectDtos.*;
import com.mjolnix.archstudio.security.CurrentUser;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/projects")
public class ProjectController {

    private final ProjectService service;

    public ProjectController(ProjectService service) {
        this.service = service;
    }

    private UUID uid() {
        return CurrentUser.get().id();
    }

    @GetMapping
    public List<ProjectMeta> list() {
        return service.list(uid()).stream().map(ProjectMeta::from).toList();
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public ProjectMeta create(@Valid @RequestBody SaveProjectRequest req) {
        Project p = service.create(uid(), req.name(), req.doc());
        return ProjectMeta.from(p);
    }

    @GetMapping("/{id}")
    public ProjectFull get(@PathVariable UUID id) {
        Project p = service.get(uid(), id);
        return new ProjectFull(p.getId().toString(), p.getName(), service.parseDoc(p), p.getUpdatedAt(), p.getShareToken());
    }

    /** Owner turns the invite link on (idempotent) and gets the token back. */
    @PostMapping("/{id}/share")
    public ShareInfo share(@PathVariable UUID id) {
        return new ShareInfo(service.enableShare(uid(), id));
    }

    /** Owner revokes the invite link. */
    @DeleteMapping("/{id}/share")
    public ResponseEntity<Void> unshare(@PathVariable UUID id) {
        service.disableShare(uid(), id);
        return ResponseEntity.noContent().build();
    }

    @PutMapping("/{id}")
    public ProjectMeta update(@PathVariable UUID id, @RequestBody SaveProjectRequest req) {
        return ProjectMeta.from(service.update(uid(), id, req.name(), req.doc()));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable UUID id) {
        service.delete(uid(), id);
        return ResponseEntity.noContent().build();
    }
}
