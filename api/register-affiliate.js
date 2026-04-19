import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { name, email, social, story, payment } = req.body;

  if (!name || !email || !social) {
    return res.status(400).json({ error: 'Preencha todos os campos obrigatórios.' });
  }

  try {
    // 1. Enviar E-mail para o Administrador (André)
    const adminEmail = await resend.emails.send({
      from: 'Sistema iFooty <parceiros@ifooty.ca>',
      to: ['camisadez085@gmail.com'],
      replyTo: email,
      subject: `🚀 Nova Candidatura de Afiliado: ${name}`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #eee; padding: 20px; border-radius: 10px;">
          <h2 style="color: #000; border-bottom: 2px solid #CCFF00; padding-bottom: 10px;">Nova Candidatura de Afiliado</h2>
          <p><strong>Nome:</strong> ${name}</p>
          <p><strong>E-mail:</strong> ${email}</p>
          <p><strong>Redes Sociais:</strong> ${social}</p>
          <p><strong>Como planeja divulgar:</strong><br/> ${story.replace(/\n/g, '<br/>')}</p>
          <p><strong>Forma de Pagamento Preferida:</strong> ${payment}</p>
          <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;">
          <p style="font-size: 0.8rem; color: #666;">Enviado via formulário de afiliados em ifooty.ca</p>
        </div>
      `,
    });

    // 2. Enviar E-mail de Confirmação para o Candidato
    const candidateEmail = await resend.emails.send({
      from: 'iFooty Parceiros <parceiros@ifooty.ca>',
      to: [email],
      replyTo: 'camisadez085@gmail.com',
      subject: `⚽ Recebemos seu interesse na iFooty, ${name.split(' ')[0]}!`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #edf2f7; border-radius: 12px; overflow: hidden;">
          <div style="padding: 30px; background: #000; text-align: center;">
            <h1 style="margin: 0; color: #fff; font-style: italic;">iFooty<span style="color: #CCFF00;">.</span></h1>
          </div>
          <div style="padding: 40px 30px; background: #fff;">
            <h2 style="color: #1a202c; margin-top: 0;">Olá, ${name}!</h2>
            <p style="color: #4a5568; line-height: 1.6; font-size: 1.1rem;">
              Obrigado por se candidatar ao nosso <strong>Programa de Embaixadores</strong>. Recebemos seus dados com sucesso!
            </p>
            <div style="background: #f7fafc; padding: 20px; border-radius: 8px; border-left: 4px solid #CCFF00; margin: 30px 0;">
              <p style="margin: 0; color: #1a202c; font-weight: 600;">O que acontece agora?</p>
              <p style="margin: 10px 0 0 0; color: #718096; font-size: 0.95rem;">
                Nossa equipe (André Oliveira) analisará suas redes sociais e seu plano de divulgação. 
                Entraremos em contato via WhatsApp ou e-mail nas próximas <strong>24 horas</strong> para os próximos passos.
              </p>
            </div>
            <p style="color: #4a5568; line-height: 1.6;">
              Enquanto isso, você pode conferir as novidades no nosso catálogo oficial.
            </p>
            <div style="text-align: center; margin-top: 40px;">
              <a href="https://ifooty.ca" style="background: #000; color: #CCFF00; padding: 12px 25px; text-decoration: none; font-weight: 800; border-radius: 6px; display: inline-block;">VER CATÁLOGO</a>
            </div>
          </div>
          <div style="padding: 20px; background: #f7fafc; text-align: center; font-size: 0.8rem; color: #a0aec0;">
            <p>© ${new Date().getFullYear()} iFooty Store Canada</p>
          </div>
        </div>
      `,
    });

    if (adminEmail.error || candidateEmail.error) {
      return res.status(500).json({ error: adminEmail.error || candidateEmail.error });
    }

    res.status(200).json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
