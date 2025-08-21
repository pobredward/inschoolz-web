# reCAPTCHA Enterprise 설정 가이드

## 현재 오류 상황
`Failed to initialize reCAPTCHA Enterprise config. Triggering the reCAPTCHA v2 verification.` 오류가 발생하고 있습니다.

## 해결 방법

### 1. Firebase Console 설정

1. **Firebase Console** (https://console.firebase.google.com) 접속
2. 프로젝트 선택
3. **Authentication** > **Settings** > **Sign-in method**로 이동
4. **Phone** 인증 제공업체 설정에서 다음 확인:
   - reCAPTCHA Enterprise가 활성화되어 있는지 확인
   - 승인된 도메인에 개발/운영 도메인이 모두 포함되어 있는지 확인

### 2. reCAPTCHA Enterprise 활성화

1. **Google Cloud Console** (https://console.cloud.google.com) 접속
2. Firebase 프로젝트와 동일한 프로젝트 선택
3. **Security** > **reCAPTCHA Enterprise** 메뉴로 이동
4. reCAPTCHA Enterprise API 활성화
5. **Keys** 탭에서 새 사이트 키 생성:
   - **Type**: Score-based (for Enterprise)
   - **Domains**: 앱의 도메인들 추가 (localhost:3000, 운영 도메인 등)

### 3. 환경변수 설정

`.env.local` 파일에 다음 변수 추가 (선택사항):
```env
# reCAPTCHA Enterprise 사용 시
NEXT_PUBLIC_RECAPTCHA_SITE_KEY=your_enterprise_site_key_here
```

### 4. 승인된 도메인 확인

Firebase Console > Authentication > Settings > Authorized domains에서:
- `localhost` (개발용)
- `your-domain.com` (운영용)
- 기타 필요한 도메인들

## 코드 수정 사항

이미 다음 수정사항이 적용되었습니다:

1. **reCAPTCHA 설정 개선** (`lib/auth.ts`):
   - Enterprise 호환성을 위한 추가 설정
   - Fallback 로직 구현
   - 에러 처리 강화

2. **컴포넌트 초기화 로직 개선**:
   - DOM 렌더링 후 reCAPTCHA 설정
   - 메모리 누수 방지를 위한 정리 함수
   - Enterprise fallback 오류 처리

3. **사용자 친화적 오류 메시지**:
   - reCAPTCHA Enterprise 오류 감지 시 자동 재설정
   - 명확한 안내 메시지 제공

## 테스트 방법

1. 개발 서버 재시작:
   ```bash
   cd inschoolz-web
   npm run dev
   ```

2. 브라우저에서 `/auth` 페이지 접속
3. 휴대폰 로그인 탭 선택
4. 휴대폰 번호 입력 후 인증번호 발송 테스트

## 임시 해결책

reCAPTCHA Enterprise 설정이 완료될 때까지 다음과 같이 임시로 테스트할 수 있습니다:

1. **개발 환경에서만**: Firebase Console에서 앱 확인 비활성화
2. **테스트 번호 사용**: Firebase에서 제공하는 테스트 번호 활용

## 추가 참고자료

- [Firebase Phone Auth 공식 문서](https://firebase.google.com/docs/auth/web/phone-auth)
- [reCAPTCHA Enterprise 설정 가이드](https://cloud.google.com/recaptcha-enterprise/docs/quickstart)
- [Firebase 승인된 도메인 설정](https://firebase.google.com/docs/auth/web/auth-domain-customization)
