import { json } from '@sveltejs/kit';
import { supabaseClient } from '$lib/supabaseClient.js';

/** @type {import('./$types').RequestHandler} */
export async function GET({ locals, url }) {
	try {
		// 사용자 인증 확인
		if (!locals.user) {
			return json({ error: '인증이 필요합니다.' }, { status: 401 });
		}

		const userId = locals.user.id;
		const limit = parseInt(url.searchParams.get('limit') || '50');
		const offset = parseInt(url.searchParams.get('offset') || '0');

		// 크레딧 사용 내역 조회
		const { data: transactions, error } = await supabaseClient
			.from('credit_transactions')
			.select('*')
			.eq('user_id', userId)
			.order('created_at', { ascending: false })
			.range(offset, offset + limit - 1);

		if (error) {
			console.error('크레딧 내역 조회 오류:', error);
			return json({ error: '크레딧 내역 조회에 실패했습니다.' }, { status: 500 });
		}

		// 총 개수 조회
		const { count } = await supabaseClient
			.from('credit_transactions')
			.select('*', { count: 'exact', head: true })
			.eq('user_id', userId);

		return json({
			success: true,
			data: transactions || [],
			total: count || 0,
			limit,
			offset
		});

	} catch (error) {
		console.error('GET /api/credits/history error:', error);
		return json({ error: error.message || '서버 오류가 발생했습니다.' }, { status: 500 });
	}
}



