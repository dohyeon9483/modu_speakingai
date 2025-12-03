import { json } from '@sveltejs/kit';
import { supabaseClient } from '$lib/supabaseClient.js';

/** @type {import('./$types').RequestHandler} */
export async function GET({ locals }) {
	try {
		// 사용자 인증 확인
		if (!locals.user) {
			return json({ error: '인증이 필요합니다.' }, { status: 401 });
		}

		const userId = locals.user.id;

		// 사용자 크레딧 조회
		const { data: user, error } = await supabaseClient
			.from('users')
			.select('credits')
			.eq('id', userId)
			.single();

		if (error || !user) {
			console.error('크레딧 조회 오류:', error);
			return json({ error: '크레딧 조회에 실패했습니다.' }, { status: 500 });
		}

		return json({
			success: true,
			credits: user.credits || 0
		});

	} catch (error) {
		console.error('GET /api/credits/balance error:', error);
		return json({ error: error.message || '서버 오류가 발생했습니다.' }, { status: 500 });
	}
}



