<script>
    import { goto } from '$app/navigation';
    import { onMount } from 'svelte';
    import { get } from 'svelte/store';
    import { realtimeStore } from '$lib/stores/realtimeStore.js';

    import RealtimeManager from '$lib/components/RealtimeManager.svelte';
    import ConversationStyleSelector from '$lib/components/ConversationStyleSelector.svelte';
    import MessageList from '$lib/components/MessageList.svelte';
    import DebugPanel from '$lib/components/DebugPanel.svelte';

    /** @type {import('./$types').PageData} */
    let { data } = $props();

    const isRealtimeConnected = $derived($realtimeStore.isConnected);
    const realtimeStatus = $derived($realtimeStore.status);
    const errorMessage = $derived($realtimeStore.errorMessage);

    let handleConnect = $state(null);
    let handleDisconnect = $state(null);
    let conversationId = $state(null);
    let conversations = $state([]);
    let isLoadingConversations = $state(false);

    function onRealtimeError(error) {
        console.error('Realtime 오류:', error);
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

    async function loadConversation(convId) {
        try {
            // 먼저 연결 종료
            if (isRealtimeConnected && handleDisconnect) {
                await handleDisconnectWithSave();
            }

            const response = await fetch(`/api/conversations/${convId}/items`);
            if (response.ok) {
                const result = await response.json();
                const { conversation, items } = result.data;
                
                conversationId = convId;
                realtimeStore.setConversationId(convId);
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

                // 자동 연결하지 않음 - 사용자가 "실시간 회화 시작" 버튼을 클릭해야 함
                console.log('✅ 대화 로드 완료. "실시간 회화 시작" 버튼을 클릭하세요.');
            }
        } catch (error) {
            console.error('대화 로드 오류:', error);
        }
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
                    // 스토어에 conversationId 저장 (실시간 메시지 저장용)
                    realtimeStore.setConversationId(conversationId);
                    console.log('✅ 새 대화 생성됨. ID:', conversationId);
                    
                    // 대화 목록 새로고침
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

        // 대화 종료 처리 (메시지는 이미 실시간으로 저장됨)
        if (conversationId) {
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
                console.log('✅ 대화가 종료되었습니다. ID:', conversationId);
            } catch (error) {
                console.error('대화 종료 오류:', error);
            }
        }

        // 상태 초기화
        conversationId = null;
        realtimeStore.setConversationId(null);
        
        // 대화 목록 새로고침
        await loadConversations();
    }

    onMount(() => {
        realtimeStore.setChatMode('voice');
        realtimeStore.clearMessages();
        
        // 대화 목록 로드
        loadConversations();

        // 페이지 이탈 시 자동 연결 종료
        const handleBeforeUnload = async (event) => {
            if (isRealtimeConnected && conversationId) {
                // 대화 내용 가져오기
                const messages = $realtimeStore.messages || [];
                
                // 제목 생성 및 대화 종료 (keepalive 사용)
                if (messages.length > 0) {
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
        };

        const handleVisibilityChange = () => {
            // 페이지가 숨겨질 때 (다른 탭으로 이동 등)
            if (document.hidden && isRealtimeConnected) {
                console.log('페이지 숨김 - 연결 유지');
                // 필요시 여기서 연결 종료 가능
            }
        };

        // 이벤트 리스너 등록
        window.addEventListener('beforeunload', handleBeforeUnload);
        document.addEventListener('visibilitychange', handleVisibilityChange);

        return () => {
            // 컴포넌트 언마운트 시 연결 종료
            if (handleDisconnect) {
                handleDisconnect();
            }
            
            // 대화 종료 처리
            if (conversationId) {
                handleDisconnectWithSave();
            }

            // 이벤트 리스너 제거
            window.removeEventListener('beforeunload', handleBeforeUnload);
            document.removeEventListener('visibilitychange', handleVisibilityChange);
        };
    });

    const primaryActionLabel = $derived(() => (isRealtimeConnected ? '실시간 회화 종료' : '실시간 회화 시작'));
    const primaryActionVariant = $derived(() => (isRealtimeConnected ? 'bg-red-500 hover:bg-red-600' : 'bg-blue-500 hover:bg-blue-600'));

    function handlePrimaryAction() {
        if (isRealtimeConnected) {
            handleDisconnectWithSave();
        } else {
            handleConnectWithSave();
        }
    }
</script>

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

    <div class="min-h-screen flex bg-gradient-to-br from-blue-50 to-indigo-100">
        <!-- Sidebar -->
        <aside class="w-72 min-h-screen bg-blue-100/80 border-r border-blue-200 backdrop-blur-sm flex flex-col">
            <div class="px-6 py-6 border-b border-blue-200 flex items-center justify-between">
                <div>
                    <p class="text-xs uppercase tracking-wide text-blue-500">Voice Chat</p>
                    <h2 class="text-xl font-bold text-blue-900">대화 메뉴</h2>
                </div>
                <span class="text-2xl">🎙️</span>
            </div>

            <div class="flex-1 overflow-y-auto px-6 py-6 space-y-8">
                <!-- 새 대화 시작 버튼 -->
                <div>
                    <button
                        type="button"
                        onclick={() => {
                            conversationId = null;
                            realtimeStore.setConversationId(null);
                            realtimeStore.clearMessages();
                            console.log('🆕 새 대화 준비 완료');
                        }}
                        class="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-blue-500 hover:bg-blue-600 text-white text-sm font-semibold shadow-sm transition"
                        disabled={isRealtimeConnected}
                    >
                        <span>➕</span>
                        <span>새 대화 시작</span>
                    </button>
                </div>

                <!-- 대화 목록 -->
                <div>
                    <div class="flex items-center justify-between mb-2 px-2">
                        <h3 class="text-xs uppercase tracking-wide text-blue-700">내 대화 목록</h3>
                        <button
                            type="button"
                            onclick={() => goto('/mypage?section=history')}
                            class="px-2 py-1 bg-blue-500 hover:bg-blue-600 text-white text-xs font-medium rounded transition flex items-center gap-1"
                        >
                            <span>✏️</span>
                            <span>편집</span>
                        </button>
                    </div>
                    {#if isLoadingConversations}
                        <div class="text-center py-4 text-sm text-blue-600">로딩 중...</div>
                    {:else if conversations.length === 0}
                        <div class="text-center py-4 text-sm text-blue-600">대화 기록이 없습니다</div>
                    {:else}
                        <div class="space-y-1 max-h-64 overflow-y-auto">
                            {#each conversations as conv}
                                <button
                                    type="button"
                                    onclick={() => loadConversation(conv.id)}
                                    disabled={isRealtimeConnected}
                                    class={`w-full text-left px-3 py-2 rounded-lg text-xs transition ${
                                        conversationId === conv.id
                                            ? 'bg-blue-500 text-white shadow-sm'
                                            : 'bg-white/60 text-blue-800 hover:bg-white/80'
                                    } ${isRealtimeConnected ? 'opacity-50 cursor-not-allowed' : ''}`}
                                >
                                    <div class="font-medium truncate">{conv.title || '제목 없음'}</div>
                                    <div class="text-[10px] opacity-75 mt-1">
                                        {new Date(conv.started_at).toLocaleDateString('ko-KR')}
                                    </div>
                                </button>
                            {/each}
                        </div>
                    {/if}
                </div>

                <nav class="space-y-2">
                    <button
                        type="button"
                        onclick={() => goto('/voice')}
                        class="w-full flex items-center justify-between px-4 py-2 rounded-lg bg-white/70 border border-blue-300 text-sm font-semibold text-blue-700 shadow-sm hover:bg-white/90 transition"
                    >
                        <span>🎙️ 실시간 음성</span>
                        <span class="text-xs">현재</span>
                    </button>
                    <button
                        type="button"
                        onclick={() => goto('/text')}
                        class="w-full flex items-center justify-between px-4 py-2 rounded-lg bg-white/50 border border-transparent text-sm font-semibold text-blue-600 hover:bg-white/80 transition"
                    >
                        <span>💬 텍스트 대화</span>
                        <span class="text-xs">바로가기</span>
                    </button>
                </nav>

                <div>
                    <ConversationStyleSelector />
                </div>

                <div>
                    <div class="bg-white/70 border border-blue-200 rounded-xl p-4 shadow-sm space-y-2">
                        <p class="text-sm text-blue-900 flex items-start gap-2">
                            <span>🎤</span>
                            <span>마이크 접근 권한을 허용해주세요.</span>
                        </p>
                        <p class="text-sm text-blue-900 flex items-start gap-2">
                            <span>🔊</span>
                            <span>헤드폰을 사용하면 더 선명한 경험을 제공합니다.</span>
                        </p>
                        <p class="text-sm text-blue-900 flex items-start gap-2">
                            <span>🌐</span>
                            <span>안정적인 인터넷 연결이 필요해요.</span>
                        </p>
                    </div>
                </div>

                {#if errorMessage}
                    <div class="bg-red-50 border border-red-200 rounded-xl p-4">
                        <h3 class="text-sm font-semibold text-red-800 mb-1 flex items-center gap-2">
                            <span class="text-base">⚠️</span>
                            오류 발생
                        </h3>
                        <p class="text-xs text-red-700">{errorMessage}</p>
                    </div>
                {/if}
            </div>

            <div class="px-6 py-6 border-t border-blue-200 space-y-3">
                <button
                    onclick={() => goto('/mypage')}
                    class="w-full px-4 py-2 bg-white border border-blue-300 text-blue-700 font-semibold rounded-lg shadow-sm hover:bg-blue-50 transition flex items-center justify-center gap-2"
                >
                    <span>👤</span>
                    <span>마이페이지</span>
                </button>
                <button
                    onclick={() => fetch('/api/auth/logout', { method: 'POST' }).then(() => goto('/login')).catch((error) => console.error('로그아웃 오류:', error))}
                    class="w-full px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white font-semibold rounded-lg shadow-md transition flex items-center justify-center gap-2"
                >
                    <span>🚪</span>
                    <span>로그아웃</span>
                </button>
            </div>
        </aside>

        <!-- Main content -->
        <main class="flex-1">
            <div class="max-w-4xl mx-auto px-4 md:px-8 py-10 md:py-16 space-y-8">
                <header class="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div>
                        <h1 class="text-3xl md:text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600 flex items-center gap-3">
                            <span class="text-4xl">🎙️</span>
                            <span>실시간 음성 대화</span>
                        </h1>
                        <p class="text-gray-600 mt-2 text-sm md:text-base">
                            👋 안녕하세요, <span class="font-semibold text-gray-800">{data.user?.name || '사용자'}</span>님! 음성으로 자유롭게 대화해보세요.
                        </p>
                    </div>
                </header>

                <div class="flex flex-col bg-white rounded-2xl shadow-lg overflow-hidden">
                    <div class="flex-1 overflow-hidden">
                        <MessageList />
                    </div>
                    
                    <!-- Voice Control Area -->
                    <div class="border-t border-gray-200 bg-gray-50 px-6 py-4">
                        <div class="flex items-center justify-between gap-4">
                            <!-- Status Display -->
                            <div class="flex items-center gap-3">
                                <div class={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium ${isRealtimeConnected ? 'bg-green-100 text-green-700' : realtimeStatus === 'connecting' ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-100 text-gray-600'}`}>
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
                                        class="px-6 py-3 rounded-xl bg-red-500 hover:bg-red-600 text-white font-semibold shadow-md transition flex items-center gap-2"
                                    >
                                        <span>🛑</span>
                                        <span>회화 종료</span>
                                    </button>
                                {:else}
                                    <button
                                        onclick={handleConnectWithSave}
                                        class="px-6 py-3 rounded-xl bg-blue-500 hover:bg-blue-600 text-white font-semibold shadow-md transition flex items-center gap-2"
                                        disabled={realtimeStatus === 'connecting'}
                                    >
                                        <span>🎙️</span>
                                        <span>{realtimeStatus === 'connecting' ? '연결 중...' : '회화 시작'}</span>
                                    </button>
                                {/if}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </main>
    </div>

    <DebugPanel />
</RealtimeManager>
