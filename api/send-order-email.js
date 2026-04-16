import { Resend } from 'resend';

// Inicializa o Resend com a chave de API das variáveis de ambiente
const resend = new Resend(process.env.RESEND_API_KEY);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { order } = req.body;

  if (!order) {
    return res.status(400).json({ error: 'Order data missing' });
  }

  try {
    const itemsHtml = order.items.map(item => `
      <li style="margin-bottom: 10px; list-of-style: none; padding: 10px; background: #f4f4f4; border-radius: 4px;">
        <strong>${item.name}</strong><br/>
        Tamanho: ${item.size} | Qtd: ${item.quantity}<br/>
        Preço: $${item.price.toFixed(2)} CAD
      </li>
    `).join('');

    const { data, error } = await resend.emails.send({
      from: 'iFooty Store <onboarding@resend.dev>', // No modo gratuito, usa o domínio de teste da Resend
      to: ['bivisualizerr@gmail.com'],
      subject: `⚽ NOVO PEDIDO: ${order.customer_name}`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #eee; padding: 20px; border-radius: 8px;">
          <h2 style="color: #10B981; border-bottom: 2px solid #10B981; padding-bottom: 10px;">Novo Pedido Recebido! 🚀</h2>
          
          <p><strong>Cliente:</strong> ${order.customer_name}</p>
          <p><strong>E-mail:</strong> ${order.customer_email}</p>
          <p><strong>WhatsApp:</strong> ${order.customer_phone}</p>
          
          <h3 style="margin-top: 30px;">Itens do Pedido:</h3>
          <ul style="padding: 0;">
            ${itemsHtml}
          </ul>
          
          <div style="margin-top: 20px; padding: 15px; background: #10B981; color: #fff; border-radius: 4px; font-weight: bold; text-align: center;">
            TOTAL: $${order.total_price.toFixed(2)} CAD
          </div>
          
          <p style="margin-top: 30px; font-size: 0.9rem; color: #666;">
            <strong>Endereço de Entrega:</strong><br/>
            ${order.shipping_address.street}, ${order.shipping_address.apartment || ''}<br/>
            ${order.shipping_address.city}, ${order.shipping_address.province}<br/>
            CEP: ${order.shipping_address.postalCode}
          </p>
          
          <hr style="margin-top: 30px; border: 0; border-top: 1px solid #eee;" />
          <p style="text-align: center; color: #999; font-size: 0.8rem;">iFooty System Notification</p>
        </div>
      `,
    });

    if (error) {
      console.error('Resend Error:', error);
      return res.status(400).json(error);
    }

    res.status(200).json({ success: true, id: data.id });
  } catch (err) {
    console.error('Server Error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
}
