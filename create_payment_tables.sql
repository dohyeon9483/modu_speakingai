-- 토스페이먼츠 결제 및 크레딧 시스템을 위한 데이터베이스 스키마

-- 1. Users 테이블에 credits 컬럼 추가
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS credits INTEGER DEFAULT 0 NOT NULL;

-- 2. Payments 테이블 생성 (결제 기록)
CREATE TABLE IF NOT EXISTS payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    payment_key VARCHAR(255) UNIQUE, -- 토스페이먼츠 paymentKey
    order_id VARCHAR(255) NOT NULL UNIQUE, -- 주문번호
    amount INTEGER NOT NULL, -- 결제 금액 (원)
    credits_added INTEGER NOT NULL, -- 추가된 크레딧
    status VARCHAR(50) NOT NULL DEFAULT 'READY', -- READY, IN_PROGRESS, DONE, CANCELED
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. Credit Transactions 테이블 생성 (크레딧 사용 내역)
CREATE TABLE IF NOT EXISTS credit_transactions (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    conversation_id UUID REFERENCES conversations(id) ON DELETE SET NULL,
    amount INTEGER NOT NULL, -- 차감/추가 금액 (음수는 차감, 양수는 추가)
    type VARCHAR(50) NOT NULL, -- 'payment', 'user_message', 'ai_response', 'refund'
    message_count INTEGER, -- 메시지 수 (nullable)
    duration_seconds INTEGER, -- 대화 시간(초) (nullable)
    tokens_used INTEGER, -- 사용된 토큰 수 (nullable)
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_payments_user_id ON payments(user_id);
CREATE INDEX IF NOT EXISTS idx_payments_order_id ON payments(order_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);
CREATE INDEX IF NOT EXISTS idx_credit_transactions_user_id ON credit_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_credit_transactions_conversation_id ON credit_transactions(conversation_id);
CREATE INDEX IF NOT EXISTS idx_credit_transactions_created_at ON credit_transactions(created_at DESC);

-- Payments 테이블의 updated_at 자동 업데이트 트리거
DROP TRIGGER IF EXISTS update_payments_updated_at ON payments;
CREATE TRIGGER update_payments_updated_at
    BEFORE UPDATE ON payments
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();



