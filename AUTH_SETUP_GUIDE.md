# 🔐 회원가입/로그인 시스템 설정 가이드

## 개요

기존의 비밀번호(1115) 인증 방식을 데이터베이스 기반 회원가입/로그인 시스템으로 변경했습니다.
이제 users 테이블에 등록된 사용자만 실시간 AI 회화 기능을 사용할 수 있습니다.

## 🚀 설정 단계

### 1단계: 데이터베이스 테이블에 password 컬럼 추가

Supabase SQL Editor에서 다음 SQL을 실행하세요:

```sql
-- password 컬럼 추가 (bcrypt 해시 저장용)
ALTER TABLE users 
ADD COLUMN password VARCHAR(255) NOT NULL DEFAULT 'temp_password';

-- 기존 샘플 데이터에 임시 비밀번호 설정 (비밀번호: "1234")
UPDATE users 
SET password = '$2b$10$rBV2Ifbz3aL9w8RwqGQTf.nPJLz9L5Z5Z7cMxOJEXvBvXKqvfGW4G'
WHERE password = 'temp_password';
```

또는 프로젝트 루트의 `add_password_column.sql` 파일을 실행하세요.

### 2단계: 개발 서버 재시작

환경 변수와 새로운 코드를 반영하기 위해 서버를 재시작하세요:

```bash
# 개발 서버 종료 (Ctrl + C)
npm run dev
```

## 📱 기능 설명

### 새로운 페이지

1. **회원가입 페이지** (`/signup`)
   - 이름, 이메일, 비밀번호 입력
   - 비밀번호 확인
   - 이메일 중복 검사
   - 비밀번호 bcrypt 해싱 후 저장

2. **로그인 페이지** (`/login`)
   - 이메일/비밀번호로 로그인
   - 세션 쿠키 생성 (7일 유효)
   - 테스트 계정 정보 표시

3. **메인 페이지** (`/`)
   - 로그인한 사용자만 접근 가능
   - 사용자 이름 표시
   - 로그아웃 버튼
   - 비밀번호 입력 없이 바로 실시간 회화 시작

### 접근 제어

- ✅ 로그인하지 않은 사용자가 메인 페이지 접근 시 → 로그인 페이지로 자동 리다이렉트
- ✅ 이미 로그인한 사용자가 로그인/회원가입 페이지 접근 시 → 메인 페이지로 자동 리다이렉트
- ✅ 세션은 HTTP-only 쿠키로 저장 (XSS 공격 방지)

## 🧪 테스트 방법

### 1. 기존 샘플 계정으로 테스트

SQL을 실행했다면 다음 계정으로 로그인 가능합니다:

```
이메일: hong@example.com
비밀번호: 1234
```

또는

```
이메일: kim@example.com
비밀번호: 1234
```

### 2. 새 계정 생성 테스트

1. `http://localhost:5173/signup` 접속
2. 회원가입 폼 작성
3. 회원가입 완료 후 자동으로 로그인 페이지로 이동
4. 생성한 계정으로 로그인
5. 메인 페이지에서 실시간 회화 기능 사용

## 📂 생성된 파일

### API 엔드포인트
- `src/routes/api/auth/signup/+server.js` - 회원가입 API
- `src/routes/api/auth/login/+server.js` - 로그인 API
- `src/routes/api/auth/logout/+server.js` - 로그아웃 API

### 페이지
- `src/routes/signup/+page.svelte` - 회원가입 UI
- `src/routes/signup/+page.server.js` - 회원가입 페이지 서버 로직
- `src/routes/login/+page.svelte` - 로그인 UI
- `src/routes/login/+page.server.js` - 로그인 페이지 서버 로직
- `src/routes/+page.server.js` - 메인 페이지 접근 제어

### 서버 설정
- `src/hooks.server.js` - 세션 관리 훅

### SQL 파일
- `add_password_column.sql` - password 컬럼 추가 SQL

## 🔒 보안 기능

1. **비밀번호 해싱**: bcryptjs를 사용한 안전한 비밀번호 저장
2. **HTTP-only 쿠키**: XSS 공격으로부터 세션 보호
3. **Same-Site Strict**: CSRF 공격 방지
4. **세션 만료**: 7일 후 자동 만료

## 🎯 사용 흐름

```
방문자 → /login (로그인) → 세션 생성 → / (메인 페이지) → 실시간 회화 시작
         ↓
      /signup (회원가입) → 계정 생성 → /login
```

## ⚠️ 중요 사항

1. **Supabase SQL 실행 필수**: `add_password_column.sql`을 반드시 실행해야 합니다
2. **서버 재시작**: 코드 변경 후 개발 서버를 재시작하세요
3. **기존 데이터**: SQL을 실행하면 기존 사용자들의 비밀번호가 "1234"로 설정됩니다
4. **PasswordDialog.svelte**: 더 이상 사용되지 않지만 파일은 남아있습니다 (필요시 삭제 가능)

## 🐛 문제 해결

### "Cannot find table users"
→ `create_users_table.sql`을 먼저 실행하세요

### "Column password does not exist"
→ `add_password_column.sql`을 실행하세요

### 로그인 후에도 로그인 페이지로 이동
→ 브라우저 쿠키를 확인하거나 개발자 도구에서 Application → Cookies 확인

### "SUPABASE_DB_URL is required"
→ `.env` 파일에 환경 변수가 올바르게 설정되었는지 확인하고 서버 재시작

