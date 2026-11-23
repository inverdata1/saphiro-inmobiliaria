CREATE TABLE "redes_sociales" (
  "id" SERIAL PRIMARY KEY,
  "nombre" character varying(50) UNIQUE NOT NULL,
  "base_url" character varying(255) NOT NULL,
  "name_icon" character varying(50) NOT NULL,
  "is_active" BOOLEAN NOT NULL DEFAULT true
);

CREATE TABLE "usuarios_redes_sociales" (
  "id" SERIAL PRIMARY KEY,
  "red_social_id" integer NOT NULL,
  "usuario_id" integer NOT NULL,
  "url" text NOT NULL,
  "orden" integer NOT NULL,
  "is_public" boolean NOT NULL DEFAULT true
);

ALTER TABLE "usuarios_redes_sociales" ADD FOREIGN KEY ("usuario_id") REFERENCES "usuarios" ("id") DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "usuarios_redes_sociales" ADD FOREIGN KEY ("red_social_id") REFERENCES "redes_sociales" ("id") DEFERRABLE INITIALLY IMMEDIATE;

INSERT INTO redes_sociales (nombre, base_url, name_icon) VALUES
  ('Instagram', 'www.instagram.com/', 'logo-instagram'),
  ('Facebook', 'www.facebook.com/', 'logo-facebook'),
  ('X', 'x.com/', 'logo-x'),
  ('TikTok', 'www.tiktok.com/@', 'logo-tiktok'),
  ('LinkedIn', 'www.linkedin.com/in/', 'logo-linkedin'),
  ('YouTube', 'www.youtube.com/@', 'logo-youtube'),
  ('Telegram', 't.me/', 'send');