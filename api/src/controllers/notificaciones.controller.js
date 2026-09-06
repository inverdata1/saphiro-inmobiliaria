const notificacionesService = require("../services/notificaciones.service");

exports.create = async (req, res) => {
  const data = await notificacionesService.create(req.body);
  res.status(201).json({ ok: true, data });
};

exports.getByUser = async (req, res) => {
  const data = await notificacionesService.getByUser(req.params.usuario_id);
  res.json({ ok: true, data });
};

exports.getUnreadByUser = async (req, res) => {
  const data = await notificacionesService.getUnreadByUser(req.params.usuario_id);
  res.json({ ok: true, data });
};

exports.markAsRead = async (req, res) => {
  const data = await notificacionesService.markAsRead(req.params.id);
  res.json({ ok: true, data });
};

exports.markAllAsRead = async (req, res) => {
  const data = await notificacionesService.markAllAsRead(req.params.usuario_id);
  res.json({ ok: true, data });
};

exports.remove = async (req, res) => {
  await notificacionesService.remove(req.params.id);
  res.json({ ok: true, message: "Notificación eliminada" });
};

exports.removeAllByUser = async (req, res) => {
  const data = await notificacionesService.removeAllByUser(req.params.usuario_id);
  res.json({ ok: true, data });
};
