import { json } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import { supabaseClient } from '$lib/supabaseClient.js';
import { addCredits } from '$lib/credits.js';

/** @type {import('./$types').RequestHandler} */
export async function POST({ request }) {
	try {
		const secretKey = env.TOSS_PAYMENTS_SECRET_KEY;
		if (!secretKey) {
			return json({ error: '토스페이먼츠 시크릿 키가 설정되지 않았습니다.' }, { status: 500 });
		}

		const body = await request.json();
		const { event, data } = body;

		// 결제 완료 이벤트만 처리
		if (event !== 'PAYMENT_CONFIRMED') {
			return json({ message: '처리할 이벤트가 없습니다.' });
		}

		const { paymentKey, orderId, amount } = data;

		if (!paymentKey || !orderId) {
			return json({ error: '필수 정보가 누락되었습니다.' }, { status: 400 });
		}

		// 결제 정보 조회
		const { data: payment, error: paymentError } = await supabaseClient
			.from('payments')
			.select('*, users!inner(id)')
			.eq('order_id', orderId)
			.single();

		if (paymentError || !payment) {
			console.error('결제 정보를 찾을 수 없습니다:', paymentError);
			return json({ error: '결제 정보를 찾을 수 없습니다.' }, { status: 404 });
		}

		// 이미 처리된 결제인지 확인
		if (payment.status === 'DONE') {
			return json({ message: '이미 처리된 결제입니다.' });
		}

		// 크레딧 추가
		const addResult = await addCredits(payment.user_id, payment.credits_added, {
			paymentId: payment.id,
			description: `결제 완료 (웹훅): ${payment.amount.toLocaleString()}원 → ${payment.credits_added.toLocaleString()} 크레딧`
		});

		if (!addResult.success) {
			console.error('크레딧 추가 실패:', addResult.error);
			return json({ error: '크레딧 추가에 실패했습니다.' }, { status: 500 });
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
			message: '웹훅 처리 완료'
		});

	} catch (error) {
		console.error('POST /api/payments/webhook error:', error);
		return json({ error: error.message || '서버 오류가 발생했습니다.' }, { status: 500 });
	}
}



