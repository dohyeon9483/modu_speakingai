<script>
	export let isRealtimeMode = false;
	export let realtimeStatus = 'disconnected';
	export let conversationText = '';
</script>

<!-- 실시간 회화 모드 상태 표시 -->
{#if isRealtimeMode}
	<div class="mb-6">
		<div class="flex items-center justify-center gap-4 mb-4">
			<div class="flex items-center gap-2">
				{#if realtimeStatus === 'connecting'}
					<div class="w-3 h-3 bg-yellow-500 rounded-full animate-pulse"></div>
					<span class="text-lg font-semibold text-yellow-600">연결 중...</span>
				{:else if realtimeStatus === 'connected' || realtimeStatus === 'listening'}
					<div class="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
					<span class="text-lg font-semibold text-green-600">대화 중 (듣는 중)</span>
				{:else if realtimeStatus === 'speaking'}
					<div class="w-3 h-3 bg-blue-500 rounded-full animate-pulse"></div>
					<span class="text-lg font-semibold text-blue-600">대화 중 (말하는 중)</span>
				{:else}
					<div class="w-3 h-3 bg-gray-400 rounded-full"></div>
					<span class="text-lg font-semibold text-gray-600">연결 끊김</span>
				{/if}
			</div>
		</div>
		{#if conversationText}
			<div class="bg-gray-50 rounded-lg p-4 max-h-48 overflow-y-auto">
				<p class="text-sm text-gray-700 whitespace-pre-wrap">{conversationText}</p>
			</div>
		{/if}
	</div>
{/if}


