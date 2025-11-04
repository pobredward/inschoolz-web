# 인스쿨즈 앱 다운로드 리다이렉트 페이지

## 개요

사용자의 디바이스를 자동으로 감지하여 적절한 앱 스토어로 리다이렉트하는 페이지입니다.

- iOS 사용자 → App Store
- Android 사용자 → Google Play Store
- 기타 디바이스 → Google Play Store (기본값)

## 구현된 페이지

프로젝트에 3가지 버전의 리다이렉트 페이지가 구현되었습니다:

### 1. `/get` - 미니멀 버전
- **경로**: `src/app/get/page.tsx`
- **특징**: 가장 단순한 UI, 빠른 리다이렉트
- **사용 사례**: 간단한 공유 링크, SMS 등

### 2. `/download` - 스탠다드 버전
- **경로**: `src/app/download/page.tsx`
- **특징**: 중간 수준의 UI, 수동 다운로드 버튼 제공
- **사용 사례**: 일반적인 마케팅 캠페인

### 3. `/app` - 프리미엄 버전
- **경로**: `src/app/app/page.tsx`
- **특징**: 
  - 풍부한 UI/UX
  - SEO 최적화 (메타데이터)
  - 브랜드 아이덴티티 강조
  - 애니메이션 효과
- **사용 사례**: 
  - 메인 다운로드 페이지
  - 소셜 미디어 광고
  - 공식 프로모션

## 기술 스택

- **Framework**: Next.js 14+ (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Device Detection**: User Agent 분석

## 디바이스 감지 로직

```typescript
const userAgent = navigator.userAgent || navigator.vendor;

// iOS 감지 (iPhone, iPad, iPod)
if (/iPad|iPhone|iPod/.test(userAgent)) {
  // App Store로 리다이렉트
}
// Android 감지
else if (/android/i.test(userAgent)) {
  // Google Play Store로 리다이렉트
}
// 기타 디바이스
else {
  // Google Play Store로 리다이렉트 (기본값)
}
```

## URL 설정

### App Store URL
```
https://apps.apple.com/kr/app/%EC%9D%B8%EC%8A%A4%EC%BF%A8%EC%A6%88-inschoolz/id6748880507?l=en-GB
```

### Google Play Store URL
```
https://play.google.com/store/apps/details?id=com.onmindlab.inschoolz
```

## 사용 방법

### 로컬 테스트

```bash
# 개발 서버 실행
cd inschoolz-web
npm run dev

# 테스트 URL
http://localhost:3000/get
http://localhost:3000/download
http://localhost:3000/app
```

### 모바일 디바이스에서 테스트

1. **iOS Safari 테스트**
   - 개발자 도구에서 User Agent 변경
   - 또는 실제 iOS 기기에서 접속

2. **Android Chrome 테스트**
   - Chrome DevTools → Device Mode
   - User Agent를 Android로 설정

3. **네트워크 테스트**
   - 같은 네트워크의 모바일 기기에서 접속
   - 예: `http://192.168.x.x:3000/app`

## 미들웨어 설정

앱 다운로드 페이지는 **인증 없이 접근 가능**해야 합니다.

### 공개 경로 설정 완료

`src/middleware.ts`에 다음 경로들이 추가되어 있습니다:

```typescript
const publicRoutes = [
  // ... 기존 경로들
  '/app',      // 앱 다운로드 (프리미엄)
  '/download', // 앱 다운로드 (스탠다드)
  '/get',      // 앱 다운로드 (미니멀)
];
```

이제 로그인하지 않은 사용자도 앱 다운로드 페이지에 접근할 수 있습니다.

## 배포

### Vercel 배포 (권장)

```bash
# Vercel CLI 설치
npm i -g vercel

# 배포
vercel --prod
```

배포 후 접근 URL 예시:
- `https://inschoolz.com/app`
- `https://inschoolz.com/download`
- `https://inschoolz.com/get`

### 환경 변수 (선택사항)

필요시 `.env.local`에 추가:

```env
NEXT_PUBLIC_APP_STORE_URL=https://apps.apple.com/kr/app/...
NEXT_PUBLIC_PLAY_STORE_URL=https://play.google.com/store/apps/details?id=...
```

## 마케팅 활용 예시

### 1. QR 코드 생성
```
URL: https://inschoolz.com/app
```

### 2. 소셜 미디어 링크
- Instagram Bio: `inschoolz.com/app`
- Facebook 게시물: `inschoolz.com/download`
- Twitter/X: `inschoolz.com/get`

### 3. SMS 캠페인
```
인스쿨즈 앱을 다운로드하세요! 👉 inschoolz.com/get
```

### 4. 이메일 마케팅
```html
<a href="https://inschoolz.com/app">
  지금 다운로드하기
</a>
```

## URL 단축 서비스 (선택사항)

더 짧은 URL이 필요한 경우:

1. **Bitly 사용**
   - `bit.ly/inschoolz-app` → `inschoolz.com/app`

2. **커스텀 도메인**
   - `get.inschoolz.com` → `inschoolz.com/get`

## 성능 최적화

### 1. 즉시 리다이렉트
- `useEffect`에서 즉시 실행
- 사용자 대기 시간 최소화

### 2. 로딩 UI
- 리다이렉트 중 로딩 애니메이션 표시
- 사용자 경험 개선

### 3. 폴백 버튼
- 자동 리다이렉트 실패 시 수동 버튼 제공
- 접근성 향상

## 트러블슈팅

### 문제 1: 리다이렉트가 작동하지 않음

**원인**: 브라우저 보안 정책
**해결**:
```typescript
// 타임아웃 추가
setTimeout(() => {
  window.location.href = targetUrl;
}, 100);
```

### 문제 2: iOS에서 App Store가 열리지 않음

**원인**: 잘못된 URL 형식
**해결**: URL 인코딩 확인
```typescript
const appStoreUrl = encodeURI('https://apps.apple.com/...');
```

### 문제 3: 데스크톱에서 모바일 스토어로 이동

**원인**: 의도된 동작
**해결**: 웹 버전 안내 페이지 추가 고려

## 분석 및 추적

### Google Analytics 연동

```typescript
// /app/app/page.tsx
useEffect(() => {
  // GA 이벤트 추적
  gtag('event', 'app_download_redirect', {
    device_type: isIOS ? 'ios' : isAndroid ? 'android' : 'other',
  });
}, []);
```

### Facebook Pixel 연동

```typescript
fbq('track', 'ViewContent', {
  content_name: 'App Download Page',
  content_category: 'Downloads',
});
```

## SEO 최적화

각 페이지에는 다음이 포함되어 있습니다:

- **Title**: 검색 엔진용 제목
- **Description**: 페이지 설명
- **Open Graph**: 소셜 미디어 공유용
- **Keywords**: 검색 키워드
- **Canonical URL**: 중복 컨텐츠 방지

## 참고 자료

### 유사 서비스 분석
- [Prompie](https://prompie.com) - Firebase Dynamic Links 기반
- [Branch.io](https://branch.io) - 딥링킹 솔루션
- [Firebase Dynamic Links](https://firebase.google.com/docs/dynamic-links) (Deprecated)

### 대안 솔루션

1. **Firebase Dynamic Links** (2025년 8월 25일 종료 예정)
2. **Branch.io** (유료, 고급 기능)
3. **AppsFlyer OneLink** (유료, 어트리뷰션 포함)
4. **자체 구현** ✅ (현재 방식, 무료)

## 유지보수

### URL 업데이트

앱 스토어 URL이 변경될 경우:

1. 각 페이지의 URL 상수 수정
2. 또는 환경 변수 사용 (권장)

```typescript
// 환경 변수 사용 예시
const appStoreUrl = process.env.NEXT_PUBLIC_APP_STORE_URL || 'fallback-url';
```

### 버전 관리

```bash
# Git 태그
git tag -a v1.0.0 -m "Initial app download redirect pages"
git push origin v1.0.0
```

## 라이선스

© 2025 OnMindLab. All rights reserved.

## 문의

- **이메일**: pobredward@gmail.com
- **전화**: +82 10-6711-7933

---

**최종 업데이트**: 2025-11-04
**작성자**: Edward Shin
**버전**: 1.0.0

