const sectoresService = require("../services/sectores.service");

exports.listSectores = async (req, res) => {
  const data = await sectoresService.listSectores(Number(req.query.ciudad_id));
  res.json({ ok: true, data });
};
