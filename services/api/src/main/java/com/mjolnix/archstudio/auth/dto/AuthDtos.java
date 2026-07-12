package com.mjolnix.archstudio.auth.dto;

import com.mjolnix.archstudio.domain.User;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import java.time.Instant;

/** Auth request/response DTOs grouped in one file for brevity. */
public final class AuthDtos {
    private AuthDtos() {}

    public record RegisterRequest(
            @NotBlank(message = "Informe seu nome") String name,
            @Email(message = "E-mail inválido") @NotBlank(message = "Informe seu e-mail") String email,
            @Size(min = 8, message = "A senha deve ter ao menos 8 caracteres") String password) {}

    public record LoginRequest(
            @Email(message = "E-mail inválido") @NotBlank String email,
            @NotBlank(message = "Informe a senha") String password) {}

    public record EmailRequest(@Email @NotBlank String email) {}

    public record ResetRequest(
            @NotBlank String token,
            @Size(min = 8, message = "A senha deve ter ao menos 8 caracteres") String password) {}

    public record UserResponse(String id, String name, String email, String avatar, Instant createdAt) {
        public static UserResponse from(User u) {
            return new UserResponse(u.getId().toString(), u.getName(), u.getEmail(), u.getAvatar(),
                    u.getCreatedAt());
        }
    }

    /** name null = mantém; avatar null = mantém, "" = remove, senão data URL de imagem. */
    public record UpdateMeRequest(String name, String avatar) {}

    public record ChangePasswordRequest(
            @NotBlank(message = "Informe a senha atual") String current,
            @Size(min = 8, message = "A nova senha deve ter ao menos 8 caracteres") String next) {}

    public record DeleteAccountRequest(@NotBlank(message = "Confirme sua senha") String password) {}
}
