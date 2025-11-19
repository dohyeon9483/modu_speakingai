<script>
    import { goto } from '$app/navigation';
    import { onMount } from 'svelte';
    import { getAllStyles } from '$lib/conversationStyles.js';

    /** @type {import('./$types').PageData} */
    let { data } = $props();

    const user = data.user;
    const styles = getAllStyles();

    let activeSection = $state('profile');
    let conversations = $state([]);
    let isLoadingConversations = $state(false);
    let editingId = $state(null);
    let editingTitle = $state('');
    let selectedIds = $state(new Set());
    
    // 사용자 프로필 상태
    let userProfile = $state({
        age: '',
        gender: '',
        personality: '',
        occupation: '',
        characteristics: ''
    });
    let isLoadingProfile = $state(false);
    let isSavingProfile = $state(false);

    function gotoChat() {
        goto('/chat');
    }

    function handleLogout() {
        fetch('/api/auth/logout', { method: 'POST' })
            .then(() => goto('/login'))
            .catch((error) => console.error('로그아웃 오류:', error));
    }

    async function loadConversations() {
        isLoadingConversations = true;
        try {
            const response = await fetch('/api/conversations/user');
            if (response.ok) {
                const result = await response.json();
                conversations = result.data || [];
            }
        } catch (error) {
            console.error('대화 목록 로드 오류:', error);
        } finally {
            isLoadingConversations = false;
        }
    }

    async function viewConversation(convId) {
        goto(`/chat?conversation=${convId}`);
    }

    function toggleSelect(convId) {
        const newSelected = new Set(selectedIds);
        if (newSelected.has(convId)) {
            newSelected.delete(convId);
        } else {
            newSelected.add(convId);
        }
        selectedIds = newSelected;
    }

    function toggleSelectAll() {
        if (selectedIds.size === conversations.length) {
            selectedIds = new Set();
        } else {
            selectedIds = new Set(conversations.map(c => c.id));
        }
    }

    function startEdit(conv) {
        editingId = conv.id;
        editingTitle = conv.title || '';
    }

    function cancelEdit() {
        editingId = null;
        editingTitle = '';
    }

    async function saveTitle(convId) {
        if (!editingTitle.trim()) {
            alert('제목을 입력해주세요.');
            return;
        }

        try {
            const response = await fetch(`/api/conversations/${convId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'update_title',
                    title: editingTitle.trim()
                })
            });

            if (response.ok) {
                await loadConversations();
                cancelEdit();
            } else {
                alert('제목 수정에 실패했습니다.');
            }
        } catch (error) {
            console.error('제목 수정 오류:', error);
            alert('제목 수정 중 오류가 발생했습니다.');
        }
    }

    async function deleteConversation(convId, title) {
        if (!confirm(`"${title}" 대화를 삭제하시겠습니까?\n이 작업은 되돌릴 수 없습니다.`)) {
            return;
        }

        try {
            const response = await fetch(`/api/conversations/${convId}`, {
                method: 'DELETE'
            });

            if (response.ok) {
                await loadConversations();
            } else {
                alert('대화 삭제에 실패했습니다.');
            }
        } catch (error) {
            console.error('대화 삭제 오류:', error);
            alert('대화 삭제 중 오류가 발생했습니다.');
        }
    }

    async function deleteSelected() {
        if (selectedIds.size === 0) {
            alert('삭제할 대화를 선택해주세요.');
            return;
        }

        if (!confirm(`선택한 ${selectedIds.size}개의 대화를 삭제하시겠습니까?\n이 작업은 되돌릴 수 없습니다.`)) {
            return;
        }

        try {
            const deletePromises = Array.from(selectedIds).map(id =>
                fetch(`/api/conversations/${id}`, { method: 'DELETE' })
            );
            await Promise.all(deletePromises);
            selectedIds = new Set();
            await loadConversations();
        } catch (error) {
            console.error('대화 삭제 오류:', error);
            alert('대화 삭제 중 오류가 발생했습니다.');
        }
    }

    async function downloadSummary(convId, title, event) {
        let button = null;
        try {
            console.log('📥 대화 요약 시작:', convId, title);
            
            // 대화 내용 가져오기
            const response = await fetch(`/api/conversations/${convId}/items`);
            console.log('📡 대화 내용 응답:', response.status);
            
            if (!response.ok) {
                const errorText = await response.text();
                console.error('❌ 대화 내용 로드 실패:', errorText);
                alert('대화 내용을 불러오는데 실패했습니다.');
                return;
            }

            const result = await response.json();
            const { items } = result.data;
            console.log('📝 대화 메시지 수:', items.length);

            if (items.length === 0) {
                alert('요약할 대화 내용이 없습니다.');
                return;
            }

            // 최소 메시지 수 체크
            if (items.length < 4) {
                alert('대화가 너무 짧아 요약할 수 없습니다.\n최소 2번 이상의 대화가 필요합니다.');
                return;
            }

            // 요약 생성 중 표시
            if (event) {
                button = event.target.closest('button');
                if (button) {
                    button.disabled = true;
                    button.textContent = '요약 생성 중...';
                }
            }

            // 메시지 형식 변환
            const messages = items.map(item => ({
                role: item.role,
                content: item.content
            }));
            console.log('✅ 메시지 변환 완료:', messages.length);

            // 요약 API 호출
            console.log('🤖 OpenAI 요약 API 호출 중...');
            const summaryResponse = await fetch('/api/conversations/summarize-conversation', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ messages })
            });

            console.log('📡 요약 API 응답:', summaryResponse.status);

            if (!summaryResponse.ok) {
                const errorData = await summaryResponse.json();
                console.error('❌ 요약 생성 실패:', errorData);
                alert(`요약 생성에 실패했습니다: ${errorData.error || '알 수 없는 오류'}`);
                if (button) {
                    button.disabled = false;
                    button.textContent = '요약 다운로드';
                }
                return;
            }

            const summaryData = await summaryResponse.json();
            const summary = summaryData.summary;
            console.log('✅ 요약 생성 완료, 길이:', summary?.length);

            if (!summary) {
                console.error('❌ 요약 내용이 비어있음');
                alert('요약 생성에 실패했습니다.');
                if (button) {
                    button.disabled = false;
                    button.textContent = '요약 다운로드';
                }
                return;
            }

            // 요약 다운로드
            const blob = new Blob([summary], { type: 'text/plain;charset=utf-8' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${title || 'conversation'}_요약.txt`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            
            console.log('✅ 다운로드 완료');

            if (button) {
                button.disabled = false;
                button.textContent = '요약 다운로드';
            }

        } catch (error) {
            console.error('❌ 요약 다운로드 오류:', error);
            alert(`요약 다운로드 중 오류가 발생했습니다: ${error.message}`);
            if (button) {
                button.disabled = false;
                button.textContent = '요약 다운로드';
            }
        }
    }

    async function loadUserProfile() {
        isLoadingProfile = true;
        try {
            const response = await fetch('/api/user/profile');
            if (response.ok) {
                const result = await response.json();
                userProfile = {
                    age: result.profile.age || '',
                    gender: result.profile.gender || '',
                    personality: result.profile.personality || '',
                    occupation: result.profile.occupation || '',
                    characteristics: result.profile.characteristics || ''
                };
            }
        } catch (error) {
            console.error('프로필 로드 오류:', error);
        } finally {
            isLoadingProfile = false;
        }
    }

    async function saveUserProfile() {
        isSavingProfile = true;
        try {
            const response = await fetch('/api/user/profile', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(userProfile)
            });

            if (response.ok) {
                alert('프로필이 저장되었습니다.');
            } else {
                alert('프로필 저장에 실패했습니다.');
            }
        } catch (error) {
            console.error('프로필 저장 오류:', error);
            alert('프로필 저장 중 오류가 발생했습니다.');
        } finally {
            isSavingProfile = false;
        }
    }

    async function downloadSelected() {
        if (selectedIds.size === 0) {
            alert('다운로드할 대화를 선택해주세요.');
            return;
        }

        try {
            for (const convId of selectedIds) {
                const response = await fetch(`/api/conversations/${convId}/items`);
                if (response.ok) {
                    const result = await response.json();
                    const { conversation, items } = result.data;

                    const textContent = items.map(item => {
                        const time = new Date(item.created_at).toLocaleTimeString('ko-KR', {
                            hour: '2-digit',
                            minute: '2-digit'
                        });
                        const role = item.role === 'user' ? '사용자' : 'AI';
                        return `[${time}] ${role}: ${item.content}`;
                    }).join('\n\n');

                    const blob = new Blob([textContent], { type: 'text/plain;charset=utf-8' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `${conversation.title || 'conversation'}.txt`;
                    document.body.appendChild(a);
                    a.click();
                    document.body.removeChild(a);
                    URL.revokeObjectURL(url);
                }
            }
        } catch (error) {
            console.error('다운로드 오류:', error);
            alert('다운로드 중 오류가 발생했습니다.');
        }
    }

    onMount(() => {
        loadConversations();
        loadUserProfile();
        
        // URL 쿼리 파라미터에서 section 확인
        const urlParams = new URLSearchParams(window.location.search);
        const section = urlParams.get('section');
        if (section) {
            activeSection = section;
        }
    });
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
                <button
                    type="button"
                    onclick={() => (activeSection = 'history')}
                    class={`w-full text-left px-4 py-2 rounded-lg text-sm font-semibold transition ${activeSection === 'history' ? 'bg-indigo-500 text-white shadow' : 'bg-white/70 text-slate-700 hover:bg-white'}`}
                >
                    📚 대화 기록
                </button>
            </div>
        </div>

        <div class="px-6 py-6 border-t border-slate-200 space-y-3">
            <button
                onclick={gotoChat}
                class="w-full px-4 py-2 bg-white border border-blue-200 text-blue-600 font-semibold rounded-lg shadow-sm hover:bg-blue-50 transition flex items-center justify-center gap-2"
            >
                <span>💬</span>
                <span>대화하기</span>
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
                <h1 class="text-3xl md:text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 to-blue-500">
                    마이페이지
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
                <section class="bg-white rounded-2xl shadow-lg p-6 space-y-6">
                    <div>
                        <h2 class="text-xl font-semibold text-gray-800 flex items-center gap-2">
                            <span class="text-2xl">⚙️</span>
                            환경 설정
                        </h2>
                        <p class="text-sm text-gray-500 mt-2">
                            나에 대한 정보를 입력하면 AI가 더 맞춤형 대화를 제공합니다.
                        </p>
                    </div>

                    <div class="bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <p class="text-xs text-blue-800">
                            ℹ️ 이 정보는 AI와 대화 시 사용되며, 별도로 다른 용도로 사용되지 않습니다. 원하지 않는다면 입력하지 않아도 됩니다.
                        </p>
                    </div>

                    {#if isLoadingProfile}
                        <div class="text-center py-8">
                            <p class="text-sm text-gray-500">프로필을 불러오는 중...</p>
                        </div>
                    {:else}
                        <form onsubmit={(e) => { e.preventDefault(); saveUserProfile(); }} class="space-y-4">
                            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <!-- 나이 -->
                                <div>
                                    <label for="age" class="block text-sm font-medium text-gray-700 mb-1">
                                        나이
                                    </label>
                                    <input
                                        type="number"
                                        id="age"
                                        bind:value={userProfile.age}
                                        placeholder="예: 25"
                                        class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    />
                                </div>

                                <!-- 성별 -->
                                <div>
                                    <label for="gender" class="block text-sm font-medium text-gray-700 mb-1">
                                        성별
                                    </label>
                                    <input
                                        type="text"
                                        id="gender"
                                        bind:value={userProfile.gender}
                                        placeholder="예: 남성, 여성"
                                        class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    />
                                </div>
                            </div>

                            <!-- 직업 -->
                            <div>
                                <label for="occupation" class="block text-sm font-medium text-gray-700 mb-1">
                                    직업
                                </label>
                                <input
                                    type="text"
                                    id="occupation"
                                    bind:value={userProfile.occupation}
                                    placeholder="예: 개발자, 학생, 디자이너"
                                    class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                            </div>

                            <!-- 성격 -->
                            <div>
                                <label for="personality" class="block text-sm font-medium text-gray-700 mb-1">
                                    성격
                                </label>
                                <textarea
                                    id="personality"
                                    bind:value={userProfile.personality}
                                    placeholder="예: 활발하고 긍정적인 성격, 내향적이고 신중한 편"
                                    rows="3"
                                    class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                                ></textarea>
                            </div>

                            <!-- 특징 -->
                            <div>
                                <label for="characteristics" class="block text-sm font-medium text-gray-700 mb-1">
                                    특징 및 관심사
                                </label>
                                <textarea
                                    id="characteristics"
                                    bind:value={userProfile.characteristics}
                                    placeholder="예: 운동을 좋아하고 건강에 관심이 많음, 책 읽기와 영화 감상을 즐김"
                                    rows="3"
                                    class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                                ></textarea>
                            </div>

                            <!-- 저장 버튼 -->
                            <div class="flex justify-end">
                                <button
                                    type="submit"
                                    disabled={isSavingProfile}
                                    class="px-6 py-2 bg-blue-500 hover:bg-blue-600 text-white font-semibold rounded-lg shadow-md transition disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {isSavingProfile ? '저장 중...' : '프로필 저장'}
                                </button>
                            </div>
                        </form>
                    {/if}
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
            {:else if activeSection === 'history'}
                <section class="bg-white rounded-2xl shadow-lg p-6 space-y-4">
                    <div class="flex items-center justify-between">
                        <h2 class="text-xl font-semibold text-gray-800 flex items-center gap-2">
                            <span class="text-2xl">📚</span>
                            대화 기록
                        </h2>
                    </div>

                    {#if !isLoadingConversations && conversations.length > 0}
                        <div class="bg-gray-50 rounded-xl p-4 flex flex-wrap items-center gap-3">
                            <label class="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={selectedIds.size === conversations.length && conversations.length > 0}
                                    onchange={toggleSelectAll}
                                    class="w-5 h-5 text-indigo-500 rounded focus:ring-2 focus:ring-indigo-500"
                                />
                                <span class="text-sm font-medium text-gray-700">전체 선택</span>
                            </label>
                            
                            {#if selectedIds.size > 0}
                                <div class="flex items-center gap-2 ml-auto">
                                    <span class="text-sm text-gray-600">{selectedIds.size}개 선택됨</span>
                                    <button
                                        onclick={downloadSelected}
                                        class="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white text-sm font-medium rounded-lg transition"
                                    >
                                        다운로드
                                    </button>
                                    <button
                                        onclick={deleteSelected}
                                        class="px-4 py-2 bg-red-500 hover:bg-red-600 text-white text-sm font-medium rounded-lg transition"
                                    >
                                        삭제
                                    </button>
                                </div>
                            {/if}
                        </div>
                    {/if}

                    {#if isLoadingConversations}
                        <div class="text-center py-8">
                            <div class="inline-block w-6 h-6 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                            <p class="mt-2 text-sm text-gray-600">로딩 중...</p>
                        </div>
                    {:else if conversations.length === 0}
                        <div class="text-center py-8">
                            <p class="text-gray-500">대화 기록이 없습니다.</p>
                        </div>
                    {:else}
                        <div class="space-y-3 max-h-[600px] overflow-y-auto pr-2">
                            {#each conversations as conv}
                                <div class="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition">
                                    <div class="flex items-start gap-4">
                                        <label class="flex items-center pt-1 cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={selectedIds.has(conv.id)}
                                                onchange={() => toggleSelect(conv.id)}
                                                class="w-5 h-5 text-indigo-500 rounded focus:ring-2 focus:ring-indigo-500"
                                            />
                                        </label>

                                        <div class="flex-1">
                                            {#if editingId === conv.id}
                                                <input
                                                    type="text"
                                                    bind:value={editingTitle}
                                                    class="w-full px-3 py-2 border border-indigo-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 font-semibold"
                                                    placeholder="대화 제목"
                                                />
                                            {:else}
                                                <h3 class="font-semibold text-gray-800">{conv.title || '제목 없음'}</h3>
                                            {/if}
                                            <div class="flex items-center gap-2 mt-1 text-xs text-gray-600">
                                                <span>{new Date(conv.started_at).toLocaleDateString('ko-KR')}</span>
                                            </div>
                                        </div>

                                        <div class="flex items-center gap-2">
                                            {#if editingId === conv.id}
                                                <button
                                                    onclick={() => saveTitle(conv.id)}
                                                    class="px-3 py-1.5 bg-indigo-500 hover:bg-indigo-600 text-white text-xs font-medium rounded transition"
                                                >
                                                    저장
                                                </button>
                                                <button
                                                    onclick={cancelEdit}
                                                    class="px-3 py-1.5 bg-gray-300 hover:bg-gray-400 text-gray-700 text-xs font-medium rounded transition"
                                                >
                                                    취소
                                                </button>
                                            {:else}
                                                <button
                                                    onclick={() => viewConversation(conv.id)}
                                                    class="px-3 py-1.5 bg-blue-500 hover:bg-blue-600 text-white text-xs font-medium rounded transition"
                                                >
                                                    보기
                                                </button>
                                                <button
                                                    onclick={(e) => downloadSummary(conv.id, conv.title, e)}
                                                    class="px-3 py-1.5 bg-green-500 hover:bg-green-600 text-white text-xs font-medium rounded transition"
                                                >
                                                    요약 다운로드
                                                </button>
                                                <button
                                                    onclick={() => startEdit(conv)}
                                                    class="px-3 py-1.5 bg-indigo-500 hover:bg-indigo-600 text-white text-xs font-medium rounded transition"
                                                >
                                                    수정
                                                </button>
                                                <button
                                                    onclick={() => deleteConversation(conv.id, conv.title)}
                                                    class="px-3 py-1.5 bg-red-500 hover:bg-red-600 text-white text-xs font-medium rounded transition"
                                                >
                                                    삭제
                                                </button>
                                            {/if}
                                        </div>
                                    </div>
                                </div>
                            {/each}
                        </div>
                    {/if}
                </section>
            {/if}
        </div>
    </main>
</div>
