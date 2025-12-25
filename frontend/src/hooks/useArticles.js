import { useEffect, useState } from 'react';
import { getArticles } from '../api/article.api';

export function useArticles() {
	const [data, setData] = useState([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState(null);

	useEffect(() => {
		let mounted = true;
		(async () => {
			try {
				setLoading(true);
				const items = await getArticles();
				if (mounted) setData(items);
			} catch (e) {
				if (mounted) setError(e);
			} finally {
				if (mounted) setLoading(false);
			}
		})();
		return () => { mounted = false; };
	}, []);

	return { data, loading, error };
}
