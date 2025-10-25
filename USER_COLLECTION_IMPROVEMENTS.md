# Users 컬렉션 개선사항

## 개요
실제 사용자 문서의 구조를 통일하고, 정보 수정 시 검색 토큰(`searchTokens`)이 자동으로 업데이트되도록 개선했습니다.

## 주요 변경사항

### 1. 회원가입 시 실제 사용자와 동일한 구조 적용

#### ✅ 수정된 파일들

1. **`src/lib/auth.ts`**
   - **Google 로그인 신규 사용자 생성**
     - `fake: false` 필드 추가 (실제 사용자 표시)
     - `searchTokens` 필드 추가 (닉네임 기반 검색 토큰)
     - `isVerified: true`로 설정 (봇과 구분)
   
   - **카카오 사용자 생성 함수 (`createKakaoUser`)**
     - `fake: false` 필드 추가
     - `searchTokens` 필드 추가 (닉네임 기반)

2. **`src/lib/api/auth.ts`**
   - 이메일 회원가입 (`signUp`) 함수는 이미 올바르게 구현되어 있음
   - `fake: false`, `searchTokens` 모두 포함

3. **`src/lib/kakao.ts`**
   - `convertKakaoUserToFirebaseUser` 함수는 이미 올바르게 구현되어 있음
   - `fake: false`, `searchTokens` 모두 포함

### 2. 정보 수정 시 searchTokens 자동 갱신

#### ✅ 수정된 파일들

1. **`src/lib/api/users.ts`**
   - **`updateUserProfile` 함수 개선**
     - 닉네임(`userName`) 또는 실명(`realName`) 변경 시
     - 현재 닉네임, 실명, 학교명을 모두 고려하여 `searchTokens` 재생성
     - 자동으로 Firestore 업데이트에 포함

2. **`src/lib/api/schools.ts`**
   - **`selectSchool` 함수 개선**
     - 학교 선택/변경 시
     - 닉네임, 실명, 새 학교명으로 `searchTokens` 재생성
     - 학교 정보와 함께 자동 업데이트

## 기술적 세부사항

### searchTokens 생성 로직
```typescript
// utils/search-tokens.ts의 generateUserSearchTokens 사용
const searchTokens = generateUserSearchTokens(
  userName,    // 닉네임
  realName,    // 실명
  schoolName   // 학교명
);
```

### 검색 토큰의 특징
- **닉네임/실명**: 1-8글자의 모든 부분 문자열 생성
- **학교명**: 2-4글자의 의미있는 부분 문자열만 생성
- **최대 50개**로 제한하여 Firestore 배열 크기 최적화
- 한글 완벽 지원

## 사용자 문서 구조 (통일됨)

```typescript
{
  uid: string,
  email: string,
  role: 'student',
  isVerified: true,
  fake: false,              // ✅ 실제 사용자 표시
  searchTokens: string[],   // ✅ 검색용 토큰 배열
  profile: {
    userName: string,
    realName: string,
    gender: string,
    birthYear: number,
    birthMonth: number,
    birthDay: number,
    phoneNumber: string,
    profileImageUrl: string,
    createdAt: Timestamp,
    isAdmin: boolean
  },
  stats: {
    level: number,
    currentExp: number,
    totalExperience: number,
    currentLevelRequiredXp: number,
    postCount: number,
    commentCount: number,
    likeCount: number,
    streak: number
  },
  school?: {
    id: string,
    name: string,
    grade: string | null,
    classNumber: string | null,
    studentNumber: string | null,
    isGraduate: boolean
  },
  agreements: {
    terms: boolean,
    privacy: boolean,
    location: boolean,
    marketing: boolean
  },
  createdAt: Timestamp,
  updatedAt: Timestamp
}
```

## 실제 사용자 vs 봇 구분

### 실제 사용자
- `fake: false`
- `isVerified: true`
- 회원가입 시 자동으로 `searchTokens` 생성
- 프로필 수정 시 `searchTokens` 자동 갱신

### 봇 계정
- `fake: true`
- 봇 생성 시 `searchTokens` 포함 (`BotService.createBot`)
- 관리자 페이지에서 수정 가능

## 영향받는 기능

### ✅ 검색 기능 개선
- 닉네임 변경 → 즉시 새 닉네임으로 검색 가능
- 학교 변경 → 새 학교명으로 사용자 검색 가능
- 실명 입력/변경 → 실명으로도 검색 가능

### ✅ 일관성 개선
- 모든 회원가입 방법(이메일, Google, 카카오)에서 동일한 구조
- 봇과 실제 사용자를 명확히 구분 가능
- 검색 기능이 항상 최신 정보 반영

## 플랫폼별 상태

### ✅ 웹 (inschoolz-web)

| 로그인 방법 | fake | searchTokens | 상태 |
|-----------|------|--------------|------|
| 이메일 회원가입 | ✅ | ✅ (닉네임+실명+학교) | 완료 |
| Google 로그인 | ✅ | ✅ (닉네임) | 완료 |
| 카카오 로그인 | ✅ | ✅ (닉네임) | 완료 |
| Apple 로그인 | ❌ | ❌ | **미구현** |

### ✅ 앱 (inschoolz-app)

| 로그인 방법 | fake | searchTokens | 상태 |
|-----------|------|--------------|------|
| 이메일 회원가입 | ✅ | ✅ (닉네임+실명+학교) | 완료 |
| 카카오 로그인 | ✅ | ✅ (닉네임) | 완료 |
| Apple 로그인 | ✅ | ✅ (닉네임+실명) | 완료 |
| Google 로그인 | ❌ | ❌ | **미구현** |

### 📝 정보 수정 시 searchTokens 자동 갱신

| 기능 | 웹 | 앱 | 상태 |
|-----|----|----|------|
| 닉네임 변경 | ✅ | ✅ | 완료 |
| 실명 변경 | ✅ | ✅ | 완료 |
| 학교 선택/변경 | ✅ | ✅ | 완료 |

## 테스트 체크리스트

### 웹
- [x] Google 로그인 신규 가입 시 `fake: false`, `searchTokens` 확인
- [x] 카카오 로그인 신규 가입 시 `fake: false`, `searchTokens` 확인
- [x] 이메일 회원가입 시 `fake: false`, `searchTokens` 확인
- [x] 프로필에서 닉네임 변경 시 `searchTokens` 업데이트 확인
- [x] 프로필에서 실명 변경 시 `searchTokens` 업데이트 확인
- [x] 학교 선택/변경 시 `searchTokens` 업데이트 확인
- [ ] 변경된 정보로 사용자 검색 기능 동작 확인

### 앱
- [x] 이메일 회원가입 시 `fake: false`, `searchTokens` 확인
- [x] 카카오 로그인 신규 가입 시 `fake: false`, `searchTokens` 확인
- [x] Apple 로그인 신규 가입 시 `fake: false`, `searchTokens` 확인
- [x] 프로필에서 닉네임 변경 시 `searchTokens` 업데이트 확인
- [x] 프로필에서 실명 변경 시 `searchTokens` 업데이트 확인
- [x] 학교 선택/변경 시 `searchTokens` 업데이트 확인

## 주의사항

### 기존 사용자 마이그레이션
기존에 생성된 사용자 중 `fake`, `searchTokens` 필드가 없는 경우:

```javascript
// 스크립트로 일괄 업데이트 필요
const users = await db.collection('users').where('fake', '==', null).get();
const batch = db.batch();

users.forEach(doc => {
  const userData = doc.data();
  const searchTokens = generateUserSearchTokens(
    userData.profile?.userName,
    userData.profile?.realName,
    userData.school?.name
  );
  
  batch.update(doc.ref, {
    fake: false,
    searchTokens
  });
});

await batch.commit();
```

### Firestore 인덱스
`searchTokens` 배열 필드 검색을 위한 인덱스가 필요할 수 있습니다:
- Collection: `users`
- Field: `searchTokens` (Array)
- 자동 생성되지만, 복합 쿼리 시 수동 생성 필요

## 관련 파일

### 웹 - 수정된 파일
- `inschoolz-web/src/lib/auth.ts` - Google, 카카오 로그인
- `inschoolz-web/src/lib/api/users.ts` - 프로필 업데이트
- `inschoolz-web/src/lib/api/schools.ts` - 학교 선택

### 웹 - 영향받지 않은 파일 (이미 올바름)
- `inschoolz-web/src/lib/api/auth.ts` - 이메일 회원가입
- `inschoolz-web/src/lib/kakao.ts` - 카카오 사용자 변환
- `inschoolz-web/src/app/auth/kakao/success/page.tsx` - 카카오 로그인 성공
- `inschoolz-web/src/lib/services/bot-service.ts` - 봇 생성

### 앱 - 수정된 파일
- `inschoolz-app/lib/users.ts` - 프로필 업데이트
- `inschoolz-app/components/SchoolSetupModal.tsx` - 학교 선택

### 앱 - 영향받지 않은 파일 (이미 올바름)
- `inschoolz-app/lib/auth.ts` - 이메일 회원가입, Apple 로그인
- `inschoolz-app/lib/kakao.ts` - 카카오 로그인

### 유틸리티
- `inschoolz-web/src/utils/search-tokens.ts` - 검색 토큰 생성 함수
- `inschoolz-app/utils/search-tokens.ts` - 검색 토큰 생성 함수

