<script>
    import { onMount } from 'svelte';
    import { realtimeStore } from '$lib/stores/realtimeStore.js';
    
    import StatusDisplay from '$lib/components/StatusDisplay.svelte';
    import RealtimeControls from '$lib/components/RealtimeControls.svelte';
    import PasswordDialog from '$lib/components/PasswordDialog.svelte';
    import RealtimeManager from '$lib/components/RealtimeManager.svelte';

    // UI 상태
    let isPasswordDialogOpen = false;
    let passwordError = '';

    // 비밀번호 설정
    const CORRECT_PASSWORD = "1115";

    // 스토어에서 상태 가져오기
    $: ({ 
        isConnected: isRealtimeConnected,
        status: realtimeStatus,
        conversationText,
        errorMessage,
        isButtonDisabled
    } = $realtimeStore);

    function handlePasswordSubmit(event) {
        const { password } = event.detail;
        if (password === CORRECT_PASSWORD) {
            isPasswordDialogOpen = false;
            passwordError = '';
            // RealtimeManager로부터 전달받은 connect 함수 호출
            handleConnect();
        } else {
            passwordError = '비밀번호가 올바르지 않습니다.';
        }
    }

    function handlePasswordDialogClose() {
        isPasswordDialogOpen = false;
        passwordError = '';
        realtimeStore.setButtonDisabled(false);
    }

    let handleConnect;
    let handleDisconnect;

    function onRealtimeError(error) {
        console.error('Realtime 오류:', error);
    }
</script>

<RealtimeManager
    let:handleRealtimeConnect
    let:handleRealtimeDisconnect
    {onRealtimeError}
>
    {#if handleRealtimeConnect && handleRealtimeDisconnect}
        {@const initializeHandlers = () => {
            handleConnect = handleRealtimeConnect;
            handleDisconnect = handleRealtimeDisconnect;
        }}
        {initializeHandlers()}
    {/if}

    <div class="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8">
        <div class="max-w-2xl mx-auto">
            <h1 class="text-4xl font-bold text-center text-gray-800 mb-8">
                실시간 AI 회화
            </h1>

            <div class="bg-white rounded-2xl shadow-xl p-8">
                <!-- 상태 표시 -->
                <StatusDisplay
                    isRealtimeMode={true}
                    {realtimeStatus}
                    {conversationText}
                />

                <!-- 에러 메시지 -->
                {#if errorMessage}
                    <div class="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
                        {errorMessage}
                    </div>
                {/if}

                <!-- 비밀번호 다이얼로그 -->
                <PasswordDialog
                    isOpen={isPasswordDialogOpen}
                    error={passwordError}
                    on:submit={handlePasswordSubmit}
                    on:close={handlePasswordDialogClose}
                />

                <!-- 컨트롤 버튼 -->
                <RealtimeControls
                    isConnected={isRealtimeConnected}
                    status={realtimeStatus}
                    onConnect={() => {
                        realtimeStore.setButtonDisabled(true);
                        isPasswordDialogOpen = true;
                    }}
                    onDisconnect={handleDisconnect}
                />
            </div>

            <!-- 사용 안내 -->
            <div class="mt-6 text-center text-gray-600 text-sm">
                <p>💬 실시간 회화: 말하면 AI가 즉시 응답합니다 (초 저지연)</p>
                <p class="mt-2">마이크 권한을 허용하고 "실시간 회화 시작" 버튼을 눌러주세요</p>
            </div>
        </div>
    </div>
</RealtimeManager>
