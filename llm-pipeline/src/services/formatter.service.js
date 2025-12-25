export function formatContent(plainText, title) {
    const text = plainText.replace(/\s+/g, ' ').trim();
    const sentences = text.match(/[^.!?]+[.!?]+/g) || [text];
    
    const formatted = [`<h1>${title}</h1>`];
    let paragraphSentences = [];
    let sentenceCount = 0;
    
    for (let i = 0; i < sentences.length; i++) {
        const sentence = sentences[i].trim();
        if (!sentence) continue;
        
        sentenceCount++;
        
        const isQuestion = sentence.endsWith('?');
        const isShort = sentence.length < 100;
        const startsWithKey = /^(Why|How|What|When|Where|The|Key|Important|Note)/i.test(sentence);
        
        if (sentenceCount % 5 === 0 && i < sentences.length - 1) {
            const nextSentence = sentences[i + 1].trim();
            if ((nextSentence.length < 100 && /^[A-Z]/.test(nextSentence)) || 
                nextSentence.endsWith('?') ||
                /^(Why|How|What|When|Where|The key|Important)/i.test(nextSentence)) {
                if (paragraphSentences.length > 0) {
                    formatted.push(`<p>${paragraphSentences.join(' ')}</p>`);
                    paragraphSentences = [];
                }
            }
        }
        
        if (isQuestion && isShort && paragraphSentences.length > 3) {
            if (paragraphSentences.length > 0) {
                formatted.push(`<p>${paragraphSentences.join(' ')}</p>`);
                paragraphSentences = [];
            }
            formatted.push(`<h2>${sentence}</h2>`);
        }
        else if (startsWithKey && isShort && sentenceCount > 3 && paragraphSentences.length > 2) {
            if (paragraphSentences.length > 0) {
                formatted.push(`<p>${paragraphSentences.join(' ')}</p>`);
                paragraphSentences = [];
            }
            formatted.push(`<h2>${sentence.replace(/[.!?]+$/, '')}</h2>`);
        }
        else {
            paragraphSentences.push(sentence);
            
            if (paragraphSentences.length >= 4) {
                formatted.push(`<p>${paragraphSentences.join(' ')}</p>`);
                paragraphSentences = [];
            }
        }
    }
    
    if (paragraphSentences.length > 0) {
        formatted.push(`<p>${paragraphSentences.join(' ')}</p>`);
    }
    
    let html = formatted.join('\n\n');
    
    html = html.replace(/\b(important|crucial|key point|remember|note|warning|tip|pro tip)\b/gi, '<strong>$1</strong>');
    
    html = html.replace(/<\/p>\n\n<p>/g, '</p>\n\n<p>');
    
    return html;
}