<script>
	import { goto } from '$app/navigation';

	let email = $state('');
	let password = $state('');
	let loading = $state(false);
	let error = $state('');

	async function handleLogin() {
		error = '';

		if (!email || !password) {
			error = '이메일과 비밀번호를 입력해주세요.';
			return;
		}

		loading = true;

		try {
			const response = await fetch('/api/auth/login', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({ email, password })
			});

			const data = await response.json();

			if (!response.ok) {
				error = data.error || '로그인에 실패했습니다.';
			} else {
				// 로그인 성공 - 메인 페이지로 이동
				goto('/');
			}
		} catch (err) {
			error = '서버 오류가 발생했습니다.';
			console.error(err);
		} finally {
			loading = false;
		}
	}
</script>

<div class="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/30 flex items-center justify-center px-4 relative">
	<!-- 상단 우측 버튼들 -->
	<div class="absolute top-6 right-6 flex items-center gap-3">
		<a
			href="/"
			class="w-10 h-10 flex items-center justify-center bg-white/80 hover:bg-white rounded-lg shadow-md hover:shadow-lg transition-all duration-200 text-gray-700 hover:text-gray-900"
			title="홈으로 돌아가기"
		>
			<span class="text-xl">🏠</span>
		</a>
		<a
			href="/admin"
			class="w-10 h-10 flex items-center justify-center bg-white/80 hover:bg-white rounded-lg shadow-md hover:shadow-lg transition-all duration-200 text-gray-700 hover:text-gray-900"
			title="관리자 대시보드"
		>
			<span class="text-xl">⚙️</span>
		</a>
	</div>

	<div class="max-w-md w-full bg-white rounded-2xl shadow-lg border border-gray-100 p-8">
		<div class="text-center mb-8">
			<h1 class="text-3xl font-bold text-gray-900 mb-2">로그인</h1>
			<p class="text-gray-600">AI 실시간 회화 서비스</p>
		</div>

		<form onsubmit={(e) => { e.preventDefault(); handleLogin(); }} class="space-y-4">
			<!-- 이메일 입력 -->
			<div>
				<label for="email" class="block text-sm font-medium text-gray-700 mb-1">
					이메일
				</label>
				<input
					type="email"
					id="email"
					bind:value={email}
					placeholder="example@email.com"
					disabled={loading}
					class="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 disabled:bg-gray-50 disabled:cursor-not-allowed transition-all"
				/>
			</div>

			<!-- 비밀번호 입력 -->
			<div>
				<label for="password" class="block text-sm font-medium text-gray-700 mb-1">
					비밀번호
				</label>
				<input
					type="password"
					id="password"
					bind:value={password}
					placeholder="비밀번호를 입력하세요"
					disabled={loading}
					class="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 disabled:bg-gray-50 disabled:cursor-not-allowed transition-all"
				/>
			</div>

			<!-- 에러 메시지 -->
			{#if error}
				<div class="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
					{error}
				</div>
			{/if}

			<!-- 로그인 버튼 -->
			<button
				type="submit"
				disabled={loading}
				class="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 disabled:from-gray-400 disabled:to-gray-400 text-white font-semibold py-3 px-4 rounded-xl transition-all duration-200 shadow-md hover:shadow-lg disabled:shadow-sm"
			>
				{loading ? '로그인 중...' : '로그인'}
			</button>
		</form>

		<!-- 회원가입 버튼 -->
		<div class="mt-4">
			<a
				href="/signup"
				class="block w-full text-center bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 font-semibold py-3 px-4 rounded-xl transition-all duration-200 shadow-sm hover:shadow"
			>
				회원가입
			</a>
		</div>
	</div>
</div>

