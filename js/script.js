// ========================================
// API Configuration
// ========================================
const API_ENDPOINT = '/api/groq';

// ========================================
// Static Articles (fallback et exemples concrets)
// ========================================
const STATIC_REAL_NEWS = [
    {
        title: "La France lance un nouveau plan pour la transition énergétique avec 30 milliards d'euros",
        source: "Le Monde",
        type: "true",
        emoji: "⚡",
        explanation: "Ceci est un véritable article publié par Le Monde sur les investissements énergétiques.",
        wrongPercent: 35
    },
    {
        title: "Une startup parisienne lève 50 millions d'euros pour son IA de diagnostic médical",
        source: "Les Échos",
        type: "true",
        emoji: "🏥",
        explanation: "Article réel publié dans Les Échos concernant une levée de fonds dans la tech santé.",
        wrongPercent: 28
    },
    {
        title: "Le Louvre bat son record avec 12 millions de visiteurs en 2025",
        source: "France Info",
        type: "true",
        emoji: "🖼️",
        explanation: "Information vérifiée publiée par France Info sur la fréquentation des musées.",
        wrongPercent: 42
    },
    {
        title: "L'UE vote l'AI Act avec des amendes pouvant atteindre 7% du chiffre d'affaires",
        source: "Euronews",
        type: "true",
        emoji: "⚖️",
        explanation: "Actualité réelle rapportée par Euronews sur la régulation de l'IA en Europe.",
        wrongPercent: 31
    }
];

const STATIC_FAKE_NEWS = [
    {
        title: "Un étudiant de Toulouse invente une batterie smartphone qui dure 3 mois sans recharge",
        source: "InfoDélire",
        type: "false",
        emoji: "🔋",
        explanation: "Aucune technologie actuelle ne permet une telle durée de batterie. Les meilleures batteries lithium-ion durent maximum 3-4 jours. Cette information est complètement inventée.",
        wrongPercent: 68
    },
    {
        title: "La NASA découvre une planète habitable à 12 années-lumière avec de l'eau liquide confirmée",
        source: "InfoDélire",
        type: "false",
        emoji: "🪐",
        explanation: "Bien que la recherche d'exoplanètes soit réelle, cette découverte spécifique avec ces chiffres précis est fictive et n'a pas été annoncée par la NASA.",
        wrongPercent: 72
    },
    {
        title: "Un inventeur français crée un moteur de voiture fonctionnant à 100% à l'eau de pluie",
        source: "InfoDélire",
        type: "false",
        emoji: "💧",
        explanation: "Cette invention défie les lois de la thermodynamique. L'eau n'est pas un carburant et ne peut pas produire d'énergie sans apport extérieur. C'est une fausse nouvelle récurrente.",
        wrongPercent: 55
    },
    {
        title: "Des scientifiques prouvent que dormir 2 heures par jour suffit avec la méthode du sommeil fractionné",
        source: "InfoDélire",
        type: "false",
        emoji: "😴",
        explanation: "Cette affirmation contredit toutes les recherches scientifiques validées sur le sommeil. Le corps humain a besoin de 7-9h de sommeil pour fonctionner correctement.",
        wrongPercent: 63
    }
];

const STATIC_CLICKBAIT = [
    {
        title: "Netflix annonce une augmentation à 45€/mois pour l'abonnement standard en avril 2026",
        source: "BuzzActu",
        type: "clickbait",
        emoji: "📺",
        explanation: "Ce titre exagère drastiquement. Netflix ajuste ses prix progressivement (généralement 1-2€), jamais de manière aussi radicale. Le titre déforme probablement une rumeur ou une augmentation bien plus modeste.",
        wrongPercent: 61
    },
    {
        title: "Apple confirme : l'iPhone 20 aura une batterie tenant 2 semaines complètes",
        source: "BuzzActu",
        type: "clickbait",
        emoji: "📱",
        explanation: "Bien qu'Apple améliore ses batteries, ce chiffre de 2 semaines est totalement irréaliste avec la technologie actuelle. Le titre transforme probablement une légère amélioration en promesse extraordinaire.",
        wrongPercent: 58
    },
    {
        title: "Nouveau régime révolutionnaire : perdre 12kg en 5 jours selon une étude de Harvard",
        source: "BuzzActu",
        type: "clickbait",
        emoji: "⚖️",
        explanation: "Ce type de promesse est médicalement dangereux et impossible. Une perte de poids saine est de 0.5-1kg par semaine maximum. L'étude mentionnée n'existe probablement pas ou est sortie de son contexte.",
        wrongPercent: 75
    },
    {
        title: "Tesla lance une voiture électrique à 5000€ pour concurrencer Dacia, livraisons en mars",
        source: "BuzzActu",
        type: "clickbait",
        emoji: "🚗",
        explanation: "Ce prix est complètement irréaliste pour Tesla dont le modèle le moins cher coûte 40000€+. Le titre déforme probablement une annonce sur un futur modèle abordable... à 25000€ minimum.",
        wrongPercent: 66
    }
];

// ========================================
// Game State
// ========================================
let gameState = {
    articles: [],
    usedRealArticles: new Set(), // Track used articles to avoid dupes
    currentQuestionIndex: 0,
    score: 0,
    streak: 0,
    totalQuestions: 10,
    isLoading: false
};

// ========================================
// DOM Elements
// ========================================
const DOM = {
    startScreen: document.getElementById('start-screen'),
    gameContainer: document.getElementById('game-container'),
    questionCard: document.getElementById('question-card'),
    resultCard: document.getElementById('result-card'),
    endgameCard: document.getElementById('endgame-card'),
    startGameBtn: document.getElementById('start-game-btn'),
    scoreDisplay: document.getElementById('score'),
    currentQuestionDisplay: document.getElementById('current-question'),
    streakDisplay: document.getElementById('streak'),
    questionNumberSpan: document.getElementById('q-num'),
    articleTitle: document.getElementById('article-title'),
    articleSource: document.getElementById('source-name'),
    articleDate: document.getElementById('article-date'),
    articleImage: document.getElementById('article-img'),
    resultOutcome: document.getElementById('result-outcome'),
    playerAnswer: document.getElementById('player-answer'),
    correctAnswer: document.getElementById('correct-answer'),
    accuracyInfo: document.getElementById('accuracy-info'),
    pointsAwarded: document.getElementById('points-awarded'),
    finalScore: document.getElementById('final-score'),
    badgeIcon: document.getElementById('badge-icon'),
    badgeTitle: document.getElementById('badge-title'),
    progressBar: document.getElementById('progress-bar'),
    progressText: document.getElementById('progress-text'),
    progressContainer: document.getElementById('progress-container'),
    explanationText: document.getElementById('explanation-text'),
    endgameDescription: document.getElementById('endgame-description'),
    scoreContainer: document.getElementById('score-container')
};

// ========================================
// API Functions - Groq
// ========================================
async function callGroqAPI(messages, options = {}) {
    try {
        const response = await fetch(API_ENDPOINT, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: options.model || 'llama-3.3-70b-versatile',
                messages: messages,
                temperature: options.temperature || 0.9,
                max_tokens: options.max_tokens || 200,
                response_format: options.response_format || undefined
            })
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
            console.error('Groq API error:', response.status, errorData);
            return null;
        }

        const data = await response.json();
        return data.choices[0]?.message?.content || null;
    } catch (error) {
        console.error('Error calling Groq API:', error.message);
        return null;
    }
}

async function generateEmojiWithGroq(title) {
    try {
        const content = await callGroqAPI([
            {
                role: "system",
                content: "Réponds UNIQUEMENT avec un seul emoji pertinent. Aucun texte."
            },
            {
                role: "user",
                content: `Emoji pour: "${title}"`
            }
        ], {
            max_tokens: 10,
            temperature: 0.5
        });

        if (!content) return '📰';
        const emoji = content.trim();
        return /\p{Emoji}/u.test(emoji) ? emoji : '📰';
    } catch (error) {
        console.error('Error generating emoji:', error);
        return '📰';
    }
}

async function generateArticleWithGroq(type = 'false', baseArticle = null) {
    try {
        // If no base article, pick a random unused real one
        if (!baseArticle && gameState.articles && gameState.articles.length > 0) {
            const realArticles = gameState.articles.filter(a => a.type === 'true');
            const unusedArticles = realArticles.filter(a => !gameState.usedRealArticles.has(a.title));
            
            if (unusedArticles.length > 0) {
                baseArticle = unusedArticles[Math.floor(Math.random() * unusedArticles.length)];
            } else if (realArticles.length > 0) {
                // If all used, pick any (recycling)
                baseArticle = realArticles[Math.floor(Math.random() * realArticles.length)];
            }
        }

        // Fallback to static if still no article
        if (!baseArticle) {
            return getStaticFallback(type);
        }

        // Track this article as used
        gameState.usedRealArticles.add(baseArticle.title);

        // Call the new API to generate fake/clickbait based on real article
        const response = await fetch('/api/generateContent', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                realArticle: { title: baseArticle.title },
                type: type
            })
        });

        if (!response.ok) {
            console.log('generateContent API failed, using static fallback');
            return getStaticFallback(type);
        }

        const data = await response.json();
        const date = formatDate(new Date());
        const source = type === 'false' ? 'InfoDélire' : 'BuzzActu';
        
        // Clean quotes from title
        const cleanedTitle = (data.generatedTitle || 'Titre non généré').replace(/"/g, '');
        
        let explanation;
        if (type === 'false') {
            explanation = `Cette information est complètement inventée basée sur le sujet réel: "${baseArticle.title}". Aucune source fiable ne rapporte cet événement.`;
        } else {
            explanation = `Ce titre exagère et déforme l'article réel: "${baseArticle.title}". Technique classique de clickbait pour attirer les clics.`;
        }

        return {
            title: cleanedTitle,
            source: source,
            date: date,
            icon: '❓',
            type: type,
            explanation: explanation,
            wrongPercent: randomInt(50, 80)
        };
    } catch (error) {
        console.error(`Error generating ${type} article:`, error);
        return getStaticFallback(type);
    }
}

function getStaticFallback(type) {
    const pool = type === 'false' ? STATIC_FAKE_NEWS : STATIC_CLICKBAIT;
    const article = pool[Math.floor(Math.random() * pool.length)];
    return {
        ...article,
        title: article.title.replace(/"/g, ''), // Remove quotes
        date: formatDate(new Date()),
        icon: article.emoji
    };
}

// ========================================
// Real News Functions
// ========================================
async function getRealNews() {
    try {
        // Fetch real news from live sources
        const response = await fetch('/api/fetchNews');
        if (!response.ok) throw new Error('Failed to fetch news');
        
        const data = await response.json();
        const realArticles = data.articles || [];

        console.log(`Fetched ${realArticles.length} real articles from ${data.source}`);

        // Take the first few for the game
        const selected = realArticles.slice(0, 4);
        
        const articles = selected.map((item) => ({
            title: item.title.replace(/"/g, ''), // Remove quotes
            source: item.source,
            date: item.date || formatDate(new Date()),
            icon: item.emoji || '📰',
            type: 'true',
            explanation: item.explanation || 'Article d\'actualité vérifiée',
            wrongPercent: 35
        }));

        return articles;
    } catch (error) {
        console.error('Error getting real news:', error);
        // Fallback to static news
        const shuffled = [...STATIC_REAL_NEWS].sort(() => 0.5 - Math.random());
        return shuffled.slice(0, 3).map(item => ({
            title: item.title.replace(/"/g, ''), // Remove quotes
            source: item.source,
            date: formatDate(new Date()),
            icon: item.emoji,
            type: 'true',
            explanation: item.explanation,
            wrongPercent: item.wrongPercent
        }));
    }
}

// ========================================
// Game Logic
// ========================================
async function generateAllArticles() {
    gameState.isLoading = true;
    showLoadingState();
    gameState.usedRealArticles.clear(); // Reset tracking for new game

    try {
        // Step 1: Fetch real news first
        const realNews = await getRealNews();
        console.log(`Got ${realNews.length} real articles`);
        
        // Store real articles for reference
        gameState.articles = [...realNews];
        
        const realCount = realNews.length;
        const fakeCount = Math.floor((gameState.totalQuestions - realCount) / 2);
        const clickbaitCount = gameState.totalQuestions - realCount - fakeCount;

        console.log(`Generating: ${realCount} real, ${fakeCount} fake, ${clickbaitCount} clickbait`);

        // Step 2: Generate fake news (let function pick to avoid dupes)
        const fakePromises = Array(fakeCount).fill(null).map(() => 
            generateArticleWithGroq('false')
        );
        
        // Step 3: Generate clickbait (let function pick to avoid dupes)
        const clickbaitPromises = Array(clickbaitCount).fill(null).map(() => 
            generateArticleWithGroq('clickbait')
        );

        const fakeNews = await Promise.all(fakePromises);
        const clickbaitNews = await Promise.all(clickbaitPromises);

        gameState.articles = [...realNews, ...fakeNews, ...clickbaitNews].filter(a => a !== null);
        // Better shuffle to avoid clustering same types
        for (let i = 0; i < 3; i++) {
            shuffleArray(gameState.articles);
        }
        gameState.totalQuestions = gameState.articles.length;

        console.log(`Total articles ready: ${gameState.articles.length}`);

    } catch (error) {
        console.error('Error generating articles:', error);
        gameState.articles = [];
    } finally {
        gameState.isLoading = false;
    }

    return gameState.articles.length > 0;
}

function initApp() {
    gameState.currentQuestionIndex = 0;
    gameState.score = 0;
    gameState.streak = 0;
    updateScoreDisplay();
    showScreen('start');
}

async function startGame() {
    gameState.currentQuestionIndex = 0;
    gameState.score = 0;
    gameState.streak = 0;
    
    updateScoreDisplay();
    DOM.progressContainer.classList.remove('hidden');
    
    const success = await generateAllArticles();
    
    if (!success || gameState.articles.length === 0) {
        alert("Erreur lors du chargement des articles. Vérifiez votre connexion Internet.");
        initApp();
        return;
    }
    
    showScreen('game');
    displayQuestion();
}

function displayQuestion() {
    const article = gameState.articles[gameState.currentQuestionIndex];
    
    if (!article) {
        console.error('No article found for question');
        return;
    }
    
    DOM.articleTitle.textContent = article.title;
    DOM.articleSource.textContent = article.source;
    DOM.articleDate.textContent = article.date;
    DOM.articleImage.textContent = article.icon;
    DOM.questionNumberSpan.textContent = gameState.currentQuestionIndex + 1;
    DOM.currentQuestionDisplay.textContent = gameState.currentQuestionIndex + 1;
    
    updateProgressBar();
    showScreen('game');
}

function checkAnswer(playerAnswer) {
    const article = gameState.articles[gameState.currentQuestionIndex];
    const isCorrect = playerAnswer === article.type;
    
    if (isCorrect) {
        gameState.score += 10;
        gameState.streak++;
    } else {
        gameState.streak = 0;
    }
    
    updateScoreDisplay();
    showResult(isCorrect, article, playerAnswer);
}

function generateContextualExplanation(article, playerAnswer, isCorrect) {
    const explanations = {
        correct_true: `✅ C'est effectivement vrai ! Cet article provient d'une source fiable (${article.source}). ${article.explanation}`,
        
        correct_false: `✅ Bien joué ! Tu as repéré que c'était faux. ${article.explanation}`,
        
        correct_clickbait: `✅ Exact ! Ce titre utilise les techniques du clickbait. ${article.explanation}`,
        
        wrong_true_false: `❌ Erreur : c'est un article vrai. Bien que le titre puisse sembler exagéré, ${article.source} est une source d'actualité fiable. ${article.explanation}`,
        
        wrong_true_clickbait: `❌ Erreur : c'est un vrai article, pas du clickbait. La source ${article.source} publie des informations vérifiées. ${article.explanation}`,
        
        wrong_false_true: `❌ Erreur : c'est une fausse nouvelle. Le titre peut sembler plausible, mais aucune source fiable ne le rapporte. ${article.explanation}`,
        
        wrong_false_clickbait: `❌ Erreur : c'est une fausse nouvelle totale, encore pire que du simple clickbait. ${article.explanation}`,
        
        wrong_clickbait_true: `❌ Erreur : c'est un vrai article ! Bien que le titre soit accrocateur, ${article.source} est une source vérifiée. ${article.explanation}`,
        
        wrong_clickbait_false: `❌ Erreur : c'est une fausse nouvelle complète, pas du clickbait. Le titre n'est pas qu'exagéré, il est totalement inventé. ${article.explanation}`
    };
    
    let key;
    if (isCorrect) {
        key = `correct_${article.type}`;
    } else {
        key = `wrong_${article.type}_${playerAnswer}`;
    }
    
    return explanations[key] || article.explanation;
}

function showResult(isCorrect, article, playerAnswer) {
    const answerLabels = {
        'true': 'Vrai',
        'false': 'Totalement faux',
        'clickbait': 'Titre trompeur'
    };
    
    if (isCorrect) {
        DOM.resultOutcome.textContent = 'Bravo ! 🎉';
        DOM.resultOutcome.className = 'result-outcome correct';
        DOM.pointsAwarded.textContent = '+ 10 pts';
        DOM.pointsAwarded.style.color = '#6BCF7F';
        playSound('success');
        showToast('Bonne réponse !', 'success');
    } else {
        DOM.resultOutcome.textContent = 'Raté ! 😢';
        DOM.resultOutcome.className = 'result-outcome wrong';
        DOM.pointsAwarded.textContent = '+ 0 pts';
        DOM.pointsAwarded.style.color = '#FF6B9D';
        playSound('error');
        showToast('Mauvaise réponse...', 'error');
    }
    
    DOM.playerAnswer.textContent = answerLabels[playerAnswer];
    DOM.correctAnswer.textContent = answerLabels[article.type];
    DOM.accuracyInfo.textContent = `${article.wrongPercent}% se trompent`;
    
    if (DOM.explanationText) {
        const contextualExplanation = generateContextualExplanation(article, playerAnswer, isCorrect);
        DOM.explanationText.textContent = contextualExplanation;
    }
    
    showScreen('result');
}

function nextQuestion() {
    gameState.currentQuestionIndex++;
    
    if (gameState.currentQuestionIndex >= gameState.totalQuestions) {
        endGame();
    } else {
        displayQuestion();
    }
}

function endGame() {
    DOM.progressContainer.classList.add('hidden');
    
    const maxScore = gameState.totalQuestions * 10;
    const percentage = (gameState.score / maxScore) * 100;
    
    DOM.finalScore.textContent = `${gameState.score}/${maxScore}`;
    
    let badge, title, description;
    
    if (percentage >= 90) {
        badge = '🏆';
        title = `Maître de l'info`;
        description = 'Exceptionnel ! Tu es quasiment impossible à tromper. Ton esprit critique est aiguisé comme une lame.';
    } else if (percentage >= 70) {
        badge = '🧠';
        title = 'Analyste confirmé';
        description = `Très bien ! Tu as un bon instinct pour détecter la désinformation. Continue d'affiner ton esprit critique.`;
    } else if (percentage >= 50) {
        badge = '🔍';
        title = 'Détective amateur';
        description = `Pas mal ! Tu commences à développer ton sens critique, mais il reste du travail. Rejoue pour t'améliorer !`;
    } else {
        badge = '🙈';
        title = 'Pigeon certifié';
        description = 'Aïe ! Tu te fais facilement avoir. Prends le temps de vérifier tes sources et développe ton esprit critique !';
    }
    
    DOM.badgeIcon.textContent = badge;
    DOM.badgeTitle.textContent = title;
    if (DOM.endgameDescription) {
        DOM.endgameDescription.textContent = description;
    }
    
    showScreen('endgame');
    
    // Trigger confetti animation if score is good
    if (percentage >= 70) {
        createConfetti();
    }
}

function createConfetti() {
    const confettiEmojis = ['🎉', '✨', '🎊', '⭐', '🌟'];
    const confettiCount = 30;
    
    for (let i = 0; i < confettiCount; i++) {
        setTimeout(() => {
            const confetti = document.createElement('div');
            confetti.style.position = 'fixed';
            confetti.style.left = Math.random() * 100 + '%';
            confetti.style.top = '-10px';
            confetti.style.fontSize = (Math.random() * 20 + 15) + 'px';
            confetti.style.opacity = '1';
            confetti.style.pointerEvents = 'none';
            confetti.style.zIndex = '9999';
            confetti.textContent = confettiEmojis[Math.floor(Math.random() * confettiEmojis.length)];
            confetti.classList.add('confetti-piece');
            
            document.body.appendChild(confetti);
            
            setTimeout(() => confetti.remove(), 2500);
        }, i * 50);
    }
}

function shareScore() {
    const maxScore = gameState.totalQuestions * 10;
    const percentage = (gameState.score / maxScore) * 100;
    
    // Message de partage dynamique basé sur le score
    let shareMessage = '';
    let emoji = '';
    
    if (percentage >= 90) {
        emoji = '🏆';
        shareMessage = `${emoji} JE SUIS UN MAÎTRE DE L'INFO ! J'ai écrasé "${DOM.badgeTitle.textContent}" avec ${gameState.score}/${maxScore} au Fake News Detector ! 🎯

💪 T'es capable de faire mieux ? Rejoins la bataille contre la désinformation ! 👇`;
    } else if (percentage >= 70) {
        emoji = '🧠';
        shareMessage = `${emoji} J'ai atteint "${DOM.badgeTitle.textContent}" avec ${gameState.score}/${maxScore} au Fake News Detector ! 🎯

Entraîne-toi à repérer les fake news et deviens un champion ! 🚀`;
    } else if (percentage >= 50) {
        emoji = '🔍';
        shareMessage = `${emoji} Regarde, j'ai ${gameState.score}/${maxScore} au Fake News Detector ! 🎯

C'est un jeu DINGUE pour tester ton esprit critique ! À toi de jouer maintenant ! 💪`;
    } else {
        emoji = '😂';
        shareMessage = `${emoji} Aïe ! J'ai seulement ${gameState.score}/${maxScore} au Fake News Detector 😅

Mais c'est normal, je commence à peine ! Rejoins-moi pour qu'on apprenne ensemble à repérer les fake news ! 🎯`;
    }
    
    const urlMessage = `

🔗 JOUE MAINTENANT: ${window.location.href}`;
    const fullMessage = shareMessage + urlMessage;
    
    if (navigator.share) {
        navigator.share({
            title: '🔍 Fake News Detector - Teste ton esprit critique !',
            text: fullMessage,
            url: window.location.href
        }).catch(() => copyToClipboard(fullMessage));
    } else {
        copyToClipboard(fullMessage);
    }
}

function restartGame() {
    initApp();
}

// ========================================
// UI Helper Functions
// ========================================
function showScreen(screen) {
    // Hide all screens
    DOM.startScreen.classList.add('hidden');
    DOM.gameContainer.classList.add('hidden');
    DOM.questionCard.classList.add('hidden');
    DOM.resultCard.classList.add('hidden');
    DOM.endgameCard.classList.add('hidden');
    
    // Show score container and progress based on game state
    if (screen === 'game' || screen === 'question' || screen === 'result') {
        DOM.scoreContainer.classList.remove('hidden');
    } else {
        DOM.scoreContainer.classList.add('hidden');
    }
    
    // Show selected screen
    switch(screen) {
        case 'start':
            DOM.startScreen.classList.remove('hidden');
            break;
        case 'game':
            DOM.gameContainer.classList.remove('hidden');
            DOM.questionCard.classList.remove('hidden');
            break;
        case 'result':
            DOM.gameContainer.classList.remove('hidden');
            DOM.resultCard.classList.remove('hidden');
            break;
        case 'endgame':
            DOM.endgameCard.classList.remove('hidden');
            break;
    }
}

function showLoadingState() {
    DOM.articleTitle.textContent = "Chargement des articles...";
    DOM.articleSource.textContent = "";
    DOM.articleDate.textContent = "";
    DOM.articleImage.textContent = "⏳";
}

function updateScoreDisplay() {
    DOM.scoreDisplay.textContent = gameState.score;
    DOM.streakDisplay.textContent = gameState.streak;
    DOM.currentQuestionDisplay.textContent = gameState.currentQuestionIndex + 1;
    
    // Add animation effect to score
    DOM.scoreDisplay.classList.add('updated');
    setTimeout(() => DOM.scoreDisplay.classList.remove('updated'), 400);
    
    // Add animation to streak if it increases
    if (gameState.streak > 0) {
        DOM.streakDisplay.classList.add('updated');
        setTimeout(() => DOM.streakDisplay.classList.remove('updated'), 400);
    }
}

function updateProgressBar() {
    const progress = ((gameState.currentQuestionIndex + 1) / gameState.totalQuestions) * 100;
    DOM.progressBar.style.width = `${progress}%`;
    DOM.progressText.textContent = `Question ${gameState.currentQuestionIndex + 1}/${gameState.totalQuestions}`;
}

// ========================================
// Utility Functions
// ========================================
function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
    });
}

function randomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function copyToClipboard(text) {
    if (navigator.clipboard) {
        navigator.clipboard.writeText(text).then(() => {
            alert(` SUPER ! Ton message est prêt à être partagé !

💪 Defie tes amis et montre qui est le roi des fake news !

✨ Plus tes amis jouent, plus tu deviendras fort !`);
        });
    } else {
        const textarea = document.createElement('textarea');
        textarea.value = text;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
        alert(`🚀 SUPER ! Ton message est prêt à être partagé !

💪 Defie tes amis et montre qui est le roi des fake news !

✨ Plus tes amis jouent, plus tu deviendras fort !`);
    }
}

// ========================================
// Event Listeners
// ========================================
window.addEventListener('load', initApp);
DOM.startGameBtn.addEventListener('click', startGame);

window.checkAnswer = checkAnswer;
window.nextQuestion = nextQuestion;
window.shareScore = shareScore;
window.restartGame = restartGame;

// ========================================
// Toast/Notification UI
// ========================================
// Lightweight sound feedback using Web Audio API
let _audioCtx = null;
function playSound(type = 'success') {
    try {
        if (!_audioCtx) _audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        const ctx = _audioCtx;
        const o = ctx.createOscillator();
        const g = ctx.createGain();
        o.connect(g);
        g.connect(ctx.destination);
        const now = ctx.currentTime;
        g.gain.setValueAtTime(0.0001, now);
        if (type === 'success') {
            o.type = 'sine';
            o.frequency.setValueAtTime(880, now);
            g.gain.exponentialRampToValueAtTime(0.08, now + 0.001);
            o.start(now);
            o.frequency.exponentialRampToValueAtTime(1320, now + 0.12);
            g.gain.exponentialRampToValueAtTime(0.0001, now + 0.28);
            o.stop(now + 0.29);
        } else {
            o.type = 'sine';
            o.frequency.setValueAtTime(220, now);
            g.gain.exponentialRampToValueAtTime(0.09, now + 0.001);
            o.start(now);
            o.frequency.exponentialRampToValueAtTime(110, now + 0.12);
            g.gain.exponentialRampToValueAtTime(0.0001, now + 0.28);
            o.stop(now + 0.29);
        }
    } catch (e) {
        // ignore if audio not allowed or fails
    }
}

function showToast(message, type = 'info', duration = 3000) {
    const container = document.getElementById('toast-container');
    if (!container) return;
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    let icon = '';
    if (type === 'success') icon = '✅';
    else if (type === 'error') icon = '❌';
    else if (type === 'info') icon = 'ℹ️';
    toast.innerHTML = `<span class="toast-icon">${icon}</span>${message}`;
    container.appendChild(toast);
    setTimeout(() => {
        toast.style.opacity = '0';
        setTimeout(() => toast.remove(), 400);
    }, duration);
}