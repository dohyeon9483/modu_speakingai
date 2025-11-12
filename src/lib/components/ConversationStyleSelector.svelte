<script>
    import { realtimeStore } from '$lib/stores/realtimeStore.js';
    import { getAllStyles } from '$lib/conversationStyles.js';

    const styles = getAllStyles();
    const selectedStyle = $derived($realtimeStore.selectedConversationStyle);
    const isConnected = $derived($realtimeStore.isConnected);

    function handleStyleChange(styleId) {
        if (isConnected) return;

        realtimeStore.setConversationStyle(styleId);
    }

    function handleDefaultSelect() {
        if (isConnected) return;

        realtimeStore.setConversationStyle(null);
    }
</script>

<div class="space-y-2">
    <button
        type="button"
        disabled={isConnected}
        onclick={handleDefaultSelect}
        class={`w-full flex items-center gap-3 px-3 py-2 rounded-lg border transition ${selectedStyle === null ? 'bg-white border-blue-400 text-blue-600 shadow-sm' : 'bg-white/70 border-transparent text-gray-700 hover:bg-white transition'}`}
    >
        <span class="text-xl">✨</span>
        <span class="text-sm font-semibold">기본</span>
        {#if selectedStyle === null}
            <span class="ml-auto text-xs text-blue-500">선택됨</span>
        {/if}
    </button>

    {#each styles as style (style.id)}
        {@const isSelected = selectedStyle === style.id}
        <button
            type="button"
            disabled={isConnected}
            onclick={() => handleStyleChange(style.id)}
            class={`w-full flex items-center gap-3 px-3 py-2 rounded-lg border transition ${isSelected ? 'bg-white border-blue-400 text-blue-600 shadow-sm' : 'bg-white/70 border-transparent text-gray-700 hover:bg-white transition'}`}
        >
            <span class="text-xl">{style.emoji}</span>
            <span class="text-sm font-semibold">{style.label}</span>
            {#if isSelected}
                <span class="ml-auto text-xs text-blue-500">선택됨</span>
            {/if}
        </button>
    {/each}
</div>
