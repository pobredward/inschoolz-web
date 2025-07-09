'use client';

import { useEffect, useState } from 'react';
import { parseHtmlContent, stripHtmlTags } from '@/lib/utils';

interface HtmlContentProps {
  content: string;
  className?: string;
  fallbackToText?: boolean;
}

export function HtmlContent({ content, className = '', fallbackToText = true }: HtmlContentProps) {
  const [parsedContent, setParsedContent] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const parseContent = async () => {
      try {
        setIsLoading(true);
        const parsed = await parseHtmlContent(content);
        setParsedContent(parsed);
      } catch (error) {
        console.error('HTML 파싱 오류:', error);
        // 파싱 실패 시 텍스트만 표시
        if (fallbackToText) {
          setParsedContent(stripHtmlTags(content));
        } else {
          setParsedContent(content);
        }
      } finally {
        setIsLoading(false);
      }
    };

    parseContent();
  }, [content, fallbackToText]);

  if (isLoading) {
    return (
      <div className={`animate-pulse ${className}`}>
        <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
        <div className="h-4 bg-gray-200 rounded w-3/4"></div>
      </div>
    );
  }

  return (
    <div 
      className={`prose prose-sm max-w-none ${className}`}
      dangerouslySetInnerHTML={{ __html: parsedContent }}
    />
  );
}

// 서버사이드에서 사용할 수 있는 동기 버전
export function HtmlContentSync({ content, className = '' }: Omit<HtmlContentProps, 'fallbackToText'>) {
  // 서버사이드에서는 HTML 태그 제거
  const textContent = stripHtmlTags(content);
  
  return (
    <div className={`whitespace-pre-wrap leading-relaxed ${className}`}>
      {textContent}
    </div>
  );
} 