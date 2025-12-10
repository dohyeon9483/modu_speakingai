<script>
    import { goto } from '$app/navigation';
    import { onMount } from 'svelte';
    import { get } from 'svelte/store';
    import { realtimeStore } from '$lib/stores/realtimeStore.js';

    import RealtimeManager from '$lib/components/RealtimeManager.svelte';
    import ConversationStyleSelector from '$lib/components/ConversationStyleSelector.svelte';
    import MessageList from '$lib/components/MessageList.svelte';
    import ChatInput from '$lib/components/ChatInput.svelte';
    import DebugPanel from '$lib/components/DebugPanel.svelte';

    /** @type {import('./$types').PageData} */
    let { data } = $props();

    const errorMessage = $derived($realtimeStore.errorMessage);
    const isRealtimeConnected = $derived($realtimeStore.isConnected);
    const realtimeStatus = $derived($realtimeStore.status);
    
    let conversationId = $state(null);
    let conversations = $state([]);
    let isLoadingConversations = $state(false);
    let chatMode = $state('text'); // 'text' or 'voice'
    
    // 음성 대화 핸들러
    let handleConnect = $state(null);
    let handleDisconnect = $state(null);

    function handleLogout() {
        fetch('/api/auth/logout', { method: 'POST' })
            .then(() => goto('/login'))
            .catch((error) => console.error('로그아웃 오류:', error));
    }

    function goToMyPage() {
        goto('/mypage');
    }

    function onRealtimeError(error) {
        console.error('Realtime 오류:', error);
    }

    async function handleConnectWithSave() {
        // 이미 대화가 로드된 경우 새 대화를 만들지 않음
        if (!conversationId) {
            realtimeStore.clearMessages();

            try {
                const now = new Date();
                const dateStr = now.toLocaleDateString('ko-KR', { month: 'long', day: 'numeric' });
                const timeStr = now.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' });
                
                const response = await fetch('/api/conversations/create', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        title: `음성 대화 (${dateStr} ${timeStr})`
                    })
                });

                if (response.ok) {
                    const result = await response.json();
                    conversationId = result.data.id;
                    realtimeStore.setConversationId(conversationId);
                    console.log('✅ 새 대화 생성됨. ID:', conversationId);
                    await loadConversations();
                }
            } catch (error) {
                console.error('대화 생성 오류:', error);
            }
        } else {
            console.log('✅ 기존 대화 이어하기. ID:', conversationId);
        }

        if (handleConnect) {
            handleConnect();
        }
    }

    async function handleDisconnectWithSave() {
        if (handleDisconnect) {
            handleDisconnect();
        }

        if (conversationId) {
            try {
                const messages = $realtimeStore.messages || [];
                
                // 메시지가 하나도 없으면 대화 삭제
                if (messages.length === 0) {
                    console.log('🗑️ 빈 대화 감지 - 자동 삭제');
                    try {
                        await fetch(`/api/conversations/${conversationId}`, {
                            method: 'DELETE'
                        });
                        console.log('✅ 빈 대화 삭제 완료');
                    } catch (error) {
                        console.error('빈 대화 삭제 오류:', error);
                    }
                } else {
                    // 메시지가 있으면 제목 생성 및 종료 처리
                    let generatedTitle = null;
                    try {
                        const titleResponse = await fetch('/api/conversations/summarize-title', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ messages })
                        });

                        if (titleResponse.ok) {
                            const titleData = await titleResponse.json();
                            generatedTitle = titleData.title;
                            console.log('✅ AI가 생성한 제목:', generatedTitle);
                        }
                    } catch (error) {
                        console.error('제목 생성 오류:', error);
                    }

                    if (generatedTitle) {
                        await fetch(`/api/conversations/${conversationId}`, {
                            method: 'PATCH',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ 
                                action: 'update_title',
                                title: generatedTitle 
                            })
                        });
                    }

                    await fetch('/api/conversations/finalize', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ conversationId })
                    });
                }
            } catch (error) {
                console.error('대화 종료 오류:', error);
            }
        }

        conversationId = null;
        realtimeStore.setConversationId(null);
        await loadConversations();
    }

    async function loadConversations() {
        isLoadingConversations = true;
        try {
            const response = await fetch('/api/conversations/user');
            if (response.ok) {
                const result = await response.json();
                conversations = result.data || [];
            }
        } catch (error) {
            console.error('대화 목록 로드 오류:', error);
        } finally {
            isLoadingConversations = false;
        }
    }

    async function createConversation(firstMessage = '') {
        try {
            // 제목 생성: 첫 10문자 + 날짜 + 시간
            const messagePreview = firstMessage.slice(0, 10);
            const now = new Date();
            const date = now.toLocaleDateString('ko-KR', { 
                year: 'numeric', 
                month: '2-digit', 
                day: '2-digit' 
            }).replace(/\. /g, '-').replace('.', '');
            const time = now.toLocaleTimeString('ko-KR', { 
                hour: '2-digit', 
                minute: '2-digit',
                hour12: false
            });
            const title = messagePreview ? `${messagePreview} ${date} ${time}` : `새 대화 ${date} ${time}`;

            const response = await fetch('/api/conversations/create', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ title })
            });

            if (response.ok) {
                const result = await response.json();
                conversationId = result.data.id;
                realtimeStore.setSession({ id: conversationId });
                realtimeStore.clearMessages();
                await loadConversations(); // 목록 새로고침
            }
        } catch (error) {
            console.error('대화 생성 오류:', error);
        }
    }

    async function loadConversation(convId) {
        try {
            const response = await fetch(`/api/conversations/${convId}/items`);
            if (response.ok) {
                const result = await response.json();
                const { conversation, items } = result.data;
                
                conversationId = convId;
                realtimeStore.setSession({ id: convId });
                realtimeStore.clearMessages();
                
                // 메시지 복원
                items.forEach(item => {
                    realtimeStore.addMessage({
                        id: `msg-${item.id}`,
                        role: item.role,
                        content: item.content,
                        timestamp: item.created_at
                    });
                });

                // 종료된 대화면 재개
                if (conversation.status === 'completed') {
                    await fetch(`/api/conversations/${convId}`, {
                        method: 'PATCH',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ action: 'resume' })
                    });
                    await loadConversations(); // 목록 새로고침
                }
            }
        } catch (error) {
            console.error('대화 로드 오류:', error);
        }
    }

    async function finalizeConversation() {
        if (!conversationId) return;
        
        try {
            // 1. 대화 내용 가져오기
            const messages = $realtimeStore.messages || [];
            console.log('📝 저장된 메시지 개수:', messages.length);
            console.log('📝 메시지 내용:', messages);
            
            // 2. AI로 제목 생성 (메시지가 있는 경우에만)
            let generatedTitle = null;
            if (messages.length > 0) {
                try {
                    console.log('🤖 제목 생성 API 호출 중...');
                    const titleResponse = await fetch('/api/conversations/summarize-title', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ messages })
                    });

                    if (titleResponse.ok) {
                        const titleData = await titleResponse.json();
                        generatedTitle = titleData.title;
                        console.log('✅ AI가 생성한 제목:', generatedTitle);
                    } else {
                        console.error('❌ 제목 생성 실패:', await titleResponse.text());
                    }
                } catch (error) {
                    console.error('제목 생성 오류:', error);
                }
            } else {
                console.warn('⚠️ 저장된 메시지가 없어 제목을 생성하지 않습니다.');
            }

            // 3. 제목 업데이트 (생성된 제목이 있는 경우)
            if (generatedTitle) {
                try {
                    await fetch(`/api/conversations/${conversationId}`, {
                        method: 'PATCH',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ 
                            action: 'update_title',
                            title: generatedTitle 
                        })
                    });
                    console.log('✅ 대화 제목 업데이트됨:', generatedTitle);
                } catch (error) {
                    console.error('제목 업데이트 오류:', error);
                }
            }

            // 4. 대화 종료
            await fetch('/api/conversations/finalize', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ conversationId })
            });
            await loadConversations(); // 목록 새로고침
        } catch (error) {
            console.error('대화 종료 오류:', error);
        }
    }

    function downloadChatHistory() {
        const messages = $realtimeStore.messages;
        if (!messages || messages.length === 0) {
            alert('다운로드할 대화 내용이 없습니다.');
            return;
        }

        const textContent = messages.map(msg => {
            const time = new Date(msg.timestamp).toLocaleTimeString('ko-KR', {
                hour: '2-digit',
                minute: '2-digit'
            });
            const role = msg.role === 'user' ? '사용자' : 'AI';
            return `[${time}] ${role}: ${msg.content}`;
        }).join('\n\n');

        const blob = new Blob([textContent], { type: 'text/plain;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `chat-history-${new Date().toISOString().slice(0, 10)}.txt`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    async function downloadSummary(event) {
        let button = null;
        try {
            const messages = $realtimeStore.messages;
            
            if (!messages || messages.length === 0) {
                alert('요약할 대화 내용이 없습니다.');
                return;
            }

            // 최소 메시지 수 체크
            if (messages.length < 4) {
                alert('대화가 너무 짧아 요약할 수 없습니다.\n최소 2번 이상의 대화가 필요합니다.');
                return;
            }

            // 요약 생성 중 표시
            if (event) {
                button = event.target.closest('button');
                if (button) {
                    button.disabled = true;
                    button.textContent = '요약 생성 중...';
                }
            }

            console.log('📥 대화 요약 시작');

            // 요약 API 호출
            const summaryResponse = await fetch('/api/conversations/summarize-conversation', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ messages })
            });

            console.log('📡 요약 API 응답:', summaryResponse.status);

            if (!summaryResponse.ok) {
                const errorData = await summaryResponse.json();
                console.error('❌ 요약 생성 실패:', errorData);
                alert(`요약 생성에 실패했습니다: ${errorData.error || '알 수 없는 오류'}`);
                if (button) {
                    button.disabled = false;
                    button.textContent = '요약 다운로드';
                }
                return;
            }

            const summaryData = await summaryResponse.json();
            const summary = summaryData.summary;
            console.log('✅ 요약 생성 완료, 길이:', summary?.length);

            if (!summary) {
                console.error('❌ 요약 내용이 비어있음');
                alert('요약 생성에 실패했습니다.');
                if (button) {
                    button.disabled = false;
                    button.textContent = '요약 다운로드';
                }
                return;
            }

            // 요약 다운로드
            const blob = new Blob([summary], { type: 'text/plain;charset=utf-8' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `대화요약_${new Date().toISOString().slice(0, 10)}.txt`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            
            console.log('✅ 다운로드 완료');

            if (button) {
                button.disabled = false;
                button.textContent = '요약 다운로드';
            }

        } catch (error) {
            console.error('❌ 요약 다운로드 오류:', error);
            alert(`요약 다운로드 중 오류가 발생했습니다: ${error.message}`);
            if (button) {
                button.disabled = false;
                button.textContent = '요약 다운로드';
            }
        }
    }

    onMount(() => {
        // 초기 모드는 텍스트
        realtimeStore.setChatMode(chatMode);
        realtimeStore.clearMessages();
        realtimeStore.setSession(null);
        realtimeStore.updateStatus({
            status: 'disconnected',
            isConnected: false,
            isListening: false,
            isSpeaking: false,
            errorMessage: ''
        });

        // 대화 목록만 로드
        loadConversations();

        // URL 쿼리 파라미터에서 conversation ID 확인
        const urlParams = new URLSearchParams(window.location.search);
        const conversationIdFromUrl = urlParams.get('conversation');
        if (conversationIdFromUrl) {
            console.log('📖 URL에서 대화 ID 감지:', conversationIdFromUrl);
            loadConversation(conversationIdFromUrl);
        }

        // 페이지 이탈 시 자동 대화 종료 및 제목 생성 (또는 빈 대화 삭제)
        const handleBeforeUnload = async (event) => {
            if (conversationId) {
                const messages = $realtimeStore.messages || [];
                
                // 메시지가 없으면 대화 삭제
                if (messages.length === 0) {
                    try {
                        await fetch(`/api/conversations/${conversationId}`, {
                            method: 'DELETE',
                            keepalive: true
                        });
                        console.log('🗑️ 빈 대화 자동 삭제 (페이지 이탈)');
                    } catch (error) {
                        console.error('빈 대화 삭제 오류:', error);
                    }
                } else {
                    // 메시지가 있으면 제목 생성 및 대화 종료 (keepalive 사용)
                    try {
                        // 제목 생성
                        const titleResponse = await fetch('/api/conversations/summarize-title', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ messages }),
                            keepalive: true
                        });

                        if (titleResponse.ok) {
                            const titleData = await titleResponse.json();
                            
                            // 제목 업데이트
                            await fetch(`/api/conversations/${conversationId}`, {
                                method: 'PATCH',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ 
                                    action: 'update_title',
                                    title: titleData.title 
                                }),
                                keepalive: true
                            });
                        }
                    } catch (error) {
                        console.error('제목 생성 오류:', error);
                    }

                    // 대화 종료
                    try {
                        await fetch('/api/conversations/finalize', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ conversationId }),
                            keepalive: true
                        });
                    } catch (error) {
                        console.error('대화 종료 오류:', error);
                    }
                }
            }
        };

        window.addEventListener('beforeunload', handleBeforeUnload);

        return () => {
            // 컴포넌트 언마운트 시 대화 종료
            if (conversationId) {
                finalizeConversation();
            }
            window.removeEventListener('beforeunload', handleBeforeUnload);
        };
    });

    // 대화 생성 함수를 전역으로 노출 (ChatInput에서 호출)
    globalThis.ensureConversation = async function(firstMessage = '') {
        if (!conversationId) {
            await createConversation(firstMessage);
        }
        return conversationId;
    };
</script>

<div class="min-h-screen flex bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/30">
    <!-- Sidebar -->
    <aside class="w-72 min-h-screen bg-white/80 backdrop-blur-sm border-r border-gray-200/50 flex flex-col shadow-sm">
        <div class="px-6 py-5 border-b border-gray-100">
            <div class="flex items-center gap-3">
                <div class="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-lg font-bold shadow-md">
                    AI
                </div>
                <div>
                    <h2 class="text-lg font-bold text-gray-900">대화</h2>
                    <p class="text-xs text-gray-500">Speaking AI</p>
                </div>
            </div>
        </div>

        <div class="flex-1 overflow-y-auto px-4 py-5 space-y-6">
            <!-- 새 대화 시작 버튼 -->
            <div>
                <button
                    type="button"
                    onclick={() => {
                        conversationId = null;
                        realtimeStore.setSession({ id: null });
                        realtimeStore.clearMessages();
                        console.log('🆕 새 대화 준비 완료');
                    }}
                    class="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-sm font-semibold shadow-md hover:shadow-lg transition-all duration-200"
                >
                    <span class="text-base">➕</span>
                    <span>새 대화 시작</span>
                </button>
            </div>

            <!-- 대화 목록 -->
            <div>
                <div class="flex items-center justify-between mb-3 px-2">
                    <h3 class="text-xs font-semibold uppercase tracking-wide text-gray-500">대화 목록</h3>
                    <button
                        type="button"
                        onclick={() => goto('/mypage?section=history')}
                        class="px-2.5 py-1 text-xs font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                        편집
                    </button>
                </div>
                {#if isLoadingConversations}
                    <div class="text-center py-6 text-sm text-gray-500">로딩 중...</div>
                {:else if conversations.length === 0}
                    <div class="text-center py-6 text-sm text-gray-400">대화 기록이 없습니다</div>
                {:else}
                    <div class="space-y-1.5 max-h-64 overflow-y-auto">
                        {#each conversations as conv}
                            <button
                                type="button"
                                onclick={() => loadConversation(conv.id)}
                                class={`w-full text-left px-3 py-2.5 rounded-lg text-sm transition-all duration-200 ${
                                    conversationId === conv.id
                                        ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-md'
                                        : 'text-gray-700 hover:bg-gray-50'
                                }`}
                            >
                                <div class="font-medium truncate">{conv.title || '제목 없음'}</div>
                                <div class={`text-xs mt-1 ${
                                    conversationId === conv.id ? 'text-blue-100' : 'text-gray-400'
                                }`}>
                                    {new Date(conv.started_at).toLocaleDateString('ko-KR')}
                                </div>
                            </button>
                        {/each}
                    </div>
                {/if}
            </div>

            <div>
                <ConversationStyleSelector />
            </div>

            {#if errorMessage}
                <div class="bg-red-50 border border-red-200/50 rounded-xl p-4">
                    <h3 class="text-sm font-semibold text-red-800 mb-1 flex items-center gap-2">
                        <span class="text-base">⚠️</span>
                        오류 발생
                    </h3>
                    <p class="text-xs text-red-700">{errorMessage}</p>
                </div>
            {/if}
        </div>

        <div class="px-4 py-5 border-t border-gray-100 space-y-2.5">
            <button
                onclick={() => goto('/mypage')}
                class="w-full px-4 py-2.5 bg-gray-50 hover:bg-gray-100 text-gray-700 font-medium rounded-lg transition-colors duration-200"
            >
                마이페이지
            </button>
            <button
                onclick={handleLogout}
                class="w-full px-4 py-2.5 bg-gray-900 hover:bg-gray-800 text-white font-semibold rounded-lg shadow-sm transition-all duration-200"
            >
                로그아웃
            </button>
        </div>
    </aside>

    <!-- Main content -->
    <RealtimeManager
        let:handleRealtimeConnect
        let:handleRealtimeDisconnect
        {onRealtimeError}
    >
        {#if handleRealtimeConnect && handleRealtimeDisconnect}
            {@const initializeHandlers = () => {
                handleConnect = handleRealtimeConnect;
                handleDisconnect = handleRealtimeDisconnect;
            }}
            {initializeHandlers()}
        {/if}

        <main class="flex-1 overflow-hidden">
            <div class="h-full flex flex-col max-w-5xl mx-auto px-4 md:px-8 py-6 md:py-8">
                <header class="mb-6">
                    <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                        <div>
                            <h1 class="text-2xl md:text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">
                                {chatMode === 'voice' ? '음성 대화' : '텍스트 대화'}
                            </h1>
                            <p class="text-gray-600 mt-1.5 text-sm md:text-base">
                                안녕하세요, <span class="font-semibold text-gray-900">{data.user?.name || '사용자'}</span>님! {chatMode === 'voice' ? '음성으로' : '채팅으로'} 자유롭게 대화해보세요.
                            </p>
                        </div>
                        
                        <!-- 모드 전환 버튼 -->
                        <div class="flex gap-2 bg-gray-100 p-1 rounded-xl">
                            <button
                                onclick={() => {
                                    chatMode = 'text';
                                    realtimeStore.setChatMode('text');
                                    if (isRealtimeConnected) {
                                        handleDisconnectWithSave();
                                    }
                                }}
                                class={`px-4 py-2 rounded-lg font-semibold text-sm transition-all duration-200 ${
                                    chatMode === 'text'
                                        ? 'bg-white text-gray-900 shadow-sm'
                                        : 'text-gray-600 hover:text-gray-900'
                                }`}
                            >
                                텍스트
                            </button>
                            <button
                                onclick={() => {
                                    chatMode = 'voice';
                                    realtimeStore.setChatMode('voice');
                                }}
                                class={`px-4 py-2 rounded-lg font-semibold text-sm transition-all duration-200 ${
                                    chatMode === 'voice'
                                        ? 'bg-white text-gray-900 shadow-sm'
                                        : 'text-gray-600 hover:text-gray-900'
                                }`}
                            >
                                음성
                            </button>
                        </div>
                    </div>
                </header>

                <div class="flex flex-col bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden flex-1 min-h-0">
                    <div class="flex-1 overflow-hidden min-h-0">
                        <MessageList />
                    </div>
                    
                    {#if chatMode === 'text'}
                        <!-- 텍스트 입력 -->
                        <ChatInput />
                    {:else}
                        <!-- 음성 컨트롤 -->
                        <div class="border-t border-gray-100 bg-gray-50/50 px-6 py-4">
                            <div class="flex items-center justify-between gap-4">
                                <!-- Status Display -->
                                <div class="flex items-center gap-3">
                                    <div class={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium ${
                                        isRealtimeConnected 
                                            ? 'bg-green-50 text-green-700 border border-green-200' 
                                            : realtimeStatus === 'connecting' 
                                                ? 'bg-yellow-50 text-yellow-700 border border-yellow-200' 
                                                : 'bg-gray-100 text-gray-600'
                                    }`}>
                                        <span>{isRealtimeConnected ? '✅' : realtimeStatus === 'connecting' ? '⏳' : '⛔'}</span>
                                        <span>
                                            {#if realtimeStatus === 'connecting'}
                                                연결 중...
                                            {:else if isRealtimeConnected}
                                                연결됨
                                            {:else}
                                                대기 중
                                            {/if}
                                        </span>
                                    </div>
                                    <p class="text-sm text-gray-600 hidden md:block">
                                        {#if isRealtimeConnected}
                                            🎤 말씀하세요
                                        {:else if realtimeStatus === 'connecting'}
                                            잠시만 기다려주세요
                                        {:else}
                                            회화 시작 버튼을 눌러주세요
                                        {/if}
                                    </p>
                                </div>

                                <!-- Control Button -->
                                <div>
                                    {#if isRealtimeConnected}
                                        <button
                                            onclick={handleDisconnectWithSave}
                                            class="px-6 py-3 rounded-xl bg-red-500 hover:bg-red-600 text-white font-semibold shadow-md hover:shadow-lg transition-all duration-200"
                                        >
                                            회화 종료
                                        </button>
                                    {:else}
                                        <button
                                            onclick={handleConnectWithSave}
                                            class="px-6 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold shadow-md hover:shadow-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                                            disabled={realtimeStatus === 'connecting'}
                                        >
                                            {realtimeStatus === 'connecting' ? '연결 중...' : '회화 시작'}
                                        </button>
                                    {/if}
                                </div>
                            </div>
                        </div>
                    {/if}
                </div>

                <!-- 다운로드 버튼 그룹 (하단) -->
                <div class="flex gap-2 justify-end mt-4">
                    <button
                        onclick={(e) => downloadSummary(e)}
                        class="px-4 py-2 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 text-sm font-medium rounded-lg shadow-sm hover:shadow transition-all duration-200 flex items-center gap-2"
                    >
                        <span>📄</span>
                        <span>요약 다운로드</span>
                    </button>
                    <button
                        onclick={downloadChatHistory}
                        class="px-4 py-2 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 text-sm font-medium rounded-lg shadow-sm hover:shadow transition-all duration-200 flex items-center gap-2"
                    >
                        <span>💾</span>
                        <span>전체 다운로드</span>
                    </button>
                </div>
            </div>

            <DebugPanel />
        </main>
    </RealtimeManager>
</div>
