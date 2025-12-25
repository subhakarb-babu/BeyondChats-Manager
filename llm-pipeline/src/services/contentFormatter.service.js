export function formatEnhancedContent(text, references = []) {
	if (!text) return '';

	let html = text;

	html = html.replace(
		/^### (.*?)$/gm,
		'<h3 style="font-size: 1.3em; font-weight: 700; margin: 1.5em 0 0.8em 0; color: #333;">$1</h3>'
	);
	html = html.replace(
		/^## (.*?)$/gm,
		'<h2 style="font-size: 1.6em; font-weight: 700; margin: 1.8em 0 1em 0; color: #222;">$1</h2>'
	);
	html = html.replace(
		/^# (.*?)$/gm,
		'<h1 style="font-size: 2em; font-weight: 700; margin: 1em 0 0.8em 0; color: #111;">$1</h1>'
	);

	html = html.replace(
		/\*\*(.*?)\*\*/g,
		'<strong style="font-weight: 700; color: #333;">$1</strong>'
	);
	html = html.replace(
		/__(.+?)__/g,
		'<strong style="font-weight: 700; color: #333;">$1</strong>'
	);

	html = html.replace(
		/\*(.*?)\*/g,
		'<em style="font-style: italic; color: #555;">$1</em>'
	);
	html = html.replace(
		/_(.+?)_/g,
		'<em style="font-style: italic; color: #555;">$1</em>'
	);

	html = html.replace(
		/^\* (.*?)$/gm,
		'<li style="margin: 0.5em 0; line-height: 1.6;">$1</li>'
	);
	html = html.replace(
		/^- (.*?)$/gm,
		'<li style="margin: 0.5em 0; line-height: 1.6;">$1</li>'
	);
	html = html.replace(
		/^\d+\. (.*?)$/gm,
		'<li style="margin: 0.5em 0; line-height: 1.6;">$1</li>'
	);

	html = html.replace(
		/(<li[^>]*>.*?<\/li>)/s,
		(match) => {
			if (!match.includes('<ul')) {
				return `<ul style="margin: 1em 0; padding-left: 2em;">${match}</ul>`;
			}
			return match;
		}
	);

	const lines = html.split(/\n\n+/);

	html = lines
		.map((line) => {
			line = line.trim();
			if (!line) return '';

			if (/<h[1-6]|<ul|<ol|<blockquote/.test(line)) {
				return line;
			}

			if (/^<[a-z]/.test(line)) {
				return line;
			}

			return `<p style="margin: 1em 0; line-height: 1.7; color: #444; font-size: 1em;">${line}</p>`;
		})
		.join('\n');

	html = html
		.replace(/<p[^>]*>(<h[1-6])/g, '$1')
		.replace(/(<\/h[1-6]>)<\/p>/g, '$1')
		.replace(/<p[^>]*>(<ul|<ol)/g, '$1')
		.replace(/(<\/ul>|<\/ol>)<\/p>/g, '$1');

	if (references && references.length > 0) {
		const referenceListItems = references
			.map((ref) => {
				const title = ref.title || 'Reference';
				const url = ref.url || '#';
				return `<li style="margin: 0.5em 0; line-height: 1.6;"><a href="${url}" target="_blank" rel="noopener noreferrer" style="color: #FF8C42; text-decoration: none; font-weight: 500;">${title}</a></li>`;
			})
			.join('\n');

		html += `
<h2 style="font-size: 1.6em; font-weight: 700; margin: 2em 0 1em 0; color: #222; border-top: 2px solid #FF8C42; padding-top: 1em;">References</h2>
<ul style="margin: 1em 0; padding-left: 2em;">
${referenceListItems}
</ul>`;
	}

	return html.trim();
}
