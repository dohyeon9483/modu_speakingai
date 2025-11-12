import { writable } from 'svelte/store';

function createRealtimeStore() {
    const initialState = {
        session: null,
        isConnected: false,
        status: 'disconnected',
        isListening: false,
        isSpeaking: false,
        conversationText: '',
        errorMessage: '',
        isButtonDisabled: false,
        selectedConversationStyle: null // 선택된 대화 스타일 ID (null = 기본)
    };

    const { subscribe, set, update } = writable(initialState);

    return {
        subscribe,
        updateStatus: (updates) => {
            update(state => {
                const newState = { ...state };

                // 명시적 상태 업데이트
                if (updates.status !== undefined) {
                    newState.status = updates.status;
                    // status에 따른 isConnected 자동 업데이트
                    if (['connected', 'speaking', 'listening'].includes(updates.status)) {
                        newState.isConnected = true;
                    } else if (updates.status === 'disconnected') {
                        newState.isConnected = false;
                    }
                }

                // 다른 상태들 업데이트
                if (updates.isConnected !== undefined) newState.isConnected = updates.isConnected;
                if (updates.isListening !== undefined) newState.isListening = updates.isListening;
                if (updates.isSpeaking !== undefined) newState.isSpeaking = updates.isSpeaking;
                if (updates.conversationText !== undefined) newState.conversationText = updates.conversationText;
                if (updates.error !== undefined) newState.errorMessage = updates.error;
                if (updates.isButtonDisabled !== undefined) newState.isButtonDisabled = updates.isButtonDisabled;
                if (updates.selectedConversationStyle !== undefined) newState.selectedConversationStyle = updates.selectedConversationStyle;

                return newState;
            });
        },
        setSession: (session) => {
            update(state => ({ ...state, session }));
        },
        setButtonDisabled: (disabled) => {
            update(state => ({ ...state, isButtonDisabled: disabled }));
        },
        setConversationStyle: (styleId) => {
            update(state => ({ ...state, selectedConversationStyle: styleId }));
        },
        reset: () => {
            set(initialState);
        }
    };
}

export const realtimeStore = createRealtimeStore();