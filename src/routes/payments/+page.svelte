<script>
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';

	let selectedAmount = $state(5000);
	let loading = $state(false);
	let error = $state('');
	let creditsBalance = $state(0);

	const amounts = [
		{ value: 5000, label: '5,000원', credits: 10000 },
		{ value: 10000, label: '10,000원', credits: 20000 },
		{ value: 20000, label: '20,000원', credits: 40000 },
		{ value: 50000, label: '50,000원', credits: 100000 }
	];

	async function loadCredits() {
		try {
			const response = await fetch('/api/credits/balance');
			if (response.ok) {
				const data = await response.json();
				creditsBalance = data.credits || 0;
			}
		} catch (err) {
			console.error('크레딧 조회 오류:', err);
		}
	}

	async function handlePayment() {
		error = '';
		loading = true;

		try {
			const response = await fetch('/api/payments/create', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({ amount: selectedAmount })
			});

			const data = await response.json();

			if (!response.ok) {
				error = data.error || '결제 요청에 실패했습니다.';
				
				// 토스페이먼츠 키 미설정 에러인 경우 안내
				if (data.error?.includes('시크릿 키') || data.error?.includes('설정되지 않았습니다')) {
					error += '\n\n해결 방법:\n1. .env 파일에 TOSS_PAYMENTS_SECRET_KEY 추가\n2. 토스페이먼츠 개발자센터에서 API 키 발급\n3. 개발 서버 재시작\n\n자세한 내용은 TOSS_PAYMENTS_QUICK_START.md 파일을 참고하세요.';
				}
				return;
			}

			// 결제 페이지로 리다이렉트
			if (data.checkoutUrl) {
				window.location.href = data.checkoutUrl;
			} else if (data.paymentKey) {
				// 결제 승인 페이지로 이동
				goto(`/payments/confirm?paymentKey=${data.paymentKey}&orderId=${data.orderId}&amount=${selectedAmount}`);
			} else {
				error = '결제 URL을 받을 수 없습니다.';
			}
		} catch (err) {
			console.error('결제 오류:', err);
			error = '결제 처리 중 오류가 발생했습니다.';
		} finally {
			loading = false;
		}
	}

	onMount(() => {
		loadCredits();
	});
</script>

<div class="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center px-4 py-12">
	<div class="max-w-2xl w-full bg-white rounded-2xl shadow-xl p-8">
		<div class="text-center mb-8">
			<h1 class="text-3xl font-bold text-gray-900 mb-2">크레딧 충전</h1>
			<p class="text-gray-600">AI 대화를 위한 크레딧을 충전하세요</p>
		</div>

		<!-- 현재 크레딧 잔액 -->
		<div class="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
			<div class="flex items-center justify-between">
				<span class="text-sm font-medium text-blue-800">현재 크레딧</span>
				<span class="text-2xl font-bold text-blue-600">{creditsBalance.toLocaleString()}</span>
			</div>
		</div>

		<!-- 결제 금액 선택 -->
		<div class="mb-6">
			<label class="block text-sm font-medium text-gray-700 mb-3">충전 금액 선택</label>
			<div class="grid grid-cols-2 gap-3">
				{#each amounts as amount}
					<button
						type="button"
						onclick={() => (selectedAmount = amount.value)}
						disabled={loading}
						class={`px-4 py-3 rounded-lg border-2 transition ${
							selectedAmount === amount.value
								? 'border-blue-500 bg-blue-50 text-blue-700 font-semibold'
								: 'border-gray-200 bg-white text-gray-700 hover:border-blue-300'
						} disabled:opacity-50 disabled:cursor-not-allowed`}
					>
						<div class="text-lg font-bold">{amount.label}</div>
						<div class="text-xs text-gray-500 mt-1">{amount.credits.toLocaleString()} 크레딧</div>
					</button>
				{/each}
			</div>
		</div>

		<!-- 선택된 금액 정보 -->
		<div class="bg-gray-50 rounded-lg p-4 mb-6">
			<div class="flex items-center justify-between mb-2">
				<span class="text-sm text-gray-600">결제 금액</span>
				<span class="text-lg font-semibold text-gray-900">{selectedAmount.toLocaleString()}원</span>
			</div>
			<div class="flex items-center justify-between">
				<span class="text-sm text-gray-600">충전될 크레딧</span>
				<span class="text-lg font-semibold text-blue-600">
					{Math.floor((selectedAmount / 5000) * 10000).toLocaleString()} 크레딧
				</span>
			</div>
		</div>

			<!-- 에러 메시지 -->
			{#if error}
				<div class="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 whitespace-pre-line">
					<p class="text-sm font-semibold text-red-800 mb-2">❌ 오류</p>
					<p class="text-sm text-red-700">{error}</p>
					{#if error.includes('시크릿 키') || error.includes('설정되지 않았습니다')}
						<div class="mt-3 pt-3 border-t border-red-300">
							<p class="text-xs font-semibold text-red-800 mb-2">빠른 설정 방법:</p>
							<ol class="text-xs text-red-700 list-decimal list-inside space-y-1">
								<li><a href="https://developers.tosspayments.com/" target="_blank" class="underline">토스페이먼츠 개발자센터</a>에서 계정 생성</li>
								<li>샌드박스 환경에서 시크릿 키 발급 (test_sk_로 시작)</li>
								<li>.env 파일에 TOSS_PAYMENTS_SECRET_KEY=test_sk_xxxxx 추가</li>
								<li>개발 서버 재시작</li>
							</ol>
							<p class="text-xs text-red-600 mt-2">자세한 내용: TOSS_PAYMENTS_QUICK_START.md 파일 참고</p>
						</div>
					{/if}
				</div>
			{/if}

		<!-- 결제 버튼 -->
		<button
			type="button"
			onclick={handlePayment}
			disabled={loading}
			class="w-full px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white font-semibold rounded-lg shadow-md transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
		>
			{#if loading}
				<div class="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
				<span>처리 중...</span>
			{:else}
				<span>결제하기</span>
			{/if}
		</button>

		<!-- 안내 메시지 -->
		<div class="mt-6 text-center">
			<p class="text-xs text-gray-500">
				5,000원 = 10,000 크레딧 (환율: 1원 = 2 크레딧)
			</p>
			<p class="text-xs text-gray-500 mt-1">
				결제는 토스페이먼츠를 통해 안전하게 처리됩니다.
			</p>
		</div>

		<!-- 뒤로가기 버튼 -->
		<div class="mt-6 text-center">
			<button
				type="button"
				onclick={() => goto('/mypage')}
				class="text-sm text-gray-600 hover:text-gray-800 underline"
			>
				마이페이지로 돌아가기
			</button>
		</div>
	</div>
</div>

