<script>
    import { realtimeStore } from '$lib/stores/realtimeStore.js';
    import { getAllStyles } from '$lib/conversationStyles.js';

    const styles = getAllStyles();
    const selectedStyle = $derived($realtimeStore.selectedConversationStyle);
    const isConnected = $derived($realtimeStore.isConnected);
    
    let isOpen = $state(false);
    let hoveredStyle = $state(null);

    function handleStyleSelect(styleId) {
        if (isConnected) return;

        if (styleId === 'default') {
            realtimeStore.setConversationStyle(null);
        } else {
            realtimeStore.setConversationStyle(styleId);
        }
        isOpen = false;
    }

    function toggleDropdown() {
        if (isConnected) return;
        isOpen = !isOpen;
    }

    function closeDropdown() {
        isOpen = false;
        hoveredStyle = null;
    }

    // 선택된 스타일의 정보 가져오기
    const selectedStyleInfo = $derived(() => {
        if (selectedStyle === null) {
            return { emoji: '✨', label: '기본' };
        }
        const style = styles.find(s => s.id === selectedStyle);
        return style || { emoji: '✨', label: '기본' };
    });
</script>

<svelte:window onclick={(e) => {
    if (!e.target.closest('.dropdown-container')) {
        closeDropdown();
    }
}} />

<style>
    @keyframes fade-in {
        from {
            opacity: 0;
            transform: translateY(10px);
        }
        to {
            opacity: 1;
            transform: translateY(0);
        }
    }
    .animate-fade-in {
        animation: fade-in 0.2s ease-out;
    }
</style>

<div class="space-y-2 dropdown-container">
    <label class="block">
        <div class="text-xs font-semibold text-gray-600 mb-1 px-1">대화 스타일</div>
        <div class="relative">
            <!-- Selected Value Display -->
            <button
                type="button"
                disabled={isConnected}
                onclick={toggleDropdown}
                class="w-full px-3 py-2.5 pr-10 rounded-lg border border-gray-200 bg-white text-sm font-medium text-gray-700 text-left cursor-pointer hover:border-emerald-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
                <span>{selectedStyleInfo().emoji} {selectedStyleInfo().label}</span>
            </button>
            
            <!-- Dropdown Arrow -->
            <div class="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                <svg class="w-4 h-4 text-gray-400 transition-transform {isOpen ? 'rotate-180' : ''}" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>
                </svg>
            </div>

            <!-- Dropdown Menu -->
            {#if isOpen}
                <div class="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-80 overflow-y-auto">
                    <!-- Default Option -->
                    <button
                        type="button"
                        onclick={() => handleStyleSelect('default')}
                        onmouseenter={() => hoveredStyle = 'default'}
                        onmouseleave={() => hoveredStyle = null}
                        class="w-full px-3 py-2.5 text-left text-sm hover:bg-emerald-50 transition flex items-center gap-2 {selectedStyle === null ? 'bg-emerald-50 text-emerald-700 font-semibold' : 'text-gray-700'}"
                    >
                        <span class="text-lg">✨</span>
                        <span>기본</span>
                        {#if selectedStyle === null}
                            <span class="ml-auto text-xs text-emerald-500">✓</span>
                        {/if}
                    </button>

                    <!-- Style Options -->
                    {#each styles as style (style.id)}
                        {@const isSelected = selectedStyle === style.id}
                        <button
                            type="button"
                            onclick={() => handleStyleSelect(style.id)}
                            onmouseenter={() => hoveredStyle = style.id}
                            onmouseleave={() => hoveredStyle = null}
                            class="w-full px-3 py-2.5 text-left text-sm hover:bg-emerald-50 transition flex items-center gap-2 {isSelected ? 'bg-emerald-50 text-emerald-700 font-semibold' : 'text-gray-700'}"
                        >
                            <span class="text-lg">{style.emoji}</span>
                            <span>{style.label}</span>
                            {#if isSelected}
                                <span class="ml-auto text-xs text-emerald-500">✓</span>
                            {/if}
                        </button>
                    {/each}
                </div>
            {/if}

            <!-- Tooltip (positioned below the dropdown) -->
            {#if hoveredStyle && isOpen}
                {@const tooltipStyle = hoveredStyle === 'default' 
                    ? { emoji: '✨', label: '기본', longDescription: '친절하고 도움이 되는 기본 대화 모드입니다. 일반적인 대화와 질문에 적합합니다.' }
                    : styles.find(s => s.id === hoveredStyle)
                }
                {#if tooltipStyle}
                    <div class="fixed bottom-4 left-4 right-4 z-[60] bg-gray-900 text-white text-sm rounded-lg shadow-2xl p-4 pointer-events-none animate-fade-in">
                        <div class="font-semibold mb-2 flex items-center gap-2">
                            <span class="text-lg">{tooltipStyle.emoji}</span>
                            <span>{tooltipStyle.label}</span>
                        </div>
                        <div class="text-gray-300 leading-relaxed">
                            {tooltipStyle.longDescription}
                        </div>
                    </div>
                {/if}
            {/if}
        </div>
    </label>
</div>
