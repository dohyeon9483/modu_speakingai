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

<div class="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center px-4">
	<div class="max-w-md w-full bg-white rounded-2xl shadow-xl p-8">
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
					class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
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
					class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
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
					class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
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
					class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
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
				class="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-semibold py-3 px-4 rounded-lg transition duration-200 shadow-md hover:shadow-lg"
			>
				{loading ? '처리 중...' : '회원가입'}
			</button>
		</form>
	</div>
</div>

