import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { customerName, customerEmail, cartItems, emailType } = req.body;

  if (!customerEmail || !customerName || !cartItems || !Array.isArray(cartItems) || cartItems.length === 0) {
    return res.status(400).json({ error: 'Missing required parameters' });
  }

  const firstName = customerName.split(' ')[0] || 'Cliente';

  const cartItemsHtml = cartItems.map(item => {
    let customization = '';
    if (item.extras?.nameNumber) {
      customization += `
        <div style="margin-top: 5px; padding: 4px 8px; background: #FFF9C4; border-left: 3px solid #FBC02D; font-size: 0.78rem; color: #444; border-radius: 4px; display: inline-block;">
          <strong>CUSTOMIZATION:</strong> ${item.extras.customName || 'N/A'} - ${item.extras.customNumber || 'N/A'}
        </div>
      `;
    }
    if (item.extras?.patches || item.extras?.patch) {
      const patchText = item.extras?.customPatch ? `: ${item.extras.customPatch}` : '';
      customization += `
        <div style="margin-top: 5px; padding: 4px 8px; font-size: 0.78rem; color: #4a5568; background: #fafafa; border: 1px solid #edf2f7; border-radius: 4px; display: inline-block; margin-left: 5px;">
          <strong>+ Patches included</strong>${patchText}
        </div>
      `;
    }
    if (item.extras?.extraCustomization && item.extras?.customExtraName) {
      customization += `
        <div style="margin-top: 5px; padding: 4px 8px; background: #E0F7FA; border-left: 3px solid #00BCD4; font-size: 0.78rem; color: #444; border-radius: 4px; display: inline-block; margin-left: 5px;">
          <strong>EXTRA:</strong> ${item.extras.customExtraName}
        </div>
      `;
    }
    return `
      <div style="display: flex; align-items: center; padding: 15px; border-bottom: 1px solid #edf2f7; background: #fdfdfd;">
        <div style="flex: 0 0 50px; margin-right: 15px;">
          <img src="${item.image}" alt="" style="width: 50px; height: 50px; object-fit: contain; background: #fff; border: 1px solid #edf2f7; border-radius: 4px;" />
        </div>
        <div style="flex: 1;">
          <h4 style="margin: 0; color: #1a202c; font-size: 0.95rem;">${item.name}</h4>
          <p style="margin: 5px 0 0 0; color: #718096; font-size: 0.85rem;">Tamanho: <strong>${item.size}</strong> | Qtd: ${item.quantity}</p>
          ${customization}
        </div>
        <div style="flex: 0 0 auto; text-align: right; font-weight: bold; color: #000000; font-size: 0.95rem;">
          $${(item.price * item.quantity).toFixed(2)}
        </div>
      </div>
    `;
  }).join('');

  const isSecondEmail = Number(emailType) === 2;

  const subject = isSecondEmail 
    ? 'Last chance! Your iFooty cart is about to expire ⏳🚨'
    : 'Did you forget something in your cart? 🛒⚽';

  const subtitle = isSecondEmail
    ? 'Time is running out!'
    : 'You left something behind!';

  const emailBody = `
        <p style="color: #4a5568; line-height: 1.6; font-size: 1.05rem; margin-top: 0;">Hi, <strong>${firstName}</strong>!</p>
        <p style="color: #4a5568; line-height: 1.6; font-size: 1.05rem;">We noticed you visited iFooty and left some items selected in your cart.</p>
        <p style="color: #4a5568; line-height: 1.6; font-size: 1.05rem;">Since our premium jersey stock is limited and demand is high, we saved your items below so you don't miss out:</p>
        
        <div style="margin: 25px 0; border: 1px solid #edf2f7; border-radius: 8px; overflow: hidden;">
          ${cartItemsHtml}
        </div>
        
        <p style="color: #4a5568; line-height: 1.6; font-size: 1.05rem;">Take advantage of <strong>free shipping across Canada and the USA</strong>! 🇨🇦🇺🇸</p>
        
        <div style="text-align: center; margin: 35px 0 25px 0;">
          <a href="https://ifooty.ca" style="background-color: #CCFF00; color: #000000; padding: 14px 35px; border-radius: 6px; font-weight: 900; text-decoration: none; display: inline-block; font-size: 1.05rem; text-transform: uppercase; letter-spacing: 0.5px; box-shadow: 0 4px 15px rgba(204, 255, 0, 0.3);">Complete My Order</a>
        </div>
      `;

  const htmlTemplate = isSecondEmail
    ? `
        <div style="font-family: Arial, sans-serif; font-size: 15px; color: #333333; line-height: 1.6; max-width: 600px; margin: 0 auto; padding: 10px;">
          <p>Hi ${firstName}, how are you?</p>
          
          <p>This is Oliver from iFooty.</p>
          
          <p>I noticed in our system that you left some items selected in your cart and wanted to reach out in case you had any questions about sizing, stock availability, or shipping.</p>
          
          <p>Our jersey stock here in Canada is very limited and demand is high — I can't hold the reservation on your items for much longer. But to give you a final nudge and help you secure your jerseys, I managed to unlock a special deal for you:</p>
          
          <p>Use coupon <strong>IFOOTY5</strong> at checkout to get <strong>5% Extra Discount</strong> + <strong>Free Shipping</strong> across Canada and the USA! 🇨🇦🇺🇸</p>
          
          <p>You can view your cart and complete the purchase by clicking the link below:<br/>
          <a href="https://ifooty.ca" style="color: #0066cc; text-decoration: underline; font-weight: bold;">https://ifooty.ca</a></p>
          
          <p>If you prefer to place the order directly via Interac e-Transfer, or if you have any questions about the jerseys, just reply to this email and I'll help you right away.</p>
          
          <p style="margin-top: 25px; border-top: 1px solid #edf2f7; padding-top: 20px; color: #718096; font-size: 0.9rem;">
            Any questions about payment methods (we accept Interac e-Transfer and PayPal), just reach out.
          </p>
          
          <p style="margin-top: 20px;">Best,<br/>
          <strong>Oliver | iFooty Support</strong></p>
        </div>
      `
    : `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff; border: 1px solid #edf2f7; border-radius: 8px; overflow: hidden;">
      <div style="padding: 35px 30px; background: #000000; text-align: center;">
        <h1 style="margin: 0; font-style: italic; font-weight: 900; letter-spacing: -1px; font-family: sans-serif; font-size: 2.5rem;">
          <span style="color: #CCFF00;">i</span><span style="color: #FFFFFF;">Footy</span><span style="color: #CCFF00;">.</span>
        </h1>
        <p style="color: #ffffff; margin-top: 10px; font-size: 0.95rem; opacity: 0.9; text-transform: uppercase; letter-spacing: 1px;">${subtitle}</p>
      </div>
      
      <div style="padding: 35px 30px; background: #ffffff;">
        ${emailBody}
        
        <p style="color: #718096; line-height: 1.6; font-size: 0.95rem; margin-top: 25px; border-top: 1px solid #f7fafc; padding-top: 20px;">Any questions about payment (we accept Interac e-Transfer and PayPal) or shipping, feel free to reply to this email or message us directly on WhatsApp.</p>
        <p style="color: #4a5568; line-height: 1.6; font-size: 1.05rem; margin-top: 20px; margin-bottom: 0;">Best regards,<br/><strong>iFooty Team</strong></p>
      </div>
      
      <div style="padding: 20px; background: #f7fafc; text-align: center; color: #a0aec0; font-size: 0.8rem; border-top: 1px solid #edf2f7;">
        <p>© ${new Date().getFullYear()} iFooty Store Canada. Bringing Brazilian passion to Canada.</p>
        <p>If you didn't add items to a cart, you can safely ignore this email.</p>
      </div>
    </div>
  `;

  try {
    const emailRes = await resend.emails.send({
      from: 'iFooty Store <vendas@ifooty.ca>',
      to: [customerEmail],
      replyTo: 'camisadez085@gmail.com',
      subject: subject,
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
