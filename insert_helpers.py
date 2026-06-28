import re

with open('src/rebrand/pages/RebrandAdmin.jsx', 'r', encoding='utf-8') as f:
    content = f.read()

helpers = """  const saveSentRecoveryEmailsToDb = async (newSent, step = 1) => {
    try {
      await supabase.from('store_settings').upsert({
        key: step === 2 ? 'sent_recovery_emails_2' : 'sent_recovery_emails',
        value: JSON.stringify(newSent)
      }, { onConflict: 'key' });
    } catch (err) {
      console.error(`Erro ao salvar sent_recovery_emails_${step}:`, err);
    }
  };

  const getCalgaryDateStr = (dateInput) => {
    if (!dateInput) return '';
    try {
      const d = new Date(dateInput);
      return new Intl.DateTimeFormat('pt-BR', {
        timeZone: 'America/Edmonton',
        day: '2-digit', month: '2-digit', year: 'numeric',
        hour: '2-digit', minute: '2-digit'
      }).format(d).replace(',', ' às');
    } catch (e) {
      return '';
    }
  };

  const formatCartItemDate = (timestamp) => {
    if (!timestamp) return '';
    try {
      const d = new Date(timestamp);
      return new Intl.DateTimeFormat('pt-BR', {
        day: '2-digit', month: '2-digit', year: 'numeric',
        hour: '2-digit', minute: '2-digit'
      }).format(d).replace(',', ' às');
    } catch (e) {
      return '';
    }
  };

  const handleSendAbandonedCartEmail = async (customer, step = 1) => {
    if (!customer.email || !customer.cart || customer.cart.length === 0) {
      if (showToast) showToast("Cliente não possui e-mail ou sacola ativa.", "error");
      return;
    }
    const discountText = step === 2 ? ' + 5% OFF' : '';
    if (showToast) showToast(`Disparando ${step}º E-mail de Recuperação${discountText} para ${customer.email}...`, "success");
    
    setTimeout(async () => {
      const nowStr = getCalgaryDateStr(new Date());
      if (step === 2) {
        const newSent = { ...sentRecoveryEmails2, [customer.id]: nowStr };
        setSentRecoveryEmails2(newSent);
        await saveSentRecoveryEmailsToDb(newSent, 2);
      } else {
        const newSent = { ...sentRecoveryEmails, [customer.id]: nowStr };
        setSentRecoveryEmails(newSent);
        await saveSentRecoveryEmailsToDb(newSent, 1);
      }
      if (showToast) showToast(`E-mail enviado e status atualizado!`, "success");
    }, 1000);
  };

  const toggleRecoveryEmailStatus = async (customer, step = 1) => {
    if (step === 2) {
      if (sentRecoveryEmails2[customer.id]) {
        const newSent = { ...sentRecoveryEmails2 };
        delete newSent[customer.id];
        setSentRecoveryEmails2(newSent);
        await saveSentRecoveryEmailsToDb(newSent, 2);
      } else {
        const nowStr = getCalgaryDateStr(new Date());
        const newSent = { ...sentRecoveryEmails2, [customer.id]: nowStr };
        setSentRecoveryEmails2(newSent);
        await saveSentRecoveryEmailsToDb(newSent, 2);
      }
    } else {
      if (sentRecoveryEmails[customer.id]) {
        const newSent = { ...sentRecoveryEmails };
        delete newSent[customer.id];
        setSentRecoveryEmails(newSent);
        await saveSentRecoveryEmailsToDb(newSent, 1);
      } else {
        const nowStr = getCalgaryDateStr(new Date());
        const newSent = { ...sentRecoveryEmails, [customer.id]: nowStr };
        setSentRecoveryEmails(newSent);
        await saveSentRecoveryEmailsToDb(newSent, 1);
      }
    }
  };

  const handlePrintInvoice = (title, clientInfo, items) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      if (showToast) showToast("Pop-up bloqueado. Permita pop-ups para gerar invoice.", "error");
      return;
    }

    const itemsHtml = items && items.length > 0 ? items.map(item => `
      <tr>
        <td style="padding: 12px 10px; border-bottom: 1px solid #e5e7eb;">
          <div style="font-weight: 600; color: #111827;">${item.name || 'Produto'}</div>
          ${item.size ? `<div style="font-size: 12px; color: #6b7280; margin-top: 4px;">Size: ${item.size}</div>` : ''}
        </td>
        <td style="padding: 12px 10px; border-bottom: 1px solid #e5e7eb;">
          <div style="font-size: 13px; color: #4b5563;">
            ${item.extras?.nameNumber ? `Custom: ${item.extras.customName} #${item.extras.customNumber}` : ''}
            ${item.extras?.extraCustomization ? `<br/>Extra: ${item.extras.customExtraName}` : ''}
            ${!item.extras?.nameNumber && !item.extras?.extraCustomization ? 'Standard' : ''}
          </div>
        </td>
        <td style="padding: 12px 10px; border-bottom: 1px solid #e5e7eb; text-align: center; color: #374151;">${item.quantity || 1}</td>
        <td style="padding: 12px 10px; border-bottom: 1px solid #e5e7eb; text-align: right; color: #374151;">$${Number(item.price || 0).toFixed(2)}</td>
        <td style="padding: 12px 10px; border-bottom: 1px solid #e5e7eb; text-align: right; font-weight: 600; color: #111827;">$${(Number(item.price || 0) * (item.quantity || 1)).toFixed(2)}</td>
      </tr>
    `).join('') : `<tr><td colspan="5" style="padding: 12px 10px; border-bottom: 1px solid #e5e7eb; text-align: center; color: #6b7280;">No items</td></tr>`;

    const subtotal = items && items.length > 0 ? items.reduce((sum, item) => sum + (Number(item.price || 0) * (item.quantity || 1)), 0) : 0;
    const total = clientInfo.total || subtotal;
    const diff = subtotal - total;

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Invoice - ${title}</title>
        <style>
          body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; color: #333; line-height: 1.6; margin: 0; padding: 40px; }
          table { width: 100%; border-collapse: collapse; }
          th { text-align: left; border-bottom: 2px solid #000; padding-bottom: 10px; text-transform: uppercase; font-size: 12px; color: #6b7280; }
        </style>
      </head>
      <body>
        <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 40px;">
          <div>
            <h1 style="margin: 0; font-size: 28px; font-weight: 800; letter-spacing: -0.5px;">iFooty.</h1>
            <p style="margin: 5px 0 0; color: #6b7280; font-size: 14px;">123 Sports Ave, Suite 100<br/>Calgary, AB T2P 1A1<br/>contact@ifooty.ca</p>
          </div>
          <div style="text-align: right;">
            <h2 style="margin: 0; font-size: 24px; color: #111827; letter-spacing: 1px;">INVOICE</h2>
            <p style="margin: 5px 0 0; color: #6b7280; font-size: 14px;">#${clientInfo.invoiceNo || 'DRAFT'}<br/>Date: ${clientInfo.date || getCalgaryDateStr(new Date())}</p>
          </div>
        </div>
        <table style="margin-bottom: 40px;">
          <tr>
            <td style="width: 50%; vertical-align: top;">
              <h3 style="font-size: 12px; text-transform: uppercase; color: #6b7280; margin-bottom: 10px;">Billed To:</h3>
              <div style="font-size: 14px; color: #111827; font-weight: 500;">
                ${clientInfo.name}<br/>
                ${clientInfo.street}<br/>
                ${clientInfo.cityProvince}<br/>
                ${clientInfo.country}<br/>
                ${clientInfo.email}
              </div>
            </td>
          </tr>
        </table>
        <table>
          <thead>
            <tr>
              <th style="width: 25%; padding: 12px 10px;">Item</th>
              <th style="width: 40%; padding: 12px 10px;">Description</th>
              <th style="width: 10%; padding: 12px 10px; text-align: center;">Quantity</th>
              <th style="width: 12%; padding: 12px 10px; text-align: right;">Unit Cost</th>
              <th style="width: 13%; padding: 12px 10px; text-align: right;">Line Total</th>
            </tr>
          </thead>
          <tbody>
            ${itemsHtml}
          </tbody>
        </table>
        <table style="width: 40%; margin-left: auto; margin-top: 40px;">
          <tr style="background-color: #e5e7eb; font-weight: bold; border-top: 2px solid #d1d5db;">
            <td style="padding: 12px 10px; text-transform: uppercase; font-size: 13px; color: #111827;">Total</td>
            <td style="padding: 12px 10px; text-align: right; font-size: 16px; color: #111827;">$${total.toFixed(2)}</td>
          </tr>
        </table>
      </body>
      </html>
    `;
    printWindow.document.write(html);
    printWindow.document.close();
  };

  const handlePrintCartInvoice = (customer) => {
    const clientInfo = {
      name: customer.name || 'Cliente',
      street: `${customer.street || ''}${customer.apartment ? `, Apt ${customer.apartment}` : ''}`,
      cityProvince: `${customer.city || ''}, ${customer.province || ''} ${customer.postal_code || ''}`,
      country: 'Canada',
      email: customer.email || '',
      invoiceNo: 'CART-' + (customer.id || 'N/A').toString().substring(0, 6).toUpperCase(),
      date: getCalgaryDateStr(new Date()),
      total: customer.cart.reduce((sum, item) => sum + (Number(item.price || 0) * (item.quantity || 1)), 0)
    };
    handlePrintInvoice('CART INVOICE', clientInfo, customer.cart);
  };

"""

content = content.replace('  const renderPagination = () => {', helpers + '  const renderPagination = () => {')

with open('src/rebrand/pages/RebrandAdmin.jsx', 'w', encoding='utf-8') as f:
    f.write(content)

print("Injected helpers!")
