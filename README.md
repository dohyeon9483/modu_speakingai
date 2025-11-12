# My Speaking AI

OpenAI Realtime API와 Chat Completions API를 활용한 음성 및 텍스트 AI 회화 서비스입니다.

## 주요 기능

- 🎙️ **실시간 음성 대화**: OpenAI Realtime API와 WebRTC를 통해 저지연 한국어 음성 대화를 제공합니다.
- 💬 **텍스트 채팅**: Chat Completions API 기반의 자연스러운 텍스트 대화를 지원합니다.
- 🎨 **대화 스타일**: 업무 브레인스토밍, 고민 상담 등 여러 스타일을 선택해 원하는 분위기로 대화할 수 있습니다.
- 📄 **마이페이지**: 기본 정보, 스타일 가이드, 환경 설정을 확인하고 빠르게 음성/텍스트 페이지로 이동할 수 있습니다.
- 🔐 **로그인 기반 접근 제어**: 인증된 사용자만 대화 기능을 사용할 수 있습니다.

## 시작하기

### 1. 의존성 설치

```sh
npm install
```

### 2. 환경 변수 설정

`.env` 파일을 생성하고 다음 값을 입력하세요.

```env
OPENAI_API_KEY=your_openai_api_key_here
SUPABASE_DB_URL=your_supabase_project_url
SUPABASE_DB_PUBLIC_KEY=your_supabase_anon_key
```

### 3. 개발 서버 실행

```sh
npm run dev
# 또는 브라우저 자동 오픈
npm run dev -- --open
```

### 4. 사용 방법

1. `/login`에서 가입한 계정으로 로그인합니다.
2. 메인 허브에서 **음성 대화** 또는 **텍스트 대화** 페이지로 이동합니다.
3. 
   - 음성 페이지: `실시간 회화 시작` 버튼을 눌러 Realtime 세션을 열고 마이크 권한을 허용합니다.
   - 텍스트 페이지: 채팅 입력창에 메시지를 입력하고 Enter로 전송합니다.
4. 대화 스타일을 변경하고 싶으면 좌측 사이드바에서 원하는 스타일을 선택한 뒤 대화를 진행합니다.

## 기술 스택

- **SvelteKit**: 애플리케이션 프레임워크
- **Tailwind CSS**: 스타일링
- **OpenAI Realtime API / Chat Completions API**
- **Supabase**: 인증 및 사용자 정보 저장
- **WebRTC, Web Audio API**: 음성 스트리밍 및 처리

## 프로젝트 구조 (요약)

```
src/
├── lib/
│   ├── components/
│   │   ├── ChatInput.svelte            # 텍스트 입력 컴포넌트
│   │   ├── ConversationStyleSelector.svelte
│   │   ├── MessageList.svelte
│   │   ├── RealtimeManager.svelte      # 음성 세션 관리
│   │   └── DebugPanel.svelte
│   ├── conversationStyles.js           # 스타일 데이터 및 프롬프트
│   ├── realtime.js                     # Realtime API 로직
│   └── stores/realtimeStore.js         # 글로벌 상태 관리
└── routes/
    ├── +page.svelte                    # 허브 (음성/텍스트 선택)
    ├── voice/+page.svelte              # 실시간 음성 대화 페이지
    ├── text/+page.svelte               # 텍스트 대화 페이지
    ├── mypage/+page.svelte             # 사용자 정보 및 스타일 안내
    └── api/
        ├── realtime/+server.js         # 음성용 Realtime 엔드포인트
        └── chat/+server.js             # 텍스트용 Chat API 엔드포인트
```

## 빌드 및 배포

프로덕션 빌드를 만들려면:

```sh
npm run build
```

로컬에서 미리보기:

```sh
npm run preview
```

Vercel 어댑터가 설정되어 있으므로 Vercel에 바로 배포할 수 있습니다.

> **참고**: OpenAI Realtime API는 권한이 필요한 베타 기능일 수 있습니다. API 키에 Realtime 접근 권한이 있는지 확인하세요.
