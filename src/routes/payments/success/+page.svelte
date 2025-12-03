<script>
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';

	let loading = $state(true);
	let success = $state(false);
	let error = $state('');
	let paymentInfo = $state(null);

	async function confirmPayment() {
		const urlParams = new URLSearchParams(window.location.search);
		const paymentKey = urlParams.get('paymentKey');
		const orderId = urlParams.get('orderId');
		const amount = urlParams.get('amount');

		if (!paymentKey || !orderId || !amount) {
			error = '결제 정보가 올바르지 않습니다.';
			loading = false;
			return;
		}

		try {
			const response = await fetch('/api/payments/confirm', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({
					paymentKey,
					orderId,
					amount: parseInt(amount)
				})
			});

			const data = await response.json();

			if (!response.ok) {
				error = data.error || '결제 확인에 실패했습니다.';
				loading = false;
				return;
			}

			success = true;
			paymentInfo = data.payment;
		} catch (err) {
			console.error('결제 확인 오류:', err);
			error = '결제 확인 중 오류가 발생했습니다.';
		} finally {
			loading = false;
		}
	}

	onMount(() => {
		confirmPayment();
	});
</script>

<div class="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center px-4 py-12">
	<div class="max-w-md w-full bg-white rounded-2xl shadow-xl p-8">
		{#if loading}
			<div class="text-center">
				<div class="inline-block w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4"></div>
				<p class="text-gray-600">결제를 확인하는 중...</p>
			</div>
		{:else if success && paymentInfo}
			<div class="text-center">
				<div class="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
					<svg class="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
					</svg>
				</div>
				<h1 class="text-2xl font-bold text-gray-900 mb-2">결제 완료!</h1>
				<p class="text-gray-600 mb-6">크레딧이 성공적으로 충전되었습니다.</p>

				<div class="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6 text-left">
					<div class="flex justify-between mb-2">
						<span class="text-sm text-gray-600">결제 금액</span>
						<span class="font-semibold">{paymentInfo.amount.toLocaleString()}원</span>
					</div>
					<div class="flex justify-between mb-2">
						<span class="text-sm text-gray-600">충전된 크레딧</span>
						<span class="font-semibold text-blue-600">{paymentInfo.creditsAdded.toLocaleString()}</span>
					</div>
					<div class="flex justify-between pt-2 border-t border-blue-200">
						<span class="text-sm text-gray-600">현재 크레딧</span>
						<span class="font-bold text-blue-600">{paymentInfo.newBalance.toLocaleString()}</span>
					</div>
				</div>

				<button
					type="button"
					onclick={() => goto('/mypage')}
					class="w-full px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white font-semibold rounded-lg shadow-md transition"
				>
					마이페이지로 이동
				</button>
			</div>
		{:else}
			<div class="text-center">
				<div class="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
					<svg class="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
					</svg>
				</div>
				<h1 class="text-2xl font-bold text-gray-900 mb-2">결제 확인 실패</h1>
				<p class="text-gray-600 mb-6">{error || '결제 확인 중 문제가 발생했습니다.'}</p>

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
		{/if}
	</div>
</div>



