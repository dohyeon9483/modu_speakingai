<script>
    import { goto } from '$app/navigation';
    import { onMount } from 'svelte';
    import { realtimeStore } from '$lib/stores/realtimeStore.js';

    import ConversationStyleSelector from '$lib/components/ConversationStyleSelector.svelte';
    import MessageList from '$lib/components/MessageList.svelte';
    import ChatInput from '$lib/components/ChatInput.svelte';
    import DebugPanel from '$lib/components/DebugPanel.svelte';

    /** @type {import('./$types').PageData} */
    let { data } = $props();

    const errorMessage = $derived($realtimeStore.errorMessage);

    function handleLogout() {
        fetch('/api/auth/logout', { method: 'POST' })
            .then(() => goto('/login'))
            .catch((error) => console.error('로그아웃 오류:', error));
    }

    function goToVoice() {
        goto('/voice');
    }

    function goToMyPage() {
        goto('/mypage');
    }

    onMount(() => {
        realtimeStore.setChatMode('text');
        realtimeStore.clearMessages();
        realtimeStore.setSession(null);
        realtimeStore.updateStatus({
            status: 'disconnected',
            isConnected: false,
            isListening: false,
            isSpeaking: false,
            errorMessage: ''
        });
    });
</script>

<div class="min-h-screen flex bg-gradient-to-br from-emerald-50 via-sky-50 to-slate-100">
    <!-- Sidebar -->
    <aside class="w-72 min-h-screen bg-emerald-100 border-r border-emerald-200 flex flex-col">
        <div class="px-6 py-6 border-b border-emerald-200 flex items-center justify-between">
            <div>
                <p class="text-xs uppercase tracking-wide text-emerald-700">Text Chat</p>
                <h2 class="text-xl font-bold text-emerald-900">대화 메뉴</h2>
            </div>
            <span class="text-2xl">💬</span>
        </div>

        <div class="flex-1 overflow-y-auto px-6 py-6 space-y-8">
            <nav class="space-y-2">
                <button
                    type="button"
                    onclick={() => goto('/voice')}
                    class="w-full flex items-center justify-between px-4 py-2 rounded-lg bg-white/50 border border-transparent text-sm font-semibold text-emerald-800 hover:bg-white/80 transition"
                >
                    <span>🎙️ 실시간 음성</span>
                    <span class="text-xs">바로가기</span>
                </button>
                <button
                    type="button"
                    onclick={() => goto('/text')}
                    class="w-full flex items-center justify-between px-4 py-2 rounded-lg bg-white/60 border border-emerald-200 text-sm font-semibold text-emerald-900 shadow-sm hover:bg-white/80 transition"
                >
                    <span>💬 텍스트 대화</span>
                    <span class="text-xs">현재</span>
                </button>
            </nav>

            <div>
                <ConversationStyleSelector />
            </div>

            <div>
                <div class="bg-white/70 border border-emerald-200 rounded-xl p-4 shadow-sm space-y-2">
                    <p class="text-sm text-emerald-900 flex items-start gap-2">
                        <span>✨</span>
                        <span>메시지를 입력하고 Enter 키로 전송하세요.</span>
                    </p>
                    <p class="text-sm text-emerald-900 flex items-start gap-2">
                        <span>🔁</span>
                        <span>Shift + Enter로 줄바꿈을 추가할 수 있어요.</span>
                    </p>
                    <p class="text-sm text-emerald-900 flex items-start gap-2">
                        <span>🧠</span>
                        <span>대화 스타일에 따라 AI 응답이 달라집니다.</span>
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

        <div class="px-6 py-6 border-t border-emerald-200 space-y-3">
            <button
                onclick={() => goto('/mypage')}
                class="w-full px-4 py-2 bg-white border border-emerald-200 text-emerald-700 font-semibold rounded-lg shadow-sm hover:bg-emerald-50 transition flex items-center justify-center gap-2"
            >
                <span>👤</span>
                <span>마이페이지</span>
            </button>
            <button
                onclick={handleLogout}
                class="w-full px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white font-semibold rounded-lg shadow-md transition flex items-center justify-center gap-2"
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
                    <h1 class="text-3xl md:text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-emerald-500 to-blue-500 flex items-center gap-3">
                        <span class="text-4xl">💬</span>
                        <span>텍스트 대화</span>
                    </h1>
                    <p class="text-gray-600 mt-2 text-sm md:text-base">
                        👋 안녕하세요, <span class="font-semibold text-gray-800">{data.user?.name || '사용자'}</span>님! 채팅으로 자유롭게 대화해보세요.
                    </p>
                </div>
            </header>

            <div class="flex flex-col bg-white rounded-2xl shadow-lg overflow-hidden">
                <div class="flex-1 overflow-hidden">
                    <MessageList />
                </div>
                <ChatInput />
            </div>
        </div>

        <DebugPanel />
    </main>
</div>
