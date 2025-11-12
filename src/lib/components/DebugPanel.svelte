<script>
    import { realtimeStore } from '$lib/stores/realtimeStore.js';
    import { debugStore } from '$lib/stores/debugStore.js';
    import { getPromptForStyle, CONVERSATION_STYLES } from '$lib/conversationStyles.js';

    let isOpen = $state(false);
    let activeTab = $state('prompt'); // prompt, status, logs, errors
    let autoScroll = $state(true);
    
    const selectedStyle = $derived($realtimeStore.selectedConversationStyle);
    const currentPrompt = $derived(getPromptForStyle(selectedStyle, false));
    const styleInfo = $derived(
        selectedStyle 
            ? CONVERSATION_STYLES[selectedStyle] 
            : { label: '기본', emoji: '✨', description: '일반적인 친절한 대화' }
    );
    
    const storeState = $derived($realtimeStore);
    const debugLogs = $derived($debugStore.logs);
    
    // 자동 스크롤
    let logsContainer;
    $effect(() => {
        if (autoScroll && logsContainer && activeTab === 'logs') {
            logsContainer.scrollTop = logsContainer.scrollHeight;
        }
    });

    function getStatusColor(status) {
        const colors = {
            'connected': 'text-green-600 bg-green-100',
            'connecting': 'text-yellow-600 bg-yellow-100',
            'disconnected': 'text-gray-600 bg-gray-100',
            'speaking': 'text-blue-600 bg-blue-100',
            'listening': 'text-purple-600 bg-purple-100',
            'error': 'text-red-600 bg-red-100'
        };
        return colors[status] || colors.disconnected;
    }

    function getLogTypeColor(type) {
        const colors = {
            'info': 'text-blue-600',
            'success': 'text-green-600',
            'warning': 'text-yellow-600',
            'error': 'text-red-600',
            'debug': 'text-gray-600'
        };
        return colors[type] || colors.info;
    }

    function formatTimestamp(timestamp) {
        const date = new Date(timestamp);
        return date.toLocaleTimeString('ko-KR', { 
            hour: '2-digit', 
            minute: '2-digit', 
            second: '2-digit',
            fractionalSecondDigits: 3
        });
    }
</script>

<div class="fixed bottom-4 right-4 z-50">
    <!-- 토글 버튼 -->
    <button
        onclick={() => isOpen = !isOpen}
        class="bg-purple-600 hover:bg-purple-700 text-white rounded-full p-3 shadow-lg transition-all duration-200 transform hover:scale-110 relative"
        title="종합 디버그 패널"
    >
        {#if isOpen}
            <span class="text-xl">🔍</span>
        {:else}
            <span class="text-xl">🐛</span>
        {/if}
        {#if debugLogs.length > 0}
            <span class="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                {debugLogs.length > 99 ? '99+' : debugLogs.length}
            </span>
        {/if}
    </button>

    <!-- 디버그 패널 -->
    {#if isOpen}
        <div class="absolute bottom-16 right-0 w-[600px] max-w-[calc(100vw-2rem)] bg-white rounded-xl shadow-2xl border-2 border-purple-200 max-h-[85vh] overflow-hidden flex flex-col">
            <!-- 헤더 -->
            <div class="bg-gradient-to-r from-purple-600 to-indigo-600 text-white p-4 flex justify-between items-center">
                <div class="flex items-center gap-2">
                    <span class="text-2xl">🔍</span>
                    <h3 class="font-bold text-lg">종합 디버그 패널</h3>
                </div>
                <div class="flex items-center gap-2">
                    <button
                        onclick={() => debugStore.clearLogs()}
                        class="text-white hover:bg-white/20 rounded px-2 py-1 text-xs transition-colors"
                        title="로그 지우기"
                    >
                        지우기
                    </button>
                    <button
                        onclick={() => isOpen = false}
                        class="text-white hover:bg-white/20 rounded-full p-1 transition-colors"
                    >
                        <span class="text-xl">✕</span>
                    </button>
                </div>
            </div>

            <!-- 탭 메뉴 -->
            <div class="flex border-b border-gray-200 bg-gray-50">
                <button
                    onclick={() => activeTab = 'prompt'}
                    class="flex-1 px-4 py-2 text-sm font-medium transition-colors {activeTab === 'prompt' ? 'bg-white text-purple-600 border-b-2 border-purple-600' : 'text-gray-600 hover:bg-gray-100'}"
                >
                    📝 프롬프트
                </button>
                <button
                    onclick={() => activeTab = 'status'}
                    class="flex-1 px-4 py-2 text-sm font-medium transition-colors {activeTab === 'status' ? 'bg-white text-purple-600 border-b-2 border-purple-600' : 'text-gray-600 hover:bg-gray-100'}"
                >
                    📊 상태
                </button>
                <button
                    onclick={() => activeTab = 'logs'}
                    class="flex-1 px-4 py-2 text-sm font-medium transition-colors {activeTab === 'logs' ? 'bg-white text-purple-600 border-b-2 border-purple-600' : 'text-gray-600 hover:bg-gray-100'}"
                >
                    📋 로그 ({debugLogs.length})
                </button>
                <button
                    onclick={() => activeTab = 'errors'}
                    class="flex-1 px-4 py-2 text-sm font-medium transition-colors {activeTab === 'errors' ? 'bg-white text-purple-600 border-b-2 border-purple-600' : 'text-gray-600 hover:bg-gray-100'}"
                >
                    ⚠️ 에러
                </button>
            </div>

            <!-- 내용 -->
            <div class="flex-1 overflow-hidden flex flex-col min-h-0">
                <!-- 프롬프트 탭 -->
                {#if activeTab === 'prompt'}
                    <div class="p-4 overflow-y-auto space-y-4" style="max-height: calc(85vh - 140px);">
                        <!-- 현재 선택된 스타일 -->
                        <div class="bg-gray-50 rounded-lg p-3 border border-gray-200">
                            <div class="text-sm font-semibold text-gray-700 mb-2">현재 선택된 스타일</div>
                            <div class="flex items-center gap-2">
                                <span class="text-2xl">{styleInfo.emoji}</span>
                                <div>
                                    <div class="font-bold text-gray-900">{styleInfo.label}</div>
                                    <div class="text-xs text-gray-600">{styleInfo.description}</div>
                                </div>
                            </div>
                            <div class="mt-2 text-xs text-gray-500">
                                스타일 ID: <code class="bg-gray-200 px-1 rounded">{selectedStyle || 'null (기본)'}</code>
                            </div>
                        </div>

                        <!-- 프롬프트 미리보기 -->
                        <div>
                            <div class="text-sm font-semibold text-gray-700 mb-2 flex items-center justify-between">
                                <span>적용될 프롬프트</span>
                                <span class="text-xs text-gray-500 font-normal">
                                    {currentPrompt.length}자
                                </span>
                            </div>
                            <div class="bg-gray-900 text-green-400 rounded-lg p-3 text-xs font-mono overflow-x-auto max-h-96 overflow-y-auto">
                                <pre class="whitespace-pre-wrap break-words">{currentPrompt}</pre>
                            </div>
                        </div>

                        <!-- 사용 방법 -->
                        <div class="bg-blue-50 rounded-lg p-3 border border-blue-200">
                            <div class="text-sm font-semibold text-blue-900 mb-2">💡 디버깅 방법</div>
                            <div class="text-xs text-blue-800 space-y-1">
                                <p>1. 브라우저 콘솔(F12)에서 로그 확인</p>
                                <p>2. 네트워크 탭 → WS → 메시지 확인</p>
                                <p>3. 실제 대화 응답으로 프롬프트 적용 확인</p>
                            </div>
                        </div>
                    </div>
                {/if}

                <!-- 상태 탭 -->
                {#if activeTab === 'status'}
                    <div class="p-4 overflow-y-auto space-y-4" style="max-height: calc(85vh - 140px);">
                        <!-- 연결 상태 -->
                        <div class="bg-gray-50 rounded-lg p-3 border border-gray-200">
                            <div class="text-sm font-semibold text-gray-700 mb-3">연결 상태</div>
                            <div class="space-y-2">
                                <div class="flex justify-between items-center">
                                    <span class="text-xs text-gray-600">상태:</span>
                                    <span class="px-2 py-1 rounded text-xs font-medium {getStatusColor(storeState.status)}">
                                        {storeState.status}
                                    </span>
                                </div>
                                <div class="flex justify-between items-center">
                                    <span class="text-xs text-gray-600">연결됨:</span>
                                    <span class="text-xs font-medium {storeState.isConnected ? 'text-green-600' : 'text-gray-400'}">
                                        {storeState.isConnected ? '✓ 예' : '✗ 아니오'}
                                    </span>
                                </div>
                                <div class="flex justify-between items-center">
                                    <span class="text-xs text-gray-600">듣는 중:</span>
                                    <span class="text-xs font-medium {storeState.isListening ? 'text-green-600' : 'text-gray-400'}">
                                        {storeState.isListening ? '✓ 예' : '✗ 아니오'}
                                    </span>
                                </div>
                                <div class="flex justify-between items-center">
                                    <span class="text-xs text-gray-600">말하는 중:</span>
                                    <span class="text-xs font-medium {storeState.isSpeaking ? 'text-blue-600' : 'text-gray-400'}">
                                        {storeState.isSpeaking ? '✓ 예' : '✗ 아니오'}
                                    </span>
                                </div>
                            </div>
                        </div>

                        <!-- 세션 정보 -->
                        <div class="bg-gray-50 rounded-lg p-3 border border-gray-200">
                            <div class="text-sm font-semibold text-gray-700 mb-3">세션 정보</div>
                            <div class="space-y-2 text-xs">
                                <div class="flex justify-between">
                                    <span class="text-gray-600">세션 존재:</span>
                                    <span class="font-medium">{storeState.session ? '✓ 예' : '✗ 아니오'}</span>
                                </div>
                                {#if storeState.session}
                                    <div class="flex justify-between">
                                        <span class="text-gray-600">WebSocket 상태:</span>
                                        <span class="font-medium">
                                            {storeState.session.ws?.readyState === WebSocket.OPEN ? '열림' : 
                                             storeState.session.ws?.readyState === WebSocket.CONNECTING ? '연결 중' : 
                                             storeState.session.ws?.readyState === WebSocket.CLOSING ? '닫는 중' : 
                                             '닫힘'}
                                        </span>
                                    </div>
                                {/if}
                            </div>
                        </div>

                        <!-- 대화 통계 -->
                        <div class="bg-gray-50 rounded-lg p-3 border border-gray-200">
                            <div class="text-sm font-semibold text-gray-700 mb-3">대화 통계</div>
                            <div class="space-y-2 text-xs">
                                <div class="flex justify-between">
                                    <span class="text-gray-600">대화 텍스트 길이:</span>
                                    <span class="font-medium">{storeState.conversationText.length}자</span>
                                </div>
                            </div>
                        </div>
                    </div>
                {/if}

                <!-- 로그 탭 -->
                {#if activeTab === 'logs'}
                    <div class="flex flex-col flex-1 min-h-0">
                        <div class="px-4 py-2 bg-gray-50 border-b border-gray-200 flex justify-between items-center flex-shrink-0">
                            <div class="text-xs text-gray-600">
                                로그 수: {debugLogs.length}
                            </div>
                            <label class="flex items-center gap-2 text-xs text-gray-600">
                                <input
                                    type="checkbox"
                                    bind:checked={autoScroll}
                                    class="w-3 h-3"
                                />
                                자동 스크롤
                            </label>
                        </div>
                        <div 
                            bind:this={logsContainer}
                            class="flex-1 overflow-y-auto p-4 space-y-2 bg-gray-900 min-h-0"
                        >
                            {#if debugLogs.length === 0}
                                <div class="text-gray-500 text-sm text-center py-8">
                                    로그가 없습니다
                                </div>
                            {:else}
                                {#each debugLogs as log (log.id)}
                                    <div class="bg-gray-800 rounded p-2 border-l-2 {log.type === 'error' ? 'border-red-500' : log.type === 'warning' ? 'border-yellow-500' : log.type === 'success' ? 'border-green-500' : 'border-blue-500'}">
                                        <div class="flex justify-between items-start mb-1">
                                            <span class="text-xs font-medium {getLogTypeColor(log.type)}">
                                                [{log.type?.toUpperCase() || 'INFO'}]
                                            </span>
                                            <span class="text-xs text-gray-500">
                                                {formatTimestamp(log.timestamp)}
                                            </span>
                                        </div>
                                        <div class="text-xs text-gray-300 whitespace-pre-wrap break-words">
                                            {log.message}
                                        </div>
                                        {#if log.data}
                                            <details class="mt-1">
                                                <summary class="text-xs text-gray-400 cursor-pointer hover:text-gray-300">
                                                    데이터 보기
                                                </summary>
                                                <pre class="text-xs text-gray-400 mt-1 overflow-x-auto">{JSON.stringify(log.data, null, 2)}</pre>
                                            </details>
                                        {/if}
                                    </div>
                                {/each}
                            {/if}
                        </div>
                    </div>
                {/if}

                <!-- 에러 탭 -->
                {#if activeTab === 'errors'}
                    <div class="p-4 overflow-y-auto space-y-4" style="max-height: calc(85vh - 140px);">
                        {#if storeState.errorMessage}
                            <div class="bg-red-50 border border-red-200 rounded-lg p-3">
                                <div class="text-sm font-semibold text-red-900 mb-2">에러 메시지</div>
                                <div class="text-sm text-red-700">{storeState.errorMessage}</div>
                            </div>
                        {:else}
                            <div class="text-gray-500 text-sm text-center py-8">
                                에러가 없습니다
                            </div>
                        {/if}

                        <!-- 에러 로그 -->
                        {#if debugLogs.filter(log => log.type === 'error').length > 0}
                            <div class="space-y-2">
                                <div class="text-sm font-semibold text-gray-700">에러 로그</div>
                                {#each debugLogs.filter(log => log.type === 'error') as log (log.id)}
                                    <div class="bg-red-50 border border-red-200 rounded p-2">
                                        <div class="text-xs text-red-700 font-medium mb-1">
                                            {formatTimestamp(log.timestamp)}
                                        </div>
                                        <div class="text-xs text-red-600 whitespace-pre-wrap">
                                            {log.message}
                                        </div>
                                    </div>
                                {/each}
                            </div>
                        {/if}
                    </div>
                {/if}
            </div>
        </div>
    {/if}
</div>

<style>
    /* 스크롤바 스타일링 */
    :global(.overflow-y-auto)::-webkit-scrollbar {
        width: 6px;
    }
    
    :global(.overflow-y-auto)::-webkit-scrollbar-track {
        background: #f1f1f1;
        border-radius: 3px;
    }
    
    :global(.overflow-y-auto)::-webkit-scrollbar-thumb {
        background: #888;
        border-radius: 3px;
    }
    
    :global(.overflow-y-auto)::-webkit-scrollbar-thumb:hover {
        background: #555;
    }
</style>



