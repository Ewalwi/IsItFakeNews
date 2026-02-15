export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { messages, model, temperature, max_tokens, response_format } = req.body;
    const GROQ_API_KEY = process.env.GROQ_API_KEY;
    const GROQ_API_URL = process.env.GROQ_API_URL;

    if (!GROQ_API_KEY || !GROQ_API_URL) {
        return res.status(500).json({ error: 'API credentials not configured' });
    }

    try {
        const response = await fetch(GROQ_API_URL, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${GROQ_API_KEY}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: model || 'llama-3.3-70b-versatile',
                messages: messages,
                temperature: temperature || 0.9,
                max_tokens: max_tokens || 200,
                response_format: response_format || undefined
            })
        });

        if (!response.ok) {
            console.error('Groq API error:', response.status);
            return res.status(response.status).json({ error: 'Groq API error' });
        }

        const data = await response.json();
        return res.status(200).json(data);
    } catch (error) {
        console.error('Error calling Groq API:', error);
        return res.status(500).json({ error: error.message });
    }
}
