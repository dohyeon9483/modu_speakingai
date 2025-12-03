import { json } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(env.SUPABASE_DB_URL, env.SUPABASE_DB_PUBLIC_KEY);

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

		// 사용자 프로필 가져오기
		let userProfileContext = '';
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
					userProfileContext = `\n\n[사용자 정보]\n${profileParts.join('\n')}\n위 정보를 참고하여 사용자에게 맞춤형 대화를 제공하세요.`;
				}
			}
		} catch (error) {
			console.error('프로필 조회 오류:', error);
			// 프로필 조회 실패해도 대화는 계속 진행
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

		// 사용자 프로필 정보를 시스템 프롬프트에 추가
		systemPrompt += userProfileContext;

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
		
		// 토큰 사용량 계산
		const inputTokens = data.usage?.prompt_tokens || 0;
		const outputTokens = data.usage?.completion_tokens || 0;
		const totalTokens = data.usage?.total_tokens || 0;

		// AI 응답에 대한 크레딧 차감
		const { calculateCreditsFromTokens, deductCredits } = await import('$lib/credits.js');
		const creditAmount = calculateCreditsFromTokens(inputTokens, outputTokens);
		
		// conversationId가 있으면 크레딧 차감
		const { conversationId } = body;
		if (conversationId && locals.user) {
			const deductResult = await deductCredits(locals.user.id, creditAmount, {
				conversationId: conversationId,
				type: 'ai_response',
				tokensUsed: totalTokens,
				description: `AI 응답 생성: ${creditAmount} 크레딧 차감 (입력: ${inputTokens} tokens, 출력: ${outputTokens} tokens)`
			});

			if (!deductResult.success) {
				if (deductResult.error === '크레딧이 부족합니다.') {
					return json({
						success: false,
						error: '크레딧이 부족합니다.',
						currentBalance: deductResult.currentBalance,
						required: deductResult.required
					}, { status: 402 });
				}
				console.error('크레딧 차감 실패:', deductResult.error);
				// 크레딧 차감 실패해도 응답은 반환 (경고만)
			}
		}

		return json({
			success: true,
			message: aiMessage,
			usage: {
				inputTokens,
				outputTokens,
				totalTokens
			},
			creditsDeducted: creditAmount
		});

	} catch (error) {
		console.error('POST /api/chat error:', error);
		return json({ error: error.message || '서버 오류가 발생했습니다.' }, { status: 500 });
	}
}

