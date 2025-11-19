-- 사용자 프로필 필드 추가
-- 기존 users 테이블에 프로필 관련 컬럼 추가

ALTER TABLE users ADD COLUMN IF NOT EXISTS age INTEGER;
ALTER TABLE users ADD COLUMN IF NOT EXISTS gender VARCHAR(50);
ALTER TABLE users ADD COLUMN IF NOT EXISTS personality TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS occupation VARCHAR(255);
ALTER TABLE users ADD COLUMN IF NOT EXISTS characteristics TEXT;

-- 변경사항 확인
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'users';

