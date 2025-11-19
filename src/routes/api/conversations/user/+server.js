import { supabaseClient } from '$lib/supabaseClient.js';
import { json } from '@sveltejs/kit';

/** @type {import('./$types').RequestHandler} */
export async function GET({ locals }) {
	try {
		// 사용자 인증 확인
		if (!locals.user) {
			return json({ error: '인증이 필요합니다.' }, { status: 401 });
		}

		const userId = locals.user.id;

		// 사용자의 모든 대화 조회 (최신순)
		const { data: conversations, error } = await supabaseClient
			.from('conversations')
			.select('*')
			.eq('user_id', userId)
			.order('started_at', { ascending: false });

		if (error) {
			console.error('Conversations fetch error:', error);
			return json({ error: '대화 목록을 불러오는데 실패했습니다.' }, { status: 500 });
		}

		return json({
			success: true,
			data: conversations
		});

	} catch (err) {
		console.error('GET /api/conversations/user error:', err);
		return json({ error: '서버 오류가 발생했습니다.' }, { status: 500 });
	}
}
