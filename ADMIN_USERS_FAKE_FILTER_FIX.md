# 관리자 페이지 실제 사용자 필터링 개선

## 문제점

`/admin/users` 페이지에서 "실제 사용자" 필터를 적용했을 때:
- `fake: false`인 사용자만 표시됨
- `fake` 필드가 없는 사용자는 표시되지 않음

**원인:** Firestore 쿼리에서 `where('fake', '==', false)`만 조회하여, `fake` 필드가 없는 기존 사용자들이 누락됨

## 해결 방법

### 1. 필터링 로직 개선 ✅

**파일:** `inschoolz-web/src/lib/api/users.ts`

#### 변경 사항

**이전 코드:**
```typescript
// fake 필터 (봇 사용자만 서버에서 필터링)
if (fake === 'fake') {
  constraints.push(where('fake', '==', true));
}
// fake === 'real'일 때는 서버 쿼리 없음 (클라이언트에서만 필터링)
```

**개선된 코드:**
```typescript
// fake 필터
if (fake === 'fake') {
  constraints.push(where('fake', '==', true));
} else if (fake === 'real') {
  // 실제 사용자: fake가 false이거나 존재하지 않는 경우
  // Firestore 제약으로 서버에서는 fake == false만 쿼리하고
  // fake가 없는 사용자는 클라이언트에서 추가로 가져옴
  constraints.push(where('fake', '==', false));
}

// ... 기본 쿼리 실행 후 ...

// fake === 'real'인 경우 fake 필드가 없는 사용자도 추가로 가져오기
if (fake === 'real') {
  // 모든 사용자를 가져와서 fake 필드 체크
  const allUsersQuery = query(usersRef, orderBy(sortField, sortOrder), limit(500));
  const allUsersSnapshot = await getDocs(allUsersQuery);
  
  allUsersSnapshot.forEach((doc) => {
    const userData = doc.data();
    // fake 필드가 없거나 명시적으로 false인 경우만
    if (userData.fake === undefined || userData.fake === null || userData.fake === false) {
      const userExists = allUsers.some(u => u.uid === doc.id);
      if (!userExists) {
        allUsers.push({ 
          uid: doc.id, 
          ...userData 
        } as User);
      }
    }
  });
  
  console.log('After adding users without fake field - Total users:', allUsers.length);
}
```

#### 개선 효과
- `fake: false` 사용자 조회
- `fake` 필드가 없는 사용자도 조회
- 중복 제거 로직으로 안전한 병합

### 2. 마이그레이션 스크립트 작성 ✅

**파일:** `scripts/migrate-fake-field.js`

기존 사용자들에게 `fake: false` 필드를 추가하는 스크립트입니다.

#### 주요 기능

1. **사용자 분석**
   - 모든 사용자 조회
   - `fake` 필드 유무 확인
   - 통계 출력

2. **안전한 업데이트**
   - 사용자 확인 프롬프트
   - Batch 처리 (500개씩)
   - 진행 상황 모니터링

3. **자동 토큰 생성**
   - `searchTokens`가 없는 경우 자동 생성
   - 닉네임, 실명, 학교명 기반 토큰 생성

4. **결과 검증**
   - 마이그레이션 완료 후 재확인
   - 최종 통계 출력

#### 실행 방법

```bash
cd scripts
node migrate-fake-field.js
```

#### 실행 예시

```
🚀 fake 필드 마이그레이션 시작...

📊 모든 사용자 조회 중...
✅ 총 5명의 사용자 발견

📈 통계:
  - fake 필드가 없는 사용자: 2명
  - fake: false 사용자: 1명
  - fake: true (봇) 사용자: 2명
  - 총 실제 사용자: 3명

🔍 fake 필드가 없는 사용자 목록:
  1. apple_897879 (JqIQVA0AwiZqNjEu2CWevbVslK63)
     이메일: sq2q6sbz6z@privaterelay.appleid.com
     가입일: 2025-10-22T...

  2. 수원러 (EVKUs60PBLUQ2z06N8s9ShVAxw13)
     이메일: t5@gmail.com
     가입일: 2025-10-21T...

⚠️  주의: 이 작업은 되돌릴 수 없습니다!
   2명의 사용자에게 fake: false를 부여합니다.

계속하시겠습니까? (yes/no): yes

🔄 fake 필드 업데이트 중...
  + searchTokens 추가: apple_897879 (25개 토큰)
  + searchTokens 추가: 수원러 (18개 토큰)
  ✅ Batch 1 완료 (2명)

✅ 마이그레이션 완료!
   - 업데이트된 사용자: 2명
   - 실행된 Batch: 1개

🔍 마이그레이션 결과 검증 중...
✅ 모든 사용자가 fake 필드를 가지고 있습니다!

📊 최종 통계:
   - 실제 사용자 (fake: false): 3명
   - 봇 사용자 (fake: true): 2명
   - 총 사용자: 5명

🎉 작업이 완료되었습니다.
```

## 실행 순서

### 1단계: 마이그레이션 스크립트 실행 (선택사항)

기존 사용자들에게 `fake: false`를 부여합니다.

```bash
cd scripts
node migrate-fake-field.js
```

> **참고:** 마이그레이션 없이도 관리자 페이지는 정상 작동합니다. 
> 하지만 데이터 일관성을 위해 마이그레이션을 권장합니다.

### 2단계: 관리자 페이지 확인

```bash
cd inschoolz-web
npm run dev
```

브라우저에서 `http://localhost:3000/admin/users` 접속 후:
1. "사용자 유형" 필터를 "실제 사용자"로 설정
2. 모든 실제 사용자가 표시되는지 확인

## 결과

### Before ❌
- `fake: false` 사용자: 1명만 표시
- `fake` 필드 없는 사용자: 2명 누락
- **총 표시: 1명**

### After ✅
- `fake: false` 사용자: 1명 표시
- `fake` 필드 없는 사용자: 2명 표시
- **총 표시: 3명**

## 관련 파일

### 수정된 파일
- `inschoolz-web/src/lib/api/users.ts` - 사용자 조회 로직 개선

### 신규 파일
- `scripts/migrate-fake-field.js` - 마이그레이션 스크립트
- `inschoolz-web/ADMIN_USERS_FAKE_FILTER_FIX.md` - 이 문서

### 업데이트된 파일
- `scripts/README.md` - 마이그레이션 섹션 추가

## 기술적 세부사항

### Firestore 제약사항

Firestore는 필드가 없는 문서를 직접 쿼리할 수 없습니다:
- `where('fake', '==', null)` ❌ 작동 안 함
- `where('fake', 'not-exists')` ❌ 존재하지 않음

### 해결 방법

1. **서버 쿼리**: `where('fake', '==', false)` - fake가 false인 사용자
2. **추가 쿼리**: 모든 사용자 가져와서 클라이언트에서 필터링
3. **중복 제거**: 이미 조회된 사용자는 제외

### 성능 고려사항

- 실제 사용자 필터링 시 최대 500명까지 추가 조회
- 중복 제거로 메모리 사용 최소화
- 페이지네이션은 병합 후 적용

## 향후 개선 방안

### 1. 백그라운드 마이그레이션
신규 가입 사용자는 자동으로 `fake: false`가 설정되므로, 
시간이 지나면 `fake` 필드가 없는 사용자는 자연스럽게 사라집니다.

### 2. 인덱스 최적화
Firestore 복합 인덱스 추가:
- Collection: `users`
- Fields:
  - `fake` (Ascending)
  - `createdAt` (Descending)

### 3. 캐싱 전략
자주 조회되는 실제 사용자 목록을 Redis에 캐싱하여 성능 개선

## 요약

✅ **문제 해결:** 실제 사용자 필터링이 모든 실제 사용자를 표시하도록 개선
✅ **마이그레이션:** `fake` 필드가 없는 기존 사용자들에게 `fake: false` 부여
✅ **데이터 일관성:** 모든 사용자가 명확한 `fake` 필드를 가지도록 통일
✅ **검색 개선:** `searchTokens`도 함께 생성하여 검색 기능 향상

