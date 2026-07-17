const comisionesService = require("../services/comisiones.service");
const buildCtx = require("../utils/ctx");

exports.listComisiones = async (req, res) => {
  const result = await comisionesService.listComisiones(req.query);
  res.json({ ok: true, data: result.data, pagination: result.pagination });
};

exports.getComisionById = async (req, res) => {
  const data = await comisionesService.getComisionById(Number(req.params.id));
  res.json({ ok: true, data });
};

exports.updateEstatusPago = async (req, res) => {
  const data = await comisionesService.updateEstatusPago(Number(req.params.id), req.body, buildCtx(req));
  res.json({ ok: true, data });
};
