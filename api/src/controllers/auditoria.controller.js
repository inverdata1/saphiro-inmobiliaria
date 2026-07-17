const auditoriaService = require("../services/auditoria.service");

exports.listAuditoria = async (req, res) => {
  const data = await auditoriaService.listAuditoria(req.query);
  res.json({ ok: true, data });
};
