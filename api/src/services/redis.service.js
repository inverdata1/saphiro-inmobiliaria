const Redis = require("ioredis");

//Configuracion de redis
const redis = new Redis({
  host: process.env.REDIS_HOST || "127.0.0.1",
  port: Number(process.env.REDIS_PORT) || 6379,
});

//se manda un log si es que hay un error con redis
redis.on("error", (err) => console.error("Redis error:", err));

module.exports = redis;
