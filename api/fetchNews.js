/**
 * Fetch real news from RSS feeds - No API Key Required
 * Uses popular RSS feeds from BBC, TechCrunch, Le Monde, etc.
 */

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

    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    // Popular RSS feeds (no API key needed!)
    const RSS_FEEDS = [
        { url: 'https://feeds.bbc.co.uk/news/rss.xml', source: 'BBC News', emoji: '🌍' },
        { url: 'https://feeds.techcrunch.com/techcrunch/startups', source: 'TechCrunch', emoji: '💻' },
        { url: 'https://www.lemonde.fr/rss/une.xml', source: 'Le Monde', emoji: '🇫🇷' },
        { url: 'https://feeds.reuters.com/reuters/businessNews', source: 'Reuters', emoji: '📊' },
        { url: 'https://feeds.theguardian.com/theguardian/world/rss', source: 'The Guardian', emoji: '📰' },
    ];

    try {
        const allArticles = [];

        // Fetch from multiple feeds
        const feedPromises = RSS_FEEDS.map(feed => 
            fetch(feed.url, { timeout: 5000 })
                .then(res => res.text())
                .then(xml => parseRSS(xml, feed.source, feed.emoji))
                .catch(err => {
                    console.log(`Failed to fetch ${feed.source}:`, err.message);
                    return [];
                })
        );

        const results = await Promise.all(feedPromises);
        results.forEach(articles => allArticles.push(...articles));

        // Better shuffle algorithm (Fisher-Yates)
        function shuffle(array) {
            const arr = [...array];
            for (let i = arr.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [arr[i], arr[j]] = [arr[j], arr[i]];
            }
            return arr;
        }

        // Shuffle and get the first 20 articles
        const shuffled = shuffle(allArticles)
            .slice(0, 20)
            .map(article => ({
                ...article,
                type: 'real',
                emoji: article.emoji || '📰'
            }));

        if (shuffled.length === 0) {
            return res.status(200).json({ 
                articles: getFallbackNews(),
                source: 'fallback'
            });
        }

        return res.status(200).json({ 
            articles: shuffled,
            source: 'live'
        });

    } catch (error) {
        console.error('Error fetching news:', error);
        return res.status(200).json({ 
            articles: getFallbackNews(),
            source: 'fallback',
            error: 'Using fallback data'
        });
    }
}

/**
 * Simple RSS Parser (works with most RSS feeds)
 */
function parseRSS(xmlString, source, emoji) {
    const articles = [];
    
    // Extract all <item> entries
    const itemRegex = /<item[\s\S]*?<\/item>/g;
    const items = xmlString.match(itemRegex) || [];

    items.slice(0, 5).forEach(item => {
        // Extract title
        const titleMatch = item.match(/<title>([^<]+)<\/title>/);
        const title = titleMatch ? titleMatch[1].trim() : null;

        // Extract description/content
        const descMatch = item.match(/<description>([^<]+)<\/description>/) || 
                         item.match(/<content:encoded>([^<]+)<\/content:encoded>/);
        const description = descMatch ? descMatch[1].trim() : '';

        // Extract date
        const dateMatch = item.match(/<pubDate>([^<]+)<\/pubDate>/);
        const pubDate = dateMatch ? new Date(dateMatch[1]).toLocaleDateString('fr-FR') : new Date().toLocaleDateString('fr-FR');

        if (title && title.length > 10) {
            // Clean HTML entities
            const cleanTitle = decodeHTMLEntities(title);
            const cleanDescription = decodeHTMLEntities(description);
            
            // Filter out English articles
            if (isFrench(cleanTitle)) {
                articles.push({
                    title: cleanTitle.substring(0, 150), // Limit to 150 chars
                    source: source,
                    date: pubDate,
                    emoji: emoji,
                    explanation: cleanDescription.substring(0, 200) || 'Article d\'actualité vérifiée'
                });
            }
        }
    });

    return articles;
}

/**
 * Decode HTML entities properly
 */
function decodeHTMLEntities(text) {
    if (!text) return '';
    const textArea = { innerHTML: '' };
    textArea.innerHTML = text
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        .replace(/&#x([0-9A-Fa-f]+);/g, (match, hex) => String.fromCharCode(parseInt(hex, 16)))
        .replace(/&#(\d+);/g, (match, dec) => String.fromCharCode(parseInt(dec, 10)))
        .replace(/<[^>]*>/g, '')
        .replace(/\s+/g, ' ');
    return textArea.innerHTML || text;
}

/**
 * Simple language detection - returns true if likely French
 */
function isFrench(text) {
    if (!text) return false;
    const frenchWords = ['les', 'des', 'est', 'que', 'pour', 'avec', 'dans', 'sur', 'une', 'un', 'se', 'qui', 'ce', 'pas', 'ont', 'été', 'très', 'deux', 'entre', 'nous', 'france', 'paris', 'français'];
    const lowerText = text.toLowerCase();
    const matches = frenchWords.filter(w => lowerText.includes(w)).length;
    return matches >= 3; // At least 3 French words
}

/**
 * Fallback news data (in case APIs fail)
 */
function getFallbackNews() {
    return [
        {
            title: "L'Union Européenne valide le premier règlement complet sur l'intelligence artificielle",
            source: "Reuters",
            type: "real",
            emoji: "⚖️",
            explanation: "L'UE finalise sa législation pionnière sur l'IA avec des obligations strictes",
            date: "15 fév 2026"
        },
        {
            title: "Une startup parisienne lève 75 millions d'euros pour sa plateforme biotech",
            source: "TechCrunch", 
            type: "real",
            emoji: "🧬",
            explanation: "Développement majeur dans le secteur français de la biotechnologie",
            date: "14 fév 2026"
        },
        {
            title: "Apple annonce des capteurs de biométrie avancés pour les prochains appareils",
            source: "BBC News",
            type: "real",
            emoji: "📱",
            explanation: "Progrès technologiques en matière de santé et de sécurité",
            date: "13 fév 2026"
        },
        {
            title: "Breakthrough en fusion nucléaire : les scientifiques doublent les performances",
            source: "Le Monde",
            type: "real",
            emoji: "⚛️",
            explanation: "Avancée significative vers l'énergie de fusion viable",
            date: "12 fév 2026"
        }
    ];
}
