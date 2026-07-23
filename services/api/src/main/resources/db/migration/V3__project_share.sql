-- Colaboração por link: um token opaco por projeto. Nulo = não compartilhado.
-- Quem tem o link entra na sala em tempo real (o token é a autorização).
ALTER TABLE projects ADD COLUMN share_token varchar(64);
CREATE UNIQUE INDEX ux_projects_share_token ON projects (share_token) WHERE share_token IS NOT NULL;
