const nodemailer = require("nodemailer");

//configuracion del enviador de emails
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || "smtp.gmail.com",
  port: Number(process.env.SMTP_PORT) || 587,
  secure: process.env.SMTP_SECURE === "true",
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

//Enviar email
exports.sendEmail = async ({ to, subject, html }) => {

  //si no estan las variables de entorno se aborta el proceso
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    return;
  }

  //se envia el email
  await transporter.sendMail({
    from: process.env.SMTP_FROM || process.env.SMTP_USER,
    to, //Destinatario
    subject, //Asunto del email
    html, //Cuerpo del email en html
  });
};
