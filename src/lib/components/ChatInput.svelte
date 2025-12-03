<script>
    import { realtimeStore } from '$lib/stores/realtimeStore.js';
    import { sendTextMessage } from '$lib/realtime.js';
    import PaymentButton from '$lib/components/PaymentButton.svelte';

    const isConnected = $derived($realtimeStore.isConnected);
    const chatMode = $derived($realtimeStore.chatMode || 'voice');
    const session = $derived($realtimeStore.session);
    const selectedStyle = $derived($realtimeStore.selectedConversationStyle);
    let messageText = $state('');
    let isSending = $state(false);
    let creditError = $state(null);
    let creditsBalance = $state(0);

    async function loadCredits() {
        try {
            const response = await fetch('/api/credits/balance');
            if (response.ok) {
                const data = await response.json();
                creditsBalance = data.credits || 0;
            }
        } catch (err) {
            console.error('크레딧 조회 오류:', err);
        }
    }

    async function handleSend() {
        if (!messageText.trim() || isSending) {
            return;
        }

        // 음성 모드에서는 연결이 필요하지만, 텍스트 모드에서는 연결 불필요
        if (chatMode === 'voice' && (!isConnected || !session)) {
            return;
        }

        creditError = null;
        const textToSend = messageText.trim();
        
        // 텍스트 모드에서 대화가 없으면 생성
        if (chatMode === 'text' && !session?.id) {
            if (typeof globalThis.ensureConversation === 'function') {
                await globalThis.ensureConversation(textToSend);
            }
        }

        messageText = '';
        isSending = true;

        try {
            if (chatMode === 'text') {
                // 텍스트 모드: 먼저 메시지 저장 (크레딧 차감)
                await saveMessageToDB('user', textToSend);
                
                // 크레딧 부족으로 실패한 경우
                if (creditError) {
                    // UI에 추가하지 않고 에러만 표시
                    return;
                }
            }

            // 메시지를 UI에 추가
            realtimeStore.addMessage({
                id: `msg-${Date.now()}-${Math.random()}`,
                role: 'user',
                content: textToSend,
                timestamp: new Date().toISOString()
            });

            if (chatMode === 'voice') {
                // 음성 모드: Realtime API 사용
                await sendTextMessage(session, textToSend);
            } else {
                // 텍스트 모드: Chat API 사용
                await sendChatMessage(textToSend);
            }
            
            // 성공 시 크레딧 잔액 갱신
            await loadCredits();
        } catch (error) {
            console.error('메시지 전송 오류:', error);
            
            // 크레딧 부족 에러 처리
            if (error.message && error.message.includes('크레딧')) {
                try {
                    const errorData = JSON.parse(error.message);
                    if (errorData.currentBalance !== undefined) {
                        creditError = {
                            currentBalance: errorData.currentBalance,
                            required: errorData.required || 0.5
                        };
                        creditsBalance = errorData.currentBalance;
                    }
                } catch (e) {
                    // JSON 파싱 실패 시 일반 에러 처리
                }
            }
            
            // 크레딧 부족이 아닌 경우에만 일반 에러 메시지 표시
            if (!creditError) {
                realtimeStore.updateStatus({
                    errorMessage: '메시지 전송에 실패했습니다: ' + error.message
                });
            }
        } finally {
            isSending = false;
        }
    }
    
    // 컴포넌트 마운트 시 크레딧 로드
    import { onMount } from 'svelte';
    onMount(() => {
        loadCredits();
    });

    async function saveMessageToDB(role, content) {
        if (!session?.id) return;

        try {
            const response = await fetch('/api/conversations/save-item', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    conversationId: session.id,
                    role,
                    content
                })
            });

            if (!response.ok) {
                const error = await response.json();
                // 크레딧 부족 에러 처리
                if (response.status === 402 && error.currentBalance !== undefined) {
                    creditError = {
                        currentBalance: error.currentBalance,
                        required: error.required || 0.5
                    };
                    creditsBalance = error.currentBalance;
                    throw new Error(JSON.stringify(error));
                }
                throw new Error(error.error || '메시지 저장에 실패했습니다.');
            }
        } catch (error) {
            console.error('메시지 저장 오류:', error);
            // 크레딧 부족이 아닌 경우에만 에러를 다시 throw
            if (!creditError) {
                throw error;
            }
        }
    }

    async function sendChatMessage(text) {
        // 사용자 메시지는 이미 saveMessageToDB에서 저장됨 (텍스트 모드)

        // 현재 메시지 히스토리 가져오기
        const messages = $realtimeStore.messages || [];
        
        // Chat API에 전송할 메시지 형식으로 변환
        const chatMessages = messages
            .filter(msg => msg.role === 'user' || msg.role === 'assistant')
            .map(msg => ({
                role: msg.role,
                content: msg.content
            }));

        const response = await fetch('/api/chat', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                messages: chatMessages,
                conversationStyle: selectedStyle
            })
        });

        if (!response.ok) {
            const error = await response.json();
            // 크레딧 부족 에러 처리
            if (response.status === 402 && error.currentBalance !== undefined) {
                creditError = {
                    currentBalance: error.currentBalance,
                    required: error.required || 1.0
                };
                creditsBalance = error.currentBalance;
                throw new Error(JSON.stringify(error));
            }
            throw new Error(error.error || 'AI 응답 생성에 실패했습니다.');
        }

        const data = await response.json();
        
        // AI 응답을 메시지에 추가
        realtimeStore.addMessage({
            id: `msg-${Date.now()}-${Math.random()}`,
            role: 'assistant',
            content: data.message,
            timestamp: new Date().toISOString()
        });

        // AI 응답 저장
        saveMessageToDB('assistant', data.message);
    }

    function handleKeyPress(event) {
        if (event.key === 'Enter' && !event.shiftKey) {
            event.preventDefault();
            handleSend();
        }
    }
</script>

<div class="border-t border-gray-200 bg-white p-4">
    {#if creditError}
        <PaymentButton 
            credits={creditError.currentBalance} 
            required={creditError.required}
        />
    {/if}
    
    <div class="flex items-end gap-2">
        <div class="flex-1 relative">
            <textarea
                bind:value={messageText}
                onkeydown={handleKeyPress}
                placeholder={chatMode === 'voice' 
                    ? (isConnected ? "메시지를 입력하세요... (Enter로 전송)" : "연결 후 메시지를 보낼 수 있습니다")
                    : "메시지를 입력하세요... (Enter로 전송)"}
                disabled={(chatMode === 'voice' && !isConnected) || isSending}
                rows="1"
                class="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none disabled:bg-gray-100 disabled:cursor-not-allowed text-sm"
                oninput={(e) => {
                    e.target.style.height = 'auto';
                    e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px';
                }}
            ></textarea>
        </div>
        <button
            onclick={handleSend}
            disabled={(chatMode === 'voice' && !isConnected) || !messageText.trim() || isSending}
            class="px-6 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-lg font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed hover:from-blue-600 hover:to-indigo-700 active:scale-95 flex items-center gap-2 shadow-md hover:shadow-lg"
        >
            {#if isSending}
                <span class="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                <span>전송 중...</span>
            {:else}
                <span>📤</span>
                <span>전송</span>
            {/if}
        </button>
    </div>
    <p class="text-xs text-gray-500 mt-2">
        {#if chatMode === 'voice'}
            💡 음성 모드: 연결 후 음성 또는 텍스트로 대화할 수 있어요
        {:else}
            💡 텍스트 모드: 채팅 방식으로 대화합니다
        {/if}
    </p>
</div>

