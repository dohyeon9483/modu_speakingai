import { json } from '@sveltejs/kit';
import { supabase } from '$lib/supabaseClient.js';
import bcrypt from 'bcryptjs';

export async function POST({ request, cookies }) {
	try {
		const { email, password } = await request.json();

		console.log('🔐 로그인 시도:', email);

		// 입력 검증
		if (!email || !password) {
			return json({ error: '이메일과 비밀번호를 입력해주세요.' }, { status: 400 });
		}

		// 사용자 조회
		const { data: user, error } = await supabase
			.from('users')
			.select('id, name, email, password')
			.eq('email', email)
			.single();

		if (error) {
			console.error('❌ DB 조회 오류:', {
				message: error.message,
				code: error.code,
				details: error.details,
				hint: error.hint
			});
			
			// DB 연결 오류인 경우
			if (error.code === 'PGRST116' || error.message?.includes('relation') || error.message?.includes('does not exist')) {
				return json({ 
					error: '데이터베이스 연결 오류입니다. 관리자에게 문의하세요.',
					details: error.message 
				}, { status: 500 });
			}
			
			// 사용자 없음 (일반적인 경우)
			if (error.code === 'PGRST116') {
				return json({ error: '이메일 또는 비밀번호가 올바르지 않습니다.' }, { status: 401 });
			}
			
			return json({ 
				error: '데이터베이스 오류가 발생했습니다.',
				details: error.message 
			}, { status: 500 });
		}

		if (!user) {
			console.log('❌ 사용자 없음:', email);
			return json({ error: '이메일 또는 비밀번호가 올바르지 않습니다.' }, { status: 401 });
		}

		console.log('✅ 사용자 찾음:', email);
		console.log('📝 저장된 비밀번호 형식:', user.password?.substring(0, 7) + '...');

		// 비밀번호 확인
		const isValidPassword = await bcrypt.compare(password, user.password);

		console.log('🔑 비밀번호 검증 결과:', isValidPassword);

		if (!isValidPassword) {
			return json({ error: '이메일 또는 비밀번호가 올바르지 않습니다.' }, { status: 401 });
		}

		// 세션 쿠키 설정 (비밀번호 제외)
		const sessionData = {
			id: user.id,
			name: user.name,
			email: user.email
		};

		cookies.set('session', JSON.stringify(sessionData), {
			path: '/',
			httpOnly: true,
			sameSite: 'strict',
			maxAge: 60 * 60 * 24 * 7 // 7일
		});

		return json({ 
			success: true,
			user: sessionData,
			message: '로그인 성공!' 
		});
	} catch (error) {
		console.error('Server error:', error);
		return json({ error: error.message }, { status: 500 });
	}
}

