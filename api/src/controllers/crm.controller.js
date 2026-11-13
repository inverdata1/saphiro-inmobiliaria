const crm = require("../services/crm.service");

exports.resumen = async (req, res) => {
  res.json({ ok: true, data: await crm.resumen(req.user) });
};

exports.leads = async (req, res) => {
  res.json({ ok: true, data: await crm.listarLeads(req.user) });
};

exports.crearLead = async (req, res) => {
  res.status(201).json({ ok: true, data: await crm.crearLead(req.user, req.body) });
};

exports.moverLead = async (req, res) => {
  res.json({ ok: true, data: await crm.moverLead(req.user, req.params.id, req.body?.etapa) });
};

exports.propiedades = async (req, res) => {
  res.json({ ok: true, data: await crm.propiedades(req.user) });
};

exports.clientes = async (req, res) => {
  res.json({ ok: true, data: await crm.clientes(req.user) });
};

exports.citas = async (req, res) => {
  res.json({ ok: true, data: await crm.citas(req.user) });
};
