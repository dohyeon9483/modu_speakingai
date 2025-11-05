-- 기존 테이블 삭제 (주의: 기존 데이터가 모두 삭제됩니다!)
DROP TABLE IF EXISTS users CASCADE;

-- users 테이블 생성 (email 기반)
CREATE TABLE users (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,            -- 이름
    email VARCHAR(255) NOT NULL UNIQUE,    -- 이메일 (아이디로 사용)
    password VARCHAR(255) NOT NULL,        -- 비밀번호 (bcrypt 해시)
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 이메일 인덱스 생성 (로그인 검색용)
CREATE INDEX idx_users_email ON users(email);

-- updated_at 자동 업데이트 함수
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- updated_at 자동 업데이트 트리거
CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 샘플 데이터 추가 (bcrypt 해시 사용)
-- 모든 샘플 계정의 비밀번호는 "1234"입니다
INSERT INTO users (name, email, password) VALUES
    ('홍길동', 'hong@example.com', '$2b$10$rBV2Ifbz3aL9w8RwqGQTf.nPJLz9L5Z5Z7cMxOJEXvBvXKqvfGW4G'),
    ('김철수', 'kim@example.com', '$2b$10$rBV2Ifbz3aL9w8RwqGQTf.nPJLz9L5Z5Z7cMxOJEXvBvXKqvfGW4G'),
    ('이영희', 'lee@example.com', '$2b$10$rBV2Ifbz3aL9w8RwqGQTf.nPJLz9L5Z5Z7cMxOJEXvBvXKqvfGW4G');

-- 테이블 확인
SELECT id, name, email, created_at FROM users;

-- 참고: 샘플 계정 로그인 정보
-- 이메일: hong@example.com, 비밀번호: 1234
-- 이메일: kim@example.com, 비밀번호: 1234
-- 이메일: lee@example.com, 비밀번호: 1234

