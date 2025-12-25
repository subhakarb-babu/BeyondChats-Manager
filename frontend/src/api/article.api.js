

const DEFAULT_PROD = 'https://backend-production-5198.up.railway.app/api';
const DEFAULT_DEV = 'http://localhost:8000/api';
const isLocalHost = typeof window !== 'undefined' && (
	window.location.hostname === 'localhost' ||
	window.location.hostname === '127.0.0.1'
);

const BASE_URL =
	import.meta?.env?.VITE_API_URL ||
	import.meta?.env?.VITE_API_BASE_URL ||
	(isLocalHost ? DEFAULT_DEV : DEFAULT_PROD);

export async function getArticles() {
	const res = await fetch(`${BASE_URL}/articles`);
	if (!res.ok) throw new Error(`Failed to fetch articles: ${res.status}`);
	const json = await res.json();
	return json?.data || [];
}

export async function getArticle(id) {
	const res = await fetch(`${BASE_URL}/articles/${id}`);
	if (!res.ok) throw new Error(`Failed to fetch article: ${res.status}`);
	const json = await res.json();
	return json?.data;
}

export async function createArticle(data) {
	const res = await fetch(`${BASE_URL}/articles`, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify(data),
	});
	if (!res.ok) throw new Error(`Failed to create article: ${res.status}`);
	const json = await res.json();
	return json?.data;
}

export async function updateArticle(id, data) {
	const res = await fetch(`${BASE_URL}/articles/${id}`, {
		method: 'PUT',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify(data),
	});
	if (!res.ok) throw new Error(`Failed to update article: ${res.status}`);
	const json = await res.json();
	return json?.data;
}

export async function deleteArticle(id) {
	const res = await fetch(`${BASE_URL}/articles/${id}`, {
		method: 'DELETE',
	});
	if (!res.ok) throw new Error(`Failed to delete article: ${res.status}`);
	const json = await res.json();
	return json;
}

export async function scrapeArticles(count = 5, url = 'https://beyondchats.com/blogs/') {
	const res = await fetch(`${BASE_URL}/articles/scrape`, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ count, url }),
	});
	if (!res.ok) throw new Error(`Failed to scrape articles: ${res.status}`);
	const json = await res.json();
	return json;
}

export function downloadArticle(id) {
	window.open(`${BASE_URL}/articles/${id}/download`, '_blank');
}

export async function enhanceArticle(id) {
	const res = await fetch(`${BASE_URL}/articles/${id}/enhance`, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
	});
	if (!res.ok) throw new Error(`Failed to enhance article: ${res.status}`);
	const json = await res.json();
	return json?.data;
}

