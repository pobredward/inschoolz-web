'use client';

/**
 * 카카오 로그인 버튼 컴포넌트
 */

import { useEffect, useState } from 'react';
import { Button } from './button';
import { loadKakaoSDK, startKakaoLogin } from '@/lib/kakao-auth';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface KakaoLoginButtonProps {
  className?: string;
  disabled?: boolean;
  size?: 'sm' | 'default' | 'lg';
}

export function KakaoLoginButton({ 
  className, 
  disabled = false,
  size = 'default'
}: KakaoLoginButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [isSDKReady, setIsSDKReady] = useState(false);

  useEffect(() => {
    // 카카오 SDK 로드
    const initSDK = async () => {
      try {
        await loadKakaoSDK();
        setIsSDKReady(true);
      } catch (error) {
        console.error('카카오 SDK 로드 실패:', error);
      }
    };

    initSDK();
  }, []);

  const handleKakaoLogin = async () => {
    if (!isSDKReady || isLoading || disabled) return;

    try {
      setIsLoading(true);
      startKakaoLogin();
    } catch (error) {
      console.error('카카오 로그인 실패:', error);
      setIsLoading(false);
    }
  };

  return (
    <Button
      onClick={handleKakaoLogin}
      disabled={disabled || isLoading || !isSDKReady}
      size={size}
      className={cn(
        'w-full bg-yellow-400 hover:bg-yellow-500 text-black font-medium',
        'border border-yellow-500 transition-colors duration-200',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        className
      )}
    >
      {isLoading ? (
        <>
          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          로그인 중...
        </>
      ) : !isSDKReady ? (
        '로딩 중...'
      ) : (
        <>
          {/* 카카오 로고 SVG */}
          <svg
            className="w-5 h-5 mr-2"
            viewBox="0 0 24 24"
            fill="currentColor"
          >
            <path d="M12 3C6.48 3 2 6.58 2 11c0 2.89 1.95 5.41 4.88 6.84-.07-.5-.46-2.14-.46-2.14s-1.23-7.27 6.58-7.27 6.58 7.27 6.58 7.27-.39 1.64-.46 2.14C20.05 16.41 22 13.89 22 11c0-4.42-4.48-8-10-8z" />
          </svg>
          카카오로 로그인
        </>
      )}
    </Button>
  );
}

/**
 * 간단한 카카오 로그인 버튼 (아이콘만)
 */
export function KakaoLoginIconButton({ 
  className, 
  disabled = false 
}: { 
  className?: string; 
  disabled?: boolean; 
}) {
  const [isLoading, setIsLoading] = useState(false);
  const [isSDKReady, setIsSDKReady] = useState(false);

  useEffect(() => {
    const initSDK = async () => {
      try {
        await loadKakaoSDK();
        setIsSDKReady(true);
      } catch (error) {
        console.error('카카오 SDK 로드 실패:', error);
      }
    };

    initSDK();
  }, []);

  const handleKakaoLogin = async () => {
    if (!isSDKReady || isLoading || disabled) return;

    try {
      setIsLoading(true);
      startKakaoLogin();
    } catch (error) {
      console.error('카카오 로그인 실패:', error);
      setIsLoading(false);
    }
  };

  return (
    <Button
      onClick={handleKakaoLogin}
      disabled={disabled || isLoading || !isSDKReady}
      size="lg"
      className={cn(
        'w-12 h-12 p-0 bg-yellow-400 hover:bg-yellow-500',
        'border border-yellow-500 rounded-lg',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        className
      )}
    >
      {isLoading ? (
        <Loader2 className="w-5 h-5 animate-spin text-black" />
      ) : (
        <svg
          className="w-6 h-6 text-black"
          viewBox="0 0 24 24"
          fill="currentColor"
        >
          <path d="M12 3C6.48 3 2 6.58 2 11c0 2.89 1.95 5.41 4.88 6.84-.07-.5-.46-2.14-.46-2.14s-1.23-7.27 6.58-7.27 6.58 7.27 6.58 7.27-.39 1.64-.46 2.14C20.05 16.41 22 13.89 22 11c0-4.42-4.48-8-10-8z" />
        </svg>
      )}
    </Button>
  );
}
