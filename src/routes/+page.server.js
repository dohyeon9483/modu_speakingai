import { redirect } from '@sveltejs/kit';

/** @type {import('./$types').PageServerLoad} */
export async function load({ locals }) {
	// 로그인된 사용자는 대화 페이지로 이동
	if (locals.user) {
		throw redirect(302, '/chat');
	}

	// 비로그인 사용자는 랜딩 페이지 표시 (리다이렉트 없음)
	return {
		user: null
	};
}

