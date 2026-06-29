import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { orderId, items, currency = 'CAD', shippingCost = 0, discountPercent = 0, flatDiscount = 0, successUrl, cancelUrl } = req.body;

  if (!orderId || !items || !items.length || !successUrl || !cancelUrl) {
    return res.status(400).json({ error: 'Missing required parameters.' });
  }

  try {
    const stripeCurrency = currency.toLowerCase();
    
    // Calculate proportional discount factor
    const percentFactor = 1 - (Number(discountPercent) || 0) / 100;
    
    // Construct line items
    const line_items = items.map(item => {
      let unitPrice = Number(item.price) || 0;
      
      // Apply percentage discount
      unitPrice = unitPrice * percentFactor;
      
      return {
        price_data: {
          currency: stripeCurrency,
          product_data: {
            name: `${item.name} (${item.size || 'M'})`
          },
          unit_amount: Math.max(1, Math.round(unitPrice * 100))
        },
        quantity: Number(item.quantity) || 1
      };
    });

    // Add shipping line item if applicable
    if (Number(shippingCost) > 0) {
      line_items.push({
        price_data: {
          currency: stripeCurrency,
          product_data: {
            name: 'Shipping / Frete'
          },
          unit_amount: Math.round(Number(shippingCost) * 100)
        },
        quantity: 1
      });
    }

    // Add flat discount if any
    let sessionDiscounts = [];
    if (Number(flatDiscount) > 0) {
      const coupon = await stripe.coupons.create({
        amount_off: Math.round(Number(flatDiscount) * 100),
        currency: stripeCurrency,
        duration: 'once'
      });
      sessionDiscounts.push({ coupon: coupon.id });
    }

    // Create Stripe Checkout Session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items,
      discounts: sessionDiscounts.length ? sessionDiscounts : undefined,
      mode: 'payment',
      success_url: `${successUrl}?stripe_session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: cancelUrl,
      metadata: {
        orderId
      }
    });

    return res.status(200).json({ id: session.id, url: session.url });
  } catch (error) {
    console.error('Error creating Stripe session:', error);
    return res.status(500).json({ error: error.message });
  }
}
