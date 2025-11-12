import { supabaseClient } from '$lib/supabaseClient.js';
import { error } from '@sveltejs/kit';
import { randomUUID } from 'crypto';

/** @type {import('./$types').RequestHandler} */
export async function POST({ request, locals }) {
	try {
		// 사용자 인증 확인
		if (!locals.user) {
			throw error(401, '인증이 필요합니다.');
		}

		const userId = locals.user.id;
		const body = await request.json();
		const { sessionId = randomUUID(), title } = body;

		// 새 대화 생성
		const { data: conversation, error: insertError } = await supabaseClient
			.from('conversations')
			.insert({
				user_id: userId,
				session_id: sessionId,
				title: title || null,
				status: 'active',
				started_at: new Date().toISOString()
			})
			.select()
			.single();

		if (insertError) {
			console.error('Conversation create error:', insertError);
			throw error(500, '대화를 생성하는데 실패했습니다.');
		}

		return new Response(JSON.stringify({
			success: true,
			data: conversation
		}), {
			status: 201,
			headers: {
				'Content-Type': 'application/json'
			}
		});

	} catch (err) {
		console.error('POST /api/conversations/create error:', err);

		if (err.status) {
			throw err;
		}

		throw error(500, '서버 오류가 발생했습니다.');
	}
}



