<script>
	import { goto } from '$app/navigation';

	let name = $state('');
	let email = $state('');
	let password = $state('');
	let confirmPassword = $state('');
	let loading = $state(false);
	let error = $state('');
	let success = $state('');

	async function handleSignup() {
		error = '';
		success = '';

		// 클라이언트 측 검증
		if (!name || !email || !password || !confirmPassword) {
			error = '모든 필드를 입력해주세요.';
			return;
		}

		if (password !== confirmPassword) {
			error = '비밀번호가 일치하지 않습니다.';
			return;
		}

		if (password.length < 4) {
			error = '비밀번호는 최소 4자 이상이어야 합니다.';
			return;
		}

		loading = true;

		try {
			const response = await fetch('/api/auth/signup', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({ name, email, password })
			});

			const data = await response.json();

			if (!response.ok) {
				error = data.error || '회원가입에 실패했습니다.';
			} else {
				success = data.message;
				// 2초 후 로그인 페이지로 이동
				setTimeout(() => {
					goto('/login');
				}, 2000);
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
	<!-- 상단 우측 버튼 -->
	<div class="absolute top-6 right-6">
		<a
			href="/"
			class="w-10 h-10 flex items-center justify-center bg-white/80 hover:bg-white rounded-lg shadow-md hover:shadow-lg transition-all duration-200 text-gray-700 hover:text-gray-900"
			title="홈으로 돌아가기"
		>
			<span class="text-xl">🏠</span>
		</a>
	</div>

	<div class="max-w-md w-full bg-white rounded-2xl shadow-lg border border-gray-100 p-8">
		<div class="text-center mb-8">
			<h1 class="text-3xl font-bold text-gray-900 mb-2">회원가입</h1>
			<p class="text-gray-600">AI 실시간 회화 서비스에 가입하세요</p>
		</div>

		<form onsubmit={(e) => { e.preventDefault(); handleSignup(); }} class="space-y-4">
			<!-- 이름 입력 -->
			<div>
				<label for="name" class="block text-sm font-medium text-gray-700 mb-1">
					이름
				</label>
				<input
					type="text"
					id="name"
					bind:value={name}
					placeholder="홍길동"
					disabled={loading}
					class="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 disabled:bg-gray-50 disabled:cursor-not-allowed transition-all"
				/>
			</div>

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
					placeholder="최소 4자 이상"
					disabled={loading}
					class="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 disabled:bg-gray-50 disabled:cursor-not-allowed transition-all"
				/>
			</div>

			<!-- 비밀번호 확인 -->
			<div>
				<label for="confirmPassword" class="block text-sm font-medium text-gray-700 mb-1">
					비밀번호 확인
				</label>
				<input
					type="password"
					id="confirmPassword"
					bind:value={confirmPassword}
					placeholder="비밀번호를 다시 입력하세요"
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

			<!-- 성공 메시지 -->
			{#if success}
				<div class="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">
					{success}
				</div>
			{/if}

			<!-- 회원가입 버튼 -->
			<button
				type="submit"
				disabled={loading}
				class="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 disabled:from-gray-400 disabled:to-gray-400 text-white font-semibold py-3 px-4 rounded-xl transition-all duration-200 shadow-md hover:shadow-lg disabled:shadow-sm"
			>
				{loading ? '처리 중...' : '회원가입'}
			</button>
		</form>
	</div>
</div>

