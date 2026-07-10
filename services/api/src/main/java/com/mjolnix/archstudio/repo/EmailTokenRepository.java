package com.mjolnix.archstudio.repo;

import com.mjolnix.archstudio.domain.EmailToken;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface EmailTokenRepository extends JpaRepository<EmailToken, UUID> {
    Optional<EmailToken> findByTokenAndUsedFalse(String token);
}
