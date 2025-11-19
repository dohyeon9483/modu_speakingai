import { supabaseClient } from '$lib/supabaseClient.js';
import { error } from '@sveltejs/kit';

/** @type {import('./$types').RequestHandler} */
export async function POST({ request, locals }) {
	try {
		// 사용자 인증 확인
		if (!locals.user) {
			throw error(401, '인증이 필요합니다.');
		}

		const body = await request.json();
		const { conversationId, role, content } = body;

		if (!conversationId || !role || !content) {
			throw error(400, '필수 정보가 누락되었습니다.');
		}

		// 현재 대화의 마지막 순서 번호 조회
		const { data: lastItem } = await supabaseClient
			.from('conversation_items')
			.select('sequence_number')
			.eq('conversation_id', conversationId)
			.order('sequence_number', { ascending: false })
			.limit(1)
			.single();

		const nextSequence = (lastItem?.sequence_number || 0) + 1;

		// 메시지 저장
		const { data, error: insertError } = await supabaseClient
			.from('conversation_items')
			.insert({
				conversation_id: conversationId,
				sequence_number: nextSequence,
				role: role,
				content: content,
				created_at: new Date().toISOString()
			})
			.select()
			.single();

		if (insertError) {
			console.error('Message save error:', insertError);
			throw error(500, '메시지 저장 실패');
		}

		return new Response(JSON.stringify({
			success: true,
			data
		}), {
			status: 201,
			headers: {
				'Content-Type': 'application/json'
			}
		});

	} catch (err) {
		console.error('POST /api/conversations/save-item error:', err);
		if (err.status) throw err;
		throw error(500, '서버 오류가 발생했습니다.');
	}
}

