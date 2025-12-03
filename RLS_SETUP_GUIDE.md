# Supabase Row Level Security (RLS) 설정 가이드

## 문제 상황

다음과 같은 에러가 발생하는 경우:
```
Supabase error: {
  code: '42501',
  message: 'new row violates row-level security policy for table "users"'
}
```

이는 Supabase의 Row Level Security (RLS) 정책이 활성화되어 있지만, 적절한 정책이 설정되지 않아서 발생하는 문제입니다.

## 해결 방법

### 방법 1: RLS 정책 설정 (권장)

프로덕션 환경에서는 이 방법을 사용하세요.

1. [Supabase Dashboard](https://app.supabase.com) 접속
2. 프로젝트 선택
3. 좌측 메뉴에서 **SQL Editor** 클릭
4. **New query** 버튼 클릭
5. `fix_rls_policies.sql` 파일의 내용을 복사하여 붙여넣기
6. **Run** 버튼 클릭하여 실행

이 스크립트는 다음 정책을 설정합니다:
- 모든 사용자가 `users` 테이블을 읽을 수 있음 (로그인용)
- 누구나 회원가입할 수 있음 (INSERT)
- 사용자가 자신의 정보를 업데이트할 수 있음
- 대화, 결제, 크레딧 관련 테이블에 대한 접근 권한 설정

### 방법 2: RLS 비활성화 (개발 환경만)

**⚠️ 주의: 이 방법은 개발 환경에서만 사용하세요! 프로덕션에서는 절대 사용하지 마세요!**

1. Supabase Dashboard → SQL Editor
2. `disable_rls_for_development.sql` 파일의 내용을 실행

이 방법은 모든 테이블의 RLS를 비활성화합니다. 개발 중에 빠르게 테스트할 때만 사용하세요.

## 정책 확인

정책이 제대로 설정되었는지 확인하려면:

```sql
SELECT 
    schemaname,
    tablename,
    policyname,
    cmd,
    qual,
    with_check
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;
```

## 보안 고려사항

### 개발 환경
- RLS를 비활성화하거나 모든 접근을 허용하는 정책 사용 가능
- 빠른 개발과 테스트에 유리

### 프로덕션 환경
- 반드시 적절한 RLS 정책 설정
- 사용자별로 자신의 데이터만 접근할 수 있도록 제한
- 예시:
  ```sql
  -- 사용자가 자신의 데이터만 볼 수 있도록
  CREATE POLICY "Users can view own data"
  ON users FOR SELECT
  USING (auth.uid() = id);
  ```

## 문제 해결 체크리스트

1. ✅ Supabase Dashboard에서 SQL Editor 열기
2. ✅ `fix_rls_policies.sql` 실행
3. ✅ 정책이 제대로 생성되었는지 확인
4. ✅ 개발 서버 재시작
5. ✅ 로그인/회원가입 다시 시도

## 추가 리소스

- [Supabase RLS 문서](https://supabase.com/docs/guides/auth/row-level-security)
- [RLS 정책 예시](https://supabase.com/docs/guides/auth/row-level-security#policies)



