<script>
    import { realtimeStore } from '$lib/stores/realtimeStore.js';

    const chatMode = $derived($realtimeStore.chatMode || 'voice');
    const isConnected = $derived($realtimeStore.isConnected);

    function handleModeChange(mode) {
        if (isConnected) return;
        realtimeStore.setChatMode(mode);
        console.log('💬 대화 모드 변경:', mode);
    }
</script>

<div class="mb-4">
    <h3 class="text-sm font-semibold text-gray-800 mb-3 flex items-center gap-2">
        <span class="text-lg">🎙️</span>
        <span>대화 모드 (이 페이지에서 설정만 가능합니다)</span>
    </h3>
    <p class="text-xs text-gray-500 mb-3">
        음성 대화는 <span class="font-semibold text-blue-600">/voice</span>, 텍스트 대화는 <span class="font-semibold text-emerald-600">/text</span> 페이지에서 진행하세요.
    </p>

    {#if isConnected}
        <div class="mb-3 p-3 bg-amber-50 border border-amber-200 rounded-lg">
            <p class="text-xs text-amber-800 flex items-center gap-2">
                <span>⚠️</span>
                <span>대화 중에는 모드를 변경할 수 없어요. 연결을 종료한 후 변경해주세요.</span>
            </p>
        </div>
    {/if}

    <div class="grid grid-cols-2 gap-2">
        <button
            type="button"
            disabled={isConnected}
            onclick={() => handleModeChange('voice')}
            class={`p-3 rounded-lg border-2 transition-all duration-300 ${
                chatMode === 'voice'
                    ? 'bg-gradient-to-br from-blue-500 to-indigo-600 border-blue-600 text-white shadow-lg'
                    : 'bg-white border-gray-200 text-gray-700 hover:border-blue-300 hover:bg-blue-50'
            } ${isConnected ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'}`}
        >
            <div class="flex flex-col items-center gap-2">
                <div class="text-2xl">🎤</div>
                <div class="text-xs font-semibold">음성 대화</div>
            </div>
        </button>

        <button
            type="button"
            disabled={isConnected}
            onclick={() => handleModeChange('text')}
            class={`p-3 rounded-lg border-2 transition-all duration-300 ${
                chatMode === 'text'
                    ? 'bg-gradient-to-br from-green-500 to-emerald-600 border-green-600 text-white shadow-lg'
                    : 'bg-white border-gray-200 text-gray-700 hover:border-green-300 hover:bg-green-50'
            } ${isConnected ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'}`}
        >
            <div class="flex flex-col items-center gap-2">
                <div class="text-2xl">💬</div>
                <div class="text-xs font-semibold">텍스트 대화</div>
            </div>
        </button>
    </div>
</div>

