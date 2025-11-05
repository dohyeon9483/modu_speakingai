-- users 테이블에 password 컬럼 추가

-- password 컬럼 추가 (bcrypt 해시 저장용)
ALTER TABLE users 
ADD COLUMN password VARCHAR(255) NOT NULL DEFAULT 'temp_password';

-- 기존 샘플 데이터에 임시 비밀번호 설정 (비밀번호: "1234")
-- bcrypt 해시값: $2b$10$rBV2Ifbz3aL9w8RwqGQTf.nPJLz9L5Z5Z7cMxOJEXvBvXKqvfGW4G
UPDATE users 
SET password = '$2b$10$rBV2Ifbz3aL9w8RwqGQTf.nPJLz9L5Z5Z7cMxOJEXvBvXKqvfGW4G'
WHERE password = 'temp_password';

-- 확인
SELECT id, name, email, created_at FROM users;

-- 참고: 위 업데이트로 기존 사용자들의 비밀번호는 모두 "1234"로 설정됩니다.

