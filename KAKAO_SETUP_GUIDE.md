# 카카오 로그인 개발 환경 설정 가이드

## 1. 카카오 개발자 콘솔 설정

### 1-1. 카카오 개발자 콘솔 접속
- [https://developers.kakao.com/](https://developers.kakao.com/) 에 접속
- 카카오 계정으로 로그인

### 1-2. 앱 생성 및 설정
1. **내 애플리케이션** → **애플리케이션 추가하기**
2. 앱 이름: `인스쿨즈` (또는 원하는 이름)
3. 사업자명: 해당 사업자명 입력

### 1-3. 플랫폼 설정
1. **앱 설정** → **플랫폼** → **Web 플랫폼 등록**
2. 사이트 도메인 등록:
   - **개발 환경**: `http://localhost:3000`
   - **프로덕션 환경**: `https://inschoolz.com`

### 1-4. 카카오 로그인 활성화
1. **제품 설정** → **카카오 로그인** → **활성화 설정**
2. **카카오 로그인** 상태를 **ON**으로 변경

### 1-5. Redirect URI 등록
1. **제품 설정** → **카카오 로그인** → **Redirect URI**
2. 다음 URI들을 추가:
   ```
   # 개발 환경
   http://localhost:3000/api/auth/callback/kakao
   
   # 프로덕션 환경
   https://inschoolz.com/api/auth/callback/kakao
   ```

### 1-6. 동의항목 설정
1. **제품 설정** → **카카오 로그인** → **동의항목**
2. 다음 항목들을 설정:
   - **닉네임**: 필수 동의
   - **프로필 사진**: 선택 동의
   - **카카오계정(이메일)**: 선택 동의

### 1-7. 앱 키 확인
1. **앱 설정** → **앱 키**에서 다음 키 확인:
   - **JavaScript 키**: 현재 사용 중인 키가 맞는지 확인
   ```
   JavaScript 키: 7aa469d3bb62d3e03652579878c8e7b3
   ```

## 2. 환경 변수 설정

`.env.local` 파일에 다음 환경 변수가 설정되어 있는지 확인:

```env
# 카카오 로그인 설정
NEXT_PUBLIC_KAKAO_APP_KEY=7aa469d3bb62d3e03652579878c8e7b3
NEXT_PUBLIC_KAKAO_REDIRECT_URI=https://inschoolz.com/api/auth/callback/kakao

# Firebase 관련 환경 변수들도 필요
NEXT_PUBLIC_FIREBASE_API_KEY=...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=...
# ... 기타 Firebase 설정
```

## 3. 개발 환경에서 테스트

### 3-1. 개발 서버 실행
```bash
npm run dev
```

### 3-2. 카카오 로그인 테스트
1. 브라우저에서 `http://localhost:3000/login` 접속
2. **카카오로 계속하기** 버튼 클릭
3. 카카오 로그인 페이지에서 로그인
4. 자동으로 앱에 로그인되는지 확인

### 3-3. 디버깅
개발자 도구 콘솔에서 다음과 같은 로그들을 확인할 수 있습니다:
```
🔍 카카오 로그인 설정: {
  appKey: "7aa469d3...",
  redirectUri: "http://localhost:3000/api/auth/callback/kakao",
  environment: "localhost"
}
```

## 4. 문제 해결

### 4-1. "Redirect URI mismatch" 오류
- 카카오 개발자 콘솔에서 Redirect URI가 정확히 등록되었는지 확인
- 개발 환경: `http://localhost:3000/api/auth/callback/kakao`
- 프로덕션 환경: `https://inschoolz.com/api/auth/callback/kakao`

### 4-2. "Invalid client" 오류
- 환경 변수 `NEXT_PUBLIC_KAKAO_APP_KEY`가 올바르게 설정되었는지 확인
- 카카오 개발자 콘솔에서 JavaScript 키가 맞는지 확인

### 4-3. "Invalid redirect_uri" 오류
- 플랫폼 설정에서 웹 도메인이 등록되었는지 확인
- Redirect URI 목록에 정확한 URL이 추가되었는지 확인

### 4-4. 권한 관련 오류
- 카카오 로그인이 활성화되어 있는지 확인
- 동의항목이 올바르게 설정되었는지 확인

## 5. 자동 환경 감지

현재 구현된 코드는 자동으로 환경을 감지합니다:

- **localhost 또는 127.0.0.1**: 개발 환경으로 인식하여 `http://localhost:포트/api/auth/callback/kakao` 사용
- **기타 도메인**: 프로덕션 환경으로 인식하여 환경 변수의 `NEXT_PUBLIC_KAKAO_REDIRECT_URI` 사용

이를 통해 개발과 프로덕션 환경에서 별도 설정 없이 자동으로 올바른 리다이렉트 URI를 사용합니다.

## 6. 보안 고려사항

1. **JavaScript 키**는 클라이언트에 노출되므로 도메인 제한을 반드시 설정
2. **Admin 키**는 절대 클라이언트에 노출하지 않음
3. Redirect URI는 정확히 일치해야 하므로 HTTPS 사용 권장
4. 카카오 개발자 콘솔에서 보안 설정을 정기적으로 검토
