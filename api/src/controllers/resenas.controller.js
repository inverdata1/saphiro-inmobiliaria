
const resenasService = require("../services/resenas.service");
const buildCtx = require("../utils/ctx");

exports.createResena = async (req, res) => {
    const data = await resenasService.createResena(req.body, buildCtx(req));
    res.status(201).json({ ok: true, data });
};

exports.getResenasByInmuebleId = async (req, res) => {
    const data = await resenasService.getResenasByInmuebleId(Number(req.params.inmueble_id));
    res.json({ ok: true, data });
};

exports.getResenaByInmuebleAndUsuario = async (req, res) => {
    const data = await resenasService.getResenaByInmuebleAndUsuario(
        Number(req.params.inmueble_id),
        Number(req.params.usuario_id)
    );
    res.json({ ok: true, data });
};

exports.getAllResenas = async (req, res) => {
    const data = await resenasService.getAllResenas();
    res.json({ ok: true, data });
};

exports.deleteResena = async (req, res) => {
    const data = await resenasService.deleteResena(Number(req.params.id), buildCtx(req));
    res.json({ ok: true, data });
};

exports.updateResena = async (req, res) => {
    const data = await resenasService.updateResena(Number(req.params.id), req.body, buildCtx(req));
    res.json({ ok: true, data });
};