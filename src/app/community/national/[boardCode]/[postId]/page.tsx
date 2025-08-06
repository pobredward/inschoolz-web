import React from "react";
import { Metadata } from "next";
import { notFound } from "next/navigation";
import { PostViewClient } from "@/components/board/PostViewClient";
import { getPostDetail, getBoardsByType } from "@/lib/api/board";
import { Post, Comment } from "@/types";
import { stripHtmlTags, serializeTimestamp } from "@/lib/utils";
import { ArticleStructuredData, BreadcrumbStructuredData } from "@/components/seo/StructuredData";
import { 
  generateSeoTitle, 
  generateSeoDescription, 
  generateSeoKeywords,
  categorizePost
} from "@/lib/seo-utils";

interface PostViewPageProps {
  params: Promise<{
    boardCode: string;
    postId: string;
  }>;
}

export async function generateMetadata({ params }: PostViewPageProps): Promise<Metadata> {
  const { boardCode, postId } = await params;
  
  try {
    // 게시글과 게시판 정보를 병렬로 가져오기 (댓글은 메타데이터에 불필요)
    const [{ post }, boards] = await Promise.all([
      getPostDetail(postId),
      getBoardsByType('national')
    ]);
    const boardInfo = boards.find(board => board.code === boardCode);
    
    if (!boardInfo || !post) {
      return {
        title: '게시글을 찾을 수 없습니다 - 인스쿨즈',
        description: '요청하신 게시글을 찾을 수 없습니다.',
        robots: 'noindex, nofollow',
      };
    }

    // 익명 게시글은 검색엔진에서 제외
    const isAnonymous = (post as Post).authorInfo?.isAnonymous;
    
    // 게시글 내용 정리 및 작성 정보 추가
    const cleanContent = stripHtmlTags((post as Post).content);
    const authorName = isAnonymous ? '익명' : ((post as Post).authorInfo?.displayName || '사용자');
    const createdDate = serializeTimestamp((post as Post).createdAt).toLocaleDateString('ko-KR');
    
    // 첨부 이미지 추출
    const images = (post as Post).attachments?.filter((att: any) => att.type === 'image').map((att: any) => att.url) || [];
    const firstImage = images.length > 0 ? images[0] : undefined;
    
    // SEO 최적화된 메타데이터 생성
    const seoTitle = generateSeoTitle(post as Post, (boardInfo as any).name, 'national');
    const seoDescription = generateSeoDescription(
      post as Post, 
      cleanContent, 
      authorName, 
      createdDate, 
      'national'
    );
    const seoKeywords = generateSeoKeywords(post as Post, (boardInfo as any).name, 'national');
    
    // 게시글 카테고리 분류
    const categories = categorizePost((post as Post).title, (post as Post).content);

    return {
      title: seoTitle,
      description: seoDescription,
      keywords: seoKeywords,
      authors: [{ name: authorName }],
      robots: isAnonymous ? 'noindex, nofollow' : 'index, follow',
      alternates: {
        canonical: `https://inschoolz.com/community/national/${boardCode}/${postId}`,
      },
      openGraph: {
        title: seoTitle,
        description: seoDescription,
        type: 'article',
        siteName: 'Inschoolz - 인스쿨즈',
        url: `https://inschoolz.com/community/national/${boardCode}/${postId}`,
        publishedTime: serializeTimestamp((post as Post).createdAt).toISOString(),
        modifiedTime: serializeTimestamp((post as Post).updatedAt || (post as Post).createdAt).toISOString(),
        authors: [authorName],
        section: `전국 ${(boardInfo as any).name}`,
        tags: [...categories, ...seoKeywords.slice(0, 10)],
        ...(firstImage && { images: [{ url: firstImage, alt: (post as Post).title }] }),
      },
      twitter: {
        card: firstImage ? 'summary_large_image' : 'summary',
        title: seoTitle,
        description: seoDescription,
        site: '@inschoolz',
        creator: `@${authorName}`,
        ...(firstImage && { images: [firstImage] }),
      },
      other: {
        'article:section': `전국 ${(boardInfo as any).name}`,
        'article:tag': categories.join(','),
        'article:author': authorName,
        'article:published_time': serializeTimestamp((post as Post).createdAt).toISOString(),
        'article:modified_time': serializeTimestamp((post as Post).updatedAt || (post as Post).createdAt).toISOString(),
      },
    };
  } catch (error) {
    console.error('메타데이터 생성 오류:', error);
    return {
      title: '게시글을 찾을 수 없습니다 - 인스쿨즈',
      description: '요청하신 게시글을 찾을 수 없습니다.',
      robots: 'noindex, nofollow',
    };
  }
}

export const revalidate = 300; // 5분마다 revalidate
export const dynamic = 'force-static'; // ISR을 위해 static 생성 강제

export default async function NationalPostDetailPage({ params }: PostViewPageProps) {
  const { boardCode, postId } = await params;
  
  try {
    // 게시글 상세 정보 가져오기 (이미 직렬화됨)
    const { post, comments } = await getPostDetail(postId);
    
    // 게시판 정보 가져오기
    const boards = await getBoardsByType('national');
    const board = (boards as any[]).find((b: any) => b.code === boardCode);
    
    if (!board) {
      notFound();
    }

    // 게시글이 해당 게시판에 속하는지 확인
    if ((post as Post).boardCode !== boardCode) {
      notFound();
    }

    const postUrl = `https://inschoolz.com/community/national/${boardCode}/${postId}`;
    
    // SEO 최적화 데이터 생성
    const categories = categorizePost((post as Post).title, (post as Post).content);
    const seoKeywords = generateSeoKeywords(post as Post, board.name, 'national');

    return (
      <>
        {/* SEO 구조화 데이터 */}
        <ArticleStructuredData
          post={post as Post}
          url={postUrl}
          boardName={board.name}
          communityType="national"
          categories={categories}
          keywords={seoKeywords}
        />
        <BreadcrumbStructuredData 
          boardCode={boardCode}
          boardName={(board as any).name}
          postTitle={(post as Post).title}
          communityType="national"
        />
        
        <PostViewClient
          post={post as unknown as Post}
          initialComments={comments as unknown as Comment[]}
          boardInfo={board as any}
        />
      </>
    );
  } catch (error) {
    console.error('National 게시글 상세 페이지 오류:', error);
    notFound();
  }
} 