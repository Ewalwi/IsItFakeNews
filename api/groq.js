export default async function handler(req, res) {
    // Enable CORS
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
    res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');
    
    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { messages, model, temperature, max_tokens, response_format } = req.body;
    const GROQ_API_KEY = process.env.GROQ_API_KEY;
    const GROQ_API_URL = process.env.GROQ_API_URL || 'https://api.groq.com/openai/v1/chat/completions';

    if (!GROQ_API_KEY) {
        console.error('GROQ_API_KEY not configured');
        return res.status(500).json({ error: 'GROQ_API_KEY not configured in environment variables' });
    }

    if (!messages || !Array.isArray(messages)) {
        return res.status(400).json({ error: 'Invalid messages format' });
    }

    try {
        console.log('Calling Groq API with URL:', GROQ_API_URL);
        
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

        const responseText = await response.text();
        
        if (!response.ok) {
            console.error('Groq API error:', response.status, responseText);
            return res.status(response.status).json({ 
                error: `Groq API error: ${response.status}`,
                details: responseText 
            });
        }

        const data = JSON.parse(responseText);
        return res.status(200).json(data);
    } catch (error) {
        console.error('Error calling Groq API:', error.message, error.stack);
        return res.status(500).json({ 
            error: 'Internal server error',
            message: error.message 
        });
    }
}
