import { json } from '@sveltejs/kit';
import { supabase } from '$lib/supabaseClient.js';
import bcrypt from 'bcryptjs';

export async function POST({ request }) {
	try {
		const { name, email, password } = await request.json();

		// 입력 검증
		if (!name || !email || !password) {
			return json({ error: '모든 필드를 입력해주세요.' }, { status: 400 });
		}

		if (password.length < 4) {
			return json({ error: '비밀번호는 최소 4자 이상이어야 합니다.' }, { status: 400 });
		}

		// 이메일 중복 확인
		const { data: existingUser } = await supabase
			.from('users')
			.select('id')
			.eq('email', email)
			.single();

		if (existingUser) {
			return json({ error: '이미 등록된 이메일입니다.' }, { status: 400 });
		}

		// 비밀번호 해싱
		const hashedPassword = await bcrypt.hash(password, 10);

		// 사용자 생성
		const { data, error } = await supabase
			.from('users')
			.insert([{ name, email, password: hashedPassword }])
			.select('id, name, email, created_at')
			.single();

		if (error) {
			console.error('Supabase error:', error);
			
			// RLS 정책 오류인 경우
			if (error.code === '42501' || error.message?.includes('row-level security')) {
				return json({ 
					error: '데이터베이스 보안 정책 오류입니다.',
					details: error.message,
					code: error.code,
					solution: 'Supabase Dashboard에서 RLS 정책을 설정해주세요. fix_rls_policies.sql 파일을 참고하세요.'
				}, { status: 500 });
			}
			
			return json({ 
				error: '회원가입 중 오류가 발생했습니다.',
				details: error.message,
				code: error.code
			}, { status: 500 });
		}

		return json({ 
			success: true, 
			user: data,
			message: '회원가입이 완료되었습니다!' 
		});
	} catch (error) {
		console.error('Server error:', error);
		return json({ error: error.message }, { status: 500 });
	}
}

