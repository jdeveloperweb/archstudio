package com.mjolnix.archstudio.auth;

import com.mjolnix.archstudio.config.AppProperties;
import com.mjolnix.archstudio.domain.EmailToken;
import com.mjolnix.archstudio.domain.User;
import com.mjolnix.archstudio.repo.EmailTokenRepository;
import com.mjolnix.archstudio.repo.UserRepository;
import com.mjolnix.archstudio.web.ApiException;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Optional;
import java.util.UUID;

@Service
public class AuthService {

    private final UserRepository users;
    private final EmailTokenRepository tokens;
    private final PasswordEncoder encoder;
    private final MailService mail;
    private final AppProperties props;

    public AuthService(UserRepository users, EmailTokenRepository tokens, PasswordEncoder encoder,
                       MailService mail, AppProperties props) {
        this.users = users;
        this.tokens = tokens;
        this.encoder = encoder;
        this.mail = mail;
        this.props = props;
    }

    @Transactional
    public void register(String name, String email, String password) {
        if (users.existsByEmailIgnoreCase(email)) {
            throw new ApiException("EMAIL_TAKEN", HttpStatus.CONFLICT, "Este e-mail já está cadastrado.");
        }
        User user = new User(name.trim(), email.trim(), encoder.encode(password));
        users.save(user);
        sendVerification(user);
    }

    private void sendVerification(User user) {
        EmailToken token = new EmailToken(user.getId(), UUID.randomUUID().toString(),
                EmailToken.TYPE_VERIFY, Instant.now().plus(48, ChronoUnit.HOURS));
        tokens.save(token);
        mail.sendVerification(user, props.publicUrl() + "/api/v1/auth/verify?token=" + token.getToken());
    }

    @Transactional
    public boolean verify(String token) {
        Optional<EmailToken> opt = tokens.findByTokenAndUsedFalse(token);
        if (opt.isEmpty()) {
            return false;
        }
        EmailToken t = opt.get();
        if (t.isExpired() || !EmailToken.TYPE_VERIFY.equals(t.getType())) {
            return false;
        }
        User user = users.findById(t.getUserId()).orElse(null);
        if (user == null) {
            return false;
        }
        user.setEmailVerified(true);
        users.save(user);
        t.setUsed(true);
        tokens.save(t);
        return true;
    }

    @Transactional
    public void resend(String email) {
        users.findByEmailIgnoreCase(email)
                .filter(u -> !u.isEmailVerified())
                .ifPresent(this::sendVerification);
    }

    public User login(String email, String password) {
        User user = users.findByEmailIgnoreCase(email).orElse(null);
        if (user == null || !encoder.matches(password, user.getPasswordHash())) {
            throw new ApiException("BAD_CREDENTIALS", HttpStatus.UNAUTHORIZED, "E-mail ou senha incorretos.");
        }
        if (!user.isEmailVerified()) {
            throw new ApiException("EMAIL_NOT_VERIFIED", HttpStatus.FORBIDDEN, "Confirme seu e-mail antes de entrar.");
        }
        return user;
    }

    @Transactional
    public void forgot(String email) {
        users.findByEmailIgnoreCase(email).ifPresent(user -> {
            EmailToken token = new EmailToken(user.getId(), UUID.randomUUID().toString(),
                    EmailToken.TYPE_RESET, Instant.now().plus(2, ChronoUnit.HOURS));
            tokens.save(token);
            mail.sendPasswordReset(user, props.publicUrl() + "/reset?token=" + token.getToken());
        });
    }

    @Transactional
    public void reset(String token, String password) {
        EmailToken t = tokens.findByTokenAndUsedFalse(token)
                .filter(x -> !x.isExpired() && EmailToken.TYPE_RESET.equals(x.getType()))
                .orElseThrow(() -> new ApiException("INVALID_TOKEN", HttpStatus.BAD_REQUEST, "Link inválido ou expirado."));
        User user = users.findById(t.getUserId())
                .orElseThrow(() -> new ApiException("INVALID_TOKEN", HttpStatus.BAD_REQUEST, "Link inválido."));
        user.setPasswordHash(encoder.encode(password));
        users.save(user);
        t.setUsed(true);
        tokens.save(t);
    }

    public User require(UUID id) {
        return users.findById(id)
                .orElseThrow(() -> new ApiException("USER_NOT_FOUND", HttpStatus.NOT_FOUND, "Usuário não encontrado."));
    }

    private static final int AVATAR_MAX_CHARS = 400_000; // ~300 KB de imagem em base64

    @Transactional
    public User updateProfile(UUID id, String name, String avatar) {
        User user = require(id);
        if (name != null) {
            String n = name.trim();
            if (n.isEmpty() || n.length() > 120) {
                throw new ApiException("BAD_NAME", HttpStatus.BAD_REQUEST, "Nome inválido (1 a 120 caracteres).");
            }
            user.setName(n);
        }
        if (avatar != null) {
            if (avatar.isBlank()) {
                user.setAvatar(null);
            } else {
                if (!avatar.startsWith("data:image/") || !avatar.contains(";base64,")
                        || avatar.length() > AVATAR_MAX_CHARS) {
                    throw new ApiException("BAD_AVATAR", HttpStatus.BAD_REQUEST,
                            "Foto inválida. Envie uma imagem de até ~300 KB.");
                }
                user.setAvatar(avatar);
            }
        }
        return users.save(user);
    }

    @Transactional
    public void changePassword(UUID id, String current, String next) {
        User user = require(id);
        if (!encoder.matches(current, user.getPasswordHash())) {
            throw new ApiException("BAD_PASSWORD", HttpStatus.BAD_REQUEST, "Senha atual incorreta.");
        }
        user.setPasswordHash(encoder.encode(next));
        users.save(user);
    }

    /** Apaga a conta e tudo que pertence a ela (projetos, settings e tokens caem por cascade). */
    @Transactional
    public void deleteAccount(UUID id, String password) {
        User user = require(id);
        if (!encoder.matches(password, user.getPasswordHash())) {
            throw new ApiException("BAD_PASSWORD", HttpStatus.BAD_REQUEST, "Senha incorreta.");
        }
        users.delete(user);
    }
}
