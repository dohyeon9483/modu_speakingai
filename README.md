# My Speaking AI

OpenAI Realtime API를 사용한 실시간 AI 회화 서비스입니다.

## 기능

- 💬 **실시간 AI 회화**: OpenAI Realtime API를 사용한 초 저지연 음성 대화
- 🔐 **비밀번호 보안**: 회화 시작 전 비밀번호 인증
- 📊 **상태 표시**: 연결, 듣는 중, 말하는 중 등 실시간 상태 표시
- 🎨 **현대적인 UI**: Tailwind CSS 기반의 반응형 디자인

## 시작하기

### 1. 의존성 설치

```sh
npm install
```

### 2. OpenAI API 키 설정

`.env` 파일을 생성하고 OpenAI API 키를 추가하세요:

```env
OPENAI_API_KEY=your_openai_api_key_here
```

API 키는 [OpenAI Platform](https://platform.openai.com/api-keys)에서 발급받을 수 있습니다.

### 3. 개발 서버 실행

```sh
npm run dev

# 또는 브라우저에서 자동으로 열기
npm run dev -- --open
```

### 4. 사용 방법

1. 브라우저에서 애플리케이션 열기
2. "실시간 회화 시작" 버튼 클릭
3. 비밀번호 입력 (기본값: `1115`)
4. 마이크 권한 허용
5. 말하면 AI가 즉시 한국어로 응답합니다 (초 저지연)

## 기술 스택

- **SvelteKit**: 웹 프레임워크
- **Tailwind CSS**: 스타일링
- **OpenAI Realtime API**: 실시간 음성 대화
- **WebRTC**: 저지연 오디오 스트리밍
- **Web Audio API**: 오디오 처리 및 시각화

## 프로젝트 구조

```
src/
├── routes/
│   ├── +page.svelte                    # 메인 페이지 (실시간 회화 UI)
│   └── api/
│       └── realtime/
│           └── +server.js               # Realtime API 엔드포인트
├── lib/
│   ├── components/
│   │   ├── PasswordDialog.svelte       # 비밀번호 인증 다이얼로그
│   │   ├── RealtimeControls.svelte     # 회화 시작/종료 버튼
│   │   ├── RealtimeManager.svelte      # 연결 관리
│   │   └── StatusDisplay.svelte        # 상태 표시
│   ├── stores/
│   │   └── realtimeStore.js            # 상태 관리 스토어
│   └── realtime.js                     # Realtime API 로직
```

## 빌드

프로덕션 빌드를 생성하려면:

```sh
npm run build
```

빌드 결과를 미리보려면:

```sh
npm run preview
```

## 배포

Vercel 어댑터가 설정되어 있으므로 Vercel에 바로 배포할 수 있습니다.

> **참고**: Realtime API는 OpenAI의 최신 기능입니다. API 키에 Realtime API 접근 권한이 있는지 확인하세요.
