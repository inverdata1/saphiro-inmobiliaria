const AppError = require("../../src/utils/AppError");

describe("AppError", () => {
  test("crea error con message y statusCode", () => {
    const err = new AppError("No encontrado", 404);
    expect(err.message).toBe("No encontrado");
    expect(err.statusCode).toBe(404);
    expect(err.status).toBe("fail");
    expect(err.isOperational).toBe(true);
  });

  test("status es 'fail' para errores 4xx", () => {
    expect(new AppError("Bad request", 400).status).toBe("fail");
    expect(new AppError("Unauthorized", 401).status).toBe("fail");
    expect(new AppError("Forbidden", 403).status).toBe("fail");
  });

  test("status es 'error' para errores 5xx", () => {
    expect(new AppError("Server error", 500).status).toBe("error");
    expect(new AppError("Bad gateway", 502).status).toBe("error");
  });

  test("captureStackTrace existe", () => {
    const err = new AppError("test", 400);
    expect(err.stack).toBeDefined();
    expect(err.stack).toContain("Error");
  });

  test("hereda de Error", () => {
    const err = new AppError("test", 400);
    expect(err instanceof Error).toBe(true);
    expect(err instanceof AppError).toBe(true);
  });
});
