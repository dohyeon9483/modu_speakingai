import { json } from '@sveltejs/kit';
import { supabase, testConnection } from '$lib/supabaseClient.js';
import { env } from '$env/dynamic/private';

/** @type {import('./$types').RequestHandler} */
export async function GET() {
	try {
		const results = {
			env: {
				hasUrl: !!env.SUPABASE_DB_URL,
				hasKey: !!env.SUPABASE_DB_PUBLIC_KEY,
				urlPreview: env.SUPABASE_DB_URL ? `${env.SUPABASE_DB_URL.substring(0, 30)}...` : '없음',
				keyPreview: env.SUPABASE_DB_PUBLIC_KEY ? `${env.SUPABASE_DB_PUBLIC_KEY.substring(0, 30)}...` : '없음'
			},
			connection: null,
			tableCheck: null
		};

		// 연결 테스트
		const connectionTest = await testConnection();
		results.connection = connectionTest;

		// users 테이블 존재 확인
		try {
			const { data, error } = await supabase
				.from('users')
				.select('count')
				.limit(1);

			results.tableCheck = {
				success: !error,
				error: error ? {
					message: error.message,
					code: error.code,
					details: error.details
				} : null,
				hasData: !!data
			};
		} catch (err) {
			results.tableCheck = {
				success: false,
				error: {
					message: err.message,
					stack: err.stack
				}
			};
		}

		return json({
			success: results.connection.success && results.tableCheck.success,
			results
		});

	} catch (error) {
		console.error('연결 테스트 오류:', error);
		return json({
			success: false,
			error: error.message,
			stack: error.stack
		}, { status: 500 });
	}
}



