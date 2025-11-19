<script>
    import { goto } from '$app/navigation';
    import { onMount } from 'svelte';

    /** @type {import('./$types').PageData} */
    let { data } = $props();

    let conversations = $state([]);
    let isLoading = $state(false);
    let editingId = $state(null);
    let editingTitle = $state('');
    let selectedIds = $state(new Set());

    async function loadConversations() {
        isLoading = true;
        try {
            const response = await fetch('/api/conversations/user');
            if (response.ok) {
                const result = await response.json();
                conversations = result.data || [];
            }
        } catch (error) {
            console.error('대화 목록 로드 오류:', error);
        } finally {
            isLoading = false;
        }
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
    });
</script>

<div class="min-h-screen flex bg-gradient-to-br from-emerald-50 via-sky-50 to-slate-100">
    <!-- Sidebar -->
    <aside class="w-72 min-h-screen bg-emerald-100 border-r border-emerald-200 flex flex-col">
        <div class="px-6 py-6 border-b border-emerald-200">
            <p class="text-xs uppercase tracking-wide text-emerald-700">Manage</p>
            <h2 class="text-xl font-bold text-emerald-900">대화 관리</h2>
        </div>

        <div class="flex-1 overflow-y-auto px-6 py-6">
            <button
                onclick={() => goto('/text')}
                class="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-semibold shadow-sm transition"
            >
                <span>←</span>
                <span>대화로 돌아가기</span>
            </button>
        </div>

        <div class="px-6 py-6 border-t border-emerald-200 space-y-3">
            <button
                onclick={() => goto('/mypage')}
                class="w-full px-4 py-2 bg-white border border-emerald-200 text-emerald-700 font-semibold rounded-lg shadow-sm hover:bg-emerald-50 transition flex items-center justify-center gap-2"
            >
                <span>👤</span>
                <span>마이페이지</span>
            </button>
            <button
                onclick={() => fetch('/api/auth/logout', { method: 'POST' }).then(() => goto('/login'))}
                class="w-full px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white font-semibold rounded-lg shadow-md transition flex items-center justify-center gap-2"
            >
                <span>🚪</span>
                <span>로그아웃</span>
            </button>
        </div>
    </aside>

    <!-- Main content -->
    <main class="flex-1">
        <div class="max-w-4xl mx-auto px-4 md:px-8 py-10 md:py-16 space-y-8">
            <header>
                <h1 class="text-3xl md:text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-emerald-500 to-blue-500 flex items-center gap-3">
                    <span class="text-4xl">📝</span>
                    <span>대화 관리</span>
                </h1>
                <p class="text-gray-600 mt-2 text-sm md:text-base">
                    대화 제목을 수정하거나 불필요한 대화를 삭제할 수 있습니다.
                </p>
            </header>

            {#if !isLoading && conversations.length > 0}
                <div class="bg-white rounded-xl shadow-lg p-4 flex flex-wrap items-center gap-3">
                    <label class="flex items-center gap-2 cursor-pointer">
                        <input
                            type="checkbox"
                            checked={selectedIds.size === conversations.length && conversations.length > 0}
                            onchange={toggleSelectAll}
                            class="w-5 h-5 text-emerald-500 rounded focus:ring-2 focus:ring-emerald-500"
                        />
                        <span class="text-sm font-medium text-gray-700">전체 선택</span>
                    </label>
                    
                    {#if selectedIds.size > 0}
                        <div class="flex items-center gap-2 ml-auto">
                            <span class="text-sm text-gray-600">{selectedIds.size}개 선택됨</span>
                            <button
                                onclick={downloadSelected}
                                class="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white text-sm font-medium rounded-lg transition flex items-center gap-2"
                            >
                                <span>💾</span>
                                <span>다운로드</span>
                            </button>
                            <button
                                onclick={deleteSelected}
                                class="px-4 py-2 bg-red-500 hover:bg-red-600 text-white text-sm font-medium rounded-lg transition flex items-center gap-2"
                            >
                                <span>🗑️</span>
                                <span>삭제</span>
                            </button>
                        </div>
                    {/if}
                </div>
            {/if}

            {#if isLoading}
                <div class="text-center py-12">
                    <div class="inline-block w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
                    <p class="mt-4 text-gray-600">로딩 중...</p>
                </div>
            {:else if conversations.length === 0}
                <div class="bg-white rounded-2xl shadow-lg p-12 text-center">
                    <p class="text-gray-500">대화 기록이 없습니다.</p>
                </div>
            {:else}
                <div class="space-y-4">
                    {#each conversations as conv}
                        <div class="bg-white rounded-xl shadow-md p-6 space-y-4">
                            <div class="flex items-start gap-4">
                                <label class="flex items-center pt-1 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={selectedIds.has(conv.id)}
                                        onchange={() => toggleSelect(conv.id)}
                                        class="w-5 h-5 text-emerald-500 rounded focus:ring-2 focus:ring-emerald-500"
                                    />
                                </label>

                                <div class="flex-1">
                                    {#if editingId === conv.id}
                                        <input
                                            type="text"
                                            bind:value={editingTitle}
                                            class="w-full px-3 py-2 border border-emerald-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 text-lg font-semibold"
                                            placeholder="대화 제목"
                                        />
                                    {:else}
                                        <h3 class="text-lg font-semibold text-gray-800">
                                            {conv.title || '제목 없음'}
                                        </h3>
                                    {/if}
                                    <div class="flex items-center gap-3 mt-2 text-sm text-gray-600">
                                        <span class={`px-2 py-1 rounded text-xs font-medium ${
                                            conv.status === 'active' 
                                                ? 'bg-green-100 text-green-700' 
                                                : 'bg-gray-100 text-gray-600'
                                        }`}>
                                            {conv.status === 'active' ? '진행중' : '완료'}
                                        </span>
                                        <span>시작: {new Date(conv.started_at).toLocaleString('ko-KR')}</span>
                                        {#if conv.ended_at}
                                            <span>종료: {new Date(conv.ended_at).toLocaleString('ko-KR')}</span>
                                        {/if}
                                    </div>
                                </div>

                                <div class="flex items-center gap-2">
                                    {#if editingId === conv.id}
                                        <button
                                            onclick={() => saveTitle(conv.id)}
                                            class="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-medium rounded-lg transition"
                                        >
                                            저장
                                        </button>
                                        <button
                                            onclick={cancelEdit}
                                            class="px-3 py-1.5 bg-gray-300 hover:bg-gray-400 text-gray-700 text-sm font-medium rounded-lg transition"
                                        >
                                            취소
                                        </button>
                                    {:else}
                                        <button
                                            onclick={() => startEdit(conv)}
                                            class="px-3 py-1.5 bg-blue-500 hover:bg-blue-600 text-white text-sm font-medium rounded-lg transition"
                                        >
                                            ✏️ 수정
                                        </button>
                                        <button
                                            onclick={() => deleteConversation(conv.id, conv.title)}
                                            class="px-3 py-1.5 bg-red-500 hover:bg-red-600 text-white text-sm font-medium rounded-lg transition"
                                        >
                                            🗑️ 삭제
                                        </button>
                                    {/if}
                                </div>
                            </div>
                        </div>
                    {/each}
                </div>
            {/if}
        </div>
    </main>
</div>

