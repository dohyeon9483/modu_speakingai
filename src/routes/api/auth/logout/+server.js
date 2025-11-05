import { json } from '@sveltejs/kit';

export async function POST({ cookies }) {
	cookies.delete('session', { path: '/' });
	return json({ success: true, message: '로그아웃되었습니다.' });
}

