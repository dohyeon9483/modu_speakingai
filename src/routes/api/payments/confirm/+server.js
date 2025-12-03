import { json } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import { supabaseClient } from '$lib/supabaseClient.js';
import { addCredits } from '$lib/credits.js';

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
		const { paymentKey, orderId, amount } = body;

		if (!paymentKey || !orderId || !amount) {
			return json({ error: '필수 정보가 누락되었습니다.' }, { status: 400 });
		}

		// 결제 정보 조회
		const { data: payment, error: paymentError } = await supabaseClient
			.from('payments')
			.select('*')
			.eq('order_id', orderId)
			.eq('user_id', locals.user.id)
			.single();

		if (paymentError || !payment) {
			return json({ error: '결제 정보를 찾을 수 없습니다.' }, { status: 404 });
		}

		// 이미 처리된 결제인지 확인
		if (payment.status === 'DONE') {
			return json({ 
				success: true, 
				message: '이미 처리된 결제입니다.',
				payment: payment
			});
		}

		// 토스페이먼츠 결제 승인
		const tossResponse = await fetch(`https://api.tosspayments.com/v1/payments/${paymentKey}`, {
			method: 'POST',
			headers: {
				'Authorization': `Basic ${Buffer.from(secretKey + ':').toString('base64')}`,
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({
				orderId: orderId,
				amount: amount
			})
		});

		if (!tossResponse.ok) {
			const errorData = await tossResponse.json();
			console.error('토스페이먼츠 결제 승인 오류:', errorData);
			
			// 결제 정보 상태 업데이트
			await supabaseClient
				.from('payments')
				.update({ status: 'CANCELED' })
				.eq('id', payment.id);

			return json({ error: '결제 승인에 실패했습니다.' }, { status: 400 });
		}

		const tossData = await tossResponse.json();

		// 결제 성공 시 크레딧 추가
		const addResult = await addCredits(locals.user.id, payment.credits_added, {
			paymentId: payment.id,
			description: `결제 완료: ${payment.amount.toLocaleString()}원 → ${payment.credits_added.toLocaleString()} 크레딧`
		});

		if (!addResult.success) {
			console.error('크레딧 추가 실패:', addResult.error);
			// 크레딧 추가 실패해도 결제는 완료된 것으로 처리 (나중에 수동 처리 가능)
		}

		// 결제 정보 상태 업데이트
		await supabaseClient
			.from('payments')
			.update({ 
				status: 'DONE',
				payment_key: paymentKey
			})
			.eq('id', payment.id);

		return json({
			success: true,
			message: '결제가 완료되었습니다.',
			payment: {
				id: payment.id,
				amount: payment.amount,
				creditsAdded: payment.credits_added,
				newBalance: addResult.newBalance
			}
		});

	} catch (error) {
		console.error('POST /api/payments/confirm error:', error);
		return json({ error: error.message || '서버 오류가 발생했습니다.' }, { status: 500 });
	}
}



