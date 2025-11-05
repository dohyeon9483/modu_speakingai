import { json } from '@sveltejs/kit';
import { OPENAI_API_KEY } from '$env/static/private';

/** @type {import('./$types').RequestHandler} */
export async function POST({ request }) {
	try {
		if (!OPENAI_API_KEY) {
			return json({ error: 'OpenAI API key not configured. Please create a .env file with OPENAI_API_KEY=your_key' }, { status: 500 });
		}

		// Ephemeral client secret 생성 (초 저지연 WebRTC 연결용)
		const sessionConfig = {
			session: {
				type: 'realtime',
				model: 'gpt-realtime',
				audio: {
					output: {
						voice: 'alloy' // alloy, echo, fable, onyx, nova, shimmer 중 선택
					}
				},
				instructions: 'You are a helpful and friendly assistant. You MUST speak ONLY in Korean. Always respond in Korean language. Never use English or any other language. Speak naturally and conversationally. Keep responses concise and engaging. 모든 대화는 반드시 한국어로만 진행합니다.'
			}
		};

		const response = await fetch('https://api.openai.com/v1/realtime/client_secrets', {
			method: 'POST',
			headers: {
				Authorization: `Bearer ${OPENAI_API_KEY}`,
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

