import { Resend } from 'resend';
import { createClient } from '@supabase/supabase-js';

const resend = new Resend(process.env.RESEND_API_KEY);

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const {
    adminEmail,
    recipientEmail,
    customerName,
    templateName,
    orderNumber,
    totalAmount,
    shippingAddress,
    products,
    trackingNumber,
    customSubject,
    customBody
  } = req.body;

  if (!recipientEmail || !templateName || !adminEmail) {
    return res.status(400).json({ error: 'Missing required parameters (recipientEmail, templateName, adminEmail)' });
  }

  // Security: only allow verified admin email to trigger manual sends
  const ALLOWED_ADMINS = ['ifootyc@gmail.com'];
  if (!ALLOWED_ADMINS.includes(adminEmail.toLowerCase().trim())) {
    return res.status(403).json({ error: 'Unauthorized admin user' });
  }

  const firstName = customerName ? customerName.split(' ')[0] : 'Customer';
  const orderIdShort = orderNumber ? orderNumber.slice(-8) : '';

  // 1. Format Products HTML
  let productsHtml = '';
  if (Array.isArray(products) && products.length > 0) {
    productsHtml = `
      <div style="margin: 25px 0; padding-top: 15px; border-top: 1px solid #edf2f7;">
        <h3 style="color: #1a202c; font-size: 1.1rem; margin-bottom: 15px;">Order Items:</h3>
        ${products.map(item => {
          let imgTag = '';
          if (item.image) {
            let imgUrl = item.image;
            if (!imgUrl.startsWith('http')) {
              imgUrl = `https://ifooty.ca${imgUrl.startsWith('/') ? '' : '/'}${imgUrl}`;
            }
            imgTag = `<img src="${imgUrl}" style="width: 50px; height: 60px; object-fit: cover; border-radius: 4px; border: 1px solid #edf2f7; margin-right: 12px;" />`;
          }
          return `
            <div style="margin-bottom: 12px; padding: 12px; border: 1px solid #edf2f7; border-radius: 6px; display: flex; align-items: center; background: #fafafa;">
              ${imgTag}
              <div style="flex: 1;">
                <h4 style="margin: 0 0 4px 0; font-size: 0.95rem; color: #2d3748;">${item.name || item.product_name || 'Jersey'}</h4>
                <p style="margin: 0; font-size: 0.85rem; color: #718096;">Size: <strong>${item.size || '—'}</strong> | Qty: <strong>${item.quantity || 1}</strong> ${item.price ? `| <strong>$${parseFloat(item.price).toFixed(2)} CAD</strong>` : ''}</p>
              </div>
            </div>
          `;
        }).join('')}
      </div>
    `;
  }

  // 2. Format Shipping Address HTML
  let addressHtml = '';
  if (shippingAddress) {
    let addressStr = '';
    if (typeof shippingAddress === 'object') {
      addressStr = `
        <strong>${shippingAddress.street || ''} ${shippingAddress.number || ''}</strong><br/>
        ${shippingAddress.apartment ? `Apt/Unit: ${shippingAddress.apartment}<br/>` : ''}
        ${shippingAddress.city || ''}, ${shippingAddress.province || ''} ${shippingAddress.postalCode || ''}<br/>
        ${shippingAddress.country || 'Canada'}
      `;
    } else {
      addressStr = shippingAddress.replace(/\n/g, '<br/>');
    }
    addressHtml = `
      <div style="margin: 20px 0; padding: 15px; background: #f8fafc; border-radius: 6px; border: 1px solid #edf2f7;">
        <h4 style="margin: 0 0 8px 0; color: #2d3748; font-size: 0.95rem;">Delivery Address:</h4>
        <p style="margin: 0; font-size: 0.9rem; color: #4a5568; line-height: 1.5;">${addressStr}</p>
      </div>
    `;
  }

  // 3. Format Total Amount Block
  let totalHtml = '';
  if (totalAmount && parseFloat(totalAmount) > 0) {
    totalHtml = `
      <div style="margin: 20px 0; padding: 12px; background: #fafafa; border-radius: 6px; text-align: right; font-size: 1.05rem; font-weight: bold;">
        Total: $${parseFloat(totalAmount).toFixed(2)} CAD
      </div>
    `;
  }

  // 4. Select template and content
  let subject = '';
  let subtitle = '';
  let bodyContent = '';

  switch (templateName) {
    case 'order_confirmation':
      subject = `⚽ Order Confirmation #${orderIdShort} - iFooty`;
      subtitle = 'Order Confirmation';
      bodyContent = `
        <p style="color: #4a5568; line-height: 1.6; font-size: 1.05rem; margin-top: 0;">Hi <strong>${firstName}</strong>,</p>
        <p style="color: #4a5568; line-height: 1.6; font-size: 1.05rem;">We have successfully received your order <strong>#${orderIdShort}</strong>. Our team is checking each detail (stock and size guide sizing) to proceed with dispatch.</p>
        ${productsHtml}
        ${totalHtml}
        ${addressHtml}
        <p style="color: #4a5568; line-height: 1.6; font-size: 1.05rem; margin-top: 25px;">You will receive another status update email once your order is processed. Thank you for choosing iFooty!</p>
      `;
      break;

    case 'payment_received':
      subject = `✅ Payment Confirmed! Order #${orderIdShort} - iFooty`;
      subtitle = 'Payment Confirmed';
      bodyContent = `
        <p style="color: #4a5568; line-height: 1.6; font-size: 1.05rem; margin-top: 0;">Hi <strong>${firstName}</strong>,</p>
        <p style="color: #4a5568; line-height: 1.6; font-size: 1.05rem;">Your payment for order <strong>#${orderIdShort}</strong> has been successfully processed and confirmed. Our team has scheduled your items for packaging and preparation.</p>
        ${productsHtml}
        ${totalHtml}
        ${addressHtml}
        <p style="color: #4a5568; line-height: 1.6; font-size: 1.05rem; margin-top: 25px;">If you have any questions or need to make last-minute sizing adjustments, please reply directly to this email.</p>
      `;
      break;

    case 'preparing_order':
      subject = `👕 Preparing your order #${orderIdShort}! - iFooty`;
      subtitle = 'Order in Preparation';
      bodyContent = `
        <p style="color: #4a5568; line-height: 1.6; font-size: 1.05rem; margin-top: 0;">Hi <strong>${firstName}</strong>,</p>
        <p style="color: #4a5568; line-height: 1.6; font-size: 1.05rem;">Passando para avisar que o seu pedido <strong>#${orderIdShort}</strong> está em preparação. Nossa equipe está conferindo e embalando os seus mantos com todo o cuidado para envio.</p>
        ${productsHtml}
        <p style="color: #4a5568; line-height: 1.6; font-size: 1.05rem; margin-top: 25px;">We will notify you with a tracking number as soon as it is picked up by the courier!</p>
      `;
      break;

    case 'order_shipped':
      subject = `🚀 Your iFooty order #${orderIdShort} has been shipped!`;
      subtitle = 'Order Dispatched';
      bodyContent = `
        <p style="color: #4a5568; line-height: 1.6; font-size: 1.05rem; margin-top: 0;">Hi <strong>${firstName}</strong>,</p>
        <p style="color: #4a5568; line-height: 1.6; font-size: 1.05rem;">Your order <strong>#${orderIdShort}</strong> has been dispatched and is on the way! Siga a entrega com o código de rastreamento abaixo.</p>
        ${trackingNumber ? `
          <div style="background: #f8fafc; padding: 15px; border-left: 4px solid #CCFF00; margin: 20px 0; font-size: 1rem; color: #1a202c;">
            <strong>Tracking Number:</strong> <code style="font-family: monospace; font-size: 1.1rem; background: #e2e8f0; padding: 2px 6px; border-radius: 4px;">${trackingNumber}</code>
          </div>
          <div style="text-align: center; margin: 25px 0;">
            <a href="https://ifooty.ca/profile" style="background-color: #CCFF00; color: #000000; padding: 12px 28px; border-radius: 6px; font-weight: bold; text-decoration: none; display: inline-block; font-size: 0.95rem; text-transform: uppercase;">Track My Order</a>
          </div>
        ` : ''}
        ${productsHtml}
        ${addressHtml}
      `;
      break;

    case 'out_for_delivery':
      subject = `🚚 Out for Delivery! Order #${orderIdShort} - iFooty`;
      subtitle = 'Out for Delivery';
      bodyContent = `
        <p style="color: #4a5568; line-height: 1.6; font-size: 1.05rem; margin-top: 0;">Hi <strong>${firstName}</strong>,</p>
        <p style="color: #4a5568; line-height: 1.6; font-size: 1.05rem;">Your package for order <strong>#${orderIdShort}</strong> is out for local delivery today. Please make sure someone is available to receive it!</p>
        ${trackingNumber ? `<p style="font-size: 0.9rem; color: #718096;">Tracking Ref: <strong>${trackingNumber}</strong></p>` : ''}
        ${productsHtml}
        ${addressHtml}
      `;
      break;

    case 'delivered':
      subject = `✅ Delivered! Order #${orderIdShort} - iFooty`;
      subtitle = 'Order Delivered';
      bodyContent = `
        <p style="color: #4a5568; line-height: 1.6; font-size: 1.05rem; margin-top: 0;">Hi <strong>${firstName}</strong>,</p>
        <p style="color: #4a5568; line-height: 1.6; font-size: 1.05rem;">Your order <strong>#${orderIdShort}</strong> has been successfully delivered!</p>
        <p style="color: #4a5568; line-height: 1.6; font-size: 1.05rem;">We hope you enjoy your new jerseys. If you can, take a photo and tag us on Instagram <strong>@ifooty.ca</strong>! We would love to see your feedback. 🔥</p>
        ${productsHtml}
      `;
      break;

    case 'custom_message':
      subject = customSubject || `Message regarding order #${orderIdShort} - iFooty`;
      subtitle = 'Support Notification';
      bodyContent = `
        <p style="color: #4a5568; line-height: 1.6; font-size: 1.05rem; margin-top: 0;">Hi <strong>${firstName}</strong>,</p>
        <div style="color: #4a5568; line-height: 1.6; font-size: 1.05rem; white-space: pre-wrap;">${customBody || ''}</div>
        ${productsHtml}
        ${addressHtml}
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
      
      <div style="padding: 40px 30px; background: #ffffff;">
        ${bodyContent}
      </div>
      
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
      subject: subject,
      html: htmlTemplate,
    });

    const isSuccess = !emailRes.error;
    const logData = {
      admin_email: adminEmail,
      recipient_email: recipientEmail,
      template_name: templateName,
      order_number: orderNumber || null,
      status: isSuccess ? 'success' : 'failed',
      message_id: emailRes.data?.id || null,
      error_message: emailRes.error ? (emailRes.error.message || JSON.stringify(emailRes.error)) : null
    };

    // Log the transaction in public.email_logs
    await supabase.from('email_logs').insert([logData]).catch(e => {
      console.error('Failed to write to database email_logs:', e);
    });

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
