function buildCtx(req) {
  let ip = null;

  const forwarded = req.headers["x-forwarded-for"];
  if (forwarded) {
    ip = String(forwarded).split(",")[0].trim();
  } else if (req.ip) {
    ip = req.ip;
    if (ip === "::1") ip = "127.0.0.1";
    ip = ip.replace(/^::ffff:/, "");
  }

  return {
    usuario_id: req.user?.id ?? null,
    ip_address: ip || null,
    user_agent: req.headers["user-agent"] || null,
  };
}

module.exports = buildCtx;