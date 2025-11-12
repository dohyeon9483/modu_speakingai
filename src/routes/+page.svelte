<script>
    import { goto } from '$app/navigation';

    function goToVoice() {
        goto('/voice');
    }

    function goToText() {
        goto('/text');
    }
</script>

<div class="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-slate-100">
    <div class="max-w-4xl mx-auto px-4 py-16 md:py-24">
        <div class="text-center mb-12">
            <h1 class="text-4xl md:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">
                AI 실시간 대화 허브
            </h1>
            <p class="mt-4 text-gray-600 text-sm md:text-base">
                원하는 대화 방식을 선택하세요. 음성 대화는 실시간 Realtime API로, 텍스트 대화는 Chat API로 제공합니다.
            </p>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <button
                type="button"
                onclick={goToVoice}
                class="group flex flex-col gap-4 bg-white border border-blue-100 rounded-2xl p-8 shadow-lg hover:shadow-xl transition duration-200 text-left"
            >
                <div class="flex items-center justify-between">
                    <span class="text-4xl">🎙️</span>
                    <span class="text-sm font-semibold text-blue-500 group-hover:text-blue-600">실시간 음성</span>
                </div>
                <div>
                    <h2 class="text-2xl font-bold text-gray-800 mb-2">음성 대화</h2>
                    <p class="text-sm text-gray-600">
                        마이크를 통해 실시간으로 대화해요. 음성 상태와 연결 정보를 확인할 수 있습니다.
                    </p>
                </div>
                <div class="mt-auto flex items-center justify-between text-sm text-blue-500">
                    <span>바로 시작하기</span>
                    <span class="transform group-hover:translate-x-1 transition">→</span>
                </div>
            </button>

            <button
                type="button"
                onclick={goToText}
                class="group flex flex-col gap-4 bg-white border border-emerald-100 rounded-2xl p-8 shadow-lg hover:shadow-xl transition duration-200 text-left"
            >
                <div class="flex items-center justify-between">
                    <span class="text-4xl">💬</span>
                    <span class="text-sm font-semibold text-emerald-500 group-hover:text-emerald-600">채팅 모드</span>
                </div>
                <div>
                    <h2 class="text-2xl font-bold text-gray-800 mb-2">텍스트 대화</h2>
                    <p class="text-sm text-gray-600">
                        채팅 인터페이스로 자연스럽게 대화해요. 대화 기록은 실시간으로 채팅창에 표시됩니다.
                    </p>
                </div>
                <div class="mt-auto flex items-center justify-between text-sm text-emerald-500">
                    <span>바로 시작하기</span>
                    <span class="transform group-hover:translate-x-1 transition">→</span>
                </div>
            </button>
        </div>
    </div>
</div>
