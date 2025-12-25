/**
 * INSTANT formatting - Intelligent text parsing
 * Creates attractive structure from plain text
 */
export function formatContent(plainText, title) {
	// Split into sentences for better analysis
	const text = plainText.replace(/\s+/g, ' ').trim();
	const sentences = text.match(/[^.!?]+[.!?]+/g) || [text];
	
	const formatted = [`<h1>${title}</h1>`];
	let paragraphSentences = [];
	let sentenceCount = 0;
	
	for (let i = 0; i < sentences.length; i++) {
		const sentence = sentences[i].trim();
		if (!sentence) continue;
		
		sentenceCount++;
		
		// Detect potential headings (questions or short emphatic statements)
		const isQuestion = sentence.endsWith('?');
		const isShort = sentence.length < 100;
		const startsWithKey = /^(Why|How|What|When|Where|The|Key|Important|Note)/i.test(sentence);
		
		// Every 5-6 sentences, check if next sentence could be a heading
		if (sentenceCount % 5 === 0 && i < sentences.length - 1) {
			const nextSentence = sentences[i + 1].trim();
			if ((nextSentence.length < 100 && /^[A-Z]/.test(nextSentence)) || 
			    nextSentence.endsWith('?') ||
			    /^(Why|How|What|When|Where|The key|Important)/i.test(nextSentence)) {
				// Flush current paragraph
				if (paragraphSentences.length > 0) {
					formatted.push(`<p>${paragraphSentences.join(' ')}</p>`);
					paragraphSentences = [];
				}
			}
		}
		
		// If this looks like a heading
		if (isQuestion && isShort && paragraphSentences.length > 3) {
			// Flush paragraph and add as heading
			if (paragraphSentences.length > 0) {
				formatted.push(`<p>${paragraphSentences.join(' ')}</p>`);
				paragraphSentences = [];
			}
			formatted.push(`<h2>${sentence}</h2>`);
		}
		// If starts with key phrase and we have some content already
		else if (startsWithKey && isShort && sentenceCount > 3 && paragraphSentences.length > 2) {
			// Flush paragraph and add as heading
			if (paragraphSentences.length > 0) {
				formatted.push(`<p>${paragraphSentences.join(' ')}</p>`);
				paragraphSentences = [];
			}
			formatted.push(`<h2>${sentence.replace(/[.!?]+$/, '')}</h2>`);
		}
		// Regular sentence
		else {
			paragraphSentences.push(sentence);
			
			// Create paragraph breaks after 4-5 sentences
			if (paragraphSentences.length >= 4) {
				formatted.push(`<p>${paragraphSentences.join(' ')}</p>`);
				paragraphSentences = [];
			}
		}
	}
	
	// Flush remaining sentences
	if (paragraphSentences.length > 0) {
		formatted.push(`<p>${paragraphSentences.join(' ')}</p>`);
	}
	
	// Add emphasis to key phrases
	let html = formatted.join('\n\n');
	
	// Bold important phrases (with word boundaries)
	html = html.replace(/\b(important|crucial|key point|remember|note|warning|tip|pro tip)\b/gi, '<strong>$1</strong>');
	
	// Add line breaks for better readability
	html = html.replace(/<\/p>\n\n<p>/g, '</p>\n\n<p>');
	
	return html;
}



