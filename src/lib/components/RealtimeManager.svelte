<script>
    import { onMount } from 'svelte';
    import { get } from 'svelte/store';
    import { connectRealtime, disconnectRealtime } from '$lib/realtime.js';
    import { realtimeStore } from '$lib/stores/realtimeStore.js';
    import { CONVERSATION_STYLES } from '$lib/conversationStyles.js';
    
    export let onError = () => {};

    let state = {
        session: null,
        isConnected: false,
        status: 'disconnected',
        conversationText: '',
        transcriptBuffer: ''
    };

    async function handleRealtimeConnect() {
        // chatMode가 'voice'가 아니면 연결하지 않음
        const storeState = get(realtimeStore);
        if (storeState.chatMode !== 'voice') {
            console.log('텍스트 모드에서는 Realtime 연결을 건너뜁니다.');
            return;
        }
        
        try {
            // 상태 초기화
            realtimeStore.updateStatus({
                status: 'connecting',
                isConnected: false,
                isListening: false,
                isSpeaking: false,
                errorMessage: ''
            });

            // 선택된 대화 스타일 가져오기 (함수 호출 시점의 최신 값)
            const storeSnapshot = get(realtimeStore);
            const selectedStyleId = storeSnapshot.selectedConversationStyle;
            
            // 디버깅: 연결 시점의 스타일 확인
            console.group('🔌 Realtime 연결 시작');
            console.log('📋 현재 스토어 상태:', {
                selectedConversationStyle: selectedStyleId,
                isConnected: storeSnapshot.isConnected,
                status: storeSnapshot.status
            });
            console.log('🎨 선택된 대화 스타일 ID:', selectedStyleId || 'null (기본 프롬프트 사용)');
            if (selectedStyleId) {
                const style = CONVERSATION_STYLES[selectedStyleId];
                if (style) {
                    console.log('✅ 스타일 정보:', {
                        id: selectedStyleId,
                        label: style.label,
                        emoji: style.emoji
                    });
                } else {
                    console.warn('⚠️ 알 수 없는 스타일 ID:', selectedStyleId);
                }
            } else {
                console.log('ℹ️ 기본 프롬프트가 사용됩니다.');
            }
            console.groupEnd();

            await connectRealtime(
                state,
                (message) => { 
                    console.error('연결 오류:', message);
                    realtimeStore.updateStatus({
                        status: 'disconnected',
                        isConnected: false,
                        isListening: false,
                        isSpeaking: false,
                        error: message
                    });
                },
                () => {}, // onEvent
                (updates) => {
                    // 상태가 connected로 변경될 때 isConnected도 함께 업데이트
                    if (updates.status === 'connected') {
                        updates.isConnected = true;
                        updates.isListening = true;
                        updates.isSpeaking = false;
                    } else if (updates.status === 'disconnected') {
                        updates.isConnected = false;
                        updates.isListening = false;
                        updates.isSpeaking = false;
                    }
                    realtimeStore.updateStatus(updates);
                },
                selectedStyleId // 선택된 스타일 ID 전달
            );

            // 연결 상태 확인 (세션은 connectRealtime 내부에서 저장됨)
            const connected = state.session?.dataChannel?.readyState === 'open';
            
            if (connected) {
                realtimeStore.updateStatus({
                    status: 'connected',
                    isConnected: true,
                    isListening: true,
                    isSpeaking: false,
                    errorMessage: ''
                });
            }
            realtimeStore.updateStatus({
                status: 'connected',
                isConnected: true,
                isListening: true,
                isSpeaking: false
            });
        } catch (error) {
            console.error('연결 실패:', error);
            realtimeStore.updateStatus({
                status: 'disconnected',
                isConnected: false,
                isListening: false,
                isSpeaking: false,
                error: error.message || '연결에 실패했습니다.'
            });
            onError(error);
        }
    }

    async function handleRealtimeDisconnect() {
        try {
            // 먼저 상태를 업데이트하여 UI 즉시 반영
            realtimeStore.updateStatus({
                status: 'disconnected',
                isConnected: false,
                isListening: false,
                isSpeaking: false
            });

            // 실제 연결 해제 처리
            await disconnectRealtime(state, (updates) => {
                realtimeStore.updateStatus(updates);
            });

            // 모든 상태 초기화 (메시지는 유지)
            state = {
                session: null,
                isConnected: false,
                status: 'disconnected',
                conversationText: '',
                transcriptBuffer: '',
                currentUserInput: '',
                currentAssistantResponse: ''
            };
            
            // 메시지는 유지하고 나머지만 초기화
            realtimeStore.updateStatus({
                status: 'disconnected',
                isConnected: false,
                isListening: false,
                isSpeaking: false,
                conversationText: '',
                errorMessage: ''
            });
        } catch (error) {
            console.error('연결 종료 오류:', error);
            realtimeStore.updateStatus({
                error: '연결 종료 중 오류가 발생했습니다.'
            });
        }
    }

    onMount(() => {
        return () => {
            if (state.session) {
                handleRealtimeDisconnect();
            }
        };
    });
</script>

<slot {handleRealtimeConnect} {handleRealtimeDisconnect} />