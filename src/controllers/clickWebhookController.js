const clickPaymentService = require('../services/clickPaymentService');
const axios = require('axios');

const handleClickWebhook = async (req, res) => {
  console.log('\n' + '='.repeat(60));
  console.log('📥 [CLICK WEBHOOK] Received on myrent.uz');
  console.log('Time:', new Date().toISOString());
  console.log('Service ID:', req.body.service_id);
  console.log('Transaction ID:', req.body.merchant_trans_id);
  console.log('Action:', req.body.action);
  console.log('='.repeat(60));

  const tenantId = process.env.TENANT_ID;
  
  // ✅ NEW: Check if this webhook is for another tenant
  const serviceIdToBackend = {
    '84321': { port: 3003, name: 'rizq_baraka', tenant: 'rizq_baraka' },
    '84319': { port: 3004, name: 'muzaffar-savdo', tenant: 'muzaffar-savdo' },
    '84310': { port: 3005, name: 'istiqlol', tenant: 'istiqlol' },
    '84296': { port: 3006, name: 'bogdod', tenant: 'bogdod' },
    '84316': { port: 3007, name: 'beshariq-turon', tenant: 'beshariq-turon' },
    '84272': { port: 3009, name: 'beshariq', tenant: 'beshariq' }
  };

  const backend = serviceIdToBackend[req.body.service_id];

  // ✅ If webhook is for another tenant, forward it
  if (backend) {
    console.log(`→ This is for ${backend.name}, forwarding...`);
    
    try {
      const response = await axios.post(
        `http://localhost:${backend.port}/api/payments/webhook/click`,
        req.body,
        { 
          headers: { 'Content-Type': 'application/json' },
          timeout: 15000 
        }
      );

      console.log(`✅ ${backend.name} responded successfully`);
      console.log('='.repeat(60) + '\n');
      
      return res.json(response.data);

    } catch (error) {
      console.error(`❌ Forward to ${backend.name} failed:`, error.message);
      console.log('='.repeat(60) + '\n');
      
      return res.json({
        click_trans_id: req.body.click_trans_id,
        merchant_trans_id: req.body.merchant_trans_id,
        merchant_prepare_id: req.body.merchant_prepare_id,
        error: -8,
        error_note: 'System error'
      });
    }
  }

  // ✅ If no match found, return error (ipak_yuli doesn't use Click)
  console.log('❌ Unknown service_id or ipak_yuli (uses Payme, not Click)');
  console.log('='.repeat(60) + '\n');
  
  return res.json({
    click_trans_id: req.body.click_trans_id,
    merchant_trans_id: req.body.merchant_trans_id,
    error: -3,
    error_note: 'Service not found'
  });
};

module.exports = {
  handleClickWebhook
};
