import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { name, content, rating, location, userEmail } = req.body;

  try {
    const { data, error } = await resend.emails.send({
      from: 'iFooty Testimonials <vendas@ifooty.ca>',
      to: ['camisadez085@gmail.com'],
      subject: `⭐ NOVO DEPOIMENTO - iFooty`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; color: #1a202c;">
          <div style="background: #000; padding: 20px; text-align: center; border-radius: 8px 8px 0 0;">
            <h1 style="color: #CCFF00; margin: 0; font-style: italic;">Novo Depoimento Recebido</h1>
          </div>
          <div style="padding: 30px; border: 1px solid #edf2f7; border-top: none; border-radius: 0 0 8px 8px;">
            <p style="font-size: 1.1rem; line-height: 1.6;">Um novo depoimento foi enviado e aguarda aprovação no painel de administração.</p>
            
            <div style="background: #f7fafc; padding: 20px; border-radius: 8px; border-left: 4px solid #CCFF00; margin-top: 20px;">
              <p><strong>Nome:</strong> ${name}</p>
              <p><strong>Localização:</strong> ${location}</p>
              <p><strong>Nota:</strong> ${rating} estrelas</p>
              <p style="margin-top: 15px; font-style: italic;">"${content}"</p>
            </div>
            
            <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; font-size: 0.9rem; color: #718096;">
              <p>Acesse o painel admin para aprovar ou rejeitar.</p>
            </div>
          </div>
        </div>
      `,
    });

    if (error) {
      console.error('Resend Error:', error);
      return res.status(500).json({ error });
    }

    return res.status(200).json({ success: true, id: data.id });
  } catch (err) {
    console.error('Server Error:', err);
    return res.status(500).json({ error: err.message });
  }
}
