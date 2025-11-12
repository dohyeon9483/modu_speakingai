<script>
    import { goto } from '$app/navigation';
    import { onMount } from 'svelte';
    import { get } from 'svelte/store';
    import { realtimeStore } from '$lib/stores/realtimeStore.js';

    import RealtimeManager from '$lib/components/RealtimeManager.svelte';
    import ConversationStyleSelector from '$lib/components/ConversationStyleSelector.svelte';
    import DebugPanel from '$lib/components/DebugPanel.svelte';

    /** @type {import('./$types').PageData} */
    let { data } = $props();

    const isRealtimeConnected = $derived($realtimeStore.isConnected);
    const realtimeStatus = $derived($realtimeStore.status);
    const errorMessage = $derived($realtimeStore.errorMessage);

    let handleConnect = $state(null);
    let handleDisconnect = $state(null);
    let conversationId = $state(null);

    function onRealtimeError(error) {
        console.error('Realtime 오류:', error);
    }

    async function handleConnectWithSave() {
        realtimeStore.clearMessages();
        conversationId = null;

        try {
            const response = await fetch('/api/conversations/create', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    title: `대화 ${new Date().toLocaleString('ko-KR')}`
                })
            });

            if (response.ok) {
                const result = await response.json();
                conversationId = result.data.id;
            }
        } catch (error) {
            console.error('대화 생성 오류:', error);
        }

        if (handleConnect) {
            handleConnect();
        }
    }

    async function handleDisconnectWithSave() {
        if (handleDisconnect) {
            handleDisconnect();
        }

        const storeSnapshot = get(realtimeStore);
        const messages = storeSnapshot.messages || [];

        if (messages.length > 0) {
            try {
                await fetch('/api/conversations/save', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        conversationId,
                        messages,
                        title: `대화 ${new Date().toLocaleString('ko-KR')}`
                    })
                });
                console.log('대화가 저장되었습니다.');
            } catch (error) {
                console.error('대화 저장 오류:', error);
            }
        }

        conversationId = null;
    }

    onMount(() => {
        realtimeStore.setChatMode('voice');
        realtimeStore.clearMessages();

        return () => {
            if (handleDisconnect) {
                handleDisconnect();
            }
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
                <header class="space-y-2">
                    <h1 class="text-3xl md:text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600 flex items-center gap-3">
                        <span class="text-4xl">🎙️</span>
                        <span>실시간 음성 대화</span>
                    </h1>
                    <p class="text-gray-600 text-sm md:text-base">
                        👋 안녕하세요, <span class="font-semibold text-gray-800">{data.user?.name || '사용자'}</span>님! 필요한 경우 회화 시작 버튼을 눌러 음성 대화를 시작하세요.
                    </p>
                </header>

                <section class="space-y-6">
                    <div class="bg-white rounded-2xl shadow-lg p-6 space-y-6">
                        <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                            <div>
                                <p class="text-sm font-semibold text-gray-500 mb-1">현재 상태</p>
                                <div class={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium ${isRealtimeConnected ? 'bg-green-100 text-green-700' : realtimeStatus === 'connecting' ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-100 text-gray-600'}`}>
                                    <span>{isRealtimeConnected ? '✅' : realtimeStatus === 'connecting' ? '⏳' : '⛔'}</span>
                                    <span>
                                        {#if realtimeStatus === 'connecting'}
                                            연결 중
                                        {:else if isRealtimeConnected}
                                            연결됨
                                        {:else}
                                            연결 끊김
                                        {/if}
                                    </span>
                                </div>
                            </div>

                            <div class="flex flex-wrap gap-3">
                                {#if isRealtimeConnected}
                                    <button
                                        onclick={handleDisconnectWithSave}
                                        class="px-6 py-3 rounded-xl bg-red-500 hover:bg-red-600 text-white font-semibold shadow-md transition text-base"
                                    >
                                        실시간 회화 종료
                                    </button>
                                {:else}
                                    <button
                                        onclick={handleConnectWithSave}
                                        class="px-6 py-3 rounded-xl bg-blue-500 hover:bg-blue-600 text-white font-semibold shadow-md transition text-base"
                                    >
                                        실시간 회화 시작
                                    </button>
                                {/if}
                            </div>
                        </div>

                        <p class="text-sm text-gray-500">
                            {#if isRealtimeConnected}
                                대화가 진행 중입니다. 말을 시작하거나 잠시 기다리면 AI가 응답해요.
                            {:else if realtimeStatus === 'connecting'}
                                연결을 설정하는 중입니다. 잠시만 기다려주세요.
                            {:else}
                                회화를 시작하려면 상단 버튼을 눌러주세요.
                            {/if}
                        </p>
                    </div>
                </section>
            </div>
        </main>
    </div>

    <DebugPanel />
</RealtimeManager>
