import axios from 'axios';
import { env } from '../config/env.js';

/**
 * Build enhancement prompt for OpenAI
 * Instructs the model to improve the original article using reference materials
 * 
 * @param {string} originalText - The original article content
 * @param {Array} refItems - Reference articles with title, URL, and content
 * @returns {string} Formatted prompt for the LLM
 */
function buildEnhancementPrompt(originalText, referenceArticles) {
	const formattedReferences = referenceArticles
		.map((ref, index) => `
Reference ${index + 1}: ${ref.title}
URL: ${ref.url}
Excerpt: ${ref.content?.slice(0, 800)}...
`.trim())
		.join('\n\n');

	return [
		'You are a professional content editor. Enhance the ORIGINAL ARTICLE using insights and structure from the reference articles.',
		'',
		'Guidelines:',
		'- Preserve all factual information and add relevant context',
		'- Organize content with clear headings and subheadings (use markdown format)',
		'- Break long paragraphs into shorter, readable chunks',
		'- Use bullet points for lists and key takeaways',
		'- Maintain a professional but accessible tone',
		'- Do NOT invent facts; only use information from provided materials',
		'- End with a "References" section listing the source URLs',
		'',
		'ORIGINAL ARTICLE:',
		originalText,
		'',
		'REFERENCE ARTICLES:',
		formattedReferences,
	].join('\n');
}

/**
 * Call OpenAI GPT to enhance article content
 * Uses the LLM to improve structure, add context, and format content professionally
 * 
 * @param {Object} params - Enhancement parameters
 * @param {string} params.originalText - Original article content
 * @param {Array} params.references - Reference articles for context
 * @returns {Promise<string>} Enhanced article content
 * @throws {Error} If OpenAI API key is missing or API call fails
 */
export async function enhance({ originalText, references }) {
	if (!env.OPENAI_API_KEY) {
		throw new Error('OPENAI_API_KEY not configured. Add it to .env file to enable AI enhancement.');
	}

	const prompt = buildEnhancementPrompt(originalText, references);

	try {
		const response = await axios.post(
			'https://api.openai.com/v1/chat/completions',
			{
				model: env.LLM_MODEL,
				messages: [
					{ 
						role: 'system', 
						content: 'You are an expert content editor producing well-structured, accurate, and engaging articles.'
					},
					{ 
						role: 'user', 
						content: prompt 
					},
				],
				temperature: 0.7, // Balanced between creativity and consistency
				max_tokens: 2000,
			},
			{
				headers: {
					Authorization: `Bearer ${env.OPENAI_API_KEY}`,
					'Content-Type': 'application/json',
				},
				timeout: 120000, // 2 minute timeout for LLM response
			}
		);

		const enhancedContent = response.data?.choices?.[0]?.message?.content?.trim();
		if (!enhancedContent) {
			throw new Error('LLM returned empty response');
		}

		return enhancedContent;

	} catch (error) {
		throw new Error(`LLM enhancement failed: ${error.message}`);
	}
}
