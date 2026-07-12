package com.mjolnix.archstudio.auth;

import com.mjolnix.archstudio.auth.dto.AuthDtos.*;
import com.mjolnix.archstudio.config.AppProperties;
import com.mjolnix.archstudio.domain.User;
import com.mjolnix.archstudio.security.AuthUser;
import com.mjolnix.archstudio.security.CurrentUser;
import com.mjolnix.archstudio.security.JwtService;
import com.mjolnix.archstudio.web.CookieUtil;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.net.URI;
import java.util.Map;

@RestController
@RequestMapping("/api/v1")
public class AuthController {

    private final AuthService auth;
    private final JwtService jwt;
    private final AppProperties props;

    public AuthController(AuthService auth, JwtService jwt, AppProperties props) {
        this.auth = auth;
        this.jwt = jwt;
        this.props = props;
    }

    @PostMapping("/auth/register")
    @ResponseStatus(HttpStatus.CREATED)
    public Map<String, String> register(@Valid @RequestBody RegisterRequest req) {
        auth.register(req.name(), req.email(), req.password());
        return Map.of("message", "Enviamos um link de confirmação para seu e-mail.");
    }

    @GetMapping("/auth/verify")
    public ResponseEntity<Void> verify(@RequestParam String token) {
        boolean ok = auth.verify(token);
        URI to = URI.create(props.publicUrl() + "/login?verified=" + (ok ? "1" : "0"));
        return ResponseEntity.status(HttpStatus.FOUND).location(to).build();
    }

    @PostMapping("/auth/resend")
    public Map<String, String> resend(@Valid @RequestBody EmailRequest req) {
        auth.resend(req.email());
        return Map.of("message", "Se o e-mail existir e não estiver confirmado, enviamos um novo link.");
    }

    @PostMapping("/auth/login")
    public ResponseEntity<Map<String, Object>> login(@Valid @RequestBody LoginRequest req, HttpServletResponse res) {
        User user = auth.login(req.email(), req.password());
        String token = jwt.issue(user.getId(), user.getEmail());
        res.addHeader(HttpHeaders.SET_COOKIE,
                CookieUtil.build(props.cookieName(), token, props.jwtTtlDays(), props.cookieSecure()).toString());
        return ResponseEntity.ok(Map.of("user", UserResponse.from(user)));
    }

    @PostMapping("/auth/logout")
    public Map<String, String> logout(HttpServletResponse res) {
        res.addHeader(HttpHeaders.SET_COOKIE,
                CookieUtil.clear(props.cookieName(), props.cookieSecure()).toString());
        return Map.of("message", "Sessão encerrada.");
    }

    @PostMapping("/auth/forgot")
    public Map<String, String> forgot(@Valid @RequestBody EmailRequest req) {
        auth.forgot(req.email());
        return Map.of("message", "Se o e-mail existir, enviamos um link de redefinição.");
    }

    @PostMapping("/auth/reset")
    public Map<String, String> reset(@Valid @RequestBody ResetRequest req) {
        auth.reset(req.token(), req.password());
        return Map.of("message", "Senha redefinida. Você já pode entrar.");
    }

    @GetMapping("/me")
    public UserResponse me() {
        AuthUser principal = CurrentUser.get();
        return UserResponse.from(auth.require(principal.id()));
    }

    @PutMapping("/me")
    public UserResponse updateMe(@Valid @RequestBody UpdateMeRequest req) {
        AuthUser principal = CurrentUser.get();
        return UserResponse.from(auth.updateProfile(principal.id(), req.name(), req.avatar()));
    }

    @PutMapping("/me/password")
    public Map<String, String> changePassword(@Valid @RequestBody ChangePasswordRequest req) {
        AuthUser principal = CurrentUser.get();
        auth.changePassword(principal.id(), req.current(), req.next());
        return Map.of("message", "Senha alterada.");
    }

    @DeleteMapping("/me")
    public Map<String, String> deleteMe(@Valid @RequestBody DeleteAccountRequest req, HttpServletResponse res) {
        AuthUser principal = CurrentUser.get();
        auth.deleteAccount(principal.id(), req.password());
        res.addHeader(HttpHeaders.SET_COOKIE,
                CookieUtil.clear(props.cookieName(), props.cookieSecure()).toString());
        return Map.of("message", "Conta excluída.");
    }
}
