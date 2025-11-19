import { json } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';

/** @type {import('./$types').RequestHandler} */
export async function POST({ request }) {
    try {
        console.log('📥 요약 API 요청 받음');
        
        const body = await request.json();
        console.log('📦 요청 본문:', { messageCount: body.messages?.length });
        
        const { messages } = body;

        if (!messages || messages.length === 0) {
            console.error('❌ 메시지가 없음');
            return json({ error: '대화 내용이 없습니다.' }, { status: 400 });
        }

        // 최소 메시지 수 체크 (너무 짧은 대화는 요약 불가)
        if (messages.length < 4) {
            console.warn('⚠️ 대화가 너무 짧음 (최소 4개 메시지 필요):', messages.length);
            return json({ 
                error: '대화가 너무 짧아 요약할 수 없습니다. 최소 2번 이상의 대화가 필요합니다.' 
            }, { status: 400 });
        }

        const apiKey = env.OPENAI_API_KEY;
        if (!apiKey) {
            console.error('❌ OpenAI API 키가 설정되지 않음');
            return json({ error: 'OpenAI API key not configured' }, { status: 500 });
        }

        // 대화 내용을 텍스트로 변환
        const conversationText = messages
            .map(msg => `${msg.role === 'user' ? '사용자' : 'ChatGPT'}: ${msg.content}`)
            .join('\n\n');

        console.log('✅ 대화 요약 생성 중... 메시지 수:', messages.length);
        console.log('📝 대화 텍스트 길이:', conversationText.length);

        // 대화 길이에 따른 최소 텍스트 길이 체크
        if (conversationText.length < 100) {
            console.warn('⚠️ 대화 내용이 너무 짧음:', conversationText.length, '자');
            return json({ 
                error: '대화 내용이 너무 짧아 요약할 수 없습니다. 더 많은 대화를 나눈 후 시도해주세요.' 
            }, { status: 400 });
        }

        const summaryPrompt = `You are an AI assistant specialized in summarizing conversations between a user and ChatGPT.

Your task is to read the entire conversation provided below and generate a structured summary in **Korean**.

**IMPORTANT**: Even if the conversation is short or covers only one topic, you MUST generate a complete summary following all six sections. Do NOT refuse or say the conversation is incomplete.

Follow these rules strictly:

[Summary Structure]

Produce the summary in the following six sections, written in Korean:

#### 1) 대화 주제 개요
- Describe what topics appeared in the conversation (even if it's just one topic)

#### 2) 주요 요청 & 작업들
- Summarize the key tasks, questions, and instructions the user asked for
- If none, write "특별한 요청이나 작업 없음"

#### 3) 생성된 문서 / 코드 / 템플릿 / 산출물
- Describe what outputs the assistant produced
- If none, write "특별한 산출물 없음"

#### 4) 의사결정 및 합의된 방향
- Extract any decisions or agreements made
- If none, write "특별한 의사결정 없음"

#### 5) 미해결 사항 / Follow-up 필요 항목
- List any pending tasks or next steps
- If none, write "미해결 사항 없음"

#### 6) 사용자 성향 / 패턴
- Describe user preferences or patterns observed
- If not enough data, write "추가 관찰 필요"

[Formatting Rules]

- Write the final summary **only in Korean**
- Use clear Markdown formatting (#### headers, bullet points)
- Be concise but complete for each section
- Do NOT refuse to summarize or say the input is incomplete
- If a section has no content, explicitly state so rather than omitting it

[Input Conversation]

${conversationText}

Generate the structured summary in Korean following ALL six sections above.`;

        // OpenAI API로 요약 생성 요청
        console.log('🤖 OpenAI API 호출 시작...');
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: 'gpt-4o',
                messages: [
                    {
                        role: 'user',
                        content: summaryPrompt
                    }
                ],
                temperature: 0.3,
                max_tokens: 2000
            })
        });

        console.log('📡 OpenAI API 응답 상태:', response.status);

        if (!response.ok) {
            const error = await response.text();
            console.error('❌ OpenAI API 오류:', error);
            return json({ error: `OpenAI API 오류: ${error}` }, { status: response.status });
        }

        const data = await response.json();
        console.log('📦 OpenAI 응답 데이터:', { hasChoices: !!data.choices, choicesLength: data.choices?.length });
        
        if (!data.choices || data.choices.length === 0) {
            console.error('❌ OpenAI 응답에 choices가 없음');
            return json({ error: 'OpenAI 응답이 비어있습니다.' }, { status: 500 });
        }
        
        const summary = data.choices[0].message.content.trim();
        console.log('✅ 대화 요약 생성 완료, 길이:', summary.length);

        return json({ 
            success: true, 
            summary 
        });

    } catch (err) {
        console.error('❌ POST /api/conversations/summarize-conversation error:', err);
        console.error('❌ Error stack:', err.stack);
        return json({ error: err.message || '서버 오류가 발생했습니다.' }, { status: 500 });
    }
}

