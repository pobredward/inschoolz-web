'use client';

import { Post, Board } from '@/types';

interface ArticleStructuredDataProps {
  post: Post;
  board: Board;
  url: string;
  schoolName?: string;
  regionName?: string;
}

export function ArticleStructuredData({ 
  post, 
  board, 
  url, 
  schoolName, 
  regionName 
}: ArticleStructuredDataProps) {
  // 익명 게시글은 구조화 데이터를 생성하지 않음
  if (post.authorInfo?.isAnonymous) {
    return null;
  }

  const authorName = post.authorInfo?.displayName || '사용자';
  const publishedDate = new Date(post.createdAt).toISOString();
  const modifiedDate = new Date(post.updatedAt || post.createdAt).toISOString();
  
  // 첫 번째 이미지 추출
  const firstImage = post.attachments?.find(att => att.type === 'image')?.url;
  
  // 게시글 내용에서 HTML 태그 제거
  const textContent = post.content
    .replace(/<[^>]*>/g, '')
    .replace(/&nbsp;/g, ' ')
    .trim()
    .slice(0, 300);

  // 조직 정보 (학교나 지역)
  const organizationName = schoolName || regionName || '전국';
  
  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: post.title,
    description: textContent,
    articleBody: textContent,
    url: url,
    datePublished: publishedDate,
    dateModified: modifiedDate,
    author: {
      '@type': 'Person',
      name: authorName,
    },
    publisher: {
      '@type': 'Organization',
      name: 'Inschoolz',
      url: 'https://inschoolz.com',
      logo: {
        '@type': 'ImageObject',
        url: 'https://inschoolz.com/logo.png',
        width: 200,
        height: 200,
      },
    },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': url,
    },
    articleSection: `${organizationName} ${board.name}`,
    keywords: [
      post.title,
      board.name,
      organizationName,
      '인스쿨즈',
      '학생 커뮤니티',
      ...(post.tags || []),
    ].join(', '),
    ...(firstImage && {
      image: {
        '@type': 'ImageObject',
        url: firstImage,
        caption: post.title,
      },
    }),
    interactionStatistic: [
      {
        '@type': 'InteractionCounter',
        interactionType: 'https://schema.org/LikeAction',
        userInteractionCount: post.stats?.likeCount || 0,
      },
      {
        '@type': 'InteractionCounter',
        interactionType: 'https://schema.org/CommentAction',
        userInteractionCount: post.stats?.commentCount || 0,
      },
    ],
    commentCount: post.stats?.commentCount || 0,
    about: {
      '@type': 'Thing',
      name: `${organizationName} 커뮤니티`,
      description: `${organizationName}의 ${board.name} 게시판`,
    },
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
    />
  );
}

interface BreadcrumbStructuredDataProps {
  items: Array<{
    name: string;
    url: string;
  }>;
}

export function BreadcrumbStructuredData({ items }: BreadcrumbStructuredDataProps) {
  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
    />
  );
} 