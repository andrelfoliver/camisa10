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
    const itemsHtml = order.items.map(item => {
      const customization = item.extras?.nameNumber 
        ? `<div style="margin-top: 5px; padding: 8px; background: #FFF9C4; border-left: 4px solid #FBC02D; font-size: 0.9rem; color: #444;">
             <strong>CUSTOMIZAÇÃO:</strong> ${item.extras.customName || 'N/A'} - ${item.extras.customNumber || 'N/A'}
           </div>`
        : '';
      
      const patches = item.extras?.patches 
        ? `<div style="margin-top: 3px; font-size: 0.85rem; color: #666;"><strong>+ Patches inclusos</strong></div>`
        : '';

      return `
        <div style="margin-bottom: 20px; padding: 15px; border: 1px solid #edf2f7; border-radius: 8px; display: flex; align-items: center; gap: 15px;">
          <div style="flex-shrink: 0;">
            <img src="${item.image}" alt="${item.name}" style="width: 80px; height: 100px; object-fit: cover; border-radius: 4px; border: 1px solid #eee;" />
          </div>
          <div style="flex-grow: 1;">
            <h4 style="margin: 0 0 5px 0; color: #1a202c; font-size: 1.1rem;">${item.name}</h4>
            <div style="font-size: 0.95rem; color: #4a5568;">
              Tamanho: <strong>${item.size}</strong> | Qtd: <strong>${item.quantity}</strong> | <strong>$${item.price.toFixed(2)} CAD</strong>
            </div>
            ${customization}
            ${patches}
          </div>
        </div>
      `;
    }).join('');

    const { data, error } = await resend.emails.send({
      from: 'iFooty Store <onboarding@resend.dev>',
      to: ['bivisualizerr@gmail.com'],
      subject: `⚽ NOVO PEDIDO: ${order.customer_name}`,
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 650px; margin: 0 auto; background: #ffffff;">
          <div style="padding: 30px; background: #000000; text-align: center; border-radius: 8px 8px 0 0;">
            <h1 style="color: #CCFF00; margin: 0; font-style: italic; font-weight: 900; letter-spacing: -1px;">iFooty.</h1>
            <p style="color: #ffffff; margin: 5px 0 0 0; opacity: 0.8; font-size: 0.9rem; text-transform: uppercase; letter-spacing: 2px;">Notificação de Venda Oficial</p>
          </div>
          
          <div style="padding: 30px; border: 1px solid #edf2f7; border-top: none; border-radius: 0 0 8px 8px;">
            <div style="margin-bottom: 30px;">
              <h2 style="color: #2d3748; font-size: 1.5rem; margin-bottom: 15px; border-bottom: 2px solid #CCFF00; display: inline-block;">Detalhes do Cliente</h2>
              <table style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="padding: 8px 0; color: #718096; width: 120px;">Nome:</td>
                  <td style="padding: 8px 0; color: #1a202c; font-weight: 600;">${order.customer_name}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #718096;">E-mail:</td>
                  <td style="padding: 8px 0; color: #1a202c;">${order.customer_email}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #718096;">WhatsApp:</td>
                  <td style="padding: 8px 0; color: #1a202c;">${order.customer_phone}</td>
                </tr>
              </table>
            </div>

            <div style="margin-bottom: 30px;">
              <h2 style="color: #2d3748; font-size: 1.5rem; margin-bottom: 20px;">Itens do Pedido</h2>
              ${itemsHtml}
            </div>

            <div style="background: #f7fafc; padding: 25px; border-radius: 8px; margin-bottom: 30px;">
              <table style="width: 100%;">
                <tr>
                  <td style="font-size: 1.1rem; color: #4a5568;">Subtotal</td>
                  <td style="text-align: right; font-size: 1.1rem; color: #4a5568;">$${order.total_price.toFixed(2)} CAD</td>
                </tr>
                <tr>
                  <td style="font-size: 1.4rem; font-weight: 800; color: #1a202c; padding-top: 10px;">TOTAL</td>
                  <td style="text-align: right; font-size: 1.4rem; font-weight: 900; color: #CCFF00; background: #000; padding: 10px 15px; border-radius: 6px;">$${order.total_price.toFixed(2)} CAD</td>
                </tr>
              </table>
            </div>

            <div style="border-top: 1px solid #edf2f7; padding-top: 25px;">
              <h3 style="color: #2d3748; font-size: 1.1rem; margin-bottom: 10px;">Endereço de Entrega</h3>
              <p style="color: #4a5568; line-height: 1.6; margin: 0;">
                ${order.shipping_address.street}, ${order.shipping_address.apartment || ''}<br/>
                ${order.shipping_address.city}, ${order.shipping_address.province}<br/>
                CEP: ${order.shipping_address.postalCode}
              </p>
            </div>

            <div style="margin-top: 40px; text-align: center; color: #a0aec0; font-size: 0.85rem;">
              <p>© 2026 iFooty Store Canada. All rights reserved.</p>
              <p>Este é um e-mail automático. Responda apenas se houver dúvidas sobre o processamento.</p>
            </div>
          </div>
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
