// ClickPesa Webhook Handler for Vite
// This file should be accessible at /api/webhooks/clickpesa

export default function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-clickpesa-signature');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    console.log('ClickPesa webhook received:', req.body);
    
    // For now, just log the webhook event
    const event = req.body;
    
    // Basic webhook processing
    const response = {
      success: true,
      message: 'Webhook received successfully',
      timestamp: new Date().toISOString(),
      event_type: event.event_type || 'unknown',
      transaction_id: event.transaction_id || 'unknown'
    };

    console.log('Webhook response:', response);
    
    res.status(200).json(response);
  } catch (error) {
    console.error('Webhook processing error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Internal server error',
      message: error.message 
    });
  }
}
