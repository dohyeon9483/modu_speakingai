<script>
	import { onMount } from 'svelte';

	let loading = $state(true);
	let results = $state(null);
	let error = $state('');

	async function testConnection() {
		loading = true;
		error = '';
		
		try {
			const response = await fetch('/api/test-connection');
			const data = await response.json();
			results = data;
		} catch (err) {
			error = err.message;
			console.error('연결 테스트 오류:', err);
		} finally {
			loading = false;
		}
	}

	onMount(() => {
		testConnection();
	});
</script>

<div class="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8">
	<div class="max-w-4xl mx-auto">
		<div class="bg-white rounded-2xl shadow-xl p-8">
			<div class="mb-6">
				<h1 class="text-3xl font-bold text-gray-900 mb-2">데이터베이스 연결 테스트</h1>
				<p class="text-gray-600">Supabase 연결 상태를 확인합니다.</p>
			</div>

			{#if loading}
				<div class="text-center py-12">
					<div class="inline-block w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4"></div>
					<p class="text-gray-600">연결 테스트 중...</p>
				</div>
			{:else if error}
				<div class="bg-red-50 border border-red-200 rounded-lg p-4">
					<p class="text-red-800 font-semibold">❌ 오류 발생</p>
					<p class="text-red-700 text-sm mt-1">{error}</p>
				</div>
			{:else if results}
				<div class="space-y-6">
					<!-- 환경 변수 확인 -->
					<div class="border border-gray-200 rounded-lg p-4">
						<h2 class="text-lg font-semibold text-gray-800 mb-3">환경 변수 확인</h2>
						<div class="space-y-2">
							<div class="flex items-center justify-between">
								<span class="text-sm text-gray-600">SUPABASE_DB_URL</span>
								<span class={`text-sm font-semibold ${results.results.env.hasUrl ? 'text-green-600' : 'text-red-600'}`}>
									{results.results.env.hasUrl ? '✅ 설정됨' : '❌ 없음'}
								</span>
							</div>
							{#if results.results.env.hasUrl}
								<p class="text-xs text-gray-500 ml-4">{results.results.env.urlPreview}</p>
							{/if}
							
							<div class="flex items-center justify-between">
								<span class="text-sm text-gray-600">SUPABASE_DB_PUBLIC_KEY</span>
								<span class={`text-sm font-semibold ${results.results.env.hasKey ? 'text-green-600' : 'text-red-600'}`}>
									{results.results.env.hasKey ? '✅ 설정됨' : '❌ 없음'}
								</span>
							</div>
							{#if results.results.env.hasKey}
								<p class="text-xs text-gray-500 ml-4">{results.results.env.keyPreview}</p>
							{/if}
						</div>
					</div>

					<!-- 연결 테스트 -->
					<div class="border border-gray-200 rounded-lg p-4">
						<h2 class="text-lg font-semibold text-gray-800 mb-3">연결 테스트</h2>
						{#if results.results.connection}
							<div class="space-y-2">
								<div class="flex items-center justify-between">
									<span class="text-sm text-gray-600">상태</span>
									<span class={`text-sm font-semibold ${results.results.connection.success ? 'text-green-600' : 'text-red-600'}`}>
										{results.results.connection.success ? '✅ 성공' : '❌ 실패'}
									</span>
								</div>
								{#if results.results.connection.error}
									<div class="bg-red-50 border border-red-200 rounded p-3 mt-2">
										<p class="text-xs text-red-800 font-semibold mb-1">오류 메시지:</p>
										<p class="text-xs text-red-700">{results.results.connection.error.message || JSON.stringify(results.results.connection.error)}</p>
										{#if results.results.connection.error.code}
											<p class="text-xs text-red-600 mt-1">코드: {results.results.connection.error.code}</p>
										{/if}
									</div>
								{/if}
							</div>
						{/if}
					</div>

					<!-- 테이블 확인 -->
					<div class="border border-gray-200 rounded-lg p-4">
						<h2 class="text-lg font-semibold text-gray-800 mb-3">테이블 확인</h2>
						{#if results.results.tableCheck}
							<div class="space-y-2">
								<div class="flex items-center justify-between">
									<span class="text-sm text-gray-600">users 테이블</span>
									<span class={`text-sm font-semibold ${results.results.tableCheck.success ? 'text-green-600' : 'text-red-600'}`}>
										{results.results.tableCheck.success ? '✅ 존재함' : '❌ 없음 또는 오류'}
									</span>
								</div>
								{#if results.results.tableCheck.error}
									<div class="bg-red-50 border border-red-200 rounded p-3 mt-2">
										<p class="text-xs text-red-800 font-semibold mb-1">오류:</p>
										<p class="text-xs text-red-700">{results.results.tableCheck.error.message || JSON.stringify(results.results.tableCheck.error)}</p>
										{#if results.results.tableCheck.error.code}
											<p class="text-xs text-red-600 mt-1">코드: {results.results.tableCheck.error.code}</p>
										{/if}
										{#if results.results.tableCheck.error.details}
											<p class="text-xs text-red-600 mt-1">상세: {results.results.tableCheck.error.details}</p>
										{/if}
									</div>
								{/if}
							</div>
						{/if}
					</div>

					<!-- 전체 상태 -->
					<div class={`border-2 rounded-lg p-4 ${results.success ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}`}>
						<div class="flex items-center gap-3">
							<span class="text-2xl">{results.success ? '✅' : '❌'}</span>
							<div>
								<p class={`font-semibold ${results.success ? 'text-green-800' : 'text-red-800'}`}>
									{results.success ? '모든 연결이 정상입니다!' : '연결에 문제가 있습니다.'}
								</p>
								{#if !results.success}
									<p class="text-sm text-red-700 mt-1">
										환경 변수를 확인하고 개발 서버를 재시작해주세요.
									</p>
								{/if}
							</div>
						</div>
					</div>

					<!-- 다시 테스트 버튼 -->
					<button
						onclick={testConnection}
						class="w-full px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white font-semibold rounded-lg shadow-md transition"
					>
						🔄 다시 테스트
					</button>
				</div>
			{/if}
		</div>
	</div>
</div>



