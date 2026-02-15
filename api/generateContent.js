/**
 * Use Groq AI to generate fake/clickbait versions of real news
 * This creates variations based on real articles for a more engaging game
 */

export default async function handler(req, res) {
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

    const { realArticle, type } = req.body;
    const GROQ_API_KEY = process.env.GROQ_API_KEY;
    const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';

    if (!GROQ_API_KEY) {
        return res.status(500).json({ error: 'GROQ_API_KEY not configured' });
    }

    if (!realArticle || !type) {
        return res.status(400).json({ error: 'Missing realArticle or type parameter' });
    }

    try {
        let systemPrompt = '';
        
        if (type === 'clickbait') {
            systemPrompt = `Tu es un expert en clickbait SUBTIL. Prends cet article et crée une VERSION avec:
- Un titre un peu exagéré mais PAS évidemment faux
- Utilise des techniques subtiles: omission de contexte, chiffres légèrement gonflés, causalité suggérée
- Doit être CRÉDIBLE au premier abord mais suspect à l'analyse
- Exemples: Si article="« Tesla annonce v7", tu dis "Tesla révolutionne les voitures électriques" (exagération mineure)
- Répondre UNIQUEMENT avec le new titre
- Français seulement
- MAX 100 caractères`;
        } else if (type === 'false') {
            systemPrompt = `Tu crées des FAUSSES NOUVELLES SUBTILES et CRÉDIBLES. Règles:
- Base sur sujet réel (même domaine/industrie) mais détails FAUX
- Doit sembler plausible du premier coup - pas de sci-fi ou miracle
- Exemples: Article "Apple lance iPhone 20" -> "Apple enregistre brevet pour écran non-cassable" (vraisemblable mais faux)
- PAS évident qu'c'est faux jusqu'à vérification
- Répondre UNIQUEMENT le titre
- Français
- MAX 100 caractères`;
        }

        const response = await fetch(GROQ_API_URL, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${GROQ_API_KEY}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: 'llama-3.3-70b-versatile',
                messages: [
                    {
                        role: 'system',
                        content: systemPrompt
                    },
                    {
                        role: 'user',
                        content: `Article: "${realArticle.title}"`
                    }
                ],
                temperature: 0.6,
                max_tokens: 100
            })
        });

        if (!response.ok) {
            const errorData = await response.json();
            console.error('Groq API error:', errorData);
            return res.status(response.status).json({ error: 'Groq API error' });
        }

        const data = await response.json();
        const generatedTitle = data.choices[0].message.content.trim();

        return res.status(200).json({
            originalTitle: realArticle.title,
            generatedTitle: generatedTitle,
            type: type
        });

    } catch (error) {
        console.error('Error generating content:', error);
        return res.status(500).json({ 
            error: 'Internal server error',
            message: error.message 
        });
    }
}
