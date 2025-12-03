-- 개발 환경용: RLS 비활성화 (프로덕션에서는 사용하지 마세요!)
-- 주의: 이 스크립트는 보안을 위해 개발 환경에서만 사용하세요.

-- users 테이블 RLS 비활성화
ALTER TABLE IF EXISTS users DISABLE ROW LEVEL SECURITY;

-- conversations 테이블 RLS 비활성화
ALTER TABLE IF EXISTS conversations DISABLE ROW LEVEL SECURITY;

-- conversation_items 테이블 RLS 비활성화
ALTER TABLE IF EXISTS conversation_items DISABLE ROW LEVEL SECURITY;

-- payments 테이블 RLS 비활성화
ALTER TABLE IF EXISTS payments DISABLE ROW LEVEL SECURITY;

-- credit_transactions 테이블 RLS 비활성화
ALTER TABLE IF EXISTS credit_transactions DISABLE ROW LEVEL SECURITY;

-- 확인
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;



