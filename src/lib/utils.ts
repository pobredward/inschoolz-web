import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import { Timestamp } from 'firebase/firestore'
import { formatDistanceToNow } from 'date-fns'
import { ko } from 'date-fns/locale'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

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
 * HTML 태그를 제거하고 순수 텍스트만 반환하는 함수 (웹용)
 * @param html HTML 문자열 또는 일반 텍스트
 * @returns 순수 텍스트
 */
export function stripHtmlTags(html: string): string {
  if (!html) return '';
  
  // HTML 태그 제거
  let text = html.replace(/<[^>]*>/g, '');
  
  // HTML 엔티티 디코딩
  text = text
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'");
  
  // 연속된 공백 제거 및 앞뒤 공백 제거
  text = text.replace(/\s+/g, ' ').trim();
  
  return text;
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
    
    // 일반 텍스트인 경우
    return content;
  } catch {
    // JSON 파싱 실패 시 HTML 태그 제거 시도
    return stripHtmlTags(content);
  }
}

/**
 * TipTap JSON에서 텍스트를 추출하는 함수 (웹용)
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
