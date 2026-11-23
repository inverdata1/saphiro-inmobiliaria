const sent = [];

const sendEmail = jest.fn(async ({ to, subject, html }) => {
  sent.push({ to, subject, html });
});

sendEmail.__sent = sent;
sendEmail.__clear = () => {
  sent.length = 0;
};

module.exports = { sendEmail };
