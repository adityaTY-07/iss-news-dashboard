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

    const { messages, dashboardData } = req.body;
    
    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: 'Invalid messages format' });
    }

    // Construct the prompt for Mistral Instruct
    // System instruction injected into the first user message or prepended
    const systemInstruction = `You are a helpful AI assistant for a dashboard. The current dashboard data is: ${JSON.stringify(dashboardData)}. 
RULE: You must ONLY answer using this dashboard data. If a user asks something not present in the data, politely refuse to answer and tell them you can only answer questions about the dashboard data. Do not guess or use outside knowledge. Answer concisely.`;

    // Mistral Instruct format: <s>[INST] Instruction [/INST] Model answer</s>[INST] Follow-up instruction [/INST]
    let prompt = `<s>[INST] ${systemInstruction}\n\n`;
    
    messages.forEach((msg, idx) => {
      if (msg.role === 'user') {
        if (idx === 0) {
          prompt += `${msg.content} [/INST]`;
        } else {
          prompt += `[INST] ${msg.content} [/INST]`;
        }
      } else {
        prompt += ` ${msg.content} </s>`;
      }
    });

    const url = 'https://api-inference.huggingface.co/models/mistralai/Mistral-7B-Instruct-v0.2';
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${aiToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        inputs: prompt,
        parameters: {
          max_new_tokens: 250,
          return_full_text: false,
          temperature: 0.1, // Low temperature since we want factual answers based on data
        }
      })
    });

    if (!response.ok) {
      const err = await response.text();
      console.error('Hugging Face API Error:', err);
      // Wait for model to load if needed
      if (response.status === 503) {
        return res.status(503).json({ error: 'Model is currently loading, please try again in a minute.', is_loading: true });
      }
      return res.status(response.status).json({ error: 'Failed to fetch AI response' });
    }

    const data = await response.json();
    let generatedText = data[0]?.generated_text || '';
    
    res.status(200).json({ response: generatedText.trim() });
  } catch (error) {
    console.error('Error generating chat response:', error);
    res.status(500).json({ error: 'Failed to generate response' });
  }
}
