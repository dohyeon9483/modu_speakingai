import { json } from '@sveltejs/kit';
import { supabase } from '$lib/supabaseClient.js';

// GET: 모든 사용자 조회 (비밀번호 포함)
export async function GET() {
	try {
		const { data, error } = await supabase
			.from('users')
			.select('id, name, email, password, created_at, updated_at')
			.order('created_at', { ascending: false });

		if (error) {
			console.error('Supabase error:', error);
			return json({ error: error.message }, { status: 500 });
		}

		return json({ users: data });
	} catch (error) {
		console.error('Server error:', error);
		return json({ error: error.message }, { status: 500 });
	}
}

// POST: 새 사용자 추가
export async function POST({ request }) {
	try {
		const { name, email } = await request.json();

		if (!name || !email) {
			return json({ error: '이름과 이메일은 필수입니다.' }, { status: 400 });
		}

		const { data, error } = await supabase
			.from('users')
			.insert([{ name, email }])
			.select();

		if (error) {
			console.error('Supabase error:', error);
			return json({ error: error.message }, { status: 500 });
		}

		return json({ user: data[0] });
	} catch (error) {
		console.error('Server error:', error);
		return json({ error: error.message }, { status: 500 });
	}
}

// DELETE: 사용자 삭제
export async function DELETE({ request }) {
	try {
		const { id } = await request.json();

		if (!id) {
			return json({ error: 'ID는 필수입니다.' }, { status: 400 });
		}

		const { error } = await supabase.from('users').delete().eq('id', id);

		if (error) {
			console.error('Supabase error:', error);
			return json({ error: error.message }, { status: 500 });
		}

		return json({ success: true });
	} catch (error) {
		console.error('Server error:', error);
		return json({ error: error.message }, { status: 500 });
	}
}

