<script>
    import { goto } from '$app/navigation';
    import { getAllStyles } from '$lib/conversationStyles.js';

    /** @type {import('./$types').PageData} */
    let { data } = $props();

    const user = data.user;
    const styles = getAllStyles();

    let activeSection = $state('profile');

    function gotoVoice() {
        goto('/voice');
    }

    function gotoText() {
        goto('/text');
    }

    function handleLogout() {
        fetch('/api/auth/logout', { method: 'POST' })
            .then(() => goto('/login'))
            .catch((error) => console.error('로그아웃 오류:', error));
    }
</script>

<div class="min-h-screen flex bg-gradient-to-br from-slate-50 via-blue-50 to-emerald-50">
    <!-- Sidebar -->
    <aside class="w-72 min-h-screen bg-white/80 border-r border-slate-200 backdrop-blur-sm flex flex-col">
        <div class="px-6 py-6 border-b border-slate-200">
            <h2 class="text-xs uppercase tracking-wide text-slate-500">My Page</h2>
            <h1 class="mt-1 text-2xl font-bold text-slate-900">개인 메뉴</h1>
        </div>

        <div class="flex-1 overflow-y-auto px-6 py-6 space-y-6">
            <div class="space-y-2">
                <p class="text-xs uppercase tracking-wide text-slate-500">마이페이지</p>
                <button
                    type="button"
                    onclick={() => (activeSection = 'profile')}
                    class={`w-full text-left px-4 py-2 rounded-lg text-sm font-semibold transition ${activeSection === 'profile' ? 'bg-indigo-500 text-white shadow' : 'bg-white/70 text-slate-700 hover:bg-white'}`}
                >
                    📄 기본 정보
                </button>
                <button
                    type="button"
                    onclick={() => (activeSection = 'settings')}
                    class={`w-full text-left px-4 py-2 rounded-lg text-sm font-semibold transition ${activeSection === 'settings' ? 'bg-indigo-500 text-white shadow' : 'bg-white/70 text-slate-700 hover:bg-white'}`}
                >
                    ⚙️ 환경 설정
                </button>
                <button
                    type="button"
                    onclick={() => (activeSection = 'styles')}
                    class={`w-full text-left px-4 py-2 rounded-lg text-sm font-semibold transition ${activeSection === 'styles' ? 'bg-indigo-500 text-white shadow' : 'bg-white/70 text-slate-700 hover:bg-white'}`}
                >
                    🎨 대화 스타일 안내
                </button>
            </div>
        </div>

        <div class="px-6 py-6 border-t border-slate-200 space-y-3">
            <button
                onclick={gotoVoice}
                class="w-full px-4 py-2 bg-white border border-blue-200 text-blue-600 font-semibold rounded-lg shadow-sm hover:bg-blue-50 transition flex items-center justify-center gap-2"
            >
                <span>🎙️</span>
                <span>실시간 음성 바로가기</span>
            </button>
            <button
                onclick={gotoText}
                class="w-full px-4 py-2 bg-white border border-emerald-200 text-emerald-600 font-semibold rounded-lg shadow-sm hover:bg-emerald-50 transition flex items-center justify-center gap-2"
            >
                <span>💬</span>
                <span>텍스트 대화 바로가기</span>
            </button>
            <button
                onclick={handleLogout}
                class="w-full px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white font-semibold rounded-lg shadow-md transition flex items-center justify-center gap-2"
            >
                <span>🚪</span>
                <span>로그아웃</span>
            </button>
        </div>
    </aside>

    <!-- Main content -->
    <main class="flex-1">
        <div class="max-w-4xl mx-auto px-4 md:px-8 py-12 space-y-8">
            <header class="space-y-2">
                <h1 class="text-3xl md:text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 to-blue-500 flex items-center gap-3">
                    <span class="text-4xl">👤</span>
                    <span>마이페이지</span>
                </h1>
                <p class="text-gray-600 text-sm md:text-base">
                    {user?.name ? `${user.name}님, 반갑습니다!` : '안녕하세요!'} 개인 설정과 대화 스타일 안내를 확인해보세요.
                </p>
            </header>

            {#if activeSection === 'profile'}
                <section class="bg-white rounded-2xl shadow-lg p-6 space-y-4">
                    <h2 class="text-xl font-semibold text-gray-800 flex items-center gap-2">
                        <span class="text-2xl">📄</span>
                        기본 정보
                    </h2>
                    <div class="space-y-3 text-sm text-gray-600">
                        <p><span class="font-semibold text-gray-800">이름:</span> {user?.name || '알 수 없음'}</p>
                        <p><span class="font-semibold text-gray-800">이메일:</span> {user?.email || '알 수 없음'}</p>
                        <p><span class="font-semibold text-gray-800">가입일:</span> {user?.created_at ? new Date(user.created_at).toLocaleDateString('ko-KR') : '알 수 없음'}</p>
                    </div>
                </section>
            {:else if activeSection === 'settings'}
                <section class="bg-white rounded-2xl shadow-lg p-6 space-y-4">
                    <h2 class="text-xl font-semibold text-gray-800 flex items-center gap-2">
                        <span class="text-2xl">⚙️</span>
                        환경 설정
                    </h2>
                    <p class="text-sm text-gray-600">
                        곧 환경 설정 기능이 제공될 예정입니다. 음성·텍스트 대화 환경을 세밀하게 조정할 수 있도록 준비 중입니다.
                    </p>
                </section>
            {:else if activeSection === 'styles'}
                <section class="bg-white rounded-2xl shadow-lg p-6 space-y-4">
                    <h2 class="text-xl font-semibold text-gray-800 flex items-center gap-2">
                        <span class="text-2xl">🎨</span>
                        대화 스타일 안내
                    </h2>
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {#each styles as style}
                            <div class="border border-gray-100 rounded-xl p-4 bg-gray-50">
                                <div class="flex items-center gap-2 mb-2">
                                    <span class="text-2xl">{style.emoji}</span>
                                    <h3 class="text-sm font-semibold text-gray-800">{style.label}</h3>
                                </div>
                                <p class="text-xs text-gray-600 whitespace-pre-wrap">{style.longDescription || style.description}</p>
                            </div>
                        {/each}
                    </div>
                </section>
            {/if}
        </div>
    </main>
</div>
