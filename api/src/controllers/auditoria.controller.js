const auditoriaService = require("../services/auditoria.service");

exports.listAuditoria = async (req, res) => {
  const result = await auditoriaService.listAuditoria(req.query);
  res.json({ ok: true, data: result.data, pagination: result.pagination });
};
