<script>
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';

	let isAuthenticated = $state(false);
	let password = $state('');
	let error = $state('');
	let result = $state('');
	let loading = $state(false);
	let newName = $state('');
	let newEmail = $state('');
	let newPassword = $state('');
	let users = $state([]);

	const ADMIN_PASSWORD = 'ai1234';

	// 세션 스토리지에서 인증 상태 확인
	onMount(() => {
		const adminAuth = sessionStorage.getItem('adminAuth');
		if (adminAuth === 'true') {
			isAuthenticated = true;
			fetchUsers();
		}
	});

	function handleAdminLogin(e) {
		e.preventDefault();
		if (password === ADMIN_PASSWORD) {
			isAuthenticated = true;
			sessionStorage.setItem('adminAuth', 'true');
			error = '';
			fetchUsers();
		} else {
			error = '비밀번호가 올바르지 않습니다.';
		}
	}

	function handleLogout() {
		sessionStorage.removeItem('adminAuth');
		goto('/');
	}

	// 모든 사용자 조회
	async function fetchUsers() {
		loading = true;
		result = '';
		try {
			const response = await fetch('/test-db/api', {
				method: 'GET'
			});
			const data = await response.json();

			if (data.error) {
				result = `에러: ${data.error}`;
			} else {
				users = data.users || [];
				result = `성공! ${users.length}명의 사용자를 불러왔습니다.`;
			}
		} catch (error) {
			result = `에러: ${error.message}`;
		} finally {
			loading = false;
		}
	}

	// 새 사용자 추가
	async function addUser() {
		if (!newName || !newEmail || !newPassword) {
			result = '이름, 이메일, 비밀번호를 모두 입력해주세요.';
			return;
		}

		loading = true;
		result = '';
		try {
			const response = await fetch('/api/auth/signup', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({
					name: newName,
					email: newEmail,
					password: newPassword
				})
			});
			const data = await response.json();

			if (data.error) {
				result = `에러: ${data.error}`;
			} else {
				result = `성공! 사용자가 추가되었습니다.`;
				newName = '';
				newEmail = '';
				newPassword = '';
				await fetchUsers(); // 목록 새로고침
			}
		} catch (error) {
			result = `에러: ${error.message}`;
		} finally {
			loading = false;
		}
	}

	// 사용자 삭제
	async function deleteUser(id) {
		if (!confirm('정말 삭제하시겠습니까?')) return;

		loading = true;
		result = '';
		try {
			const response = await fetch('/test-db/api', {
				method: 'DELETE',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({ id })
			});
			const data = await response.json();

			if (data.error) {
				result = `에러: ${data.error}`;
			} else {
				result = `성공! 사용자가 삭제되었습니다.`;
				await fetchUsers(); // 목록 새로고침
			}
		} catch (error) {
			result = `에러: ${error.message}`;
		} finally {
			loading = false;
		}
	}
</script>

{#if !isAuthenticated}
	<!-- 관리자 로그인 -->
	<div class="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center px-4">
		<div class="max-w-md w-full bg-white rounded-2xl shadow-xl p-8">
			<div class="text-center mb-8">
				<div class="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
					<svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
					</svg>
				</div>
				<h1 class="text-3xl font-bold text-gray-900 mb-2">관리자 인증</h1>
				<p class="text-gray-600">관리자 비밀번호를 입력하세요</p>
			</div>

			<form onsubmit={handleAdminLogin} class="space-y-4">
				<div>
					<label for="password" class="block text-sm font-medium text-gray-700 mb-1">
						비밀번호
					</label>
					<input
						type="password"
						id="password"
						bind:value={password}
						placeholder="관리자 비밀번호"
						class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
					/>
				</div>

				{#if error}
					<div class="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
						{error}
					</div>
				{/if}

				<div class="flex gap-3">
					<button
						type="submit"
						class="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-lg transition duration-200 shadow-md hover:shadow-lg"
					>
						인증
					</button>
					<a
						href="/"
						class="flex-1 text-center bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-3 px-4 rounded-lg transition duration-200"
					>
						취소
					</a>
				</div>
			</form>
		</div>
	</div>
{:else}
	<!-- 관리자 대시보드 -->
	<div class="min-h-screen bg-gray-100 py-8 px-4">
		<div class="max-w-6xl mx-auto">
			<!-- 헤더 -->
			<div class="flex justify-between items-center mb-8">
				<h1 class="text-3xl font-bold text-gray-900">관리자 대시보드</h1>
				<div class="flex gap-3">
					<button
						onclick={fetchUsers}
						disabled={loading}
						class="px-4 py-2 bg-green-500 hover:bg-green-600 disabled:bg-gray-400 text-white font-medium rounded-lg transition"
					>
						새로고침
					</button>
					<button
						onclick={handleLogout}
						class="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 font-medium rounded-lg transition"
					>
						돌아가기
					</button>
				</div>
			</div>

			<!-- 사용자 추가 폼 -->
			<div class="bg-white rounded-lg shadow-md p-6 mb-6">
				<h2 class="text-xl font-semibold mb-4">새 사용자 추가</h2>
				<div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
					<input
						type="text"
						bind:value={newName}
						placeholder="이름"
						class="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
					/>
					<input
						type="email"
						bind:value={newEmail}
						placeholder="이메일"
						class="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
					/>
					<input
						type="password"
						bind:value={newPassword}
						placeholder="비밀번호"
						class="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
					/>
				</div>
				<button
					onclick={addUser}
					disabled={loading}
					class="w-full bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 text-white font-semibold py-2 px-4 rounded-md transition"
				>
					{loading ? '처리 중...' : '사용자 추가'}
				</button>
			</div>

			<!-- 결과 메시지 -->
			{#if result}
				<div
					class="bg-white rounded-lg shadow-md p-4 mb-6 {result.includes('에러')
						? 'border-l-4 border-red-500'
						: 'border-l-4 border-green-500'}"
				>
					<p class="font-mono text-sm">{result}</p>
				</div>
			{/if}

			<!-- 사용자 목록 -->
			{#if users.length > 0}
				<div class="bg-white rounded-lg shadow-md p-6">
					<h2 class="text-xl font-semibold mb-4">사용자 목록 ({users.length}명)</h2>
					<div class="overflow-x-auto">
						<table class="w-full text-sm">
							<thead>
								<tr class="border-b">
									<th class="text-left py-2 px-2">ID</th>
									<th class="text-left py-2 px-2">이름</th>
									<th class="text-left py-2 px-2">이메일</th>
									<th class="text-left py-2 px-2">비밀번호 해시</th>
									<th class="text-left py-2 px-2">생성일</th>
									<th class="text-left py-2 px-2">작업</th>
								</tr>
							</thead>
							<tbody>
								{#each users as user}
									<tr class="border-b hover:bg-gray-50">
										<td class="py-2 px-2">{user.id}</td>
										<td class="py-2 px-2">{user.name}</td>
										<td class="py-2 px-2">{user.email}</td>
										<td class="py-2 px-2 font-mono text-xs break-all max-w-xs">
											{user.password?.substring(0, 20) + '...'}
										</td>
										<td class="py-2 px-2">{new Date(user.created_at).toLocaleString('ko-KR')}</td>
										<td class="py-2 px-2">
											<button
												onclick={() => deleteUser(user.id)}
												disabled={loading}
												class="bg-red-500 hover:bg-red-600 disabled:bg-gray-400 text-white text-sm py-1 px-3 rounded transition"
											>
												삭제
											</button>
										</td>
									</tr>
								{/each}
							</tbody>
						</table>
					</div>
				</div>
			{/if}
		</div>
	</div>
{/if}

