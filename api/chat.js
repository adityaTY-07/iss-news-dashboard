export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Credentials', true)
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT')
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  )

  if (req.method === 'OPTIONS') {
    res.status(200).end()
    return
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const aiToken = process.env.VITE_AI_TOKEN;
    if (!aiToken) {
      return res.status(500).json({ error: 'Missing VITE_AI_TOKEN environment variable' });
    }

    let parsedBody = req.body;
    if (typeof req.body === 'string') {
      try {
        parsedBody = JSON.parse(req.body);
      } catch (e) {
        return res.status(400).json({ error: 'Invalid JSON body' });
      }
    }

    const { messages, dashboardData } = parsedBody || {};
    
    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: 'Invalid messages format: ' + typeof messages });
    }

    const systemInstruction = `You are an AI for a dashboard. The dashboard data is: ${JSON.stringify(dashboardData)}. 
RULE: ONLY answer using this data. Refuse to answer outside questions. Be concise.`;

    const promptMessages = [
      { role: 'system', content: systemInstruction },
      ...messages
    ];

    const url = 'https://router.huggingface.co/hf-inference/v1/chat/completions';
    // Actually, looking at the proxy, it just hits /v1/chat/completions on router.huggingface.co
    // But let's use the explicit model URL just to be absolutely safe and standard:
    const realUrl = 'https://api-inference.huggingface.co/models/Qwen/Qwen2.5-72B-Instruct/v1/chat/completions';
    
    const response = await fetch(realUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${aiToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: "Qwen/Qwen2.5-72B-Instruct",
        messages: promptMessages,
        max_tokens: 200,
        temperature: 0.1
      })
    });

    if (!response.ok) {
      const err = await response.text();
      console.error('Hugging Face API Error:', err);
      if (response.status === 503) {
        return res.status(503).json({ error: 'Model is currently loading, please try again in a minute.', is_loading: true });
      }
      return res.status(response.status).json({ error: 'Failed to fetch AI response', details: err });
    }

    const data = await response.json();
    let generatedText = data.choices?.[0]?.message?.content || '';
    
    res.status(200).json({ response: generatedText.trim() });
  } catch (error) {
    console.error('Error generating chat response:', error);
    res.status(500).json({ error: 'Failed to generate response' });
  }
}
