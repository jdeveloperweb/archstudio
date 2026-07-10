CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE EXTENSION IF NOT EXISTS citext;

CREATE TABLE users (
    id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name            varchar(120) NOT NULL,
    email           citext NOT NULL UNIQUE,
    password_hash   varchar(100) NOT NULL,
    email_verified  boolean NOT NULL DEFAULT false,
    created_at      timestamptz NOT NULL DEFAULT now(),
    updated_at      timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE email_tokens (
    id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token       varchar(255) NOT NULL UNIQUE,
    type        varchar(16) NOT NULL,
    expires_at  timestamptz NOT NULL,
    used        boolean NOT NULL DEFAULT false,
    created_at  timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_email_tokens_token ON email_tokens(token);

CREATE TABLE projects (
    id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name        varchar(200) NOT NULL,
    doc         jsonb NOT NULL DEFAULT '{}'::jsonb,
    created_at  timestamptz NOT NULL DEFAULT now(),
    updated_at  timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_projects_user_updated ON projects(user_id, updated_at DESC);

CREATE TABLE user_settings (
    user_id     uuid PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    provider    varchar(32) NOT NULL DEFAULT 'openai',
    model       varchar(160),
    base_url    varchar(500),
    api_key_enc text,
    updated_at  timestamptz NOT NULL DEFAULT now()
);
