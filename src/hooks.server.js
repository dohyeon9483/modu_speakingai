/** @type {import('@sveltejs/kit').Handle} */
export async function handle({ event, resolve }) {
	// 세션 쿠키에서 사용자 정보 가져오기
	const session = event.cookies.get('session');
	
	if (session) {
		try {
			event.locals.user = JSON.parse(session);
		} catch (e) {
			// 잘못된 세션 쿠키는 삭제
			event.cookies.delete('session', { path: '/' });
		}
	}

	return resolve(event);
}

