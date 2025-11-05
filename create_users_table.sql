-- Supabase 데이터베이스에 테스트용 users 테이블 생성

-- 기존 테이블이 있다면 삭제 (선택사항)
-- DROP TABLE IF EXISTS users;

-- users 테이블 생성
CREATE TABLE users (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 이메일 인덱스 생성 (검색 성능 향상)
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

-- 샘플 데이터 추가 (선택사항)
INSERT INTO users (name, email) VALUES
    ('홍길동', 'hong@example.com'),
    ('김철수', 'kim@example.com'),
    ('이영희', 'lee@example.com');

-- 테이블 확인
SELECT * FROM users;

