# 🗄️ Supabase 데이터베이스 설정 가이드

## 1. 환경 변수 설정

프로젝트 루트에 `.env` 파일을 생성하고 다음 내용을 추가하세요:

```env
OPENAI_API_KEY=your_openai_api_key_here
SUPABASE_DB_URL=https://your-project.supabase.co
SUPABASE_DB_PUBLIC_KEY=your_supabase_anon_key_here
```

### Supabase 정보 확인하는 방법:

1. [Supabase Dashboard](https://app.supabase.com) 접속
2. 프로젝트 선택
3. 좌측 메뉴에서 **Settings** → **API** 클릭
4. 다음 정보 복사:
   - **Project URL** → `SUPABASE_DB_URL`에 입력
   - **Project API keys** 섹션의 **anon public** → `SUPABASE_DB_PUBLIC_KEY`에 입력

**⚠️ 중요:**
- 환경 변수 값에 따옴표를 사용하지 마세요
- `=` 기호 앞뒤에 띄어쓰기가 없어야 합니다
- 예: `SUPABASE_DB_URL=https://abc123.supabase.co` ✅
- 잘못된 예: `SUPABASE_DB_URL = "https://abc123.supabase.co"` ❌

## 2. 데이터베이스 테이블 생성

1. [Supabase Dashboard](https://app.supabase.com) 접속
2. 프로젝트 선택
3. 좌측 메뉴에서 **SQL Editor** 클릭
4. **New query** 버튼 클릭
5. `create_users_table.sql` 파일의 내용을 복사하여 붙여넣기
6. **Run** 버튼 클릭하여 실행

## 3. 개발 서버 실행

환경 변수를 설정한 후 개발 서버를 시작하세요:

```bash
npm run dev
```

## 4. 테스트 페이지 접속

브라우저에서 다음 주소로 접속:

```
http://localhost:5173/test-db
```

## 5. 기능 테스트

테스트 페이지에서 다음 기능을 확인할 수 있습니다:

- ✅ **사용자 추가**: 이름과 이메일을 입력하여 새 레코드 생성
- ✅ **사용자 목록 조회**: 데이터베이스에 저장된 모든 사용자 조회
- ✅ **사용자 삭제**: 특정 사용자 레코드 삭제

## 문제 해결

### "supabaseKey is required" 에러

1. `.env` 파일이 프로젝트 루트에 있는지 확인
2. 환경 변수 이름이 정확한지 확인 (`SUPABASE_DB_URL`, `SUPABASE_DB_PUBLIC_KEY`)
3. 환경 변수 값에 따옴표가 없는지 확인
4. **개발 서버를 재시작**

### 연결 에러

1. Supabase 프로젝트가 활성화되어 있는지 확인
2. API 키가 올바른지 확인 (anon/public key 사용)
3. 네트워크 연결 확인

### SQL 실행 에러

1. SQL Editor에서 쿼리를 하나씩 실행해보세요
2. 기존 테이블이 있다면 먼저 삭제: `DROP TABLE IF EXISTS users;`

