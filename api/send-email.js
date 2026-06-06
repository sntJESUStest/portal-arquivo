const nodemailer = require('nodemailer');

const GMAIL_USER = 'joaochavesar@gmail.com';
const GMAIL_PASS = 'fzzjifcwdctyyitp';

module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).send('Method not allowed');

  const { destinatario, nomeCliente, nomeArquivo, setor, mes, ano } = req.body;

  if (!destinatario || !nomeArquivo) {
    return res.status(400).json({ error: 'Dados incompletos' });
  }

  try {
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: { user: GMAIL_USER, pass: GMAIL_PASS }
    });

    await transporter.sendMail({
      from: `HP Contabilidade <${GMAIL_USER}>`,
      to: destinatario,
      subject: `Novo documento disponível - ${setor || 'Portal'}`,
      html: `<div style="font-family:sans-serif;max-width:500px;margin:0 auto;padding:2rem;">
        <h2 style="color:#4338ca;">HP Contabilidade</h2>
        <p>Olá, <strong>${nomeCliente || 'Cliente'}</strong>!</p>
        <p>Um novo documento foi disponibilizado no seu portal:</p>
        <div style="background:#f7f6f3;border-radius:8px;padding:1rem;margin:1rem 0;">
          <p><strong>Arquivo:</strong> ${nomeArquivo}</p>
          <p><strong>Setor:</strong> ${setor || '—'}</p>
          ${mes || ano ? `<p><strong>Período:</strong> ${mes || ''} ${ano || ''}</p>` : ''}
        </div>
        <a href="https://portal-arquivo.vercel.app/empresas" style="display:inline-block;background:#4338ca;color:#fff;padding:10px 20px;border-radius:8px;text-decoration:none;">Acessar Portal</a>
        <p style="font-size:12px;color:#999;margin-top:2rem;">HP Contabilidade — Portal do Cliente</p>
      </div>`
    });

    console.log('E-mail enviado para:', destinatario);
    res.status(200).json({ ok: true });
  } catch(e) {
    console.error('Erro e-mail:', e.message);
    res.status(500).json({ error: e.message });
  }
};
