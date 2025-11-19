import { supabaseClient } from '$lib/supabaseClient.js';
import { json } from '@sveltejs/kit';

/** @type {import('./$types').RequestHandler} */
export async function POST({ request, locals }) {
	try {
		// 사용자 인증 확인
		if (!locals.user) {
			return json({ error: '인증이 필요합니다.' }, { status: 401 });
		}

		const body = await request.json();
		const { conversationId } = body;
		const userId = locals.user.id;

		if (!conversationId) {
			return json({ error: '대화 ID가 필요합니다.' }, { status: 400 });
		}

		// 대화 종료: status를 'completed'로 변경하고 ended_at 설정
		const { data, error } = await supabaseClient
			.from('conversations')
			.update({
				status: 'completed',
				ended_at: new Date().toISOString()
			})
			.eq('id', conversationId)
			.eq('user_id', userId)
			.select()
			.single();

		if (error) {
			console.error('Conversation finalize error:', error);
			return json({ error: '대화 종료에 실패했습니다.' }, { status: 500 });
		}

		return json({
			success: true,
			data
		});

	} catch (err) {
		console.error('POST /api/conversations/finalize error:', err);
		return json({ error: '서버 오류가 발생했습니다.' }, { status: 500 });
	}
}

