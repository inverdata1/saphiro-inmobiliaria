const fs = require("fs");
const path = require("path");
const inmueblesService = require("../services/inmuebles.service");
const corredoresService = require("../services/corredores.service");
const buildCtx = require("../utils/ctx");
const { resolveUuidToId } = require("../middleware/publicId");

const UPLOADS_DIR = path.join(__dirname, "..", "..", "uploads", "properties");

function deleteFiles(files) {
  for (const f of files) {
    const filePath = path.join(UPLOADS_DIR, f.filename);
    fs.unlink(filePath, () => {});
  }
}

exports.listInmuebles = async (req, res) => {
  const result = await inmueblesService.listInmuebles(req.query);
  res.json({ ok: true, data: result.data, pagination: result.pagination });
};

exports.listMisInmuebles = async (req, res, next) => {
  try {
    const usuarioId = await resolveUuidToId(req.params.usuario_id, "usuarios", "Usuario");
    const data = await inmueblesService.listInmueblesByCorredor(Number(usuarioId));
    res.json({ ok: true, data });
  } catch (err) {
    next(err);
  }
};

exports.getInmuebleById = async (req, res, next) => {
  try {
    const id = await resolveUuidToId(req.params.id, "inmuebles", "Inmueble");
    const data = await inmueblesService.getInmuebleById(Number(id));
    res.json({ ok: true, data });
  } catch (err) {
    next(err);
  }
};

exports.createInmueble = async (req, res, next) => {
  try {
    const body = typeof req.body.data === "string" ? JSON.parse(req.body.data) : req.body;
    const actorId = req.user?.rol === "admin" ? req.user.id : body.usuario_id;
    try {
      const corredor = await corredoresService.getCorredorByUserId(actorId);
      body.corredor_id = corredor.id;
    } catch (lookupErr) {
      if (!(req.user?.rol === "admin" && lookupErr.statusCode === 404)) throw lookupErr;
      body.corredor_id = null;
    }
    const data = await inmueblesService.createInmueble(body, req.files || [], buildCtx(req));
    res.status(201).json({ ok: true, data });
  } catch (err) {
    if (req.files?.length) deleteFiles(req.files);
    next(err);
  }
};

exports.patchInmueble = async (req, res, next) => {
  try {
    const id = await resolveUuidToId(req.params.id, "inmuebles", "Inmueble");
    const data = await inmueblesService.patchInmueble(Number(id), req.body, buildCtx(req));
    res.json({ ok: true, data });
  } catch (err) {
    next(err);
  }
};

exports.updateInmueble = async (req, res, next) => {
  try {
    const id = await resolveUuidToId(req.params.id, "inmuebles", "Inmueble");
    const body = typeof req.body.data === "string" ? JSON.parse(req.body.data) : req.body;
    const corredor = await corredoresService.getCorredorByUserId(body.usuario_id);
    body.corredor_id = corredor.id;
    const data = await inmueblesService.updateInmueble(Number(id), body, req.files || [], buildCtx(req));
    res.json({ ok: true, data });
  } catch (err) {
    if (req.files?.length) deleteFiles(req.files);
    next(err);
  }
};

exports.deleteInmueble = async (req, res, next) => {
  try {
    const id = await resolveUuidToId(req.params.id, "inmuebles", "Inmueble");
    const data = await inmueblesService.deleteInmueble(Number(id), buildCtx(req));
    res.json({ ok: true, data });
  } catch (err) {
    next(err);
  }
};

exports.listDisponiblesPorCiudad = async (req, res) => {
  const data = await inmueblesService.listDisponiblesPorCiudad(Number(req.query.ciudad_id), req.query.q);
  res.json({ ok: true, data });
};

exports.listDisponiblesPorEstado = async (req, res) => {
  const data = await inmueblesService.listDisponiblesPorEstado(Number(req.query.estado_id));
  res.json({ ok: true, data });
};

exports.listReservas = async (req, res, next) => {
  try {
    const id = await resolveUuidToId(req.params.id, "inmuebles", "Inmueble");
    const data = await inmueblesService.listReservasByInmueble(Number(id));
    res.json({ ok: true, data });
  } catch (err) {
    next(err);
  }
};
