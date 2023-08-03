import { cache } from '$lib/cache/cache';
const epoch_day = new Date().getTime() / 86400;

export async function load({ locals, url, setHeaders }) {
	setHeaders({
		'cache-control': 'max-age=240'
	});

	const order_val = url.searchParams.get('order');
	const order = order_val === 'desc' || !order_val ? 'desc' : 'asc'; // Ensure order can only be 'asc' or 'desc'
	const filter = url.searchParams.get('filter');
	const limit = url.searchParams.get('limit') || 100;

	let whereClause = '';
	const params = [];

	if (filter) {
		switch (filter) {
			case 'hasty':
				whereClause += 'DAYOFWEEK(date) = ?';
				params.push(2); // Monday
				break;
			case 'tasty':
				whereClause += 'DAYOFWEEK(date) = ?';
				params.push(4); // Wednesday
				break;
			case 'supper':
				whereClause += 'DAYOFWEEK(date) = ?';
				params.push(6); // Friday
				break;
			case 'special':
				whereClause += 'DAYOFWEEK(date) NOT IN (?, ?, ?)';
				params.push(2, 4, 6); // Not Monday, Wednesday, or Friday
				break;
		}
	}

	const cache_key = `shows:${epoch_day}:${filter}:${order}:${limit}`;

	let sqlQuery = 'SELECT id, number, title, date, slug, url FROM `Show`';
	if (whereClause !== '') {
		sqlQuery += ` WHERE ${whereClause}`;
	}
	sqlQuery += ` ORDER BY number ${order} LIMIT ${limit}`;
	let shows = await cache.get(cache_key);

	if (!shows) {
		shows = await locals.prisma.$queryRawUnsafe(sqlQuery, ...params);
		cache.set(cache_key, shows);
	}

	return {
		shows
	};
}