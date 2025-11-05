<script>
	import { createEventDispatcher } from 'svelte';
	
	export let isOpen = false;
	export let error = '';
	
	const dispatch = createEventDispatcher();
	let password = '';
	
	function handleSubmit() {
		dispatch('submit', { password });
		password = ''; // 입력 필드 초기화
	}
	
	function handleClose() {
		password = ''; // 입력 필드 초기화
		dispatch('close');
	}
</script>

{#if isOpen}
	<div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
		<div class="bg-white rounded-lg p-6 w-96 shadow-xl">
			<h2 class="text-xl font-semibold mb-4">비밀번호 입력</h2>
			
			<form on:submit|preventDefault={handleSubmit} class="space-y-4">
				<div>
					<label for="password" class="block text-sm font-medium text-gray-700 mb-1">
						회화를 시작하려면 비밀번호를 입력하세요
					</label>
					<input
						type="password"
						id="password"
						bind:value={password}
						placeholder="비밀번호를 입력하세요"
						class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
					/>
				</div>
				
				{#if error}
					<p class="text-sm text-red-600">{error}</p>
				{/if}
				
				<div class="flex justify-end gap-3">
					<button
						type="button"
						on:click={handleClose}
						class="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
					>
						취소
					</button>
					<button
						type="submit"
						class="px-4 py-2 text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors"
					>
						확인
					</button>
				</div>
			</form>
		</div>
	</div>
{/if}