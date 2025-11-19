import { supabaseClient } from '$lib/supabaseClient.js';
import { error, json } from '@sveltejs/kit';

/** @type {import('./$types').RequestHandler} */
export async function GET({ params, locals }) {
	try {
		// 사용자 인증 확인
		if (!locals.user) {
			throw error(401, '인증이 필요합니다.');
		}

		const conversationId = params.id;
		const userId = locals.user.id;

		// 대화 정보 조회 (권한 확인 포함)
		const { data: conversation, error: convError } = await supabaseClient
			.from('conversations')
			.select('*')
			.eq('id', conversationId)
			.eq('user_id', userId)
			.single();

		if (convError) {
			if (convError.code === 'PGRST116') {
				throw error(404, '대화를 찾을 수 없습니다.');
			}
			console.error('Conversation query error:', convError);
			throw error(500, '대화 정보를 불러오는데 실패했습니다.');
		}

		// 대화 아이템들 조회
		const { data: items, error: itemsError } = await supabaseClient
			.from('conversation_items')
			.select('*')
			.eq('conversation_id', conversationId)
			.order('sequence_number', { ascending: true });

		if (itemsError) {
			console.error('Conversation items query error:', itemsError);
			throw error(500, '대화 내용을 불러오는데 실패했습니다.');
		}

		// 파일 정보 조회
		const { data: file, error: fileError } = await supabaseClient
			.from('conversation_files')
			.select('*')
			.eq('conversation_id', conversationId)
			.maybeSingle();

		if (fileError) {
			console.error('Conversation file query error:', fileError);
			// 파일이 없는 것은 에러가 아님
		}

		return new Response(JSON.stringify({
			success: true,
			data: {
				conversation,
				items: items || [],
				file: file || null
			}
		}), {
			headers: {
				'Content-Type': 'application/json'
			}
		});

	} catch (err) {
		console.error('GET /api/conversations/[id] error:', err);

		if (err.status) {
			throw err;
		}

		throw error(500, '서버 오류가 발생했습니다.');
	}
}

/** @type {import('./$types').RequestHandler} */
export async function PATCH({ params, request, locals }) {
	try {
		// 사용자 인증 확인
		if (!locals.user) {
			return json({ error: '인증이 필요합니다.' }, { status: 401 });
		}

		const conversationId = params.id;
		const userId = locals.user.id;
		const body = await request.json();
		const { action, title } = body;

		if (action === 'resume') {
			// 대화 재개: status를 'active'로 변경하고 ended_at을 NULL로
			const { data, error: updateError } = await supabaseClient
				.from('conversations')
				.update({
					status: 'active',
					ended_at: null
				})
				.eq('id', conversationId)
				.eq('user_id', userId)
				.select()
				.single();

			if (updateError) {
				console.error('Conversation resume error:', updateError);
				return json({ error: '대화 재개에 실패했습니다.' }, { status: 500 });
			}

			return json({
				success: true,
				data
			});
		}

		if (action === 'update_title') {
			// 대화 제목 수정
			if (!title) {
				return json({ error: '제목이 필요합니다.' }, { status: 400 });
			}

			const { data, error: updateError } = await supabaseClient
				.from('conversations')
				.update({ title })
				.eq('id', conversationId)
				.eq('user_id', userId)
				.select()
				.single();

			if (updateError) {
				console.error('Conversation title update error:', updateError);
				return json({ error: '제목 수정에 실패했습니다.' }, { status: 500 });
			}

			return json({
				success: true,
				data
			});
		}

		return json({ error: '알 수 없는 액션입니다.' }, { status: 400 });

	} catch (err) {
		console.error('PATCH /api/conversations/[id] error:', err);
		return json({ error: '서버 오류가 발생했습니다.' }, { status: 500 });
	}
}

/** @type {import('./$types').RequestHandler} */
export async function DELETE({ params, locals }) {
	try {
		// 사용자 인증 확인
		if (!locals.user) {
			return json({ error: '인증이 필요합니다.' }, { status: 401 });
		}

		const conversationId = params.id;
		const userId = locals.user.id;

		// 대화 삭제 (CASCADE로 conversation_items도 자동 삭제됨)
		const { error: deleteError } = await supabaseClient
			.from('conversations')
			.delete()
			.eq('id', conversationId)
			.eq('user_id', userId);

		if (deleteError) {
			console.error('Conversation delete error:', deleteError);
			return json({ error: '대화 삭제에 실패했습니다.' }, { status: 500 });
		}

		return json({
			success: true,
			message: '대화가 삭제되었습니다.'
		});

	} catch (err) {
		console.error('DELETE /api/conversations/[id] error:', err);
		return json({ error: '서버 오류가 발생했습니다.' }, { status: 500 });
	}
}
