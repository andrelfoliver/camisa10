import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { customerName, customerEmail, cartItems } = req.body;

  if (!customerEmail || !customerName || !cartItems || !Array.isArray(cartItems) || cartItems.length === 0) {
    return res.status(400).json({ error: 'Missing required parameters' });
  }

  const firstName = customerName.split(' ')[0] || 'Cliente';

  const cartItemsHtml = cartItems.map(item => `
    <div style="display: flex; align-items: center; padding: 15px; border-bottom: 1px solid #edf2f7; background: #fdfdfd;">
      <div style="flex: 0 0 50px; margin-right: 15px;">
        <img src="${item.image}" alt="" style="width: 50px; height: 50px; object-fit: contain; background: #fff; border: 1px solid #edf2f7; border-radius: 4px;" />
      </div>
      <div style="flex: 1;">
        <h4 style="margin: 0; color: #1a202c; font-size: 0.95rem;">${item.name}</h4>
        <p style="margin: 5px 0 0 0; color: #718096; font-size: 0.85rem;">Tamanho: <strong>${item.size}</strong> | Qtd: ${item.quantity}</p>
      </div>
      <div style="flex: 0 0 auto; text-align: right; font-weight: bold; color: #000000; font-size: 0.95rem;">
        $${(item.price * item.quantity).toFixed(2)}
      </div>
    </div>
  `).join('');

  const htmlTemplate = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff; border: 1px solid #edf2f7; border-radius: 8px; overflow: hidden;">
      <div style="padding: 35px 30px; background: #000000; text-align: center;">
        <h1 style="margin: 0; font-style: italic; font-weight: 900; letter-spacing: -1px; font-family: sans-serif; font-size: 2.5rem;">
          <span style="color: #CCFF00;">i</span><span style="color: #FFFFFF;">Footy</span><span style="color: #CCFF00;">.</span>
        </h1>
        <p style="color: #ffffff; margin-top: 10px; font-size: 0.95rem; opacity: 0.9; text-transform: uppercase; letter-spacing: 1px;">Esqueceu algo na sacola?</p>
      </div>
      
      <div style="padding: 35px 30px; background: #ffffff;">
        <p style="color: #4a5568; line-height: 1.6; font-size: 1.05rem; margin-top: 0;">Olá, <strong>${firstName}</strong>!</p>
        <p style="color: #4a5568; line-height: 1.6; font-size: 1.05rem;">Notamos que você visitou a iFooty e deixou alguns itens selecionados no seu carrinho de compras.</p>
        <p style="color: #4a5568; line-height: 1.6; font-size: 1.05rem;">Como o estoque de nossos mantos premium é limitado e a demanda é alta, salvamos os seus itens abaixo para que você não os perca:</p>
        
        <div style="margin: 25px 0; border: 1px solid #edf2f7; border-radius: 8px; overflow: hidden;">
          ${cartItemsHtml}
        </div>
        
        <p style="color: #4a5568; line-height: 1.6; font-size: 1.05rem;">Aproveite para garantir o seu manto oficial com <strong>frete grátis para todo o Canadá e EUA</strong>! 🇨🇦🇺🇸</p>
        
        <div style="text-align: center; margin: 35px 0 25px 0;">
          <a href="https://ifooty.ca" style="background-color: #CCFF00; color: #000000; padding: 14px 35px; border-radius: 6px; font-weight: 900; text-decoration: none; display: inline-block; font-size: 1.05rem; text-transform: uppercase; letter-spacing: 0.5px; box-shadow: 0 4px 15px rgba(204, 255, 0, 0.3);">Concluir Minha Compra</a>
        </div>
        
        <p style="color: #718096; line-height: 1.6; font-size: 0.95rem; margin-top: 25px; border-top: 1px solid #f7fafc; padding-top: 20px;">Qualquer dúvida sobre o pagamento (aceitamos Interac e-Transfer e PayPal) ou sobre o frete, basta responder a este e-mail ou falar conosco diretamente pelo WhatsApp.</p>
        <p style="color: #4a5568; line-height: 1.6; font-size: 1.05rem; margin-top: 20px; margin-bottom: 0;">Abraços,<br/><strong>Equipe iFooty</strong></p>
      </div>
      
      <div style="padding: 20px; background: #f7fafc; text-align: center; color: #a0aec0; font-size: 0.8rem; border-top: 1px solid #edf2f7;">
        <p>© ${new Date().getFullYear()} iFooty Store Canada. Vestindo a paixão brasileira no Canadá.</p>
        <p>Se você não iniciou esta sacola, pode desconsiderar este e-mail.</p>
      </div>
    </div>
  `;

  try {
    const emailRes = await resend.emails.send({
      from: 'iFooty Store <vendas@ifooty.ca>',
      to: [customerEmail],
      replyTo: 'camisadez085@gmail.com',
      subject: 'Esqueceu alguma coisa na sua sacola? 🛒⚽',
      html: htmlTemplate,
    });

    if (emailRes.error) {
      console.error('❌ Resend Abandoned Cart Email Error:', JSON.stringify(emailRes.error, null, 2));
      return res.status(400).json({ error: emailRes.error });
    }

    console.log('✅ Abandoned Cart Email Sent:', emailRes.data?.id);
    return res.status(200).json({ success: true, id: emailRes.data?.id });
  } catch (err) {
    console.error('📛 Internal Server Error:', err);
    return res.status(500).json({ error: 'Internal server error', details: err.message });
  }
}
