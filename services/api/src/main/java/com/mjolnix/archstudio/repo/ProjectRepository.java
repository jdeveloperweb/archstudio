package com.mjolnix.archstudio.repo;

import com.mjolnix.archstudio.domain.Project;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface ProjectRepository extends JpaRepository<Project, UUID> {
    List<Project> findByUserIdOrderByUpdatedAtDesc(UUID userId);
    Optional<Project> findByIdAndUserId(UUID id, UUID userId);
}
