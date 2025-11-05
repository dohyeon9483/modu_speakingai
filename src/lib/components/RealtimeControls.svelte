<script>
    export let isConnected = false;
    export let status = 'disconnected';
    export let onConnect;
    export let onDisconnect;

</script>

<div class="flex flex-col items-center gap-4 mb-8">
    <div class="flex gap-4">
        <!-- 동적 버튼 - 연결 상태에 따라 하나만 표시 -->
        {#if !isConnected}
            <button
                on:click={onConnect}
                disabled={status === 'connecting'}
                class="px-8 py-4 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg shadow-lg transition-all duration-200 transform hover:scale-105 disabled:bg-gray-400 disabled:cursor-not-allowed disabled:transform-none disabled:hover:scale-100"
            >
                {#if status === 'connecting'}
                    🔄 연결 중...
                {:else}
                    🎤 실시간 회화 시작
                {/if}
            </button>
        {:else}
            <button
                on:click={onDisconnect}
                class="px-8 py-4 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg shadow-lg transition-all duration-200 transform hover:scale-105"
            >
                ⏹️ 연결 종료
            </button>
        {/if}
    </div>

    <!-- 상태 메시지 -->
    <div class="text-sm text-gray-600 text-center">
        {#if status === 'connecting'}
            <p>연결 중... 잠시만 기다려주세요</p>
        {:else if status === 'speaking'}
            <p>🤖 AI가 말하는 중...</p>
        {:else if status === 'listening'}
            <p>👂 듣는 중...</p>
        {:else if status === 'connected' || isConnected}
            <p>대화를 시작하세요</p>
        {:else}
            <p>실시간 회화를 시작하려면 시작 버튼을 클릭하세요</p>
        {/if}
    </div>
</div>
