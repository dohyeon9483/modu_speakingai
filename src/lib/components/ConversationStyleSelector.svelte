<script>
    import { realtimeStore } from '$lib/stores/realtimeStore.js';
    import { getAllStyles } from '$lib/conversationStyles.js';

    const styles = getAllStyles();
    const selectedStyle = $derived($realtimeStore.selectedConversationStyle);
    const isConnected = $derived($realtimeStore.isConnected);

    function handleStyleChange(styleId) {
        // 연결 중이면 스타일 변경 불가
        if (isConnected) return;
        
        const style = styles.find(s => s.id === styleId);
        console.group('🎨 대화 스타일 변경');
        console.log('변경 전 스타일:', $realtimeStore.selectedConversationStyle || 'null (기본)');
        console.log('변경할 스타일 ID:', styleId);
        if (style) {
            console.log('변경할 스타일 정보:', {
                id: style.id,
                label: style.label,
                emoji: style.emoji
            });
        }
        
        realtimeStore.setConversationStyle(styleId);
        
        // 변경 후 확인
        setTimeout(() => {
            console.log('변경 후 스타일:', $realtimeStore.selectedConversationStyle || 'null (기본)');
            console.log('✅ 스타일 변경 완료');
            console.groupEnd();
        }, 0);
    }

    function handleDefaultSelect() {
        if (isConnected) return;
        
        console.group('🎨 대화 스타일 변경');
        console.log('변경 전 스타일:', $realtimeStore.selectedConversationStyle || 'null (기본)');
        console.log('변경할 스타일: 기본 (null)');
        
        realtimeStore.setConversationStyle(null);
        
        // 변경 후 확인
        setTimeout(() => {
            console.log('변경 후 스타일:', $realtimeStore.selectedConversationStyle || 'null (기본)');
            console.log('✅ 기본 스타일로 변경 완료');
            console.groupEnd();
        }, 0);
    }

    // 색상 클래스 매핑
    const colorClasses = {
        blue: {
            default: 'bg-blue-50 border-blue-200 text-blue-900',
            selected: 'bg-blue-500 border-blue-600 text-white shadow-lg shadow-blue-200',
            hover: 'hover:bg-blue-100 hover:border-blue-300'
        },
        green: {
            default: 'bg-green-50 border-green-200 text-green-900',
            selected: 'bg-green-500 border-green-600 text-white shadow-lg shadow-green-200',
            hover: 'hover:bg-green-100 hover:border-green-300'
        },
        purple: {
            default: 'bg-purple-50 border-purple-200 text-purple-900',
            selected: 'bg-purple-500 border-purple-600 text-white shadow-lg shadow-purple-200',
            hover: 'hover:bg-purple-100 hover:border-purple-300'
        },
        pink: {
            default: 'bg-pink-50 border-pink-200 text-pink-900',
            selected: 'bg-pink-500 border-pink-600 text-white shadow-lg shadow-pink-200',
            hover: 'hover:bg-pink-100 hover:border-pink-300'
        },
        orange: {
            default: 'bg-orange-50 border-orange-200 text-orange-900',
            selected: 'bg-orange-500 border-orange-600 text-white shadow-lg shadow-orange-200',
            hover: 'hover:bg-orange-100 hover:border-orange-300'
        },
        gray: {
            default: 'bg-gray-50 border-gray-200 text-gray-900',
            selected: 'bg-gray-700 border-gray-800 text-white shadow-lg shadow-gray-200',
            hover: 'hover:bg-gray-100 hover:border-gray-300'
        }
    };

    function getColorClasses(style, isSelected) {
        if (!style) {
            const gray = colorClasses.gray;
            return isSelected ? gray.selected : gray.default;
        }
        const color = colorClasses[style.color] || colorClasses.gray;
        return isSelected ? color.selected : color.default;
    }

    function getHoverClasses(style) {
        if (!style) return colorClasses.gray.hover;
        const color = colorClasses[style.color] || colorClasses.gray;
        return color.hover;
    }

    function getRingColor(style) {
        if (!style) return 'ring-gray-200';
        const ringColors = {
            blue: 'ring-blue-200',
            green: 'ring-green-200',
            purple: 'ring-purple-200',
            pink: 'ring-pink-200',
            orange: 'ring-orange-200',
            gray: 'ring-gray-200'
        };
        return ringColors[style.color] || 'ring-gray-200';
    }
</script>

<div class="bg-white rounded-2xl shadow-xl p-6 md:p-8">
    <div class="mb-6">
        <h2 class="text-2xl md:text-3xl font-bold text-gray-800 mb-2 flex items-center gap-3">
            <span class="text-3xl">🎨</span>
            <span>어떤 대화를 나누고 싶으신가요?</span>
        </h2>
        <p class="text-gray-600 text-sm md:text-base ml-11">
            원하는 대화 스타일을 선택하면 AI가 그에 맞춰 대화해드려요
        </p>
    </div>

    {#if isConnected}
        <div class="mb-4 p-4 bg-amber-50 border border-amber-200 rounded-xl">
            <p class="text-sm text-amber-800 flex items-center gap-2">
                <span>⚠️</span>
                <span>대화 중에는 스타일을 변경할 수 없어요. 연결을 종료한 후 변경해주세요.</span>
            </p>
        </div>
    {/if}

    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <!-- 기본 스타일 -->
        <button
            type="button"
            disabled={isConnected}
            onclick={handleDefaultSelect}
            class="group relative p-5 rounded-xl border-2 transition-all duration-300 transform {getColorClasses(null, selectedStyle === null)} {selectedStyle === null ? 'scale-105 ring-4 ring-gray-200' : getHoverClasses(null)} {isConnected ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer hover:scale-105'}"
        >
            <div class="flex flex-col items-center text-center space-y-3">
                <div class="text-4xl transform transition-transform duration-300 {selectedStyle === null ? 'scale-110' : 'group-hover:scale-110'}">
                    ✨
                </div>
                <div>
                    <div class="font-bold text-lg mb-1">기본 대화</div>
                    <div class="text-xs opacity-90">
                        {selectedStyle === null ? '선택됨' : '일반적인 친절한 대화'}
                    </div>
                </div>
            </div>
            {#if selectedStyle === null}
                <div class="absolute top-2 right-2 w-6 h-6 bg-white rounded-full flex items-center justify-center">
                    <span class="text-green-500 text-lg">✓</span>
                </div>
            {/if}
        </button>

        <!-- 각 스타일 옵션 -->
        {#each styles as style (style.id)}
            {@const isSelected = selectedStyle === style.id}
            <button
                type="button"
                disabled={isConnected}
                onclick={() => handleStyleChange(style.id)}
                class="group relative p-5 rounded-xl border-2 transition-all duration-300 transform {getColorClasses(style, isSelected)} {isSelected ? 'scale-105 ring-4 ' + getRingColor(style) : getHoverClasses(style)} {isConnected ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer hover:scale-105'}"
            >
                <div class="flex flex-col items-center text-center space-y-3">
                    <div class="text-4xl transform transition-transform duration-300 {isSelected ? 'scale-110' : 'group-hover:scale-110'}">
                        {style.emoji}
                    </div>
                    <div>
                        <div class="font-bold text-lg mb-1">{style.label}</div>
                        <div class="text-xs opacity-90">
                            {isSelected ? '선택됨' : style.description}
                        </div>
                    </div>
                </div>
                {#if isSelected}
                    <div class="absolute top-2 right-2 w-6 h-6 bg-white rounded-full flex items-center justify-center shadow-md">
                        <span class="text-green-500 text-lg">✓</span>
                    </div>
                {/if}
            </button>
        {/each}
    </div>

    <!-- 선택된 스타일 안내 -->
    {#if selectedStyle !== null}
        {@const selectedStyleObj = styles.find(s => s.id === selectedStyle)}
        {#if selectedStyleObj}
            <div class="mt-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl">
                <div class="flex items-center gap-3">
                    <span class="text-2xl">{selectedStyleObj.emoji}</span>
                    <div>
                        <p class="font-semibold text-blue-900">
                            "{selectedStyleObj.label}" 모드로 대화를 시작할 준비가 되었어요!
                        </p>
                        <p class="text-sm text-blue-700 mt-1">
                            {selectedStyleObj.description}
                        </p>
                    </div>
                </div>
            </div>
        {/if}
    {:else}
        <div class="mt-6 p-4 bg-gradient-to-r from-gray-50 to-slate-50 border border-gray-200 rounded-xl">
            <div class="flex items-center gap-3">
                <span class="text-2xl">✨</span>
                <div>
                    <p class="font-semibold text-gray-900">
                        기본 모드로 대화를 시작할 준비가 되었어요!
                    </p>
                    <p class="text-sm text-gray-700 mt-1">
                        친절하고 도움이 되는 일반적인 대화를 즐기실 수 있어요
                    </p>
                </div>
            </div>
        </div>
    {/if}
</div>
