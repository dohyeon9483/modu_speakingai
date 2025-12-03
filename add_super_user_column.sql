-- 슈퍼 계정 기능을 위한 컬럼 추가
-- 크레딧 없이도 대화할 수 있는 권한을 부여

-- users 테이블에 is_super_user 컬럼 추가
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS is_super_user BOOLEAN DEFAULT FALSE NOT NULL;

-- 인덱스 추가 (슈퍼 계정 조회 성능 향상)
CREATE INDEX IF NOT EXISTS idx_users_is_super_user ON users(is_super_user);

-- 기존 사용자 중 특정 사용자를 슈퍼 계정으로 설정 (선택사항)
-- UPDATE users SET is_super_user = TRUE WHERE email = 'admin@example.com';

-- 확인
SELECT id, name, email, is_super_user, credits FROM users ORDER BY id;



