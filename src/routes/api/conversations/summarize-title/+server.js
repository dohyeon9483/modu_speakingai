import { json } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';

/** @type {import('./$types').RequestHandler} */
export async function POST({ request, locals }) {
	try {
		// 사용자 인증 확인
		if (!locals.user) {
			return json({ error: '인증이 필요합니다.' }, { status: 401 });
		}

		const { messages } = await request.json();

		if (!messages || messages.length === 0) {
			return json({ error: '대화 내용이 필요합니다.' }, { status: 400 });
		}

		const apiKey = env.OPENAI_API_KEY;
		if (!apiKey) {
			return json({ error: 'OpenAI API key not configured' }, { status: 500 });
		}

		// 대화 내용을 텍스트로 변환 (최대 15개 메시지 사용)
		const conversationText = messages
			.slice(0, 15)
			.map(msg => `${msg.role === 'user' ? '사용자' : 'AI'}: ${msg.content}`)
			.join('\n');

		console.log('대화 내용 (제목 생성용):', conversationText);

		// OpenAI API로 제목 생성 요청
		const response = await fetch('https://api.openai.com/v1/chat/completions', {
			method: 'POST',
			headers: {
				'Authorization': `Bearer ${apiKey}`,
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({
				model: 'gpt-3.5-turbo',
				messages: [
					{
						role: 'system',
						content: '당신은 대화 내용을 분석하여 간결하고 명확한 제목을 만드는 전문가입니다. 제목은 반드시 한국어로 작성하며, 10-20자 이내로 대화의 핵심 주제를 담아야 합니다. 제목만 출력하고 따옴표나 다른 설명은 절대 포함하지 마세요.'
					},
					{
						role: 'user',
						content: `다음 대화의 핵심 주제를 파악하여 간결한 제목을 만들어주세요:\n\n${conversationText}\n\n제목:`
					}
				],
				max_tokens: 30,
				temperature: 0.5
			})
		});

		if (!response.ok) {
			const error = await response.text();
			console.error('OpenAI API error:', error);
			
			// 폴백: 첫 번째 사용자 메시지의 앞부분 사용
			const firstUserMessage = messages.find(m => m.role === 'user');
			if (firstUserMessage) {
				const fallbackTitle = firstUserMessage.content.substring(0, 20).trim();
				console.log('폴백 제목 사용:', fallbackTitle);
				return json({ 
					success: true, 
					title: fallbackTitle 
				});
			}
			
			return json({ error: 'Failed to generate title' }, { status: response.status });
		}

		const data = await response.json();
		let title = data.choices[0].message.content.trim();
		
		// 따옴표 제거
		title = title.replace(/^["']|["']$/g, '');
		
		// 너무 긴 제목은 자르기
		if (title.length > 30) {
			title = title.substring(0, 30).trim();
		}
		
		console.log('생성된 제목:', title);

		return json({ 
			success: true, 
			title 
		});

	} catch (error) {
		console.error('Summarize title error:', error);
		return json({ error: error.message || 'Internal server error' }, { status: 500 });
	}
}

