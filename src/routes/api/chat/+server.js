import { json } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';

/** @type {import('./$types').RequestHandler} */
export async function POST({ request, locals }) {
	try {
		// 사용자 인증 확인
		if (!locals.user) {
			return json({ error: '인증이 필요합니다.' }, { status: 401 });
		}

		const apiKey = env.OPENAI_API_KEY;

		if (!apiKey) {
			return json({ error: 'OpenAI API key not configured' }, { status: 500 });
		}

		const body = await request.json();
		const { messages, conversationStyle } = body;

		if (!messages || !Array.isArray(messages) || messages.length === 0) {
			return json({ error: '메시지가 필요합니다.' }, { status: 400 });
		}

		// 프롬프트 준비 (대화 스타일에 따라)
		let systemPrompt = "You are a helpful and friendly assistant. You MUST speak ONLY in Korean. Always respond in Korean language. Never use English or any other language. Speak naturally and conversationally. Keep responses concise and engaging.";
		
		// 대화 스타일이 있으면 프롬프트에 추가
		if (conversationStyle) {
			const { CONVERSATION_STYLES, DEFAULT_PROMPT } = await import('$lib/conversationStyles.js');
			const style = CONVERSATION_STYLES[conversationStyle];
			if (style && style.prompt) {
				systemPrompt = style.prompt;
			} else {
				systemPrompt = DEFAULT_PROMPT;
			}
		} else {
			const { DEFAULT_PROMPT } = await import('$lib/conversationStyles.js');
			systemPrompt = DEFAULT_PROMPT;
		}

		// OpenAI Chat API 호출
		const response = await fetch('https://api.openai.com/v1/chat/completions', {
			method: 'POST',
			headers: {
				'Authorization': `Bearer ${apiKey}`,
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({
				model: 'gpt-4o-mini',
				messages: [
					{ role: 'system', content: systemPrompt },
					...messages.map(msg => ({
						role: msg.role,
						content: msg.content
					}))
				],
				temperature: 0.7,
				max_tokens: 1000
			})
		});

		if (!response.ok) {
			const error = await response.text();
			console.error('OpenAI Chat API error:', error);
			return json({ error: 'AI 응답 생성에 실패했습니다.' }, { status: response.status });
		}

		const data = await response.json();
		const aiMessage = data.choices[0]?.message?.content || '';

		return json({
			success: true,
			message: aiMessage
		});

	} catch (error) {
		console.error('POST /api/chat error:', error);
		return json({ error: error.message || '서버 오류가 발생했습니다.' }, { status: 500 });
	}
}

