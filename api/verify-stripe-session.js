import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://agbskncncrnzmutaubdn.supabase.co';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFnYnNrbmNuY3Juem11dGF1YmRuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU5NjQ4OTksImV4cCI6MjA5MTU0MDg5OX0.Y-p426eqLyl-rumc-ZI56u2WJFk0oDvXkvp5G6m1iFM';
const supabase = createClient(supabaseUrl, supabaseKey);

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { session_id } = req.query;

  if (!session_id) {
    return res.status(400).json({ error: 'Missing session_id' });
  }

  try {
    // Retrieve checkout session from Stripe
    const session = await stripe.checkout.sessions.retrieve(session_id);

    if (session.payment_status === 'paid') {
      const orderId = session.metadata?.orderId;
      if (!orderId) {
        return res.status(400).json({ error: 'No orderId associated with this session' });
      }

      // Update order status in Supabase database using secure RPC (to bypass RLS safely)
      const { data: orderRows, error } = await supabase.rpc('confirm_stripe_payment', {
        order_id_input: orderId,
        payment_intent_input: session.payment_intent
      });

      if (error) {
        console.error('Error updating order in database:', error);
        return res.status(500).json({ error: `Erro no Banco (RPC): ${error.message} (Código: ${error.code})` });
      }

      const orderRow = orderRows?.[0];

      // Send the payment confirmation email to the customer
      if (orderRow) {
        try {
          const host = req.headers.host;
          const protocol = host.includes('localhost') ? 'http' : 'https';
          await fetch(`${protocol}://${host}/api/send-order-email`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              language: 'en',
              adminEmail: 'ifootyc@gmail.com',
              order: orderRow
            })
          });
        } catch (emailErr) {
          console.error('Failed to send confirmation email on success:', emailErr);
        }
      }

      return res.status(200).json({ success: true, orderId });
    } else {
      return res.status(400).json({ success: false, error: 'Payment not completed' });
    }
  } catch (error) {
    console.error('Error verifying Stripe session:', error);
    return res.status(500).json({ error: error.message });
  }
}
