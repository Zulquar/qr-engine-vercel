const { createClient } = require('@supabase/supabase-js');
const QRCode = require('qrcode');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ success: false, error: 'Method not allowed' });

  const { action, data } = req.body;
  try {
    if (action === 'getPatterns') {
      const { data: patterns, error } = await supabase.from('patterns').select('*');
      if (error) throw error;
      return res.status(200).json({ success: true, data: patterns });
    }
    if (action === 'savePattern') {
      const { data: result, error } = await supabase.from('patterns').insert([{
        id: Math.random().toString(36).substr(2, 9).toUpperCase(),
        name: data.name,
        code_type: data.codeType,
        segment_count: data.samples[0].split('_').length,
        delimiter: '_',
        segment_rules: JSON.stringify(data.samples),
        samples: JSON.stringify(data.samples)
      }]);
      if (error) throw error;
      return res.status(200).json({ success: true, data: { id: 'saved' } });
    }
    if (action === 'generateRaw') {
      const qrDataUri = await QRCode.toDataURL(data.text);
      return res.status(200).json({ success: true, data: { encodedPayload: data.text, qrDataUri, displayLabel: data.text } });
    }
    if (action === 'generateCode') {
      const payload = 'GEN_' + data.patternId + '_' + Math.floor(Math.random() * 10000);
      const qrDataUri = await QRCode.toDataURL(payload);
      return res.status(200).json({ success: true, data: { encodedPayload: payload, qrDataUri, displayLabel: data.displayLabel || payload } });
    }
    return res.status(400).json({ success: false, error: 'Action not found' });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
};
