
const guardadosService= require("../services/guardados.service");
const buildCtx = require("../utils/ctx");

exports.saveInmueble = async(req, res)=>{
    const data = await guardadosService.saveInmueble(req.body, buildCtx(req));
    res.status(201).json({ok: true, data});
};

exports.listGuardados= async (req, res)=>{
    const data= await guardadosService.listGuardados();
    res.status(200).json({ok: true, data});
};

exports.listGuardadosByUsuario = async (req, res) =>{
    const {usuario_id} = req.params;
    const data= await guardadosService.listGuardadosByUsuario(usuario_id);
    res.status(200).json({ok: true, data});
};

exports.getGuardado = async (req, res) => {
    const {usuario_id, inmueble_id} = req.params;
    const data = await guardadosService.getGuardado(usuario_id, inmueble_id);
    res.status(200).json({ok: true, data});
};

exports.deleteGuardado= async (req, res) => {
    const {usuario_id, inmueble_id} = req.params;
    const data= await guardadosService.deleteGuardado(usuario_id, inmueble_id, buildCtx(req));
    if (!data) return res.sendStatus(204);
    res.status(200).json({ok: true, data});
};