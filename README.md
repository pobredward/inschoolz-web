# 인스쿨즈 (inschoolz)

인스쿨즈는 학교 커뮤니티 플랫폼으로, 학생, 교사 및 학교 구성원들이 소통하고 정보를 공유할 수 있는 공간입니다.

## 기술 스택

- **프론트엔드**: Next.js 15, React 19, Tailwind CSS, shadcn/ui
- **백엔드**: Firebase (Firestore, Authentication, Storage, Analytics, Functions)
- **상태 관리**: Zustand, React Query
- **SEO**: Next.js 메타데이터 API, 정적 생성, 서버 컴포넌트

## 주요 기능

- 학교별 독립적인 커뮤니티 공간
- 사용자 인증 및 학교 구성원 인증
- 게시판 및 댓글 시스템
- 실시간 알림
- 익명 채팅
- 학사 일정
- 관리자 대시보드

## 개발 환경 설정

### 사전 요구사항

- Node.js 18.0 이상
- npm 또는 yarn
- Firebase 계정

### 설치 및 실행

1. 저장소 클론

```bash
git clone https://github.com/yourusername/inschoolz.git
cd inschoolz
```

2. 의존성 설치

```bash
npm install
# 또는
yarn install
```

3. 환경 변수 설정

`.env.local` 파일을 프로젝트 루트에 생성하고 다음 변수를 설정하세요:

```
NEXT_PUBLIC_ADMIN_PASSWORD=your_admin_password
NEXT_PUBLIC_FIREBASE_API_KEY=your_firebase_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_firebase_auth_domain
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_firebase_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_firebase_storage_bucket
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_firebase_messaging_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_firebase_app_id
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=your_firebase_measurement_id
```

4. 개발 서버 실행

```bash
npm run dev
# 또는
yarn dev
```

이제 브라우저에서 `http://localhost:3000`으로 접속하여 애플리케이션을 확인할 수 있습니다.

## 배포

프로젝트는 Vercel에 쉽게 배포할 수 있습니다:

```bash
npx vercel
```

## 라이선스

이 프로젝트는 MIT 라이선스 하에 배포됩니다. 자세한 내용은 [LICENSE](LICENSE) 파일을 참조하세요.
