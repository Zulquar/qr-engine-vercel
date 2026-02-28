const { createClient } = require('@supabase/supabase-js');
const QRCode = require('qrcode');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  if (req.method === 'OPTIONS') return res.status(200).end();
  
  const { action, data } = req.body;

  try {
    // 1. Get Patterns
    if (action === 'getPatterns') {
      const { data: patterns, error } = await supabase.from('patterns').select('*');
      if (error) throw error;
      return res.status(200).json({ success: true, data: patterns });
    }

    // 2. Save Pattern
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

    // 3. Validate Code
    if (action === 'validateCode') {
      const { data: patterns } = await supabase.from('patterns').select('*');
      let matched = null;
      let score = 0;
      
      // Simple logic: Does code match pattern structure?
      patterns.forEach(p => {
        if (data.code.includes(p.delimiter || '_')) {
           matched = p.name;
           score = 85; 
        }
      });
      return res.status(200).json({ 
        success: true, 
        data: { valid: !!matched, matchedPattern: matched, confidence: score, message: matched ? 'Pattern recognized' : 'Unknown pattern' } 
      });
    }

    // 4. History Helpers
    if (action === 'getGenerated') return res.status(200).json({ success: true, data: [] });
    if (action === 'deleteGenerated') return res.status(200).json({ success: true, data: {} });
    if (action === 'generateRaw') {
      const qrDataUri = await QRCode.toDataURL(data.text);
      return res.status(200).json({ success: true, data: { encodedPayload: data.text, qrDataUri, displayLabel: data.text } });
    }

    return res.status(400).json({ success: false, error: 'Action not found' });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
};
