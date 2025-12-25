import { run } from './workflows/articleEnhancer.workflow.js';
import { env } from './config/env.js';

async function main() {
	try {
		const result = await run();
		console.log(JSON.stringify(result, null, 2));
	} catch (err) {
		console.error('LLM Pipeline failed:', err?.message || err);
		// Helpful hints
		if (!env.OPENAI_API_KEY) {
			console.error('Missing OPENAI_API_KEY in .env');
		}
		if (!env.SERPAPI_KEY) {
			console.error('Missing SERPAPI_KEY in .env');
		}
		process.exit(1);
	}
}

main();
