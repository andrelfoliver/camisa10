import { Resend } from 'resend';

// Inicializa o Resend com a chave de API das variáveis de ambiente
const resend = new Resend(process.env.RESEND_API_KEY);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { order, language = 'pt', adminOnly = false, supplierEmail = null, supplierOnly = false } = req.body;

  if (!order) {
    return res.status(400).json({ error: 'Order data missing' });
  }

  // --- DICIONÁRIO DE TRADUÇÃO PARA E-MAILS (CLIENTE) ---
  const emailLocales = {
    pt: {
      customerSubject: order.payment_method === 'paypal'
        ? '✅ Pagamento Confirmado! Seu pedido na iFooty'
        : '⚽ Pedido Recebido! Próximos passos na iFooty',
      greeting: 'Recebemos seu pedido',
      nextStepsTitle: order.payment_method === 'paypal'
        ? '🎉 Pagamento Confirmado!'
        : '🚀 O que acontece agora?',
      nextStepsBody: order.payment_method === 'paypal'
        ? 'Seu pagamento via <strong>PayPal / Cartão</strong> foi processado e confirmado com sucesso. Nossa equipe já está conferindo e preparando os detalhes do seu pedido!'
        : 'Como você já enviou o resumo do pedido via <strong>WhatsApp</strong>, nossa equipe já está conferindo os detalhes (estoque e tamanhos). <strong>Em breve, entraremos em contato com você para enviar os dados para o pagamento via e-Transfer Interac.</strong>',
      itemsSummary: 'Resumo dos Itens',
      sizeLabel: 'Tamanho',
      qtyLabel: 'Qtd',
      customLabel: 'CUSTOMIZAÇÃO',
      patchesLabel: '+ Patches inclusos',
      footerQuestion: 'Dúvidas? Fale conosco no WhatsApp ou responda a este e-mail.',
      ctaButton: order.payment_method === 'paypal'
        ? 'Ver no WhatsApp'
        : 'Aguarde nosso contato',
      footerCopyright: 'Vestindo a paixão brasileira no Canadá.'
    },
    en: {
      customerSubject: order.payment_method === 'paypal'
        ? '✅ Payment Confirmed! Your iFooty order'
        : '⚽ Order Received! Next steps at iFooty',
      greeting: 'We received your order',
      nextStepsTitle: order.payment_method === 'paypal'
        ? '🎉 Payment Confirmed!'
        : '🚀 What happens now?',
      nextStepsBody: order.payment_method === 'paypal'
        ? 'Your payment via <strong>PayPal / Card</strong> has been successfully processed and confirmed. Our team is already checking and preparing the details of your order!'
        : 'Since you already sent the order summary via <strong>WhatsApp</strong>, our team is already checking the details (stock and sizes). <strong>Soon, we will contact you to send the payment details via Interac e-Transfer.</strong>',
      itemsSummary: 'Order Summary',
      sizeLabel: 'Size',
      qtyLabel: 'Qty',
      customLabel: 'CUSTOMIZATION',
      patchesLabel: '+ Patches included',
      footerQuestion: 'Questions? Contact us on WhatsApp or reply to this email.',
      ctaButton: order.payment_method === 'paypal'
        ? 'Check WhatsApp details'
        : 'Wait for our contact',
      footerCopyright: 'Wearing the passion in Canada.'
    }
  };

  const t = emailLocales[language] || emailLocales.pt;

  // Helper para garantir que as URLs das imagens sejam absolutas
  const normalizeImgUrl = (url) => {
    const placeholder = 'https://nshatpbtpoyrphlvpghq.supabase.co/storage/v1/object/public/products/placeholder_shirt.jpg';
    if (!url) return placeholder;
    if (url.toLowerCase().endsWith('.mp4')) return placeholder;
    if (url.startsWith('http')) return url;
    if (url.startsWith('/storage')) {
      const supabaseBase = 'https://nshatpbtpoyrphlvpghq.supabase.co';
      return `${supabaseBase}${url}`;
    }
    return `https://ifooty.ca${url.startsWith('/') ? '' : '/'}${url}`;
  };

  try {
    // --- HTML DOS ITENS (com preços — para admin e cliente) ---
    const itemsHtml = order.items.map(item => {
      const imageUrl = normalizeImgUrl(item.image);
      let customization = '';
      if (item.extras?.nameNumber) {
        customization += `<div style="margin-top: 5px; padding: 8px; background: #FFF9C4; border-left: 4px solid #FBC02D; font-size: 0.9rem; color: #444;">
             <strong>${t.customLabel}:</strong> ${item.extras.customName || 'N/A'} - ${item.extras.customNumber || 'N/A'}
           </div>`;
      }
      if (item.extras?.extraCustomization && item.extras?.customExtraName) {
        customization += `<div style="margin-top: 5px; padding: 8px; background: #E0F7FA; border-left: 4px solid #00BCD4; font-size: 0.9rem; color: #444;">
             <strong>EXTRA CUSTOM:</strong> ${item.extras.customExtraName}
           </div>`;
      }
      const patches = item.extras?.patches
        ? `<div style="margin-top: 3px; font-size: 0.85rem; color: #666;"><strong>${t.patchesLabel}</strong></div>`
        : '';
      return `
        <div style="margin-bottom: 20px; padding: 15px; border: 1px solid #edf2f7; border-radius: 8px; display: flex; align-items: center; gap: 15px;">
          <div style="flex-shrink: 0;">
            <img src="${imageUrl}" alt="${item.name}" style="width: 80px; height: 100px; object-fit: cover; border-radius: 4px; border: 1px solid #eee;" />
          </div>
          <div style="flex-grow: 1;">
            <h4 style="margin: 0 0 5px 0; color: #1a202c; font-size: 1.1rem;">${item.name}</h4>
            <div style="font-size: 0.95rem; color: #4a5568;">
              ${t.sizeLabel}: <strong>${item.size}</strong> | ${t.qtyLabel}: <strong>${item.quantity}</strong> | <strong>$${item.price.toFixed(2)} CAD</strong>
            </div>
            ${customization}
            ${patches}
          </div>
        </div>
      `;
    }).join('');

    // --- HTML DOS ITENS SEM PREÇOS (para fornecedor) ---
    const supplierItemsHtml = order.items.map(item => {
      const imageUrl = normalizeImgUrl(item.image);
      let customization = '';
      if (item.extras?.nameNumber) {
        customization += `<div style="margin-top: 5px; padding: 6px; background: #f0f4f8; border-radius: 4px; font-size: 0.85rem; color: #2d3748;">
             🛠️ <strong>PERSONALIZADO:</strong> ${item.extras.customName || 'N/A'} - ${item.extras.customNumber || 'N/A'}
           </div>`;
      }
      if (item.extras?.extraCustomization && item.extras?.customExtraName) {
        customization += `<div style="margin-top: 5px; padding: 6px; background: #e0f2fe; border-radius: 4px; font-size: 0.85rem; color: #0369a1;">
             ⭐ <strong>EXTRA:</strong> ${item.extras.customExtraName}
           </div>`;
      }
      const patches = item.extras?.patches
        ? `<div style="margin-top: 3px; font-size: 0.85rem; color: #4a5568;">🎖️ <strong>+ Patches</strong></div>`
        : '';
      return `
        <div style="margin-bottom: 15px; padding: 12px; border: 1px solid #e2e8f0; border-radius: 8px; display: flex; align-items: center; gap: 12px; background: #ffffff;">
          <div style="flex-shrink: 0;">
            <img src="${imageUrl}" alt="${item.name}" style="width: 70px; height: 90px; object-fit: cover; border-radius: 4px;" />
          </div>
          <div style="flex-grow: 1;">
            <h4 style="margin: 0 0 5px 0; color: #1a202c; font-size: 1rem; line-height: 1.2;">${item.name}</h4>
            <div style="font-size: 1rem; color: #2d3748; font-weight: 700;">
              TAMANHO: <span style="color: #ef4444;">${item.size}</span> | QTD: <span style="color: #ef4444;">${item.quantity}</span>
            </div>
            ${customization}
            ${patches}
          </div>
        </div>
      `;
    }).join('');

    // --- TABELA-RESUMO (para fornecedor) ---
    const totalQty = order.items.reduce((acc, i) => acc + (i.quantity || 1), 0);
    const summaryRows = order.items.flatMap(item => {
      const hasCustomization = item.extras?.nameNumber || (item.extras?.extraCustomization && item.extras?.customExtraName) || item.extras?.patches;
      if (!hasCustomization) {
        // Item sem personalização — uma linha simples
        let custom = '—';
        if (item.extras?.patches) custom = 'Patches';
        return [`
          <tr>
            <td style="padding: 8px 10px; border-bottom: 1px solid #e2e8f0; font-size: 0.85rem; color: #1e293b;">${item.name}</td>
            <td style="padding: 8px 10px; border-bottom: 1px solid #e2e8f0; font-size: 0.85rem; text-align: center; font-weight: 700; color: #ef4444;">${item.size}</td>
            <td style="padding: 8px 10px; border-bottom: 1px solid #e2e8f0; font-size: 0.85rem; text-align: center; font-weight: 700; color: #ef4444;">${item.quantity || 1}</td>
            <td style="padding: 8px 10px; border-bottom: 1px solid #e2e8f0; font-size: 0.8rem; color: #64748b;">${custom}</td>
          </tr>
        `];
      }

      // Item com personalização — expande por número atribuído
      const extraName = item.extras?.extraCustomization && item.extras?.customExtraName ? item.extras.customExtraName : '';
      const patches = item.extras?.patches ? 'Patches' : '';

      if (item.extras?.nameNumber && item.extras?.customNumber) {
        // Múltiplos números separados por vírgula → uma linha por unidade
        const numbers = String(item.extras.customNumber).split(',').map(n => n.trim()).filter(Boolean);
        return numbers.map(num => {
          let custom = `${item.extras.customName || ''} #${num}`;
          if (extraName) custom += ` | ${extraName}`;
          if (patches) custom += ` | ${patches}`;
          return `
            <tr>
              <td style="padding: 8px 10px; border-bottom: 1px solid #e2e8f0; font-size: 0.85rem; color: #1e293b;">${item.name}</td>
              <td style="padding: 8px 10px; border-bottom: 1px solid #e2e8f0; font-size: 0.85rem; text-align: center; font-weight: 700; color: #ef4444;">${item.size}</td>
              <td style="padding: 8px 10px; border-bottom: 1px solid #e2e8f0; font-size: 0.85rem; text-align: center; font-weight: 700; color: #ef4444;">1</td>
              <td style="padding: 8px 10px; border-bottom: 1px solid #e2e8f0; font-size: 0.8rem; color: #64748b;">${custom}</td>
            </tr>
          `;
        });
      }

      // Nome sem número ainda, ou apenas extra/patches
      let custom = item.extras?.nameNumber ? `${item.extras.customName || '?'} #?` : '';
      if (extraName) custom += (custom ? ' | ' : '') + extraName;
      if (patches) custom += (custom ? ' | ' : '') + patches;
      return [`
        <tr>
          <td style="padding: 8px 10px; border-bottom: 1px solid #e2e8f0; font-size: 0.85rem; color: #1e293b;">${item.name}</td>
          <td style="padding: 8px 10px; border-bottom: 1px solid #e2e8f0; font-size: 0.85rem; text-align: center; font-weight: 700; color: #ef4444;">${item.size}</td>
          <td style="padding: 8px 10px; border-bottom: 1px solid #e2e8f0; font-size: 0.85rem; text-align: center; font-weight: 700; color: #ef4444;">${item.quantity || 1}</td>
          <td style="padding: 8px 10px; border-bottom: 1px solid #e2e8f0; font-size: 0.8rem; color: #64748b;">${custom || '—'}</td>
        </tr>
      `];
    }).join('');

    const summaryTableHtml = `
      <div style="margin-top: 30px; padding: 20px; background: #f8fafc; border-radius: 12px; border: 2px solid #000;">
        <h2 style="color: #0f172a; font-size: 1.1rem; margin: 0 0 12px 0;">
          📋 RESUMO GERAL DO PEDIDO
          <span style="float: right; background: #000; color: #CCFF00; font-size: 1rem; font-weight: 900; padding: 4px 14px; border-radius: 20px;">
            TOTAL: ${totalQty} ${totalQty === 1 ? 'peça' : 'peças'}
          </span>
        </h2>
        <table style="width: 100%; border-collapse: collapse; background: #ffffff; border: 1px solid #e2e8f0;">
          <thead>
            <tr style="background: #0f172a;">
              <th style="padding: 10px; text-align: left; font-size: 0.8rem; color: #94a3b8; font-weight: 600; text-transform: uppercase;">Produto</th>
              <th style="padding: 10px; text-align: center; font-size: 0.8rem; color: #94a3b8; font-weight: 600; text-transform: uppercase;">Tam.</th>
              <th style="padding: 10px; text-align: center; font-size: 0.8rem; color: #94a3b8; font-weight: 600; text-transform: uppercase;">Qtd</th>
              <th style="padding: 10px; text-align: left; font-size: 0.8rem; color: #94a3b8; font-weight: 600; text-transform: uppercase;">Personalização</th>
            </tr>
          </thead>
          <tbody>
            ${summaryRows}
            <tr style="background: #f1f5f9;">
              <td colspan="2" style="padding: 10px; font-weight: 800; font-size: 0.9rem; color: #0f172a;">TOTAL DE PEÇAS</td>
              <td style="padding: 10px; text-align: center; font-weight: 900; font-size: 1.1rem; color: #ef4444;">${totalQty}</td>
              <td style="padding: 10px;"></td>
            </tr>
          </tbody>
        </table>
      </div>
    `;

    // ================================================================
    // LÓGICA DE ENVIO CONDICIONAL:
    // supplierOnly=true → SOMENTE fornecedor (admin e cliente pulados)
    // adminOnly=true    → admin recebe, cliente é pulado
    // padrão            → admin + cliente recebem
    // ================================================================

    let adminRes = { data: null, error: null };
    let customerRes = { data: null, error: null };
    let supplierRes = { data: null, error: null };

    // --- EMAIL 1: ADMIN --- (pulado quando supplierOnly=true)
    if (!supplierOnly) {
      adminRes = await resend.emails.send({
        from: 'iFooty Alerts <vendas@ifooty.ca>',
        to: ['camisadez085@gmail.com'],
        replyTo: 'camisadez085@gmail.com',
        subject: `⚽ NOVO PEDIDO: ${order.customer_name}`,
        html: `
          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 650px; margin: 0 auto; background: #ffffff;">
            <div style="padding: 30px; background: #000000; text-align: center; border-radius: 8px 8px 0 0;">
              <h1 style="margin: 0; font-style: italic; font-weight: 900; letter-spacing: -1px; font-family: sans-serif; font-size: 2.5rem;">
                <span style="color: #CCFF00;">i</span><span style="color: #FFFFFF;">Footy</span><span style="color: #CCFF00;">.</span>
              </h1>
              <p style="color: #ffffff; margin: 5px 0 0 0; opacity: 0.8; font-size: 0.9rem; text-transform: uppercase; letter-spacing: 2px;">Notificação de Venda Oficial</p>
            </div>
            <div style="padding: 30px; border: 1px solid #edf2f7; border-top: none; border-radius: 0 0 8px 8px;">
              <div style="margin-bottom: 30px;">
                <h2 style="color: #2d3748; font-size: 1.5rem; margin-bottom: 15px; border-bottom: 2px solid #CCFF00; display: inline-block;">Detalhes do Cliente</h2>
                <table style="width: 100%; border-collapse: collapse;">
                  <tr><td style="padding: 8px 0; color: #718096; width: 120px;">Nome:</td><td style="padding: 8px 0; color: #1a202c; font-weight: 600;">${order.customer_name}</td></tr>
                  <tr><td style="padding: 8px 0; color: #718096;">E-mail:</td><td style="padding: 8px 0; color: #1a202c;">${order.customer_email}</td></tr>
                  <tr><td style="padding: 8px 0; color: #718096;">WhatsApp:</td><td style="padding: 8px 0; color: #1a202c;">${order.customer_phone}</td></tr>
                  <tr><td style="padding: 8px 0; color: #718096;">Pagamento:</td><td style="padding: 8px 0; color: #1a202c;">${order.payment_method === 'paypal' ? '<span style="background: #D1FAE5; color: #065F46; padding: 4px 8px; border-radius: 4px; font-weight: bold; font-size: 0.85rem;">💰 PAGO VIA PAYPAL</span>' : 'WhatsApp (Pendente)'}</td></tr>
                  ${order.payment_id ? `<tr><td style="padding: 8px 0; color: #718096;">ID Transação:</td><td style="padding: 8px 0; color: #4a5568; font-family: monospace; font-size: 0.85rem;">${order.payment_id}</td></tr>` : ''}
                </table>
              </div>

              <div style="margin-bottom: 40px; padding: 25px; background: #f8fafc; border: 2px dashed #cbd5e1; border-radius: 12px;">
                <h2 style="color: #1e293b; font-size: 1.3rem; margin-top: 0; margin-bottom: 5px;">📦 DADOS PARA O FORNECEDOR</h2>
                <p style="color: #64748b; font-size: 0.85rem; margin-bottom: 15px;">(Copie ou Printe o bloco abaixo)</p>
                <div style="margin-bottom: 20px; padding: 20px; background: #ffffff; border-radius: 8px; border: 1px solid #e2e8f0; font-family: monospace; line-height: 1.6; color: #000;">
                  ${order.shipping_address.method === 'pickup' ? `
                    <div style="background: #FFF9C4; padding: 10px; border-radius: 4px; border: 1px solid #FBC02D; text-align: center; margin-bottom: 15px;">
                      <strong>📍 ATENÇÃO: RETIRADA EM LOJA</strong><br/>
                      Fazer o pedido no nome da iFooty (Wolf Willow).
                    </div>
                  ` : `
                    <strong>Full name:</strong> ${order.customer_name}<br/>
                    <strong>Zip code:</strong> ${order.shipping_address.postalCode}<br/>
                    <strong>Country:</strong> ${order.shipping_address.country || 'Canada'}<br/>
                    <strong>Province:</strong> ${order.shipping_address.province}<br/>
                    <strong>City:</strong> ${order.shipping_address.city}<br/>
                    <strong>District:</strong> ${order.shipping_address.district || 'N/A'}<br/>
                    <strong>Address:</strong> ${order.shipping_address.street}<br/>
                    <strong>Address number:</strong> ${order.shipping_address.number}<br/>
                    <strong>Unit:</strong> ${order.shipping_address.apartment || 'N/A'}<br/>
                    <strong>Phone:</strong> ${order.customer_phone}<br/>
                    <strong>Instructions:</strong> ${order.shipping_address.instructions || 'N/A'}
                  `}
                </div>
                ${supplierItemsHtml}
              </div>

              <div style="margin-bottom: 30px;">
                <h2 style="color: #2d3748; font-size: 1.5rem; margin-bottom: 20px;">Detalhes Financeiros (Sua Referência)</h2>
                ${itemsHtml}
              </div>

              <div style="background: #f7fafc; padding: 25px; border-radius: 8px; margin-bottom: 30px;">
                <table style="width: 100%; font-size: 0.95rem; color: #4a5568;">
                  ${order.coupon_code ? `
                  <tr><td style="padding: 5px 0;">Subtotal:</td><td style="text-align: right; color: #1a202c;">$${(order.total_price + (order.coupon_discount || 0)).toFixed(2)} CAD</td></tr>
                  <tr><td style="padding: 5px 0; color: #10B981;">Cupom (${order.coupon_code}):</td><td style="text-align: right; color: #10B981;">-$${(order.coupon_discount || 0).toFixed(2)} CAD</td></tr>
                  ` : ''}
                  <tr><td colspan="2" style="border-top: 1px solid #edf2f7; padding-top: 15px; margin-top: 10px;"></td></tr>
                  <tr><td style="font-size: 1.4rem; font-weight: 800; color: #1a202c;">TOTAL FINAL</td><td style="text-align: right; font-size: 1.4rem; font-weight: 900; color: #CCFF00; background: #000; padding: 10px 15px; border-radius: 6px;">$${order.total_price.toFixed(2)} CAD</td></tr>
                </table>
              </div>
            </div>
          </div>
        `,
      });
      if (adminRes.error) {
        console.error('❌ Resend Admin Error:', JSON.stringify(adminRes.error, null, 2));
      } else {
        console.log('✅ Admin Notification Sent:', adminRes.data?.id);
      }
    } else {
      console.log('ℹ️ supplierOnly=true — skipping admin email.');
    }

    // --- EMAIL 1.5: ADICIONAL PAYPAL GESTOR --- (enviado quando pago via PayPal)
    let paypalPaymentRes = { data: null, error: null };
    if (!supplierOnly && order.payment_method === 'paypal') {
      try {
        paypalPaymentRes = await resend.emails.send({
          from: 'iFooty Alerts <vendas@ifooty.ca>',
          to: ['camisadez085@gmail.com'],
          replyTo: 'camisadez085@gmail.com',
          subject: `💰 PEDIDO PAGO (PayPal): ${order.customer_name}`,
          html: `
            <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #edf2f7; border-radius: 12px; overflow: hidden; background: #ffffff;">
              <div style="padding: 30px; background: #0070BA; text-align: center;">
                <h1 style="margin: 0; color: #FFFFFF; font-family: sans-serif; font-size: 2rem; font-weight: 800;">
                  💰 Pagamento Recebido!
                </h1>
                <p style="color: #ffffff; margin-top: 5px; font-size: 0.9rem; opacity: 0.9; text-transform: uppercase; letter-spacing: 2px;">PayPal / Cartão de Crédito</p>
              </div>
              <div style="padding: 30px;">
                <p style="font-size: 1.1rem; color: #1a202c; margin-bottom: 20px;">
                  O pagamento do pedido de <strong>${order.customer_name}</strong> foi confirmado com sucesso via PayPal.
                </p>
                <div style="background: #f7fafc; padding: 20px; border-radius: 8px; border: 1px solid #edf2f7; margin-bottom: 25px;">
                  <table style="width: 100%; border-collapse: collapse; font-size: 0.95rem;">
                    <tr><td style="padding: 6px 0; color: #718096; width: 140px;">Cliente:</td><td style="padding: 6px 0; color: #1a202c; font-weight: 600;">${order.customer_name}</td></tr>
                    <tr><td style="padding: 6px 0; color: #718096;">WhatsApp:</td><td style="padding: 6px 0; color: #1a202c;">${order.customer_phone}</td></tr>
                    <tr><td style="padding: 6px 0; color: #718096;">Valor Pago:</td><td style="padding: 6px 0; color: #0f172a; font-weight: bold;">$${order.total_price.toFixed(2)} CAD</td></tr>
                    <tr><td style="padding: 6px 0; color: #718096;">Método:</td><td style="padding: 6px 0; color: #0070BA; font-weight: bold;">PayPal / Credit Card</td></tr>
                    <tr><td style="padding: 6px 0; color: #718096;">ID Transação:</td><td style="padding: 6px 0; color: #4a5568; font-family: monospace;">${order.payment_id || 'N/A'}</td></tr>
                    <tr><td style="padding: 6px 0; color: #718096;">Data/Hora:</td><td style="padding: 6px 0; color: #1a202c;">${new Date().toLocaleString('pt-BR')}</td></tr>
                  </table>
                </div>
                <div style="text-align: center;">
                  <p style="color: #718096; font-size: 0.9rem; margin-bottom: 0;">Esse pedido já está registrado no banco de dados como PAGO.</p>
                </div>
              </div>
            </div>
          `
        });
        if (paypalPaymentRes.error) {
          console.error('❌ Resend PayPal Payment Alert Error:', JSON.stringify(paypalPaymentRes.error, null, 2));
        } else {
          console.log('✅ PayPal Payment Alert Sent:', paypalPaymentRes.data?.id);
        }
      } catch (errPay) {
        console.error('❌ Error sending PayPal Payment email:', errPay);
      }
    }

    // --- EMAIL 2: CLIENTE --- (pulado quando adminOnly=true ou supplierOnly=true)
    if (!adminOnly && !supplierOnly) {
      customerRes = await resend.emails.send({
        from: 'iFooty Store <vendas@ifooty.ca>',
        to: [order.customer_email],
        replyTo: 'camisadez085@gmail.com',
        subject: t.customerSubject,
        html: `
          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 650px; margin: 0 auto; background: #ffffff; border: 1px solid #edf2f7; border-radius: 8px; overflow: hidden;">
            <div style="padding: 40px 30px; background: #000000; text-align: center;">
              <h1 style="margin: 0; font-style: italic; font-weight: 900; letter-spacing: -1px; font-family: sans-serif; font-size: 3rem;">
                <span style="color: #CCFF00;">i</span><span style="color: #FFFFFF;">Footy</span><span style="color: #CCFF00;">.</span>
              </h1>
              <p style="color: #ffffff; margin-top: 10px; font-size: 1.1rem; opacity: 0.9;">${t.greeting}, ${order.customer_name.split(' ')[0]}!</p>
            </div>
            <div style="padding: 40px 30px;">
              <div style="background: #fdfdea; border: 1px solid #fcf8e3; padding: 20px; border-radius: 8px; margin-bottom: 30px;">
                <h3 style="color: #856404; margin: 0 0 10px 0;">${t.nextStepsTitle}</h3>
                <p style="color: #856404; margin: 0; line-height: 1.5;">${t.nextStepsBody}</p>
              </div>
              <div style="margin-bottom: 30px;">
                <h2 style="color: #1a202c; font-size: 1.3rem; margin-bottom: 20px;">${t.itemsSummary}</h2>
                ${itemsHtml}
              </div>
              <div style="border-top: 1px solid #edf2f7; padding-top: 30px; text-align: center;">
                <p style="color: #718096; font-size: 0.95rem; margin-bottom: 20px;">${t.footerQuestion}</p>
                <div style="display: inline-block; padding: 12px 25px; background: #CCFF00; color: #000; font-weight: 800; border-radius: 6px; text-transform: uppercase; font-size: 0.9rem;">
                  ${t.ctaButton}
                </div>
              </div>
            </div>
            <div style="padding: 20px; background: #f7fafc; text-align: center; color: #a0aec0; font-size: 0.8rem;">
              <p>© ${new Date().getFullYear()} iFooty Store Canada. ${t.footerCopyright}</p>
            </div>
          </div>
        `,
      });
      if (customerRes.error) {
        console.error('❌ Resend Customer Error:', JSON.stringify(customerRes.error, null, 2));
      } else {
        console.log('✅ Customer Confirmation Sent:', customerRes.data?.id);
      }
    } else {
      console.log('ℹ️ adminOnly/supplierOnly=true — skipping customer email.');
    }

    // --- EMAIL 3: FORNECEDOR --- (somente quando supplierEmail é fornecido)
    if (supplierEmail) {
      supplierRes = await resend.emails.send({
        from: 'iFooty Store <vendas@ifooty.ca>',
        to: [supplierEmail],
        subject: `📦 Novo Pedido iFooty — ${order.customer_name}`,
        html: `
          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 650px; margin: 0 auto; background: #ffffff;">
            <div style="padding: 25px 30px; background: #000000; text-align: center; border-radius: 8px 8px 0 0;">
              <h1 style="margin: 0; font-style: italic; font-weight: 900; letter-spacing: -1px; font-family: sans-serif; font-size: 2rem;">
                <span style="color: #CCFF00;">i</span><span style="color: #FFFFFF;">Footy</span><span style="color: #CCFF00;">.</span>
              </h1>
              <p style="color: #ffffff; margin: 5px 0 0 0; opacity: 0.8; font-size: 0.85rem; text-transform: uppercase; letter-spacing: 2px;">Pedido de Produção</p>
            </div>
            <div style="padding: 30px; border: 1px solid #edf2f7; border-top: none; border-radius: 0 0 8px 8px;">
              <div style="margin-bottom: 25px; padding: 20px; background: #f8fafc; border: 2px dashed #cbd5e1; border-radius: 12px;">
                <h2 style="color: #1e293b; font-size: 1.2rem; margin-top: 0; margin-bottom: 5px;">📦 DADOS DE ENTREGA</h2>
                <div style="padding: 15px; background: #ffffff; border-radius: 8px; border: 1px solid #e2e8f0; font-family: monospace; line-height: 1.7; color: #000;">
                  ${order.shipping_address.method === 'pickup' ? `
                    <div style="background: #FFF9C4; padding: 10px; border-radius: 4px; border: 1px solid #FBC02D; text-align: center;">
                      <strong>📍 RETIRADA EM LOJA (Wolf Willow)</strong>
                    </div>
                  ` : `
                    <strong>Full name:</strong> ${order.customer_name}<br/>
                    <strong>Zip code:</strong> ${order.shipping_address.postalCode}<br/>
                    <strong>Country:</strong> ${order.shipping_address.country || 'Canada'}<br/>
                    <strong>Province:</strong> ${order.shipping_address.province}<br/>
                    <strong>City:</strong> ${order.shipping_address.city}<br/>
                    <strong>Address:</strong> ${order.shipping_address.street}<br/>
                    <strong>Address number:</strong> ${order.shipping_address.number || 'N/A'}<br/>
                    <strong>Unit:</strong> ${order.shipping_address.apartment || 'N/A'}<br/>
                    <strong>Phone:</strong> ${order.customer_phone}<br/>
                    <strong>Instructions:</strong> ${order.shipping_address.instructions || 'N/A'}
                  `}
                </div>
              </div>

              <h2 style="color: #1e293b; font-size: 1.2rem; margin-bottom: 15px;">🛒 ITENS DO PEDIDO</h2>
              ${supplierItemsHtml}
              ${summaryTableHtml}
            </div>
          </div>
        `,
      });
      if (supplierRes.error) {
        console.error('❌ Resend Supplier Error:', JSON.stringify(supplierRes.error, null, 2));
      } else {
        console.log('✅ Supplier Email Sent:', supplierRes.data?.id);
      }
    }

    res.status(200).json({
      success: true,
      admin: adminRes.data?.id || null,
      customer: customerRes.data?.id || null,
      supplier: supplierRes.data?.id || null,
      paypalPayment: paypalPaymentRes.data?.id || null,
      errors: (adminRes.error || customerRes.error || supplierRes.error || paypalPaymentRes.error)
        ? { 
            admin: adminRes.error, 
            customer: customerRes.error, 
            supplier: supplierRes.error,
            paypalPayment: paypalPaymentRes.error 
          }
        : null
    });
  } catch (err) {
    console.error('📛 Massive Server Error:', err);
    res.status(500).json({ error: 'Internal server error', details: err.message });
  }
}
