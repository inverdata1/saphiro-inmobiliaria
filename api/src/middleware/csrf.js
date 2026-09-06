module.exports = function csrfProtection(req, _res, next) {
  // Only enforce on state-changing methods
  const method = req.method.toUpperCase();
  if (method === "GET" || method === "HEAD" || method === "OPTIONS") {
    return next();
  }

  // Require custom header — browsers don't send custom headers cross-origin
  const requestedWith = req.headers["x-requested-with"];
  if (requestedWith !== "XMLHttpRequest") {
    const err = new Error("CSRF: header faltante");
    err.statusCode = 403;
    err.code = "FORBIDDEN";
    return next(err);
  }

  next();
};
