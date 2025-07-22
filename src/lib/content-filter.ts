/**
 * 콘텐츠 필터링 시스템 (앱스토어 가이드라인 1.2 준수)
 * 부적절한 콘텐츠 자동 검출 및 필터링
 */

// 금지된 키워드 리스트 (실제 운영에서는 더 포괄적이어야 함)
const PROHIBITED_WORDS = [
  // 욕설/비속어
  '바보', '멍청이', '병신', '미친', '또라이', '개새끼', '씨발', '좆', '시발', '존나',
  // 차별적 표현
  '흑인', '백인', '중국인', '일본인', '조선족', '다문화',
  // 폭력적 표현
  '죽이', '때리', '폭행', '살해', '자살', '죽어',
  // 성적 표현
  '섹스', '야동', '포르노', '음란', '변태',
  // 개인정보 관련
  '주민등록번호', '계좌번호', '비밀번호', '전화번호',
  // 스팸/광고
  '대출', '홍보', '광고', '돈벌기', '투자', '주식', '코인',
];

// 패턴 기반 필터링 (정규식)
const PROHIBITED_PATTERNS = [
  /\d{3}-\d{4}-\d{4}/, // 전화번호 패턴
  /\d{6}-\d{7}/, // 주민등록번호 패턴
  /(?:https?:\/\/)?(?:www\.)?[a-zA-Z0-9-]+\.[a-zA-Z]{2,}/g, // URL 패턴 (일부)
  /[ㄱ-ㅎㅏ-ㅣ가-힣]{2,}\s*죽|죽\s*[ㄱ-ㅎㅏ-ㅣ가-힣]{2,}/, // 폭력적 표현 패턴
];

export interface ContentFilterResult {
  isAllowed: boolean;
  filteredContent?: string;
  violations: string[];
  severity: 'low' | 'medium' | 'high';
}

/**
 * 텍스트 콘텐츠 필터링
 * @param content 검사할 텍스트 내용
 * @returns 필터링 결과
 */
export function filterTextContent(content: string): ContentFilterResult {
  if (!content || typeof content !== 'string') {
    return {
      isAllowed: true,
      violations: [],
      severity: 'low'
    };
  }

  const violations: string[] = [];
  let filteredContent = content;
  let severity: 'low' | 'medium' | 'high' = 'low';

  // 1. 금지된 키워드 검사
  const lowerContent = content.toLowerCase();
  for (const word of PROHIBITED_WORDS) {
    if (lowerContent.includes(word.toLowerCase())) {
      violations.push(`금지된 키워드: ${word}`);
      // 키워드를 별표로 마스킹
      const regex = new RegExp(word, 'gi');
      filteredContent = filteredContent.replace(regex, '*'.repeat(word.length));
      
      // 심각도 판단
      if (['병신', '씨발', '좆', '시발', '개새끼'].includes(word)) {
        severity = 'high';
      } else if (['바보', '멍청이', '미친'].includes(word)) {
        severity = severity === 'low' ? 'medium' : severity;
      }
    }
  }

  // 2. 패턴 기반 검사
  for (const pattern of PROHIBITED_PATTERNS) {
    const matches = content.match(pattern);
    if (matches) {
      violations.push(`부적절한 패턴 감지: ${matches[0]}`);
      filteredContent = filteredContent.replace(pattern, '[차단된 내용]');
      severity = severity === 'low' ? 'medium' : severity;
    }
  }

  // 3. 반복 문자 검사 (스팸 방지)
  const repeatedChars = /(.)\1{9,}/g; // 같은 문자 10개 이상 반복
  if (repeatedChars.test(content)) {
    violations.push('반복 문자 스팸');
    filteredContent = filteredContent.replace(repeatedChars, '$1$1$1'); // 3개로 제한
    severity = severity === 'low' ? 'medium' : severity;
  }

  // 4. 과도한 대문자 사용 검사
  const upperCaseRatio = (content.match(/[A-Z]/g) || []).length / content.length;
  if (upperCaseRatio > 0.7 && content.length > 10) {
    violations.push('과도한 대문자 사용');
    severity = severity === 'low' ? 'medium' : severity;
  }

  return {
    isAllowed: violations.length === 0 || severity === 'low',
    filteredContent: violations.length > 0 ? filteredContent : undefined,
    violations,
    severity
  };
}

/**
 * 이미지 파일명 및 메타데이터 검사
 * @param fileName 파일명
 * @param fileSize 파일 크기 (bytes)
 * @returns 필터링 결과
 */
export function filterImageContent(fileName: string, fileSize?: number): ContentFilterResult {
  const violations: string[] = [];
  let severity: 'low' | 'medium' | 'high' = 'low';

  // 파일명 검사
  const fileNameResult = filterTextContent(fileName);
  if (!fileNameResult.isAllowed) {
    violations.push(...fileNameResult.violations);
    severity = fileNameResult.severity;
  }

  // 파일 크기 검사 (10MB 제한)
  if (fileSize && fileSize > 10 * 1024 * 1024) {
    violations.push('파일 크기 초과 (10MB 제한)');
    severity = 'medium';
  }

  // 의심스러운 확장자 검사
  const suspiciousExtensions = ['.exe', '.bat', '.cmd', '.scr', '.pif'];
  const lowerFileName = fileName.toLowerCase();
  if (suspiciousExtensions.some(ext => lowerFileName.endsWith(ext))) {
    violations.push('허용되지 않는 파일 형식');
    severity = 'high';
  }

  return {
    isAllowed: violations.length === 0,
    violations,
    severity
  };
}

/**
 * 게시글 제목 검사
 * @param title 게시글 제목
 * @returns 필터링 결과
 */
export function filterPostTitle(title: string): ContentFilterResult {
  const result = filterTextContent(title);
  
  // 제목 특화 검사
  if (title.length < 2) {
    result.violations.push('제목이 너무 짧습니다');
    result.severity = 'medium';
    (result as any).isAllowed = false;
  }
  
  if (title.length > 100) {
    result.violations.push('제목이 너무 깁니다');
    result.severity = 'medium';
    (result as any).isAllowed = false;
  }

  return result;
}

/**
 * 댓글 내용 검사
 * @param content 댓글 내용
 * @returns 필터링 결과
 */
export function filterCommentContent(content: string): ContentFilterResult {
  const result = filterTextContent(content);
  
  // 댓글 특화 검사
  if (content.length < 1) {
    result.violations.push('댓글 내용이 비어있습니다');
    result.severity = 'medium';
    (result as any).isAllowed = false;
  }
  
  if (content.length > 1000) {
    result.violations.push('댓글이 너무 깁니다');
    result.severity = 'medium';
    (result as any).isAllowed = false;
  }

  return result;
}

/**
 * 사용자 프로필 정보 검사
 * @param userName 사용자명
 * @param realName 실명
 * @param bio 자기소개
 * @returns 필터링 결과
 */
export function filterUserProfile(userName: string, realName?: string, bio?: string): ContentFilterResult {
  const violations: string[] = [];
  let severity: 'low' | 'medium' | 'high' = 'low';

  // 사용자명 검사
  const userNameResult = filterTextContent(userName);
  if (!userNameResult.isAllowed) {
    violations.push(...userNameResult.violations.map(v => `사용자명: ${v}`));
    severity = userNameResult.severity;
  }

  // 사용자명 길이 검사
  if (userName.length < 2 || userName.length > 20) {
    violations.push('사용자명은 2-20자여야 합니다');
    severity = 'medium';
  }

  // 실명 검사 (선택사항)
  if (realName) {
    const realNameResult = filterTextContent(realName);
    if (!realNameResult.isAllowed) {
      violations.push(...realNameResult.violations.map(v => `실명: ${v}`));
      severity = Math.max(severity === 'low' ? 0 : severity === 'medium' ? 1 : 2, 
                          realNameResult.severity === 'low' ? 0 : realNameResult.severity === 'medium' ? 1 : 2) === 0 ? 'low' : 
                          Math.max(severity === 'low' ? 0 : severity === 'medium' ? 1 : 2, 
                          realNameResult.severity === 'low' ? 0 : realNameResult.severity === 'medium' ? 1 : 2) === 1 ? 'medium' : 'high';
    }
  }

  // 자기소개 검사 (선택사항)
  if (bio) {
    const bioResult = filterTextContent(bio);
    if (!bioResult.isAllowed) {
      violations.push(...bioResult.violations.map(v => `자기소개: ${v}`));
      severity = Math.max(severity === 'low' ? 0 : severity === 'medium' ? 1 : 2, 
                          bioResult.severity === 'low' ? 0 : bioResult.severity === 'medium' ? 1 : 2) === 0 ? 'low' : 
                          Math.max(severity === 'low' ? 0 : severity === 'medium' ? 1 : 2, 
                          bioResult.severity === 'low' ? 0 : bioResult.severity === 'medium' ? 1 : 2) === 1 ? 'medium' : 'high';
    }

    if (bio.length > 500) {
      violations.push('자기소개가 너무 깁니다 (500자 제한)');
      severity = severity === 'low' ? 'medium' : severity;
    }
  }

  return {
    isAllowed: violations.length === 0,
    violations,
    severity
  };
}

/**
 * 콘텐츠 필터링 로그 기록
 * @param userId 사용자 ID
 * @param content 원본 콘텐츠
 * @param result 필터링 결과
 * @param contentType 콘텐츠 타입
 */
export function logContentFilter(
  userId: string, 
  content: string, 
  result: ContentFilterResult, 
  contentType: 'post' | 'comment' | 'profile' | 'image'
): void {
  if (!result.isAllowed || result.violations.length > 0) {
    console.warn(`[콘텐츠 필터] ${contentType} 위반 감지:`, {
      userId,
      contentType,
      violations: result.violations,
      severity: result.severity,
      timestamp: new Date().toISOString(),
      contentPreview: content.substring(0, 100) + (content.length > 100 ? '...' : '')
    });
    
    // 실제 운영에서는 별도 로깅 시스템이나 모니터링 시스템에 전송
    // 예: analytics.track('content_violation', { ... })
  }
} 