const fs = require("fs");
const path = require("path");
const inmueblesService = require("../services/inmuebles.service");
const corredoresService = require("../services/corredores.service");
const buildCtx = require("../utils/ctx");

const UPLOADS_DIR = path.join(__dirname, "..", "..", "uploads");

function deleteFiles(files) {
  for (const f of files) {
    const filePath = path.join(UPLOADS_DIR, f.filename);
    fs.unlink(filePath, () => {});
  }
}

exports.listInmuebles = async (req, res) => {
  const data = await inmueblesService.listInmuebles(req.query);
  res.json({ ok: true, data });
};

exports.getInmuebleById = async (req, res) => {
  const data = await inmueblesService.getInmuebleById(Number(req.params.id));
  res.json({ ok: true, data });
};

exports.createInmueble = async (req, res, next) => {
  try {
    const body = typeof req.body.data === "string" ? JSON.parse(req.body.data) : req.body;
    const corredor = await corredoresService.getCorredorByUserId(body.usuario_id);
    body.corredor_id = corredor.id;
    const data = await inmueblesService.createInmueble(body, req.files || [], buildCtx(req));
    res.status(201).json({ ok: true, data });
  } catch (err) {
    if (req.files?.length) deleteFiles(req.files);
    next(err);
  }
};

exports.patchInmueble = async (req, res) => {
  const data = await inmueblesService.patchInmueble(Number(req.params.id), req.body, buildCtx(req));
  res.json({ ok: true, data });
};

exports.listDisponiblesPorCiudad = async (req, res) => {
  const data = await inmueblesService.listDisponiblesPorCiudad(Number(req.query.ciudad_id), req.query.q);
  res.json({ ok: true, data });
};

exports.listDisponiblesPorEstado = async (req, res) => {
  const data = await inmueblesService.listDisponiblesPorEstado(Number(req.query.estado_id));
  res.json({ ok: true, data });
};
