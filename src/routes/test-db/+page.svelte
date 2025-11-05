<script>
	let result = $state('');
	let loading = $state(false);
	let newName = $state('');
	let newEmail = $state('');
	let users = $state([]);

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
		if (!newName || !newEmail) {
			result = '이름과 이메일을 모두 입력해주세요.';
			return;
		}

		loading = true;
		result = '';
		try {
			const response = await fetch('/test-db/api', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({
					name: newName,
					email: newEmail
				})
			});
			const data = await response.json();

			if (data.error) {
				result = `에러: ${data.error}`;
			} else {
				result = `성공! 사용자가 추가되었습니다.`;
				newName = '';
				newEmail = '';
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

<div class="min-h-screen bg-gray-100 py-8 px-4">
	<div class="max-w-4xl mx-auto">
		<h1 class="text-3xl font-bold mb-8 text-center">Supabase 데이터베이스 테스트</h1>

		<!-- 사용자 추가 폼 -->
		<div class="bg-white rounded-lg shadow-md p-6 mb-6">
			<h2 class="text-xl font-semibold mb-4">새 사용자 추가</h2>
			<div class="flex gap-4 mb-4">
				<input
					type="text"
					bind:value={newName}
					placeholder="이름"
					class="flex-1 px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
				/>
				<input
					type="email"
					bind:value={newEmail}
					placeholder="이메일"
					class="flex-1 px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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

		<!-- 조회 버튼 -->
		<div class="bg-white rounded-lg shadow-md p-6 mb-6">
			<button
				onclick={fetchUsers}
				disabled={loading}
				class="w-full bg-green-500 hover:bg-green-600 disabled:bg-gray-400 text-white font-semibold py-2 px-4 rounded-md transition"
			>
				{loading ? '로딩 중...' : '사용자 목록 조회'}
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
				<h2 class="text-xl font-semibold mb-4">사용자 목록</h2>
				<div class="overflow-x-auto">
					<table class="w-full text-sm">
						<thead>
							<tr class="border-b">
								<th class="text-left py-2 px-2">ID</th>
								<th class="text-left py-2 px-2">이름</th>
								<th class="text-left py-2 px-2">이메일</th>
								<th class="text-left py-2 px-2">비밀번호</th>
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
										{user.password || 'N/A'}
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

