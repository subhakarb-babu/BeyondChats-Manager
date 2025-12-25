import { useArticles } from '../hooks/useArticles';
import ArticleList from '../components/ArticleList';

export default function Home(){
	const { data, loading, error } = useArticles();
	return (
		<div className="p-6">
			<h1 className="text-2xl font-bold mb-4">Articles</h1>
			{loading && <div>Loading…</div>}
			{error && <div className="text-red-600">Failed to load articles</div>}
			{!loading && !error && <ArticleList items={data} />}
		</div>
	);
}
