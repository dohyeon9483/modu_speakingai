import { supabaseClient } from '$lib/supabaseClient.js';
import { error } from '@sveltejs/kit';
import { deductCredits, getUserMessageCredits } from '$lib/credits.js';

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

		// 사용자 메시지인 경우 크레딧 차감
		if (role === 'user') {
			const creditAmount = getUserMessageCredits();
			const deductResult = await deductCredits(locals.user.id, creditAmount, {
				conversationId: conversationId,
				type: 'user_message',
				messageCount: 1,
				description: `사용자 메시지 전송: ${creditAmount} 크레딧 차감`
			});

			if (!deductResult.success) {
				if (deductResult.error === '크레딧이 부족합니다.') {
					return new Response(JSON.stringify({
						error: '크레딧이 부족합니다.',
						currentBalance: deductResult.currentBalance,
						required: deductResult.required
					}), {
						status: 402,
						headers: {
							'Content-Type': 'application/json'
						}
					});
				}
				throw error(500, deductResult.error || '크레딧 차감에 실패했습니다.');
			}
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
			data,
			creditsDeducted: role === 'user' ? getUserMessageCredits() : 0
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

