<script>
	import { goto } from '$app/navigation';
	
	let { credits = 0, required = 0, message = null } = $props();
	
	const defaultMessage = `크레딧이 부족합니다. (현재: ${credits.toLocaleString()}, 필요: ${required.toLocaleString()})`;
</script>

<div class="bg-yellow-50 border-2 border-yellow-200 rounded-lg p-4 mb-4">
	<div class="flex items-start gap-3">
		<div class="flex-shrink-0">
			<svg class="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>
			</svg>
		</div>
		<div class="flex-1">
			<h3 class="text-sm font-semibold text-yellow-800 mb-1">크레딧 부족</h3>
			<p class="text-sm text-yellow-700 mb-3">
				{message || defaultMessage}
			</p>
			<button
				type="button"
				onclick={() => goto('/payments')}
				class="px-4 py-2 bg-yellow-500 hover:bg-yellow-600 text-white font-semibold rounded-lg shadow-sm transition flex items-center gap-2"
			>
				<span>💳</span>
				<span>크레딧 충전하기</span>
			</button>
		</div>
	</div>
</div>



