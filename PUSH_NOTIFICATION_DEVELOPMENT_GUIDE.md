# 인스쿨즈 개발 환경 설정 가이드

## 푸시 알림 CORS 오류 해결

### 🚨 문제
- localhost 개발 환경에서 브라우저가 직접 Expo Push API에 요청 시 CORS 오류 발생
- `Access to fetch at 'https://exp.host/--/api/v2/push/send' from origin 'http://localhost:3000' has been blocked by CORS policy`

### ✅ 해결 방법

#### 1. 서버 API 엔드포인트 사용
- 클라이언트 → 서버 API → Expo Push API 구조로 변경
- `/api/send-push-notification` 엔드포인트 생성 완료

#### 2. 개발 환경 푸시 알림 비활성화 (선택사항)
`.env.local` 파일에 다음 환경 변수 추가:

```env
# 개발 환경에서 푸시 알림 비활성화 (선택사항)
DISABLE_PUSH_NOTIFICATIONS=true
```

#### 3. 푸시 알림 테스트를 원하는 경우
`.env.local` 파일에서 해당 변수를 제거하거나 `false`로 설정:

```env
# 푸시 알림 활성화
DISABLE_PUSH_NOTIFICATIONS=false
```

### 🔧 추가 설정 (푸시 알림 테스트 시 필요)

#### Firebase Admin SDK 설정
```env
# Firebase Admin SDK (서버 사이드 푸시 발송용)
FIREBASE_PROJECT_ID=your_project_id
FIREBASE_PRIVATE_KEY_ID=your_private_key_id
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL=your_client_email
FIREBASE_CLIENT_ID=your_client_id

# Firebase Web Push (웹 푸시용)
NEXT_PUBLIC_FIREBASE_VAPID_KEY=your_vapid_key
```

### 📱 테스트 방법

#### 1. 앱 푸시 테스트
1. 실제 모바일 기기에서 앱 설치 및 로그인
2. 푸시 토큰이 Firebase에 저장되었는지 확인
3. 웹에서 댓글 작성하여 푸시 알림 확인

#### 2. 웹 푸시 테스트
1. 브라우저에서 알림 권한 허용
2. 웹 푸시 토큰 등록
3. 다른 사용자가 댓글 작성하여 웹 푸시 확인

### 🐛 디버깅 팁

#### 콘솔 로그 확인
- `[CLIENT]`: 클라이언트 사이드 로그
- `[SERVER]`: 서버 사이드 로그
- `[DEBUG]`: 상세 디버그 정보

#### 일반적인 문제들
1. **푸시 토큰 없음**: 사용자가 앱 로그인을 하지 않았거나 웹 푸시 등록을 하지 않음
2. **권한 거부**: 브라우저나 앱에서 알림 권한이 거부됨
3. **네트워크 오류**: Expo Push API 서버 문제 또는 네트워크 연결 문제

### 🚀 프로덕션 배포 시 주의사항

1. **환경 변수 설정**: 모든 Firebase 관련 환경 변수가 올바르게 설정되어 있는지 확인
2. **HTTPS 필수**: 웹 푸시는 HTTPS 환경에서만 작동
3. **Service Worker**: PWA 설정이 올바르게 되어 있는지 확인
4. **도메인 검증**: Firebase 프로젝트에 도메인이 등록되어 있는지 확인
