import { redirect } from '@sveltejs/kit';

/** @type {import('./$types').PageServerLoad} */
export async function load({ locals }) {
	// 이미 로그인한 사용자는 메인 페이지로 리다이렉트
	if (locals.user) {
		throw redirect(307, '/');
	}
}

