import { json } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';

/** @type {import('./$types').RequestHandler} */
export async function POST({ request }) {
	try {
		const apiKey = env.OPENAI_API_KEY;

		if (!apiKey) {
			return json({ error: 'OpenAI API key not configured. Please create a .env file with OPENAI_API_KEY=your_key' }, { status: 500 });
		}

		// 요청에서 프롬프트 가져오기 (선택 사항)
		const body = await request.json().catch(() => ({}));
		const instructions = body.instructions || null;

		// Ephemeral client secret 생성 (WebRTC 연결용)
		// WebRTC 방식에서는 세션 설정을 client_secret 생성 시 포함합니다.
		// 주의: output_modalities는 ['text'] 또는 ['audio']만 지원됩니다.
		// 텍스트 응답이 필요하면 response.create 요청에서 별도로 지정해야 합니다.
		const sessionConfig = {
			session: {
				type: 'realtime',
				model: 'gpt-realtime',
				output_modalities: ['audio'], // 기본은 오디오, 텍스트는 response.create에서 요청
				audio: {
					output: {
						voice: 'alloy' // alloy, echo, fable, onyx, nova, shimmer 중 선택
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
			return json({ error: 'Failed to create client secret' }, { status: response.status });
		}

		const data = await response.json();
		return json({ clientSecret: data.value });
	} catch (error) {
		console.error('Server error:', error);
		return json({ error: error.message || 'Internal server error' }, { status: 500 });
	}
}

