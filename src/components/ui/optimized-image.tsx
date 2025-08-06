'use client';

import { useState, useRef, useEffect } from 'react';

interface OptimizedImageProps {
  src: string;
  alt: string;
  className?: string;
  width?: number | string;
  height?: number | string;
  priority?: boolean;
  placeholder?: string;
  onLoad?: () => void;
  onError?: () => void;
}

export const OptimizedImage = ({
  src,
  alt,
  className = '',
  width,
  height,
  priority = false,
  placeholder = 'data:image/gif;base64,R0lGODlhAQABAIAAAP///wAAACH5BAEAAAAALAAAAAABAAEAAAICRAEAOw==',
  onLoad,
  onError
}: OptimizedImageProps) => {
  const [imageSrc, setImageSrc] = useState<string>(priority ? src : placeholder);
  const [isLoaded, setIsLoaded] = useState<boolean>(priority);
  const [hasError, setHasError] = useState<boolean>(false);
  const imgRef = useRef<HTMLImageElement>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);

  useEffect(() => {
    // 우선순위가 높은 이미지는 즉시 로드
    if (priority) {
      return;
    }

    // IntersectionObserver 생성
    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !isLoaded && !hasError) {
            setImageSrc(src);
            observerRef.current?.unobserve(entry.target);
          }
        });
      },
      {
        // 뷰포트 기준 100px 여유를 두고 미리 로드 (디시 스타일)
        rootMargin: '100px',
        threshold: 0.01
      }
    );

    // 현재 이미지 요소 관찰 시작
    if (imgRef.current) {
      observerRef.current.observe(imgRef.current);
    }

    // 컴포넌트 언마운트 시 옵저버 해제
    return () => {
      observerRef.current?.disconnect();
    };
  }, [src, priority, isLoaded, hasError]);

  const handleLoad = () => {
    setIsLoaded(true);
    onLoad?.();
  };

  const handleError = () => {
    setHasError(true);
    onError?.();
  };

  return (
    <img
      ref={imgRef}
      src={imageSrc}
      alt={alt}
      className={`${className} ${!isLoaded ? 'opacity-0' : 'opacity-100'} transition-opacity duration-300`}
      width={width}
      height={height}
      loading={priority ? 'eager' : 'lazy'}
      decoding="async"
      fetchpriority={priority ? 'high' : 'low'}
      onLoad={handleLoad}
      onError={handleError}
      style={{
        ...(hasError ? { display: 'none' } : {}),
        ...(!isLoaded && !priority ? { filter: 'blur(5px)' } : {})
      }}
    />
  );
};