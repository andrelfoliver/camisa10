import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { order, newStatus, language = 'pt' } = req.body;

  if (!order || !newStatus) {
    return res.status(400).json({ error: 'Order data or new status missing' });
  }

  // Se não houver email do cliente, não há como enviar.
  if (!order.customer_email) {
     return res.status(200).json({ skipped: true, reason: 'No customer email provided' });
  }

  const orderIdShort = order.id.slice(0, 8);
  const firstName = order.customer_name ? order.customer_name.split(' ')[0] : 'Cliente';

  let subject = '';
  let bodyContent = '';

  if (newStatus === 'processing') {
    subject = `Seu pedido #${orderIdShort} está sendo preparado! 👕`;
    bodyContent = `
      <p style="color: #4a5568; line-height: 1.6; font-size: 1.05rem;">Olá, <strong>${firstName}</strong>!</p>
      <p style="color: #4a5568; line-height: 1.6; font-size: 1.05rem;">Passando para avisar que o seu pedido <strong>#${orderIdShort}</strong> acaba de entrar na nossa fase de preparação.</p>
      <p style="color: #4a5568; line-height: 1.6; font-size: 1.05rem;">Nossa equipe está separando e conferindo cada detalhe do seu manto para garantir que ele chegue em perfeitas condições.</p>
      <p style="color: #4a5568; line-height: 1.6; font-size: 1.05rem;">Assim que ele for despachado, você receberá um novo e-mail com o código de rastreamento para acompanhar a viagem.</p>
      <p style="color: #4a5568; line-height: 1.6; font-size: 1.05rem; margin-top: 20px;">Obrigado por escolher a iFooty!</p>
    `;
  } else if (newStatus === 'shipped') {
    subject = `Grande notícia! Seu pedido #${orderIdShort} foi despachado 🚀`;
    bodyContent = `
      <p style="color: #4a5568; line-height: 1.6; font-size: 1.05rem;">Olá, <strong>${firstName}</strong>!</p>
      <p style="color: #4a5568; line-height: 1.6; font-size: 1.05rem;">O seu manto já está na estrada! Seu pedido <strong>#${orderIdShort}</strong> acaba de ser despachado e está a caminho do seu endereço.</p>
      ${order.tracking_number ? `<div style="background: #f7fafc; padding: 15px; border-left: 4px solid #CCFF00; margin: 20px 0;"><strong>Seu Código de Rastreamento:</strong> ${order.tracking_number}</div>` : ''}
      <p style="color: #4a5568; line-height: 1.6; font-size: 1.05rem;">Você também pode acompanhar a evolução da entrega a qualquer momento fazendo login em nosso site, acessando a aba <strong>"Minha Conta" &gt; "Pedidos"</strong> e clicando no botão <strong>"Rastrear Envio"</strong> para ver todas as atualizações em tempo real sem precisar sair da loja.</p>
      <p style="color: #4a5568; line-height: 1.6; font-size: 1.05rem; margin-top: 20px;">Logo você estará com sua camisa em mãos!</p>
    `;
  } else if (newStatus === 'completed') {
    subject = `Seu pedido #${orderIdShort} foi entregue! ✅`;
    bodyContent = `
      <p style="color: #4a5568; line-height: 1.6; font-size: 1.05rem;">Olá, <strong>${firstName}</strong>!</p>
      <p style="color: #4a5568; line-height: 1.6; font-size: 1.05rem;">Nosso sistema logístico informou que o seu pedido <strong>#${orderIdShort}</strong> foi entregue com sucesso!</p>
      <p style="color: #4a5568; line-height: 1.6; font-size: 1.05rem;">Esperamos que você curta muito a qualidade do seu novo manto. Se puder, tire uma foto vestindo a camisa e marque a gente no Instagram <strong>@ifooty.ca</strong>! Nós adoramos ver os clientes satisfeitos. 🔥</p>
      <p style="color: #4a5568; line-height: 1.6; font-size: 1.05rem; margin-top: 20px;">Até a próxima compra!</p>
    `;
  } else if (newStatus === 'cancelled') {
    subject = `Atualização importante sobre o seu pedido #${orderIdShort}`;
    bodyContent = `
      <p style="color: #4a5568; line-height: 1.6; font-size: 1.05rem;">Olá, <strong>${firstName}</strong>!</p>
      <p style="color: #4a5568; line-height: 1.6; font-size: 1.05rem;">Infelizmente, o seu pedido <strong>#${orderIdShort}</strong> precisou ser cancelado em nosso sistema.</p>
      <p style="color: #4a5568; line-height: 1.6; font-size: 1.05rem;">Caso você tenha dúvidas sobre o motivo do cancelamento ou caso tenha ocorrido algum erro no processo de pagamento via Interac e-Transfer, por favor, responda a este e-mail ou nos chame no WhatsApp e resolveremos imediatamente.</p>
      <p style="color: #4a5568; line-height: 1.6; font-size: 1.05rem; margin-top: 20px;">Estamos à disposição!</p>
    `;
  } else {
    // Para pending ou outros status não configuramos e-mail automático ainda
    return res.status(200).json({ skipped: true, reason: 'Status does not require email notification' });
  }

  const htmlTemplate = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff; border: 1px solid #edf2f7; border-radius: 8px; overflow: hidden;">
      <div style="padding: 30px; background: #000000; text-align: center;">
        <h1 style="margin: 0; font-style: italic; font-weight: 900; letter-spacing: -1px; font-family: sans-serif; font-size: 2.5rem;">
          <span style="color: #CCFF00;">i</span><span style="color: #FFFFFF;">Footy</span><span style="color: #CCFF00;">.</span>
        </h1>
        <p style="color: #ffffff; margin-top: 10px; font-size: 1rem; opacity: 0.9; text-transform: uppercase; letter-spacing: 1px;">Atualização de Pedido</p>
      </div>
      
      <div style="padding: 40px 30px; background: #ffffff;">
        ${bodyContent}
      </div>
      
      <div style="padding: 20px; background: #f7fafc; text-align: center; color: #a0aec0; font-size: 0.8rem; border-top: 1px solid #edf2f7;">
        <p>© ${new Date().getFullYear()} iFooty Store Canada. Vestindo a paixão brasileira no Canadá.</p>
        <p>Se você não solicitou isso, ignore este e-mail.</p>
      </div>
    </div>
  `;

  try {
    const emailRes = await resend.emails.send({
      from: 'iFooty Store <vendas@ifooty.ca>',
      to: [order.customer_email],
      replyTo: 'camisadez085@gmail.com',
      subject: subject,
      html: htmlTemplate,
    });

    if (emailRes.error) {
      console.error('❌ Resend Status Email Error:', JSON.stringify(emailRes.error, null, 2));
      return res.status(400).json({ error: emailRes.error });
    }

    console.log('✅ Status Email Sent:', emailRes.data?.id);
    return res.status(200).json({ success: true, id: emailRes.data?.id });
  } catch (err) {
    console.error('📛 Internal Server Error:', err);
    return res.status(500).json({ error: 'Internal server error', details: err.message });
  }
}
