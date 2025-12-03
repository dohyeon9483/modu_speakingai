# 토스페이먼츠 빠른 시작 가이드

## 실제 크레딧 충전을 위한 설정

### 1단계: 토스페이먼츠 계정 생성 및 API 키 발급

1. **토스페이먼츠 개발자센터 접속**
   - [https://developers.tosspayments.com/](https://developers.tosspayments.com/)
   - 회원가입 또는 로그인

2. **샌드박스(테스트) 환경 설정**
   - 대시보드에서 "샌드박스" 또는 "테스트" 환경 선택
   - 실제 결제 없이 테스트 가능

3. **API 키 발급**
   - 대시보드 → **개발** → **API 키** 메뉴
   - **시크릿 키 (Secret Key)** 복사
     - 테스트 환경: `test_sk_`로 시작
     - 운영 환경: `live_sk_`로 시작

### 2단계: .env 파일에 키 추가

프로젝트 루트의 `.env` 파일에 다음을 추가하세요:

```env
# 기존 환경 변수들...
OPENAI_API_KEY=your_openai_api_key_here
SUPABASE_DB_URL=https://your-project.supabase.co
SUPABASE_DB_PUBLIC_KEY=your_supabase_anon_key_here

# 토스페이먼츠 설정 추가
TOSS_PAYMENTS_SECRET_KEY=test_sk_xxxxxxxxxxxxx
CREDITS_PER_5000_WON=10000
PUBLIC_APP_URL=http://localhost:5173
```

**중요:**
- `test_sk_`로 시작하는 키는 테스트용입니다 (실제 결제 없음)
- `live_sk_`로 시작하는 키는 운영용입니다 (실제 결제 발생)
- 처음에는 테스트 키로 시작하세요!

### 3단계: 데이터베이스 테이블 생성

Supabase SQL Editor에서 `create_payment_tables.sql` 파일 실행:

1. [Supabase Dashboard](https://app.supabase.com) 접속
2. SQL Editor 열기
3. `create_payment_tables.sql` 내용 복사하여 실행

### 4단계: 개발 서버 재시작

```bash
# 서버 중지 (Ctrl + C)
npm run dev
```

### 5단계: 결제 테스트

1. **로그인**
   - `/login` 페이지에서 로그인

2. **결제 페이지 접속**
   - `/payments` 또는 마이페이지에서 "크레딧 충전" 클릭

3. **결제 금액 선택**
   - 5,000원, 10,000원, 20,000원, 50,000원 중 선택

4. **결제 진행**
   - "결제하기" 버튼 클릭
   - 토스페이먼츠 결제 페이지로 이동

5. **테스트 카드 정보 입력** (샌드박스 환경)
   ```
   카드번호: 1234-1234-1234-1234
   유효기간: 미래 날짜 (예: 12/25)
   CVC: 임의의 3자리 (예: 123)
   카드 비밀번호: 임의의 2자리 (예: 12)
   ```

6. **결제 완료 확인**
   - 결제 성공 후 `/payments/success` 페이지로 이동
   - 크레딧이 자동으로 추가됨
   - 마이페이지에서 크레딧 잔액 확인

## 실제 결제 (운영 환경)

### 주의사항
- 실제 결제는 **운영 환경**에서만 사용하세요
- 운영 환경으로 전환하기 전에 충분히 테스트하세요
- 실제 고객의 돈이 결제되므로 신중하게 진행하세요

### 운영 환경 설정

1. **토스페이먼츠 운영 환경 활성화**
   - 대시보드에서 "운영" 환경으로 전환
   - 운영용 시크릿 키 발급 (`live_sk_`로 시작)

2. **.env 파일 업데이트**
   ```env
   TOSS_PAYMENTS_SECRET_KEY=live_sk_xxxxxxxxxxxxx
   PUBLIC_APP_URL=https://your-domain.com
   ```

3. **서버 재시작**

## 문제 해결

### "토스페이먼츠 시크릿 키가 설정되지 않았습니다" 에러

1. `.env` 파일이 프로젝트 루트에 있는지 확인
2. `TOSS_PAYMENTS_SECRET_KEY`가 올바르게 입력되었는지 확인
3. 키 앞뒤에 따옴표나 공백이 없는지 확인
4. **개발 서버를 재시작** (환경 변수 변경 후 필수!)

### 결제가 진행되지 않는 경우

1. 토스페이먼츠 대시보드에서 결제 내역 확인
2. API 키가 올바른 환경(테스트/운영)인지 확인
3. 네트워크 연결 확인
4. 브라우저 콘솔에서 에러 확인

### 크레딧이 추가되지 않는 경우

1. `/payments/success` 페이지에서 결제 확인 메시지 확인
2. Supabase에서 `payments` 테이블의 `status` 확인
3. `credit_transactions` 테이블에서 거래 내역 확인
4. 서버 로그에서 에러 확인

## 테스트 카드 번호 (샌드박스)

토스페이먼츠 샌드박스에서 사용 가능한 테스트 카드:

| 카드번호 | 결과 |
|---------|------|
| 1234-1234-1234-1234 | 성공 |
| 4000-0000-0000-0002 | 실패 |
| 4000-0000-0000-9999 | 한도 초과 |

모든 테스트 카드:
- 유효기간: 미래 날짜
- CVC: 임의의 3자리
- 카드 비밀번호: 임의의 2자리

## 추가 리소스

- [토스페이먼츠 개발자센터](https://developers.tosspayments.com/)
- [API 레퍼런스](https://docs.tosspayments.com/reference)
- [샌드박스 가이드](https://docs.tosspayments.com/guides/v2/get-started/llms-guide)



