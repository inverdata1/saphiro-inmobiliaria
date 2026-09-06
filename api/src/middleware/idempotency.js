const redis = require("../services/redis.service");
const uuid = require("crypto").randomUUID;

const TTL_DEFAULT = 60 * 60 * 24; // 24h

function getKey(req, idemKey) {
  const user = req.user?.id || req.usuario?.id || "anon";
  return `idem:${user}:${req.originalUrl}:${idemKey}`;
}

function withIdempotency(fn, options = {}) {
  const ttl = options.ttl || TTL_DEFAULT;

  return async function (req, res, next) {
    // HEAD is enabled by express to allow preflight of idempotent requests
    res.setHeader("Idempotency-Replayed", "false");

    const idemKey = req.get("Idempotency-Key");
    if (!idemKey) {
      // Sin key el request NO es idempotente
      return fn(req, res, next);
    }

    const redisKey = getKey(req, idemKey);
    const claimed = await redis.set(redisKey, "in-progress", "PX", ttl, "NX");

    if (claimed === null) {
      // Ya existe una entrada en redis
      const existing = await redis.get(redisKey);

      if (existing && existing !== "in-progress") {
        // Respuesta previa guardada -> idempotente, reenviamos
        try {
          const cached = JSON.parse(existing);
          res.setHeader("Idempotency-Replayed", "true");
          return res
            .status(cached.statusCode)
            .set(cached.headers)
            .json(cached.body);
        } catch (err) {
          await redis.del(redisKey);
          return next(err);
        }
      }

      // Otra request está procesando esta misma key (in-progress)
      const err = new Error(
        "Solicitud duplicada detectada. Espera a que la primera termine."
      );
      err.status = 409;
      return next(err);
    }

    // Primera request: estado in-progress en redis, ejecutamos el handler
    const origJson = res.json.bind(res);
    const origSend = res.send.bind(res);

    const save = (body) => {
      const statusCode = res.statusCode;
      const headers = {
        "Content-Type": res.get("Content-Type"),
      };
      const payload = JSON.stringify({
        statusCode,
        headers,
        body: body === undefined ? null : body,
      });
      redis
        .set(redisKey, payload, "PX", ttl)
        .catch((e) => console.error("Redis save idempotency error:", e));
    };

    res.json = (body) => {
      save(body);
      return origJson(body);
    };

    res.send = (body) => {
      if (typeof body === "object") {
        save(body);
      } else {
        save({ message: body });
      }
      return origSend(body);
    };

    try {
      return await fn(req, res, next);
    } catch (err) {
      // Si falla el handler, borramos la key para permitir reintento
      await redis.del(redisKey).catch(() => {});
      return next(err);
    }
  };
}

module.exports = { withIdempotency, uuid };
