import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { agentName, agentEmail, couponCode, discountPercent, commissionPercent } = req.body;

  if (!agentEmail || !couponCode) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const referralLink = `https://ifooty.ca/?ref=${couponCode}`;

  try {
    const { data, error } = await resend.emails.send({
      from: 'iFooty Parceiros <parceiros@ifooty.ca>',
      to: [agentEmail],
      replyTo: 'camisadez085@gmail.com',
      subject: `⚽ Bem-vindo ao time iFooty, ${agentName.split(' ')[0]}!`,
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #edf2f7; border-radius: 12px; overflow: hidden; background: #ffffff;">
          <div style="padding: 40px 30px; background: #000000; text-align: center;">
            <h1 style="margin: 0; font-style: italic; font-weight: 900; letter-spacing: -1px; font-family: sans-serif; font-size: 2.5rem;">
              <span style="color: #CCFF00;">i</span><span style="color: #FFFFFF;">Footy</span><span style="color: #CCFF00;">.</span>
            </h1>
            <p style="color: #CCFF00; margin-top: 10px; font-size: 0.9rem; text-transform: uppercase; letter-spacing: 2px; font-weight: 700;">Programa de Colaboradores</p>
          </div>
          
          <div style="padding: 40px 30px;">
            <h2 style="color: #1a202c; font-size: 1.5rem; margin-bottom: 20px;">Olá, ${agentName}!</h2>
            <p style="color: #4a5568; line-height: 1.6; font-size: 1.1rem; margin-bottom: 30px;">
              É um prazer ter você conosco! A partir de agora, você faz parte do nosso time de elite. Criamos ferramentas exclusivas para você divulgar o manto sagrado e ser recompensado por isso.
            </p>

            <div style="background: #f7fafc; padding: 25px; border-radius: 12px; border: 1px solid #edf2f7; margin-bottom: 30px;">
              <h3 style="margin-top: 0; color: #1a202c; font-size: 1rem; text-transform: uppercase; letter-spacing: 1px;">Seus Dados de Divulgação:</h3>
              <div style="margin-top: 15px;">
                <p style="margin: 5px 0; color: #718096; font-size: 0.85rem;">SEU CUPOM EXCLUSIVO:</p>
                <div style="font-size: 2rem; font-weight: 900; color: #000; letter-spacing: 1px;">${couponCode}</div>
                <p style="margin: 5px 0; color: #48bb78; font-weight: 600; font-size: 0.9rem;">(Oferece ${discountPercent}% de desconto para o cliente)</p>
              </div>
              
              <div style="margin-top: 25px; padding-top: 20px; border-top: 1px solid #e2e8f0;">
                <p style="margin: 5px 0; color: #718096; font-size: 0.85rem;">SEU LINK DE REFERRAL:</p>
                <a href="${referralLink}" style="color: #3182ce; font-weight: 600; word-break: break-all; font-size: 0.95rem;">${referralLink}</a>
              </div>
            </div>

            <div style="margin-bottom: 30px;">
              <h3 style="color: #1a202c; font-size: 1.2rem; margin-bottom: 15px;">💰 Seu Plano de Recompensas</h3>
              <div style="background: #fff; border-left: 4px solid #CCFF00; padding: 15px; margin-bottom: 20px; box-shadow: 0 2px 5px rgba(0,0,0,0.05);">
                <p style="margin: 0; color: #1a202c; font-weight: 700; font-size: 1.1rem;">Comissão de ${commissionPercent || 10}% por venda</p>
                <p style="margin: 5px 0 0 0; color: #718096; font-size: 0.9rem;">Você recebe sobre o valor líquido dos produtos em cada pedido atribuído a você.</p>
              </div>
              
              <ul style="color: #4a5568; line-height: 1.6; padding-left: 20px;">
                <li style="margin-bottom: 10px;"><strong>Rastreamento via Link</strong>: Se o cliente clicar no seu link, os cookies dele ficam marcados por 30 dias. Qualquer compra que ele fizer nesse período conta para você.</li>
                <li style="margin-bottom: 10px;"><strong>Fechamento via Cupom</strong>: O uso do seu código <strong>${couponCode}</strong> no checkout garante a sua comissão instantaneamente e dá <strong>${discountPercent}% OFF</strong> para o cliente.</li>
                <li style="margin-bottom: 10px;"><strong>Bonificações Extra</strong>: Parceiros com alta performance (acima de $1.000 em vendas/mês) são elegíveis a prêmios e bônus de aceleramento.</li>
                <li><strong>Pagamentos</strong>: O fechamento das comissões acontece mensalmente e os pagamentos são realizados via <strong>Interac e-Transfer</strong> até o dia 10 do mês seguinte.</li>
              </ul>
            </div>

            <div style="text-align: center; margin-top: 40px; padding-top: 30px; border-top: 1px solid #edf2f7;">
              <p style="color: #718096; font-size: 0.9rem; margin-bottom: 20px;">Dúvidas? Responda a este e-mail.</p>
              <p style="color: #1a202c; font-weight: 700;">Vamos pra cima! ⚽🚀</p>
            </div>
          </div>
          
          <div style="padding: 20px; background: #f7fafc; text-align: center; color: #a0aec0; font-size: 0.8rem;">
            <p>© ${new Date().getFullYear()} iFooty Store Canada. Vestindo a paixão brasileira no Canadá.</p>
          </div>
        </div>
      `,
    });

    if (error) {
      return res.status(500).json({ error });
    }

    res.status(200).json({ success: true, id: data.id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
