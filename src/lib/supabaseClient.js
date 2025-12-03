import { createClient } from '@supabase/supabase-js';
import { env } from '$env/dynamic/private';

const supabaseUrl = env.SUPABASE_DB_URL;
const supabaseKey = env.SUPABASE_DB_PUBLIC_KEY;

if (!supabaseUrl || !supabaseKey) {
	console.error('❌ Supabase 환경 변수 누락:');
	console.error('SUPABASE_DB_URL:', supabaseUrl ? '설정됨' : '❌ 없음');
	console.error('SUPABASE_DB_PUBLIC_KEY:', supabaseKey ? '설정됨' : '❌ 없음');
	throw new Error(
		'SUPABASE_DB_URL and SUPABASE_DB_PUBLIC_KEY must be set in .env file.\n' +
		'Example:\n' +
		'SUPABASE_DB_URL=https://xxxxx.supabase.co\n' +
		'SUPABASE_DB_PUBLIC_KEY=eyJhbGc...'
	);
}

console.log('✅ Supabase 클라이언트 초기화:', {
	url: supabaseUrl ? `${supabaseUrl.substring(0, 20)}...` : '없음',
	key: supabaseKey ? `${supabaseKey.substring(0, 20)}...` : '없음'
});

export const supabase = createClient(supabaseUrl, supabaseKey);
export const supabaseClient = supabase; // 별칭 추가

// 연결 테스트 함수
export async function testConnection() {
	try {
		const { data, error } = await supabase.from('users').select('count').limit(1);
		if (error) {
			console.error('❌ Supabase 연결 테스트 실패:', error);
			return { success: false, error };
		}
		console.log('✅ Supabase 연결 성공');
		return { success: true, data };
	} catch (err) {
		console.error('❌ Supabase 연결 테스트 예외:', err);
		return { success: false, error: err };
	}
}

