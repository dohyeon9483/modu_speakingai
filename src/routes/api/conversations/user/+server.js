import { supabaseClient } from '$lib/supabaseClient.js';
import { error } from '@sveltejs/kit';

/** @type {import('./$types').RequestHandler} */
export async function GET({ locals }) {
	try {
		// 사용자 인증 확인
		if (!locals.user) {
			throw error(401, '인증이 필요합니다.');
		}

		const userId = locals.user.id;

		// 사용자의 완료된 대화 목록 조회
		const { data: conversations, error: convError } = await supabaseClient
			.from('conversations')
			.select(`
				id,
				session_id,
				title,
				started_at,
				ended_at,
				status,
				total_duration,
				message_count,
				created_at
			`)
			.eq('user_id', userId)
			.eq('status', 'completed')
			.order('started_at', { ascending: false });

		if (convError) {
			console.error('Conversations query error:', convError);
			throw error(500, '대화 목록을 불러오는데 실패했습니다.');
		}

		// 각 대화에 파일 정보 추가
		const conversationsWithFiles = await Promise.all(
			conversations.map(async (conv) => {
				const { data: files } = await supabaseClient
					.from('conversation_files')
					.select('id, filename, file_size, created_at')
					.eq('conversation_id', conv.id)
					.single();

				return {
					...conv,
					file: files || null
				};
			})
		);

		return new Response(JSON.stringify({
			success: true,
			data: conversationsWithFiles
		}), {
			headers: {
				'Content-Type': 'application/json'
			}
		});

	} catch (err) {
		console.error('GET /api/conversations/user error:', err);

		if (err.status) {
			throw err;
		}

		throw error(500, '서버 오류가 발생했습니다.');
	}
}



