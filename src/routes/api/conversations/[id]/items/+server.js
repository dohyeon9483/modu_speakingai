import { supabaseClient } from '$lib/supabaseClient.js';
import { json } from '@sveltejs/kit';

/** @type {import('./$types').RequestHandler} */
export async function GET({ params, locals }) {
	try {
		// 사용자 인증 확인
		if (!locals.user) {
			return json({ error: '인증이 필요합니다.' }, { status: 401 });
		}

		const conversationId = params.id;
		const userId = locals.user.id;

		// 대화가 사용자의 것인지 확인
		const { data: conversation, error: convError } = await supabaseClient
			.from('conversations')
			.select('*')
			.eq('id', conversationId)
			.eq('user_id', userId)
			.single();

		if (convError || !conversation) {
			return json({ error: '대화를 찾을 수 없습니다.' }, { status: 404 });
		}

		// 대화의 메시지들 조회
		const { data: items, error: itemsError } = await supabaseClient
			.from('conversation_items')
			.select('*')
			.eq('conversation_id', conversationId)
			.order('sequence_number', { ascending: true });

		if (itemsError) {
			console.error('Conversation items fetch error:', itemsError);
			return json({ error: '메시지를 불러오는데 실패했습니다.' }, { status: 500 });
		}

		return json({
			success: true,
			data: {
				conversation,
				items
			}
		});

	} catch (err) {
		console.error('GET /api/conversations/[id]/items error:', err);
		return json({ error: '서버 오류가 발생했습니다.' }, { status: 500 });
	}
}

