import { json } from '@sveltejs/kit';
import { supabaseClient } from '$lib/supabaseClient.js';

/** @type {import('./$types').RequestHandler} */
export async function POST({ request }) {
	try {
		const body = await request.json();
		const { userId, isSuperUser } = body;

		if (!userId || typeof isSuperUser !== 'boolean') {
			return json({ error: '필수 정보가 누락되었습니다.' }, { status: 400 });
		}

		// 사용자 슈퍼 계정 상태 업데이트
		const { data, error } = await supabaseClient
			.from('users')
			.update({ is_super_user: isSuperUser })
			.eq('id', userId)
			.select('id, name, email, is_super_user')
			.single();

		if (error) {
			console.error('슈퍼 계정 설정 오류:', error);
			return json({ error: '슈퍼 계정 설정에 실패했습니다.' }, { status: 500 });
		}

		return json({
			success: true,
			user: data,
			message: isSuperUser ? '슈퍼 계정으로 설정되었습니다.' : '일반 계정으로 변경되었습니다.'
		});

	} catch (error) {
		console.error('POST /api/admin/toggle-super-user error:', error);
		return json({ error: error.message || '서버 오류가 발생했습니다.' }, { status: 500 });
	}
}



