const dashBoardService = require("../services/dashBoard.service");

exports.getKpis = async (req, res) => {
  const data = await dashBoardService.getKpis(req.query);
  res.json({ ok: true, data });
};

exports.getSerie = async (req, res) => {
  const result = await dashBoardService.getSerie(req.query);
  res.json({ ok: true, data: result.data, meta: result.meta });
};

exports.getTopCorredores = async (req, res) => {
  const result = await dashBoardService.getTopCorredores(req.query);
  res.json({ ok: true, data: result.data, meta: result.meta });
};

exports.getPorTipoOperacion = async (req, res) => {
  const result = await dashBoardService.getPorTipoOperacion(req.query);
  res.json({ ok: true, data: result.data, meta: result.meta });
};

exports.getEstatusPago = async (req, res) => {
  const result = await dashBoardService.getEstatusPago(req.query);
  res.json({ ok: true, data: result.data, meta: result.meta });
};

exports.getDashboardCorredor = async (req, res) => {
  const data = await dashBoardService.getDashboardCorredor(Number(req.params.id), req.query);
  res.json({ ok: true, data });
};
