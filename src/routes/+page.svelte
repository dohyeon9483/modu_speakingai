<script>
    import { goto } from '$app/navigation';
    import { realtimeStore } from '$lib/stores/realtimeStore.js';

    import StatusDisplay from '$lib/components/StatusDisplay.svelte';
    import RealtimeControls from '$lib/components/RealtimeControls.svelte';
    import RealtimeManager from '$lib/components/RealtimeManager.svelte';
    import ConversationStyleSelector from '$lib/components/ConversationStyleSelector.svelte';
    import DebugPanel from '$lib/components/DebugPanel.svelte';

    /** @type {import('./$types').PageData} */
    let { data } = $props();

    // 스토어에서 상태 가져오기
    const isRealtimeConnected = $derived($realtimeStore.isConnected);
    const realtimeStatus = $derived($realtimeStore.status);
    const conversationText = $derived($realtimeStore.conversationText);
    const errorMessage = $derived($realtimeStore.errorMessage);

    let handleConnect = $state(null);
    let handleDisconnect = $state(null);

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

    <div class="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4 md:p-8">
        <div class="max-w-4xl mx-auto">
            <!-- 헤더 - 사용자 정보 및 로그아웃 -->
            <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 md:mb-8">
                <div>
                    <h1 class="text-3xl md:text-4xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent flex items-center gap-3">
                        <span class="text-4xl md:text-5xl">🤖</span>
                        <span>AI 실시간 회화</span>
                    </h1>
                    <p class="text-gray-600 mt-2 ml-14 text-sm md:text-base">
                        👋 안녕하세요, <span class="font-semibold text-gray-800">{data.user?.name || '사용자'}</span>님! 오늘은 어떤 이야기를 나눠볼까요?
                    </p>
                </div>
                <button
                    onclick={handleLogout}
                    class="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-lg transition duration-200 text-sm md:text-base shadow-sm hover:shadow-md flex items-center gap-2"
                >
                    <span>🚪</span>
                    <span>로그아웃</span>
                </button>
            </div>

            <!-- 메인 컨테이너 -->
            <div class="space-y-6">
                <!-- 대화 스타일 선택 (메인 영역) -->
                <ConversationStyleSelector />

                <!-- 실시간 회화 컨트롤 영역 -->
                <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <!-- 왼쪽: 회화 컨트롤 -->
                    <div class="lg:col-span-2 space-y-6">
                        <!-- 상태 표시 -->
                        <div class="bg-white rounded-2xl shadow-xl p-6">
                            <StatusDisplay
                                isRealtimeMode={true}
                                {realtimeStatus}
                                {conversationText}
                            />
                        </div>

                        <!-- 컨트롤 버튼 -->
                        <div class="bg-white rounded-2xl shadow-xl p-6">
                            <RealtimeControls
                                isConnected={isRealtimeConnected}
                                status={realtimeStatus}
                                onConnect={handleConnect}
                                onDisconnect={handleDisconnect}
                            />
                        </div>
                    </div>

                    <!-- 오른쪽: 정보 및 안내 영역 -->
                    <div class="space-y-6">
                        <!-- 사용 안내 -->
                        <div class="bg-white rounded-2xl shadow-xl p-6">
                            <h3 class="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                                <span class="text-2xl">💡</span>
                                사용 안내
                            </h3>
                            <div class="space-y-3 text-sm text-gray-600">
                                <div class="flex items-start gap-2">
                                    <span>🎤</span>
                                    <span>말하면 AI가 즉시 응답해요</span>
                                </div>
                                <div class="flex items-start gap-2">
                                    <span>🔊</span>
                                    <span>마이크 권한을 허용해주세요</span>
                                </div>
                                <div class="flex items-start gap-2">
                                    <span>🌐</span>
                                    <span>안정적인 인터넷 연결을 권장해요</span>
                                </div>
                                <div class="flex items-start gap-2">
                                    <span>🤫</span>
                                    <span>조용한 환경에서 대화하면 더 좋아요</span>
                                </div>
                            </div>
                        </div>

                        <!-- 상태 정보 -->
                        <div class="bg-white rounded-2xl shadow-xl p-6">
                            <h3 class="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                                <span class="text-2xl">📊</span>
                                연결 상태
                            </h3>
                            <div class="space-y-2 text-sm">
                                <div class="flex justify-between items-center">
                                    <span class="text-gray-600">상태:</span>
                                    <span class="font-medium">
                                        {#if realtimeStatus === 'connecting'}
                                            <span class="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-yellow-100 text-yellow-700">
                                                <span class="w-2 h-2 bg-yellow-500 rounded-full animate-pulse"></span>
                                                연결 중
                                            </span>
                                        {:else if realtimeStatus === 'connected' || realtimeStatus === 'listening'}
                                            <span class="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-green-100 text-green-700">
                                                <span class="w-2 h-2 bg-green-500 rounded-full"></span>
                                                연결됨
                                            </span>
                                        {:else if realtimeStatus === 'speaking'}
                                            <span class="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-blue-100 text-blue-700">
                                                <span class="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></span>
                                                대화 중
                                            </span>
                                        {:else}
                                            <span class="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-gray-100 text-gray-600">
                                                <span class="w-2 h-2 bg-gray-400 rounded-full"></span>
                                                연결 끊김
                                            </span>
                                        {/if}
                                    </span>
                                </div>
                                {#if isRealtimeConnected}
                                    <div class="flex justify-between items-center pt-2 border-t border-gray-200">
                                        <span class="text-gray-600">세션:</span>
                                        <span class="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-green-100 text-green-700 font-medium">
                                            <span class="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                                            활성
                                        </span>
                                    </div>
                                {/if}
                            </div>
                        </div>

                        <!-- 에러 메시지 -->
                        {#if errorMessage}
                            <div class="bg-red-50 border border-red-200 rounded-2xl p-6">
                                <h3 class="text-lg font-semibold text-red-800 mb-2 flex items-center gap-2">
                                    <span class="text-xl">⚠️</span>
                                    오류 발생
                                </h3>
                                <p class="text-red-700 text-sm">{errorMessage}</p>
                            </div>
                        {/if}
                    </div>
                </div>
            </div>
        </div>
    </div>

    <!-- 종합 디버그 패널 -->
    <DebugPanel />
</RealtimeManager>
