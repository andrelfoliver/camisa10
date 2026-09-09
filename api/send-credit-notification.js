import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { customerEmail, customerName, amount, reason, description, orderId, minOrderAmount = 75, expiryDays = 30 } = req.body;

  if (!customerEmail || !amount) {
    return res.status(400).json({ error: 'Missing required fields (customerEmail, amount)' });
  }

  const firstName = (customerName || customerEmail.split('@')[0] || 'Cliente').split(' ')[0];
  const formattedAmount = Number(amount).toFixed(2);

  const subject = reason === 'loyalty_reward' || reason === 'reactivation_campaign'
    ? `🎁 Você ganhou $${formattedAmount} CAD de Presente na iFooty!`
    : `🎁 Crédito em Loja Disponível: $${formattedAmount} CAD na sua conta iFooty`;

  const htmlTemplate = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff; border: 1px solid #edf2f7; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.05);">
      <div style="padding: 32px 24px; background: #121416; text-align: center;">
        <h1 style="margin: 0; font-style: italic; font-weight: 900; letter-spacing: -1px; font-family: sans-serif; font-size: 2.2rem;">
          <span style="color: #CCFF00;">i</span><span style="color: #FFFFFF;">Footy</span><span style="color: #CCFF00;">.</span>
        </h1>
        <p style="color: #ffffff; margin-top: 8px; font-size: 0.9rem; opacity: 0.85; text-transform: uppercase; letter-spacing: 1.5px; font-weight: 600;">Saldo em Loja / Store Credit</p>
      </div>

      <div style="padding: 36px 28px; background: #ffffff;">
        <p style="color: #1a202c; font-size: 1.15rem; margin-top: 0;">Olá, <strong>${firstName}</strong>!</p>
        
        <p style="color: #4a5568; line-height: 1.6; font-size: 1rem;">
          ${reason === 'defect_compensation' 
            ? 'Pedimos sinceras desculpas pelo inconveniente com o produto recebido. Para nós da <strong>iFooty</strong>, a sua satisfação e a excelência dos nossos mantos vêm sempre em primeiro lugar.' 
            : reason === 'loyalty_reward' || reason === 'reactivation_campaign'
            ? 'Como agradecimento especial por ser nosso cliente e vestir a paixão pelo esporte conosco, liberamos um <strong>crédito de fidelidade exclusivo</strong> na sua conta!'
            : 'Temos uma ótima notícia! Um crédito especial acabou de ser disponibilizado em sua conta na <strong>iFooty</strong>.'}
        </p>

        <!-- CARD DE SALDO -->
        <div style="margin: 28px 0; background: #f8fafc; border: 2px dashed #cbd5e1; border-radius: 10px; padding: 24px; text-align: center;">
          <div style="font-size: 0.82rem; color: #64748b; font-weight: 700; text-transform: uppercase; letter-spacing: 1px;">Saldo Disponível na sua Carteira</div>
          <div style="font-size: 2.6rem; font-weight: 800; color: #0f172a; margin: 8px 0;">
            $${formattedAmount} <span style="font-size: 1.1rem; color: #10b981; font-weight: 700;">CAD</span>
          </div>
          ${description ? `<p style="margin: 6px 0 0; color: #64748b; font-size: 0.88rem; font-style: italic;">"${description}"</p>` : ''}
          ${orderId ? `<p style="margin: 4px 0 0; color: #94a3b8; font-size: 0.78rem;">Referente ao Pedido #${String(orderId).slice(-6)}</p>` : ''}
          
          <div style="display: inline-block; margin-top: 12px; background: #fef3c7; color: #92400e; padding: 4px 12px; border-radius: 20px; font-size: 0.78rem; font-weight: 700;">
            ⏳ Válido por ${expiryDays} dias
          </div>
        </div>

        <div style="background: #f0fdf4; border-left: 4px solid #10b981; padding: 16px 18px; border-radius: 6px; margin-bottom: 24px;">
          <p style="margin: 0 0 8px; color: #166534; font-size: 0.95rem; font-weight: 700;">
            Como aproveitar seu crédito:
          </p>
          <ul style="margin: 0; padding-left: 20px; color: #166534; font-size: 0.9rem; line-height: 1.6;">
            <li>Faça login ou informe seu e-mail (<strong>${customerEmail}</strong>) no checkout.</li>
            <li>Válido para pedidos a partir de <strong>$${Number(minOrderAmount).toFixed(2)} CAD</strong>.</li>
            <li>O desconto de <strong>$${formattedAmount} CAD</strong> será aplicado automaticamente!</li>
            <li><em>Não cumulativo com cupons promocionais adicionais ou descontos por volume.</em></li>
          </ul>
        </div>

        <div style="text-align: center; margin: 32px 0 16px;">
          <a href="https://ifooty.ca/profile" style="display: inline-block; background: #121416; color: #ffffff; text-decoration: none; font-weight: 700; font-size: 0.95rem; padding: 14px 32px; border-radius: 8px; box-shadow: 0 4px 10px rgba(0,0,0,0.15);">
            Acessar Minha Conta & Escolher Manto ⚽
          </a>
        </div>
      </div>

      <div style="padding: 20px; background: #f8fafc; text-align: center; color: #94a3b8; font-size: 0.8rem; border-top: 1px solid #edf2f7;">
        <p style="margin: 0 0 6px;">© ${new Date().getFullYear()} iFooty Store Canada. Vestindo a sua paixão.</p>
        <p style="margin: 0;">Dúvidas? Responda a este e-mail ou fale conosco diretamente no WhatsApp.</p>
      </div>
    </div>
  `;

  try {
    const emailRes = await resend.emails.send({
      from: 'iFooty Store <vendas@ifooty.ca>',
      to: [customerEmail],
      replyTo: 'camisadez085@gmail.com',
      subject,
      html: htmlTemplate,
    });

    if (emailRes.error) {
      console.error('❌ Resend Credit Notification Error:', emailRes.error);
      return res.status(400).json({ error: emailRes.error });
    }

    return res.status(200).json({ success: true, id: emailRes.data?.id });
  } catch (err) {
    console.error('📛 Credit Notification Server Error:', err);
    return res.status(500).json({ error: 'Internal server error', details: err.message });
  }
}
