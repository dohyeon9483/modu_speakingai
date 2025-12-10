<script>
	import { goto } from '$app/navigation';

	/** @type {import('./$types').PageData} */
	let { data } = $props();

	function handleGetStarted() {
		goto('/login');
	}
</script>

<div class="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
	<!-- Navigation -->
	<nav class="container mx-auto px-6 py-6">
		<div class="flex items-center justify-between">
			<div class="flex items-center gap-2">
				<div class="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-xl font-bold shadow-lg">
					AI
				</div>
				<span class="text-xl font-bold text-gray-900">Speaking AI</span>
			</div>
			<div class="flex items-center gap-4">
				<a
					href="/login"
					class="text-gray-700 hover:text-gray-900 font-medium transition-colors"
				>
					로그인
				</a>
				<a
					href="/signup"
					class="px-4 py-2 bg-gray-900 text-white rounded-lg font-medium hover:bg-gray-800 transition-colors shadow-sm"
				>
					회원가입
				</a>
			</div>
		</div>
	</nav>

	<!-- Hero Section -->
	<section class="container mx-auto px-6 py-20 md:py-32">
		<div class="max-w-4xl mx-auto text-center space-y-8">
			<h1 class="text-5xl md:text-7xl font-bold text-gray-900 leading-tight">
				AI와 함께하는
				<span class="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">
					실시간 회화
				</span>
			</h1>
			<p class="text-xl md:text-2xl text-gray-600 max-w-2xl mx-auto leading-relaxed">
				텍스트와 음성으로 AI와 자연스럽게 대화하세요. 
				언어 학습, 연습, 또는 단순한 대화까지 모든 것이 가능합니다.
			</p>
			<div class="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
				<button
					onclick={handleGetStarted}
					class="px-8 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-lg font-semibold rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"
				>
					시작하기
				</button>
				<a
					href="/login"
					class="px-8 py-4 bg-white text-gray-700 text-lg font-semibold rounded-xl border-2 border-gray-200 hover:border-gray-300 transition-all duration-200"
				>
					로그인
				</a>
			</div>
		</div>
	</section>

	<!-- Features Section -->
	<section class="container mx-auto px-6 py-20">
		<div class="max-w-6xl mx-auto">
			<h2 class="text-3xl md:text-4xl font-bold text-center text-gray-900 mb-16">
				주요 기능
			</h2>
			<div class="grid md:grid-cols-3 gap-8">
				<!-- Feature 1: Text Chat -->
				<div class="bg-white rounded-2xl p-8 shadow-sm hover:shadow-lg transition-shadow duration-300 border border-gray-100">
					<div class="w-14 h-14 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-2xl mb-6 shadow-md">
						💬
					</div>
					<h3 class="text-xl font-bold text-gray-900 mb-3">텍스트 채팅</h3>
					<p class="text-gray-600 leading-relaxed">
						실시간으로 AI와 텍스트 메시지를 주고받으며 대화를 나눠보세요. 
						언어 학습이나 질문 답변에 최적화되어 있습니다.
					</p>
				</div>

				<!-- Feature 2: Voice Chat -->
				<div class="bg-white rounded-2xl p-8 shadow-sm hover:shadow-lg transition-shadow duration-300 border border-gray-100">
					<div class="w-14 h-14 rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-600 flex items-center justify-center text-2xl mb-6 shadow-md">
						🎤
					</div>
					<h3 class="text-xl font-bold text-gray-900 mb-3">음성 대화</h3>
					<p class="text-gray-600 leading-relaxed">
						음성으로 AI와 실시간 대화를 나눠보세요. 
						발음 연습과 회화 실력 향상에 도움이 됩니다.
					</p>
				</div>

				<!-- Feature 3: Conversation History -->
				<div class="bg-white rounded-2xl p-8 shadow-sm hover:shadow-lg transition-shadow duration-300 border border-gray-100">
					<div class="w-14 h-14 rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center text-2xl mb-6 shadow-md">
						📚
					</div>
					<h3 class="text-xl font-bold text-gray-900 mb-3">대화 기록</h3>
					<p class="text-gray-600 leading-relaxed">
						모든 대화를 저장하고 관리할 수 있습니다. 
						이전 대화를 다시 확인하고 이어서 진행할 수 있어요.
					</p>
				</div>
			</div>
		</div>
	</section>

	<!-- CTA Section -->
	<section class="container mx-auto px-6 py-20">
		<div class="max-w-4xl mx-auto bg-gradient-to-r from-blue-600 to-indigo-600 rounded-3xl p-12 md:p-16 text-center text-white shadow-2xl">
			<h2 class="text-3xl md:text-4xl font-bold mb-4">
				지금 바로 시작해보세요
			</h2>
			<p class="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
				AI와의 대화를 통해 언어 실력을 향상시키고 새로운 경험을 해보세요.
			</p>
			<button
				onclick={handleGetStarted}
				class="px-8 py-4 bg-white text-blue-600 text-lg font-semibold rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"
			>
				무료로 시작하기
			</button>
		</div>
	</section>

	<!-- Footer -->
	<footer class="container mx-auto px-6 py-12 border-t border-gray-200">
		<div class="max-w-6xl mx-auto text-center text-gray-600">
			<p class="text-sm">
				© 2024 Speaking AI. All rights reserved.
			</p>
		</div>
	</footer>
</div>
