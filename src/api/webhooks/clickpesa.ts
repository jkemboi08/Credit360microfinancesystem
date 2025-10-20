import { NextApiRequest, NextApiResponse } from 'next';
import { clickPesaService } from '../../services/clickPesaService';
import { supabase } from '../../lib/supabaseClient';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const signature = req.headers['x-clickpesa-signature'] as string;
    const payload = JSON.stringify(req.body);

    // Verify webhook signature
    if (!clickPesaService.verifyWebhookSignature(payload, signature)) {
      console.error('Invalid webhook signature');
      return res.status(401).json({ error: 'Invalid signature' });
    }

    const event = req.body as any;

    // Log webhook event to database
    await supabase
      .from('clickpesa_webhook_events')
      .insert({
        event_type: event.event_type,
        transaction_id: event.transaction_id,
        status: event.status,
        amount: event.amount,
        currency: event.currency,
        reference: event.reference,
        timestamp: event.timestamp,
        event_data: event,
        processed: false
      });

    // Process the webhook event
    await clickPesaService.processWebhookEvent(event);

    // Mark event as processed
    await supabase
      .from('clickpesa_webhook_events')
      .update({ 
        processed: true, 
        processed_at: new Date().toISOString() 
      })
      .eq('transaction_id', event.transaction_id)
      .eq('event_type', event.event_type);

    res.status(200).json({ success: true });
  } catch (error) {
    console.error('Webhook processing error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
