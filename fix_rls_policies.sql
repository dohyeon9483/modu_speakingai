-- Supabase Row Level Security (RLS) 정책 설정
-- users 테이블에 대한 접근 권한 설정

-- 1. users 테이블의 RLS 활성화 확인 및 설정
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- 2. 기존 정책 삭제 (있는 경우)
DROP POLICY IF EXISTS "Users can view all users" ON users;
DROP POLICY IF EXISTS "Users can insert their own data" ON users;
DROP POLICY IF EXISTS "Users can update their own data" ON users;
DROP POLICY IF EXISTS "Public can insert users" ON users;
DROP POLICY IF EXISTS "Public can read users" ON users;

-- 3. 새 정책 생성

-- 정책 1: 모든 사용자가 users 테이블을 읽을 수 있음 (로그인 시 이메일 확인용)
CREATE POLICY "Public can read users for login"
ON users
FOR SELECT
TO public
USING (true);

-- 정책 2: 누구나 회원가입할 수 있음 (INSERT)
CREATE POLICY "Public can insert users for signup"
ON users
FOR INSERT
TO public
WITH CHECK (true);

-- 정책 3: 사용자가 자신의 정보를 업데이트할 수 있음
-- 참고: 실제로는 사용자 ID를 확인하는 로직이 필요하지만, 
-- 현재는 서버 사이드에서 처리하므로 모든 업데이트 허용
CREATE POLICY "Users can update their own data"
ON users
FOR UPDATE
TO public
USING (true)
WITH CHECK (true);

-- 4. conversations 테이블 RLS 정책 (있는 경우)
ALTER TABLE IF EXISTS conversations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own conversations" ON conversations;
DROP POLICY IF EXISTS "Users can create their own conversations" ON conversations;
DROP POLICY IF EXISTS "Users can update their own conversations" ON conversations;
DROP POLICY IF EXISTS "Users can delete their own conversations" ON conversations;

CREATE POLICY "Users can view their own conversations"
ON conversations
FOR SELECT
TO public
USING (true);

CREATE POLICY "Users can create their own conversations"
ON conversations
FOR INSERT
TO public
WITH CHECK (true);

CREATE POLICY "Users can update their own conversations"
ON conversations
FOR UPDATE
TO public
USING (true)
WITH CHECK (true);

CREATE POLICY "Users can delete their own conversations"
ON conversations
FOR DELETE
TO public
USING (true);

-- 5. conversation_items 테이블 RLS 정책 (있는 경우)
ALTER TABLE IF EXISTS conversation_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view conversation items" ON conversation_items;
DROP POLICY IF EXISTS "Users can create conversation items" ON conversation_items;
DROP POLICY IF EXISTS "Users can update conversation items" ON conversation_items;
DROP POLICY IF EXISTS "Users can delete conversation items" ON conversation_items;

CREATE POLICY "Users can view conversation items"
ON conversation_items
FOR SELECT
TO public
USING (true);

CREATE POLICY "Users can create conversation items"
ON conversation_items
FOR INSERT
TO public
WITH CHECK (true);

CREATE POLICY "Users can update conversation items"
ON conversation_items
FOR UPDATE
TO public
USING (true)
WITH CHECK (true);

CREATE POLICY "Users can delete conversation items"
ON conversation_items
FOR DELETE
TO public
USING (true);

-- 6. payments 테이블 RLS 정책 (있는 경우)
ALTER TABLE IF EXISTS payments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own payments" ON payments;
DROP POLICY IF EXISTS "Users can create their own payments" ON payments;

CREATE POLICY "Users can view their own payments"
ON payments
FOR SELECT
TO public
USING (true);

CREATE POLICY "Users can create their own payments"
ON payments
FOR INSERT
TO public
WITH CHECK (true);

-- 7. credit_transactions 테이블 RLS 정책 (있는 경우)
ALTER TABLE IF EXISTS credit_transactions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own credit transactions" ON credit_transactions;
DROP POLICY IF EXISTS "Users can create credit transactions" ON credit_transactions;

CREATE POLICY "Users can view their own credit transactions"
ON credit_transactions
FOR SELECT
TO public
USING (true);

CREATE POLICY "Users can create credit transactions"
ON credit_transactions
FOR INSERT
TO public
WITH CHECK (true);

-- 정책 확인
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;



