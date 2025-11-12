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
		const { messages, title, conversationId } = body;

		if (!messages || !Array.isArray(messages) || messages.length === 0) {
			throw error(400, '저장할 메시지가 없습니다.');
		}

		let finalConversationId = conversationId;

		// 대화가 없으면 새로 생성
		if (!finalConversationId) {
			const { data: conversation, error: insertError } = await supabaseClient
				.from('conversations')
				.insert({
					user_id: userId,
					session_id: randomUUID(),
					title: title || `대화 ${new Date().toLocaleString('ko-KR')}`,
					status: 'completed',
					started_at: new Date().toISOString(),
					ended_at: new Date().toISOString()
				})
				.select()
				.single();

			if (insertError) {
				console.error('Conversation create error:', insertError);
				throw error(500, '대화를 생성하는데 실패했습니다.');
			}

			finalConversationId = conversation.id;
		} else {
			// 기존 대화 업데이트
			const { error: updateError } = await supabaseClient
				.from('conversations')
				.update({
					status: 'completed',
					ended_at: new Date().toISOString(),
					title: title || undefined
				})
				.eq('id', finalConversationId)
				.eq('user_id', userId);

			if (updateError) {
				console.error('Conversation update error:', updateError);
				throw error(500, '대화를 업데이트하는데 실패했습니다.');
			}
		}

		// 메시지를 conversation_items로 저장
		const items = messages.map((message, index) => ({
			conversation_id: finalConversationId,
			sequence_number: index + 1,
			role: message.role,
			content: message.content,
			created_at: message.timestamp || new Date().toISOString()
		}));

		const { error: itemsError } = await supabaseClient
			.from('conversation_items')
			.insert(items);

		if (itemsError) {
			console.error('Conversation items insert error:', itemsError);
			throw error(500, '대화 내용을 저장하는데 실패했습니다.');
		}

		return new Response(JSON.stringify({
			success: true,
			data: {
				conversationId: finalConversationId,
				itemsCount: items.length
			}
		}), {
			status: 200,
			headers: {
				'Content-Type': 'application/json'
			}
		});

	} catch (err) {
		console.error('POST /api/conversations/save error:', err);

		if (err.status) {
			throw err;
		}

		throw error(500, '서버 오류가 발생했습니다.');
	}
}

