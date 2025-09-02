'use client';

import { useEffect } from 'react';

interface GoogleAdsenseProps {
  adSlot: string;
  adFormat?: 'auto' | 'fluid' | 'rectangle' | 'vertical' | 'horizontal';
  style?: React.CSSProperties;
  className?: string;
  fullWidthResponsive?: boolean;
}

declare global {
  interface Window {
    adsbygoogle: any[];
  }
}

export default function GoogleAdsense({ 
  adSlot, 
  adFormat = 'auto',
  style,
  className = '',
  fullWidthResponsive = true
}: GoogleAdsenseProps) {
  useEffect(() => {
    try {
      // AdSense 스크립트가 로드되었는지 확인
      if (typeof window !== 'undefined' && window.adsbygoogle) {
        (window.adsbygoogle = window.adsbygoogle || []).push({});
      }
    } catch (err) {
      console.error('AdSense 로드 중 오류:', err);
    }
  }, []);

  return (
    <div className={`adsense-container ${className}`} style={style}>
      <ins
        className="adsbygoogle"
        style={{ 
          display: 'block',
          ...style 
        }}
        data-ad-client="ca-pub-5100840159526765"
        data-ad-slot={adSlot}
        data-ad-format={adFormat}
        data-full-width-responsive={fullWidthResponsive.toString()}
      />
    </div>
  );
}

// 다양한 광고 유형을 위한 미리 정의된 컴포넌트들
export function BannerAd({ className }: { className?: string }) {
  return (
    <GoogleAdsense
      adSlot="1234567890" // 실제 슬롯 ID로 교체 필요
      adFormat="horizontal"
      className={`banner-ad ${className || ''}`}
      style={{ minHeight: '90px' }}
    />
  );
}

export function SidebarAd({ className }: { className?: string }) {
  return (
    <GoogleAdsense
      adSlot="0987654321" // 실제 슬롯 ID로 교체 필요
      adFormat="vertical"
      className={`sidebar-ad ${className || ''}`}
      style={{ minWidth: '160px', minHeight: '600px' }}
    />
  );
}

export function InFeedAd({ className }: { className?: string }) {
  return (
    <GoogleAdsense
      adSlot="1122334455" // 실제 슬롯 ID로 교체 필요
      adFormat="fluid"
      className={`in-feed-ad ${className || ''}`}
      style={{ minHeight: '200px' }}
    />
  );
}

export function ResponsiveAd({ className }: { className?: string }) {
  return (
    <GoogleAdsense
      adSlot="5566778899" // 실제 슬롯 ID로 교체 필요
      adFormat="auto"
      className={`responsive-ad ${className || ''}`}
      style={{ minHeight: '100px' }}
      fullWidthResponsive={true}
    />
  );
}