jest.mock("../../src/services/redis.service", () => require("../__mocks__/redis.service.js"));
jest.mock("../../src/services/email.service", () => require("../__mocks__/email.service.js"));

const pool = require("../../src/db/pool");
const authService = require("../../src/services/auth.service");
const { crearUsuario } = require("../helpers");
const { cleanTables } = require("../setup");
const redis = require("../../src/services/redis.service");
const { sendEmail } = require("../../src/services/email.service");

beforeEach(async () => {
  await cleanTables(pool);
  await redis.flushall();
  sendEmail.__clear();
});

afterAll(async () => {
  await pool.end();
});

describe("auth.service - register", () => {
  test("registra un cliente correctamente", async () => {
    const result = await authService.register({
      nombre: "Test User",
      email: "test@example.com",
      password: "password123",
    });

    expect(result).toHaveProperty("id");
    expect(result.email).toBe("test@example.com");
    expect(result.rol).toBe("cliente");
    expect(result.email_verified).toBe(false);
  });

  test("lanza error si falta nombre", async () => {
    await expect(
      authService.register({ email: "a@b.com", password: "123" })
    ).rejects.toThrow("nombre es requerido");
  });

  test("lanza error si falta email", async () => {
    await expect(
      authService.register({ nombre: "Test", password: "123" })
    ).rejects.toThrow("email es requerido");
  });

  test("lanza error si falta password", async () => {
    await expect(
      authService.register({ nombre: "Test", email: "a@b.com" })
    ).rejects.toThrow("password es requerido");
  });

  test("lanza error 409 si el email ya existe", async () => {
    await crearUsuario(pool, { nombre: "Existing", email: "dup@example.com", password: "123" });
    await expect(
      authService.register({ nombre: "Test", email: "dup@example.com", password: "123" })
    ).rejects.toThrow("Usuario ya existe");
  });

  test("envía email de verificación después del registro", async () => {
    await authService.register({
      nombre: "Test User",
      email: "verify@example.com",
      password: "password123",
    });

    expect(sendEmail.__sent.length).toBe(1);
    expect(sendEmail.__sent[0].to).toBe("verify@example.com");
  });
});

describe("auth.service - login", () => {
  test("login exitoso con credenciales válidas", async () => {
    await crearUsuario(pool, {
      nombre: "Login User",
      email: "login@example.com",
      password: "password123",
      email_verified: true,
    });

    const result = await authService.login({
      email: "login@example.com",
      password: "password123",
    });

    expect(result).toHaveProperty("accessToken");
    expect(result).toHaveProperty("refreshToken");
    expect(result.user.email).toBe("login@example.com");
  });

  test("lanza error si falta email", async () => {
    await expect(authService.login({ password: "123" })).rejects.toThrow(
      "email y password son requeridos"
    );
  });

  test("lanza error 401 con credenciales inválidas", async () => {
    await crearUsuario(pool, {
      nombre: "User",
      email: "wrong@example.com",
      password: "correct",
      email_verified: true,
    });

    await expect(
      authService.login({ email: "wrong@example.com", password: "incorrecta" })
    ).rejects.toThrow("Credenciales inválidas");
  });

  test("lanza error si el usuario no existe", async () => {
    await expect(
      authService.login({ email: "nonexistent@example.com", password: "123" })
    ).rejects.toThrow("Credenciales inválidas");
  });

  test("lanza error si el email no está verificado", async () => {
    await crearUsuario(pool, {
      nombre: "Unverified",
      email: "unverified@example.com",
      password: "password123",
      email_verified: false,
    });

    await expect(
      authService.login({ email: "unverified@example.com", password: "password123" })
    ).rejects.toThrow("verificar tu correo");
  });

  test("lanza error si el usuario está desactivado", async () => {
    const user = await crearUsuario(pool, {
      nombre: "Disabled",
      email: "disabled@example.com",
      password: "password123",
      email_verified: true,
    });
    await pool.query("UPDATE usuarios SET active = false WHERE id = $1", [user.id]);

    await expect(
      authService.login({ email: "disabled@example.com", password: "password123" })
    ).rejects.toThrow("Usuario inhabilitado");
  });
});

describe("auth.service - verificarEmail", () => {
  test("verifica email con token válido", async () => {
    const user = await crearUsuario(pool, {
      nombre: "Verify",
      email: "verifyme@example.com",
      password: "123",
      email_verified: false,
    });

    redis.__store.set("email-verify:valid-token", String(user.id));

    const result = await authService.verificarEmail({ token: "valid-token" });
    expect(result.message).toContain("verificado");
    expect(result.user.email_verified).toBe(true);
    expect(result).toHaveProperty("accessToken");
  });

  test("lanza error con token inválido", async () => {
    await expect(
      authService.verificarEmail({ token: "invalid-token" })
    ).rejects.toThrow("Enlace inválido o expirado");
  });
});

describe("auth.service - me", () => {
  test("retorna datos del usuario", async () => {
    const user = await crearUsuario(pool, {
      nombre: "Me User",
      email: "me@example.com",
      password: "123",
    });

    const result = await authService.me(user.id);
    expect(result.email).toBe("me@example.com");
    expect(result.nombre).toBe("Me User");
  });

  test("lanza error si userId es null", async () => {
    await expect(authService.me(null)).rejects.toThrow("No autorizado");
  });

  test("lanza error 404 si usuario no existe", async () => {
    await expect(authService.me(99999)).rejects.toThrow("Usuario no existe");
  });
});

describe("auth.service - issueTokenPair", () => {
  test("genera tokens JWT válidos", async () => {
    const tokens = await authService.issueTokenPair({ id: 1, rol: "cliente" });
    expect(tokens).toHaveProperty("accessToken");
    expect(tokens).toHaveProperty("refreshToken");
    expect(typeof tokens.accessToken).toBe("string");
    expect(typeof tokens.refreshToken).toBe("string");
  });

  test("guarda refresh token en Redis", async () => {
    const tokens = await authService.issueTokenPair({ id: 1, rol: "cliente" });
    const stored = await redis.get(`refresh:${tokens.refreshToken}`);
    expect(stored).toBe("1");
  });
});

describe("auth.service - rotateRefreshToken", () => {
  test("rota refresh token exitosamente", async () => {
    const tokens = await authService.issueTokenPair({ id: 1, rol: "cliente" });
    const result = await authService.rotateRefreshToken(tokens.refreshToken);
    expect(result).toHaveProperty("accessToken");
    expect(result).toHaveProperty("refreshToken");
    expect(result.user.id).toBe(1);
  });

  test("lanza error con token inválido", async () => {
    await expect(authService.rotateRefreshToken("bad-token")).rejects.toThrow(
      "Refresh token inválido"
    );
  });

  test("lanza error si el token fue revocado", async () => {
    const tokens = await authService.issueTokenPair({ id: 1, rol: "cliente" });
    redis.__store.delete(`refresh:${tokens.refreshToken}`);
    await expect(authService.rotateRefreshToken(tokens.refreshToken)).rejects.toThrow(
      "revocado"
    );
  });
});
