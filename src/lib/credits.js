/**
 * 크레딧 관리 유틸리티 함수
 */

import { supabaseClient } from './supabaseClient.js';

/**
 * 크레딧 차감
 * @param {number} userId - 사용자 ID
 * @param {number} amount - 차감할 크레딧 (양수)
 * @param {object} options - 추가 옵션
 * @returns {Promise<{success: boolean, newBalance?: number, error?: string}>}
 */
export async function deductCredits(userId, amount, options = {}) {
	const {
		conversationId = null,
		type = 'user_message',
		messageCount = null,
		durationSeconds = null,
		tokensUsed = null,
		description = null
	} = options;

	try {
		// 트랜잭션 시작을 위해 현재 크레딧 및 슈퍼 계정 여부 조회
		const { data: user, error: userError } = await supabaseClient
			.from('users')
			.select('credits, is_super_user')
			.eq('id', userId)
			.single();

		if (userError || !user) {
			return { success: false, error: '사용자를 찾을 수 없습니다.' };
		}

		// 슈퍼 계정인 경우 크레딧 차감하지 않음
		if (user.is_super_user) {
			return {
				success: true,
				newBalance: user.credits || 0,
				deducted: 0,
				isSuperUser: true,
				message: '슈퍼 계정: 크레딧이 차감되지 않습니다.'
			};
		}

		const currentCredits = user.credits || 0;

		// 크레딧 부족 확인
		if (currentCredits < amount) {
			return {
				success: false,
				error: '크레딧이 부족합니다.',
				currentBalance: currentCredits,
				required: amount
			};
		}

		// 크레딧 차감 (트랜잭션)
		const newBalance = currentCredits - amount;

		// 사용자 크레딧 업데이트
		const { error: updateError } = await supabaseClient
			.from('users')
			.update({ credits: newBalance })
			.eq('id', userId);

		if (updateError) {
			console.error('크레딧 업데이트 오류:', updateError);
			return { success: false, error: '크레딧 차감에 실패했습니다.' };
		}

		// 크레딧 거래 내역 기록
		const { error: transactionError } = await supabaseClient
			.from('credit_transactions')
			.insert({
				user_id: userId,
				conversation_id: conversationId,
				amount: -amount, // 음수로 저장 (차감)
				type: type,
				message_count: messageCount,
				duration_seconds: durationSeconds,
				tokens_used: tokensUsed,
				description: description || `${type}: ${amount} 크레딧 차감`
			});

		if (transactionError) {
			console.error('거래 내역 기록 오류:', transactionError);
			// 거래 내역 기록 실패해도 크레딧은 차감되었으므로 성공으로 처리
		}

		return {
			success: true,
			newBalance: newBalance,
			deducted: amount
		};

	} catch (error) {
		console.error('deductCredits 오류:', error);
		return { success: false, error: error.message || '크레딧 차감 중 오류가 발생했습니다.' };
	}
}

/**
 * 크레딧 추가
 * @param {number} userId - 사용자 ID
 * @param {number} amount - 추가할 크레딧 (양수)
 * @param {object} options - 추가 옵션
 * @returns {Promise<{success: boolean, newBalance?: number, error?: string}>}
 */
export async function addCredits(userId, amount, options = {}) {
	const {
		paymentId = null,
		description = null
	} = options;

	try {
		// 현재 크레딧 조회
		const { data: user, error: userError } = await supabaseClient
			.from('users')
			.select('credits')
			.eq('id', userId)
			.single();

		if (userError || !user) {
			return { success: false, error: '사용자를 찾을 수 없습니다.' };
		}

		const currentCredits = user.credits || 0;
		const newBalance = currentCredits + amount;

		// 사용자 크레딧 업데이트
		const { error: updateError } = await supabaseClient
			.from('users')
			.update({ credits: newBalance })
			.eq('id', userId);

		if (updateError) {
			console.error('크레딧 업데이트 오류:', updateError);
			return { success: false, error: '크레딧 추가에 실패했습니다.' };
		}

		// 크레딧 거래 내역 기록
		const { error: transactionError } = await supabaseClient
			.from('credit_transactions')
			.insert({
				user_id: userId,
				conversation_id: null,
				amount: amount, // 양수로 저장 (추가)
				type: 'payment',
				message_count: null,
				duration_seconds: null,
				tokens_used: null,
				description: description || `결제: ${amount} 크레딧 추가`
			});

		if (transactionError) {
			console.error('거래 내역 기록 오류:', transactionError);
			// 거래 내역 기록 실패해도 크레딧은 추가되었으므로 성공으로 처리
		}

		return {
			success: true,
			newBalance: newBalance,
			added: amount
		};

	} catch (error) {
		console.error('addCredits 오류:', error);
		return { success: false, error: error.message || '크레딧 추가 중 오류가 발생했습니다.' };
	}
}

/**
 * 크레딧 계산 (토큰 수 기반)
 * @param {number} inputTokens - 입력 토큰 수
 * @param {number} outputTokens - 출력 토큰 수
 * @returns {number} - 차감할 크레딧
 */
export function calculateCreditsFromTokens(inputTokens, outputTokens) {
	// OpenAI gpt-4o-mini 가격 기준:
	// 입력: $0.15/1M tokens
	// 출력: $0.60/1M tokens
	// 1달러 = 약 1,333원
	// 5천원 = 10,000 크레딧으로 설정
	
	// 입력 토큰 비용 계산 (1 token = 약 0.0002원)
	const inputCost = inputTokens * 0.0002;
	// 출력 토큰 비용 계산 (1 token = 약 0.0008원)
	const outputCost = outputTokens * 0.0008;
	
	// 총 비용을 크레딧으로 변환 (1원 = 2 크레딧)
	const totalCost = inputCost + outputCost;
	const credits = Math.ceil(totalCost * 2);
	
	// 최소 0.3 크레딧 (입력), 최소 0.7 크레딧 (출력)
	const minInputCredits = Math.max(0.3, credits * 0.3);
	const minOutputCredits = Math.max(0.7, credits * 0.7);
	
	return Math.ceil(minInputCredits + minOutputCredits);
}

/**
 * 사용자 메시지 크레딧 계산
 * @returns {number} - 차감할 크레딧 (고정값)
 */
export function getUserMessageCredits() {
	return 0.5; // 사용자 메시지당 0.5 크레딧
}

