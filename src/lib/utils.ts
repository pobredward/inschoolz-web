import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import { Timestamp } from 'firebase/firestore'
import { formatDistanceToNow } from 'date-fns'
import { ko } from 'date-fns/locale'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// ===== 로깅 유틸리티 =====

const isDevelopment = process.env.NODE_ENV === 'development';

export const logger = {
  debug: (message: string, ...args: unknown[]) => {
    if (isDevelopment) {
      console.log(`🔍 [DEBUG] ${message}`, ...args);
    }
  },
  
  info: (message: string, ...args: unknown[]) => {
    if (isDevelopment) {
      console.log(`ℹ️ [INFO] ${message}`, ...args);
    }
  },
  
  warn: (message: string, ...args: unknown[]) => {
    if (isDevelopment) {
      console.warn(`⚠️ [WARN] ${message}`, ...args);
    }
  },
  
  error: (message: string, ...args: unknown[]) => {
    console.error(`❌ [ERROR] ${message}`, ...args);
  },
  
  // Firebase 인증 관련 로그
  auth: (message: string, ...args: unknown[]) => {
    if (isDevelopment) {
      console.log(`🔐 [AUTH] ${message}`, ...args);
    }
  },
  
  // Firebase 관련 로그
  firebase: (message: string, ...args: unknown[]) => {
    if (isDevelopment) {
      console.log(`🔥 [FIREBASE] ${message}`, ...args);
    }
  },
  
  // API 호출 관련 로그
  api: (message: string, ...args: unknown[]) => {
    if (isDevelopment) {
      console.log(`🌐 [API] ${message}`, ...args);
    }
  },
  
  // 사용자 액션 관련 로그
  user: (message: string, ...args: unknown[]) => {
    if (isDevelopment) {
      console.log(`👤 [USER] ${message}`, ...args);
    }
  }
};

// 성능 측정을 위한 타이머 유틸리티
export const performanceLogger = {
  start: (label: string) => {
    if (isDevelopment) {
      console.time(`⏱️ [PERF] ${label}`);
    }
  },
  
  end: (label: string) => {
    if (isDevelopment) {
      console.timeEnd(`⏱️ [PERF] ${label}`);
    }
  }
};

// ===== 시간 관련 유틸리티 함수들 =====

/**
 * 다양한 형태의 timestamp를 Date 객체로 변환
 * @param timestamp Firebase Timestamp, Date, number, 또는 기타 형태
 * @returns Date 객체
 */
export function toDate(timestamp: unknown): Date {
  if (timestamp instanceof Date) {
    return timestamp;
  }
  
  if (typeof timestamp === 'number') {
    return new Date(timestamp);
  }
  
  if (timestamp && typeof timestamp === 'object') {
    // Firebase Timestamp 객체
    if ('toDate' in timestamp && typeof (timestamp as Timestamp).toDate === 'function') {
      return (timestamp as Timestamp).toDate();
    }
    
    // Firestore Timestamp 직렬화된 형태 (seconds, nanoseconds)
    if ('seconds' in timestamp && 'nanoseconds' in timestamp) {
      const { seconds, nanoseconds } = timestamp as { seconds: number; nanoseconds: number };
      return new Date(seconds * 1000 + nanoseconds / 1000000);
    }
  }
  
  // 기본값: 현재 시간
  return new Date();
}

/**
 * 다양한 형태의 timestamp를 number(milliseconds)로 변환
 * @param timestamp Firebase Timestamp, Date, number, 또는 기타 형태
 * @returns Unix timestamp (milliseconds)
 */
export function toTimestamp(timestamp: unknown): number {
  return toDate(timestamp).getTime();
}

/**
 * 현재 시간을 number(milliseconds)로 반환
 * @returns Unix timestamp (milliseconds)
 */
export function now(): number {
  return Date.now();
}

/**
 * 상대 시간 포맷팅 (예: "3시간 전", "2일 전")
 * @param timestamp 시간 데이터
 * @returns 포맷된 상대 시간 문자열
 */
export function formatRelativeTime(timestamp: unknown): string {
  try {
    const date = toDate(timestamp);
    
    if (isNaN(date.getTime())) {
      return '방금 전';
    }
    
    return formatDistanceToNow(date, { 
      addSuffix: true,
      locale: ko 
    });
  } catch (error) {
    console.error('시간 포맷팅 오류:', error);
    return '방금 전';
  }
}

/**
 * 절대 시간 포맷팅 (예: "2024-01-15", "01-15")
 * @param timestamp 시간 데이터
 * @param format 포맷 형태 ('full' | 'short' | 'time')
 * @returns 포맷된 절대 시간 문자열
 */
export function formatAbsoluteTime(timestamp: unknown, format: 'full' | 'short' | 'time' = 'short'): string {
  try {
    const date = toDate(timestamp);
    
    if (isNaN(date.getTime())) {
      return '날짜 오류';
    }
    
    switch (format) {
      case 'full':
        return date.toLocaleDateString('ko-KR', {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit'
        });
      case 'short':
        return date.toLocaleDateString('ko-KR', {
          month: '2-digit',
          day: '2-digit'
        });
      case 'time':
        return date.toLocaleTimeString('ko-KR', {
          hour: '2-digit',
          minute: '2-digit'
        });
      default:
        return date.toLocaleDateString('ko-KR');
    }
  } catch (error) {
    console.error('날짜 포맷팅 오류:', error);
    return '날짜 오류';
  }
}

/**
 * 스마트 시간 포맷팅 (상황에 따라 상대/절대 시간 자동 선택)
 * @param timestamp 시간 데이터
 * @returns 포맷된 시간 문자열
 */
export function formatSmartTime(timestamp: unknown): string {
  try {
    const date = toDate(timestamp);
    
    if (isNaN(date.getTime())) {
      return '방금 전';
    }
    
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) {
      return '방금 전';
    } else if (diffInHours < 24) {
      return `${diffInHours}시간 전`;
    } else if (diffInHours < 24 * 7) {
      return `${Math.floor(diffInHours / 24)}일 전`;
    } else {
      return formatAbsoluteTime(timestamp, 'short');
    }
  } catch (error) {
    console.error('스마트 시간 포맷팅 오류:', error);
    return '방금 전';
  }
}

/**
 * 한국 시간대 기준 날짜 문자열 생성 (YYYY-MM-DD 형태)
 * @param date 날짜 (선택사항, 기본값: 현재 시간)
 * @returns 한국 시간대 기준 날짜 문자열
 */
export function getKoreanDateString(date: Date = new Date()): string {
  // 한국 시간으로 변환 (UTC+9)
  const koreaTimezoneOffset = 9 * 60; // 9시간을 분 단위로
  const utcMinutes = date.getUTCHours() * 60 + date.getUTCMinutes();
  const koreaMinutes = utcMinutes + koreaTimezoneOffset;
  
  // 한국 날짜 계산
  const koreaDate = new Date(date);
  koreaDate.setUTCHours(0, koreaMinutes, 0, 0);
  
  const year = koreaDate.getUTCFullYear();
  const month = String(koreaDate.getUTCMonth() + 1).padStart(2, '0');
  const day = String(koreaDate.getUTCDate()).padStart(2, '0');
  
  return `${year}-${month}-${day}`;
}

/**
 * 두 시간의 차이를 계산
 * @param start 시작 시간
 * @param end 종료 시간 (선택사항, 기본값: 현재 시간)
 * @returns 차이 (milliseconds)
 */
export function timeDiff(start: unknown, end: unknown = now()): number {
  return toTimestamp(end) - toTimestamp(start);
}

/**
 * 시간이 오늘인지 확인
 * @param timestamp 확인할 시간
 * @returns 오늘인지 여부
 */
export function isToday(timestamp: unknown): boolean {
  const date = toDate(timestamp);
  const today = new Date();
  
  return date.getFullYear() === today.getFullYear() &&
         date.getMonth() === today.getMonth() &&
         date.getDate() === today.getDate();
}

// ===== 기존 함수들 (호환성 유지) =====

/**
 * Firestore Timestamp를 number로 변환하는 함수
 * @deprecated formatTimestamp 사용을 권장합니다
 */
export function convertTimestamp(timestamp: unknown): number {
  return toTimestamp(timestamp);
}

/**
 * Post 객체의 Timestamp들을 number로 변환
 * @deprecated 개별 필드에 toTimestamp 사용을 권장합니다
 */
export function serializePost(post: Record<string, unknown>) {
  return {
    ...post,
    createdAt: toTimestamp(post.createdAt),
    updatedAt: toTimestamp(post.updatedAt),
  };
}

/**
 * Comment 객체의 Timestamp들을 number로 변환
 * @deprecated 개별 필드에 toTimestamp 사용을 권장합니다
 */
export function serializeComment(comment: Record<string, unknown>) {
  return {
    ...comment,
    createdAt: toTimestamp(comment.createdAt),
    updatedAt: toTimestamp(comment.updatedAt),
  };
}

/**
 * HTML 태그를 파싱하여 안전한 HTML로 변환
 */
export async function parseHtmlContent(content: string): Promise<string> {
  if (typeof window === 'undefined') {
    // 서버사이드에서는 HTML 태그 제거하고 줄바꿈 처리
    return content
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<\/p>/gi, '\n')
      .replace(/<p[^>]*>/gi, '')
      .replace(/<div[^>]*>/gi, '\n')
      .replace(/<\/div>/gi, '')
      .replace(/<[^>]*>/g, '')
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/&apos;/g, "'")
      .trim();
  }

  // 클라이언트사이드에서는 DOMPurify 사용
  const DOMPurify = await import('dompurify');
  
  // 먼저 줄바꿈 처리를 위해 HTML 태그를 변환
  const processedContent = content
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n')
    .replace(/<p[^>]*>/gi, '')
    .replace(/<div[^>]*>/gi, '\n')
    .replace(/<\/div>/gi, '');
  
  // 허용할 HTML 태그와 속성 설정 (img 태그 추가)
  const cleanHtml = DOMPurify.default.sanitize(processedContent, {
    ALLOWED_TAGS: ['strong', 'b', 'em', 'i', 'u', 'span', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'ul', 'ol', 'li', 'blockquote', 'a', 'img'],
    ALLOWED_ATTR: ['href', 'target', 'rel', 'class', 'src', 'alt', 'width', 'height', 'style'],
    ALLOW_DATA_ATTR: false,
    ADD_ATTR: ['target'],
    FORBID_TAGS: ['script', 'object', 'embed', 'form', 'input', 'button'],
    FORBID_ATTR: ['onerror', 'onclick', 'onload', 'onmouseover', 'onfocus', 'onblur'],
  });

  // HTML 엔티티 디코딩 및 줄바꿈 정리
  const finalContent = cleanHtml
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    .trim();

  return finalContent;
}

/**
 * HTML 태그를 제거하고 순수 텍스트만 반환하는 함수
 * @param html HTML 문자열 또는 일반 텍스트
 * @returns 순수 텍스트
 */
export function stripHtmlTags(html: string): string {
  if (!html) return '';
  
  // <br>, <p> 태그를 줄바꿈으로 변환
  let text = html
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n')
    .replace(/<p[^>]*>/gi, '')
    .replace(/<div[^>]*>/gi, '\n')
    .replace(/<\/div>/gi, '');
  
  // 다른 HTML 태그 제거
  text = text.replace(/<[^>]*>/g, '');
  
  // HTML 엔티티 디코딩
  text = text
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'");
  
  // 연속된 줄바꿈을 최대 2개로 제한하고 앞뒤 공백 제거
  text = text
    .replace(/\n\s*\n\s*\n/g, '\n\n')
    .trim();
  
  return text;
}

/**
 * 게시글 내용 미리보기 생성 (HTML 태그 제거 후 일정 길이로 자르기)
 */
export function generatePreviewContent(content: string, maxLength: number = 100): string {
  const textOnly = stripHtmlTags(content);
  return textOnly.length > maxLength 
    ? textOnly.substring(0, maxLength) + '...' 
    : textOnly;
}

/**
 * JSON 형태의 content를 파싱하여 텍스트를 추출하는 함수 (웹용)
 * @param content JSON 문자열 또는 일반 텍스트
 * @returns 추출된 텍스트
 */
export function parseContentText(content: string): string {
  if (!content) return '';
  
  try {
    // JSON 형태인지 확인
    if (content.trim().startsWith('{') || content.trim().startsWith('[')) {
      const parsed = JSON.parse(content);
      
      // TipTap JSON 형태인 경우
      if (parsed.type === 'doc' && parsed.content) {
        return extractTextFromTipTapJson(parsed);
      }
      
      // 다른 JSON 형태인 경우
      return JSON.stringify(parsed);
    }
    
    // HTML 태그가 포함된 경우
    if (content.includes('<') && content.includes('>')) {
      return stripHtmlTags(content);
    }
    
    // 일반 텍스트인 경우 (줄바꿈 보존)
    return content;
  } catch {
    // JSON 파싱 실패 시 HTML 태그 제거 시도
    return stripHtmlTags(content);
  }
}

/**
 * TipTap JSON에서 텍스트를 추출하는 함수
 * @param node TipTap JSON 노드
 * @returns 추출된 텍스트
 */
function extractTextFromTipTapJson(node: unknown): string {
  if (!node || typeof node !== 'object') return '';
  
  const nodeObj = node as Record<string, unknown>;
  let text = '';
  
  // 텍스트 노드인 경우
  if (nodeObj.type === 'text') {
    return (nodeObj.text as string) || '';
  }
  
  // 하드 브레이크인 경우
  if (nodeObj.type === 'hardBreak') {
    return '\n';
  }
  
  // 자식 노드들을 재귀적으로 처리
  if (nodeObj.content && Array.isArray(nodeObj.content)) {
    for (const child of nodeObj.content) {
      text += extractTextFromTipTapJson(child);
    }
  }
  
  // 단락 노드인 경우 뒤에 줄바꿈 추가
  if (nodeObj.type === 'paragraph' && text) {
    text += '\n';
  }
  
  return text;
}

/**
 * 텍스트를 지정된 길이로 자르고 말줄임표를 추가하는 함수
 * @param text 원본 텍스트
 * @param maxLength 최대 길이 (기본값: 100)
 * @returns 잘린 텍스트
 */
export function truncateText(text: string, maxLength: number = 100): string {
  if (!text) return '';
  
  // 먼저 HTML 태그 제거 및 텍스트 파싱
  const cleanText = parseContentText(text);
  
  if (cleanText.length <= maxLength) {
    return cleanText;
  }
  
  return cleanText.substring(0, maxLength) + '...';
}

/**
 * 텍스트에서 모든 이미지 URL을 추출하는 함수
 * @param content 콘텐츠 텍스트
 * @returns 이미지 URL 배열
 */
export function extractAllImageUrls(content: string): string[] {
  if (!content) return [];
  
  const imageUrls: string[] = [];
  
  // HTML img 태그에서 src 추출
  const imgTagMatches = content.matchAll(/<img[^>]+src="([^"]+)"/gi);
  for (const match of imgTagMatches) {
    imageUrls.push(match[1]);
  }
  
  // 마크다운 이미지 형태 ![alt](url) 추출
  const markdownImgMatches = content.matchAll(/!\[[^\]]*\]\(([^)]+)\)/g);
  for (const match of markdownImgMatches) {
    imageUrls.push(match[1]);
  }
  
  // URL 형태의 이미지 링크 추출
  const urlMatches = content.matchAll(/(https?:\/\/[^\s]+\.(jpg|jpeg|png|gif|webp))/gi);
  for (const match of urlMatches) {
    imageUrls.push(match[1]);
  }
  
  // 중복 제거
  return [...new Set(imageUrls)];
}
