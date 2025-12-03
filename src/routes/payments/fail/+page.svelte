<script>
	import { goto } from '$app/navigation';
</script>

<div class="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center px-4 py-12">
	<div class="max-w-md w-full bg-white rounded-2xl shadow-xl p-8">
		<div class="text-center">
			<div class="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
				<svg class="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
				</svg>
			</div>
			<h1 class="text-2xl font-bold text-gray-900 mb-2">결제 실패</h1>
			<p class="text-gray-600 mb-6">결제가 취소되었거나 실패했습니다.</p>

			<div class="space-y-3">
				<button
					type="button"
					onclick={() => goto('/payments')}
					class="w-full px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white font-semibold rounded-lg shadow-md transition"
				>
					다시 시도
				</button>
				<button
					type="button"
					onclick={() => goto('/mypage')}
					class="w-full px-6 py-3 bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold rounded-lg transition"
				>
					마이페이지로 이동
				</button>
			</div>
		</div>
	</div>
</div>



