import { json } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(env.SUPABASE_DB_URL, env.SUPABASE_DB_PUBLIC_KEY);

/** @type {import('./$types').RequestHandler} */
export async function POST({ request, locals }) {
	try {
		const apiKey = env.OPENAI_API_KEY;

		if (!apiKey) {
			return json({ error: 'OpenAI API key not configured. Please create a .env file with OPENAI_API_KEY=your_key' }, { status: 500 });
		}

	// 요청에서 프롬프트 가져오기 (선택 사항)
	const body = await request.json().catch(() => ({}));
	let instructions = body.instructions || null;

	// 사용자 프로필 가져오기 (로그인된 경우)
	if (locals.user) {
		try {
			const { data: profile, error } = await supabase
				.from('users')
				.select('age, gender, personality, occupation, characteristics')
				.eq('id', locals.user.id)
				.single();

			if (!error && profile) {
				const profileParts = [];
				if (profile.age) profileParts.push(`나이: ${profile.age}세`);
				if (profile.gender) profileParts.push(`성별: ${profile.gender}`);
				if (profile.occupation) profileParts.push(`직업: ${profile.occupation}`);
				if (profile.personality) profileParts.push(`성격: ${profile.personality}`);
				if (profile.characteristics) profileParts.push(`특징/관심사: ${profile.characteristics}`);

				if (profileParts.length > 0) {
					const userProfileContext = `\n\n[사용자 정보]\n${profileParts.join('\n')}\n위 정보를 참고하여 사용자에게 맞춤형 대화를 제공하세요.`;
					instructions = instructions ? (instructions + userProfileContext) : userProfileContext;
				}
			}
		} catch (error) {
			console.error('프로필 조회 오류:', error);
			// 프로필 조회 실패해도 대화는 계속 진행
		}
	}

	// Ephemeral client secret 생성 (WebRTC 연결용)
	const sessionConfig = {
		session: {
			type: 'realtime',
			model: 'gpt-realtime',
			output_modalities: ['audio'],
			audio: {
				output: {
					voice: 'alloy'
				}
			}
		}
	};

	// 프롬프트가 제공된 경우 세션 설정에 포함
	if (instructions) {
		sessionConfig.session.instructions = instructions;
	}

	const response = await fetch('https://api.openai.com/v1/realtime/client_secrets', {
		method: 'POST',
		headers: {
			Authorization: `Bearer ${apiKey}`,
			'Content-Type': 'application/json'
		},
		body: JSON.stringify(sessionConfig)
	});

	if (!response.ok) {
		const error = await response.text();
		console.error('OpenAI API error:', error);
		return json({ 
			error: 'Failed to create client secret', 
			details: error
		}, { status: response.status });
	}

		const data = await response.json();
		return json({ clientSecret: data.value });
	} catch (error) {
		console.error('Server error:', error);
		return json({ error: error.message || 'Internal server error' }, { status: 500 });
	}
}

