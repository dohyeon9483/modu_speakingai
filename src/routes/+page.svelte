<script>
    import { goto } from '$app/navigation';
    import { realtimeStore } from '$lib/stores/realtimeStore.js';
    
    import StatusDisplay from '$lib/components/StatusDisplay.svelte';
    import RealtimeControls from '$lib/components/RealtimeControls.svelte';
    import RealtimeManager from '$lib/components/RealtimeManager.svelte';

    /** @type {import('./$types').PageData} */
    let { data } = $props();

    // 스토어에서 상태 가져오기
    const isRealtimeConnected = $derived($realtimeStore.isConnected);
    const realtimeStatus = $derived($realtimeStore.status);
    const conversationText = $derived($realtimeStore.conversationText);
    const errorMessage = $derived($realtimeStore.errorMessage);
    const isButtonDisabled = $derived($realtimeStore.isButtonDisabled);

    let handleConnect;
    let handleDisconnect;

    function onRealtimeError(error) {
        console.error('Realtime 오류:', error);
    }

    async function handleLogout() {
        try {
            await fetch('/api/auth/logout', {
                method: 'POST'
            });
            goto('/login');
        } catch (error) {
            console.error('로그아웃 오류:', error);
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

    <div class="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8">
        <div class="max-w-2xl mx-auto">
            <!-- 헤더 - 사용자 정보 및 로그아웃 -->
            <div class="flex justify-between items-center mb-8">
                <div>
                    <h1 class="text-4xl font-bold text-gray-800">실시간 AI 회화</h1>
                    <p class="text-gray-600 mt-2">👋 환영합니다, <span class="font-semibold">{data.user.name}</span>님!</p>
                </div>
                <div class="flex items-center gap-3">
                    <!-- 관리자 대시보드 아이콘 -->
                    <a
                        href="/admin"
                        class="p-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition duration-200"
                        title="관리자 대시보드"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                    </a>
                    <!-- 로그아웃 버튼 -->
                    <button
                        onclick={handleLogout}
                        class="px-6 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 font-medium rounded-lg transition duration-200"
                    >
                        로그아웃
                    </button>
                </div>
            </div>

            <div class="bg-white rounded-2xl shadow-xl p-8">
                <!-- 상태 표시 -->
                <StatusDisplay
                    isRealtimeMode={true}
                    {realtimeStatus}
                    {conversationText}
                />

                <!-- 에러 메시지 -->
                {#if errorMessage}
                    <div class="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
                        {errorMessage}
                    </div>
                {/if}

                <!-- 컨트롤 버튼 -->
                <RealtimeControls
                    isConnected={isRealtimeConnected}
                    status={realtimeStatus}
                    onConnect={handleConnect}
                    onDisconnect={handleDisconnect}
                />
            </div>

            <!-- 사용 안내 -->
            <div class="mt-6 text-center text-gray-600 text-sm">
                <p>💬 실시간 회화: 말하면 AI가 즉시 응답합니다 (초 저지연)</p>
                <p class="mt-2">마이크 권한을 허용하고 "실시간 회화 시작" 버튼을 눌러주세요</p>
            </div>
        </div>
    </div>
</RealtimeManager>
