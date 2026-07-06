import { Resend } from 'resend';
import { createClient } from '@supabase/supabase-js';

const resend = new Resend(process.env.RESEND_API_KEY);

// Supabase for logging — supports both VITE_ prefixed and plain env vars
const _sbUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const _sbKey = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;
let supabase = null;
try { if (_sbUrl && _sbKey) supabase = createClient(_sbUrl, _sbKey); } catch (_) {}

// ─────────────────────────────────────────────────────────────────────────────
// Helper: build formatted products HTML block
// ─────────────────────────────────────────────────────────────────────────────
function buildProductsHtml(products) {
  if (!Array.isArray(products) || products.length === 0) return '';
  return `
    <div style="margin: 25px 0; padding-top: 15px; border-top: 1px solid #edf2f7;">
      <h3 style="color: #1a202c; font-size: 1.1rem; margin-bottom: 15px;">Order Items:</h3>
      ${products.map(item => {
        let imgTag = '';
        if (item.image) {
          let imgUrl = item.image;
          if (!imgUrl.startsWith('http')) imgUrl = `https://ifooty.ca${imgUrl.startsWith('/') ? '' : '/'}${imgUrl}`;
          imgTag = `<img src="${imgUrl}" style="width: 50px; height: 60px; object-fit: cover; border-radius: 4px; border: 1px solid #edf2f7; margin-right: 12px;" />`;
        }
        
        let customization = '';
        if (item.extras?.nameNumber) {
          customization += `
            <div style="margin-top: 5px; padding: 6px 10px; background: #FFF9C4; border-left: 4px solid #FBC02D; font-size: 0.82rem; color: #444; border-radius: 4px;">
              <strong>CUSTOMIZATION:</strong> ${item.extras.customName || 'N/A'} - ${item.extras.customNumber || 'N/A'}
            </div>
          `;
        }
        if (item.extras?.extraCustomization && item.extras?.customExtraName) {
          customization += `
            <div style="margin-top: 5px; padding: 6px 10px; background: #E0F7FA; border-left: 4px solid #00BCD4; font-size: 0.82rem; color: #444; border-radius: 4px;">
              <strong>EXTRA CUSTOM:</strong> ${item.extras.customExtraName}
            </div>
          `;
        }
        if (item.extras?.patches) {
          customization += `
            <div style="margin-top: 5px; padding: 4px 8px; font-size: 0.8rem; color: #4a5568;">
              <strong>+ Patches included</strong>
            </div>
          `;
        }

        return `
          <div style="margin-bottom: 12px; padding: 12px; border: 1px solid #edf2f7; border-radius: 6px; display: flex; align-items: center; background: #fafafa;">
            ${imgTag}
            <div style="flex: 1;">
              <h4 style="margin: 0 0 4px 0; font-size: 0.95rem; color: #2d3748;">${item.name || item.product_name || 'Jersey'}</h4>
              <p style="margin: 0; font-size: 0.85rem; color: #718096;">Size: <strong>${item.size || '—'}</strong> | Qty: <strong>${item.quantity || 1}</strong> ${item.price ? `| <strong>$${parseFloat(item.price).toFixed(2)} CAD</strong>` : ''}</p>
              ${customization}
            </div>
          </div>
        `;
      }).join('')}
    </div>
  `;
}

// ─────────────────────────────────────────────────────────────────────────────
// Helper: build address HTML block
// ─────────────────────────────────────────────────────────────────────────────
function buildAddressHtml(shippingAddress) {
  if (!shippingAddress) return '';
  let addressStr = '';
  if (typeof shippingAddress === 'object') {
    addressStr = `
      <strong>${shippingAddress.street || ''} ${shippingAddress.number || ''}</strong><br/>
      ${shippingAddress.apartment ? `Apt/Unit: ${shippingAddress.apartment}<br/>` : ''}
      ${shippingAddress.city || ''}, ${shippingAddress.province || ''} ${shippingAddress.postalCode || ''}<br/>
      ${shippingAddress.country || 'Canada'}
    `;
  } else {
    addressStr = String(shippingAddress).replace(/\n/g, '<br/>');
  }
  return `
    <div style="margin: 20px 0; padding: 15px; background: #f8fafc; border-radius: 6px; border: 1px solid #edf2f7;">
      <h4 style="margin: 0 0 8px 0; color: #2d3748; font-size: 0.95rem;">Delivery Address:</h4>
      <p style="margin: 0; font-size: 0.9rem; color: #4a5568; line-height: 1.5;">${addressStr}</p>
    </div>
  `;
}

// ─────────────────────────────────────────────────────────────────────────────
// Handler
// ─────────────────────────────────────────────────────────────────────────────
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const body = req.body;

  // ── MODE: Manual Admin Email (templateName present) ──────────────────────
  if (body.templateName) {
    const {
      adminEmail, recipientEmail, customerName, templateName,
      orderNumber, totalAmount, shippingAddress, products,
      trackingNumber, customSubject, customBody
    } = body;

    if (!recipientEmail || !templateName || !adminEmail) {
      return res.status(400).json({ error: 'Missing required parameters (recipientEmail, templateName, adminEmail)' });
    }

    const ALLOWED_ADMINS = ['ifootyc@gmail.com'];
    if (!ALLOWED_ADMINS.includes(adminEmail.toLowerCase().trim())) {
      return res.status(403).json({ error: 'Unauthorized admin user' });
    }

    const firstName = customerName ? customerName.split(' ')[0] : 'Customer';
    const orderIdShort = orderNumber ? orderNumber.slice(-8) : '';
    const productsHtml = buildProductsHtml(products);
    const addressHtml = buildAddressHtml(shippingAddress);
    const totalHtml = totalAmount && parseFloat(totalAmount) > 0
      ? `<div style="margin: 20px 0; padding: 12px; background: #fafafa; border-radius: 6px; text-align: right; font-size: 1.05rem; font-weight: bold;">Total: $${parseFloat(totalAmount).toFixed(2)} CAD</div>`
      : '';

    let subject = '', subtitle = '', bodyContent = '';

    switch (templateName) {
      case 'order_confirmation':
        subject = `⚽ Order Confirmation #${orderIdShort} - iFooty`;
        subtitle = 'Order Confirmation';
        bodyContent = `
          <p style="color: #4a5568; line-height: 1.6; font-size: 1.05rem; margin-top: 0;">Hi <strong>${firstName}</strong>,</p>
          <p style="color: #4a5568; line-height: 1.6; font-size: 1.05rem;">We have successfully received your order <strong>#${orderIdShort}</strong>. Our team is checking each detail to proceed with dispatch.</p>
          ${productsHtml}${totalHtml}${addressHtml}
          <p style="color: #4a5568; line-height: 1.6; font-size: 1.05rem; margin-top: 25px;">Thank you for choosing iFooty!</p>
        `;
        break;
      case 'payment_received':
        subject = `✅ Payment Confirmed! Order #${orderIdShort} - iFooty`;
        subtitle = 'Payment Confirmed';
        bodyContent = `
          <p style="color: #4a5568; line-height: 1.6; font-size: 1.05rem; margin-top: 0;">Hi <strong>${firstName}</strong>,</p>
          <p style="color: #4a5568; line-height: 1.6; font-size: 1.05rem;">Your payment for order <strong>#${orderIdShort}</strong> has been successfully confirmed. Our team has scheduled your items for preparation.</p>
          ${productsHtml}${totalHtml}${addressHtml}
        `;
        break;
      case 'preparing_order':
        subject = `👕 Preparing your order #${orderIdShort}! - iFooty`;
        subtitle = 'Order in Preparation';
        bodyContent = `
          <p style="color: #4a5568; line-height: 1.6; font-size: 1.05rem; margin-top: 0;">Hi <strong>${firstName}</strong>,</p>
          <p style="color: #4a5568; line-height: 1.6; font-size: 1.05rem;">Your order <strong>#${orderIdShort}</strong> is now in preparation. Our team is packaging your jerseys with care.</p>
          ${productsHtml}
        `;
        break;
      case 'order_shipped':
        subject = `🚀 Your iFooty order #${orderIdShort} has been shipped!`;
        subtitle = 'Order Dispatched';
        bodyContent = `
          <p style="color: #4a5568; line-height: 1.6; font-size: 1.05rem; margin-top: 0;">Hi <strong>${firstName}</strong>,</p>
          <p style="color: #4a5568; line-height: 1.6; font-size: 1.05rem;">Your order <strong>#${orderIdShort}</strong> has been dispatched and is on the way!</p>
          ${trackingNumber ? `
            <div style="background: #f8fafc; padding: 15px; border-left: 4px solid #CCFF00; margin: 20px 0; font-size: 1rem; color: #1a202c;">
              <strong>Tracking Number:</strong> <code style="font-family: monospace; font-size: 1.1rem; background: #e2e8f0; padding: 2px 6px; border-radius: 4px;">${trackingNumber}</code>
            </div>
            <div style="text-align: center; margin: 25px 0;">
              <a href="https://ifooty.ca/profile" style="background-color: #CCFF00; color: #000000; padding: 12px 28px; border-radius: 6px; font-weight: bold; text-decoration: none; display: inline-block; font-size: 0.95rem; text-transform: uppercase;">Track My Order</a>
            </div>
          ` : ''}
          ${productsHtml}${addressHtml}
        `;
        break;
      case 'out_for_delivery':
        subject = `🚚 Out for Delivery! Order #${orderIdShort} - iFooty`;
        subtitle = 'Out for Delivery';
        bodyContent = `
          <p style="color: #4a5568; line-height: 1.6; font-size: 1.05rem; margin-top: 0;">Hi <strong>${firstName}</strong>,</p>
          <p style="color: #4a5568; line-height: 1.6; font-size: 1.05rem;">Your package for order <strong>#${orderIdShort}</strong> is out for local delivery today!</p>
          ${trackingNumber ? `<p style="font-size: 0.9rem; color: #718096;">Tracking Ref: <strong>${trackingNumber}</strong></p>` : ''}
          ${productsHtml}${addressHtml}
        `;
        break;
      case 'delivered':
        subject = `✅ Delivered! Order #${orderIdShort} - iFooty`;
        subtitle = 'Order Delivered';
        bodyContent = `
          <p style="color: #4a5568; line-height: 1.6; font-size: 1.05rem; margin-top: 0;">Hi <strong>${firstName}</strong>,</p>
          <p style="color: #4a5568; line-height: 1.6; font-size: 1.05rem;">Your order <strong>#${orderIdShort}</strong> has been delivered! We hope you enjoy your new jerseys. Tag us on Instagram <strong>@ifooty.ca</strong>! 🔥</p>
          ${productsHtml}
        `;
        break;
      case 'custom_message':
        subject = customSubject || `Message regarding order #${orderIdShort} - iFooty`;
        subtitle = 'Support Notification';
        bodyContent = `
          <p style="color: #4a5568; line-height: 1.6; font-size: 1.05rem; margin-top: 0;">Hi <strong>${firstName}</strong>,</p>
          <div style="color: #4a5568; line-height: 1.6; font-size: 1.05rem; white-space: pre-wrap;">${customBody || ''}</div>
          ${productsHtml}${addressHtml}
        `;
        break;
      default:
        return res.status(400).json({ error: `Unknown template: ${templateName}` });
    }

    const htmlTemplate = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff; border: 1px solid #edf2f7; border-radius: 8px; overflow: hidden;">
        <div style="padding: 30px; background: #000000; text-align: center;">
          <h1 style="margin: 0; font-style: italic; font-weight: 900; letter-spacing: -1px; font-family: sans-serif; font-size: 2.5rem;">
            <span style="color: #CCFF00;">i</span><span style="color: #FFFFFF;">Footy</span><span style="color: #CCFF00;">.</span>
          </h1>
          <p style="color: #ffffff; margin-top: 10px; font-size: 1rem; opacity: 0.9; text-transform: uppercase; letter-spacing: 1px;">${subtitle}</p>
        </div>
        <div style="padding: 40px 30px; background: #ffffff;">${bodyContent}</div>
        <div style="padding: 20px; background: #f7fafc; text-align: center; color: #a0aec0; font-size: 0.8rem; border-top: 1px solid #edf2f7;">
          <p>© ${new Date().getFullYear()} iFooty Store Canada. Bringing Brazilian passion to Canada.</p>
          <p>If you did not expect this email, you can safely ignore it.</p>
        </div>
      </div>
    `;

    try {
      const emailRes = await resend.emails.send({
        from: 'iFooty Store <vendas@ifooty.ca>',
        to: [recipientEmail],
        replyTo: 'camisadez085@gmail.com',
        subject,
        html: htmlTemplate,
      });

      const isSuccess = !emailRes.error;
      // Write to email_logs — completely isolated so it never breaks email delivery
      try {
        if (supabase) {
          await supabase.from('email_logs').insert([{
            admin_email: adminEmail,
            recipient_email: recipientEmail,
            template_name: templateName,
            order_number: orderNumber || null,
            status: isSuccess ? 'success' : 'failed',
            message_id: emailRes.data?.id || null,
            error_message: emailRes.error ? (emailRes.error.message || JSON.stringify(emailRes.error)) : null
          }]);
        }
      } catch (logErr) {
        // Log errors must never break the email response
        console.error('email_logs insert failed (non-fatal):', logErr.message);
      }

      if (emailRes.error) {
        console.error('❌ Resend Manual Email Error:', JSON.stringify(emailRes.error, null, 2));
        return res.status(400).json({ error: emailRes.error });
      }
      console.log('✅ Manual Email Sent:', emailRes.data?.id);
      return res.status(200).json({ success: true, id: emailRes.data?.id });
    } catch (err) {
      console.error('📛 Internal Server Error:', err);
      return res.status(500).json({ error: 'Internal server error', details: err.message });
    }
  }

  // ── MODE: Automatic Status Email (legacy — order + newStatus) ────────────
  const { order, newStatus } = body;

  if (!order || !newStatus) {
    return res.status(400).json({ error: 'Order data or new status missing' });
  }
  if (!order.customer_email) {
    return res.status(200).json({ skipped: true, reason: 'No customer email provided' });
  }

  const orderIdShort = order.id.slice(0, 8);
  const firstName = order.customer_name ? order.customer_name.split(' ')[0] : 'Cliente';
  let subject = '', bodyContent = '';

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
      <p style="color: #4a5568; line-height: 1.6; font-size: 1.05rem;">Você pode acompanhar a entrega fazendo login em nosso site, acessando <strong>"Minha Conta" &gt; "Pedidos"</strong> e clicando em <strong>"Rastrear Envio"</strong>.</p>
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
      <div style="padding: 40px 30px; background: #ffffff;">${bodyContent}</div>
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
      subject,
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
