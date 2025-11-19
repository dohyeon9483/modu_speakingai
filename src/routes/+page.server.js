import { redirect } from '@sveltejs/kit';

/** @type {import('./$types').PageServerLoad} */
export async function load({ locals }) {
	// 로그인하지 않은 사용자는 로그인 페이지로 리다이렉트
	if (!locals.user) {
		throw redirect(307, '/login');
	}

	// 로그인된 사용자는 대화 페이지로 이동
	throw redirect(302, '/chat');
}

