import { json } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import { supabaseClient } from '$lib/supabaseClient.js';
import { randomUUID } from 'crypto';

/** @type {import('./$types').RequestHandler} */
export async function POST({ request, locals }) {
	try {
		// 사용자 인증 확인
		if (!locals.user) {
			return json({ error: '인증이 필요합니다.' }, { status: 401 });
		}

		const secretKey = env.TOSS_PAYMENTS_SECRET_KEY;
		if (!secretKey) {
			return json({ error: '토스페이먼츠 시크릿 키가 설정되지 않았습니다.' }, { status: 500 });
		}

		const body = await request.json();
		const { amount } = body; // 결제 금액 (원)

		if (!amount || amount < 1000) {
			return json({ error: '결제 금액은 최소 1,000원 이상이어야 합니다.' }, { status: 400 });
		}

		// 크레딧 계산: 5천원 = 10,000 크레딧
		const creditsPer5000Won = parseInt(env.CREDITS_PER_5000_WON || '10000');
		const creditsToAdd = Math.floor((amount / 5000) * creditsPer5000Won);

		// 주문번호 생성
		const orderId = `ORDER_${Date.now()}_${randomUUID().substring(0, 8)}`;

		// 결제 정보를 DB에 저장
		const { data: payment, error: insertError } = await supabaseClient
			.from('payments')
			.insert({
				user_id: locals.user.id,
				order_id: orderId,
				amount: amount,
				credits_added: creditsToAdd,
				status: 'READY'
			})
			.select()
			.single();

		if (insertError) {
			console.error('결제 정보 저장 오류:', insertError);
			return json({ error: '결제 정보 저장에 실패했습니다.' }, { status: 500 });
		}

		// 토스페이먼츠 결제 요청 생성
		const tossResponse = await fetch('https://api.tosspayments.com/v1/payments', {
			method: 'POST',
			headers: {
				'Authorization': `Basic ${Buffer.from(secretKey + ':').toString('base64')}`,
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({
				amount: amount,
				orderId: orderId,
				orderName: `AI 대화 크레딧 ${creditsToAdd.toLocaleString()}개`,
				successUrl: `${env.PUBLIC_APP_URL || 'http://localhost:5173'}/payments/success?orderId=${orderId}`,
				failUrl: `${env.PUBLIC_APP_URL || 'http://localhost:5173'}/payments/fail?orderId=${orderId}`,
				customerEmail: locals.user.email,
				customerName: locals.user.name
			})
		});

		if (!tossResponse.ok) {
			const errorData = await tossResponse.json();
			console.error('토스페이먼츠 API 오류:', errorData);
			
			// 결제 정보 상태 업데이트
			await supabaseClient
				.from('payments')
				.update({ status: 'CANCELED' })
				.eq('id', payment.id);

			return json({ error: '결제 요청 생성에 실패했습니다.' }, { status: 500 });
		}

		const tossData = await tossResponse.json();

		// 결제 정보 업데이트 (paymentKey 저장)
		await supabaseClient
			.from('payments')
			.update({ 
				payment_key: tossData.paymentKey || null,
				status: 'IN_PROGRESS'
			})
			.eq('id', payment.id);

		return json({
			success: true,
			paymentId: payment.id,
			orderId: orderId,
			amount: amount,
			creditsToAdd: creditsToAdd,
			checkoutUrl: tossData.checkoutUrl || tossData.url || null,
			paymentKey: tossData.paymentKey || null
		});

	} catch (error) {
		console.error('POST /api/payments/create error:', error);
		return json({ error: error.message || '서버 오류가 발생했습니다.' }, { status: 500 });
	}
}



