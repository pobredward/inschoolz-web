import React from "react";
import { Metadata } from "next";
import { notFound } from "next/navigation";
import { PostViewClient } from "@/components/board/PostViewClient";
import { getPostDetail, getBoardsByType } from "@/lib/api/board";
import { Post, Comment } from "@/types";
import { stripHtmlTags } from "@/lib/utils";
import { ArticleStructuredData, BreadcrumbStructuredData } from "@/components/seo/StructuredData";

interface PostViewPageProps {
  params: Promise<{
    boardCode: string;
    postId: string;
  }>;
}

export async function generateMetadata({ params }: PostViewPageProps): Promise<Metadata> {
  const { boardCode, postId } = await params;
  
  try {
    // 실제 게시글 데이터 가져오기
    const { post } = await getPostDetail(postId);
    const boards = await getBoardsByType('national');
    const boardInfo = boards.find(board => board.code === boardCode);
    
    if (!boardInfo || !post) {
      return {
        title: '게시글을 찾을 수 없습니다 - Inschoolz',
        description: '요청하신 게시글을 찾을 수 없습니다.',
        robots: 'noindex, nofollow',
      };
    }

    // 익명 게시글은 검색엔진에서 제외
    const isAnonymous = post.authorInfo?.isAnonymous;
    
    // 게시글 내용 정리 및 작성 정보 추가
    const cleanContent = stripHtmlTags(post.content);
    const contentPreview = cleanContent.slice(0, 120);
    const authorName = isAnonymous ? '익명' : (post.authorInfo?.displayName || '사용자');
    const createdDate = new Date(post.createdAt).toLocaleDateString('ko-KR');
    
    // 첨부 이미지 추출
    const images = post.attachments?.filter(att => att.type === 'image').map(att => att.url) || [];
    const firstImage = images.length > 0 ? images[0] : undefined;
    
    const description = `${contentPreview}... - ${authorName} | ${createdDate}`;

    return {
      title: `${post.title} - ${boardInfo.name} - Inschoolz`,
      description,
      keywords: [post.title, boardInfo.name, '전국 커뮤니티', '인스쿨즈', ...post.tags || []],
      authors: [{ name: authorName }],
      robots: isAnonymous ? 'noindex, nofollow' : 'index, follow',
      alternates: {
        canonical: `https://inschoolz.com/community/national/${boardCode}/${postId}`,
      },
      openGraph: {
        title: `${post.title} - ${boardInfo.name}`,
        description: contentPreview + '...',
        type: 'article',
        siteName: 'Inschoolz',
        url: `https://inschoolz.com/community/national/${boardCode}/${postId}`,
        publishedTime: new Date(post.createdAt).toISOString(),
        modifiedTime: new Date(post.updatedAt || post.createdAt).toISOString(),
        authors: [authorName],
        section: boardInfo.name,
        tags: post.tags || [],
        ...(firstImage && { images: [{ url: firstImage, alt: post.title }] }),
      },
      twitter: {
        card: 'summary_large_image',
        title: `${post.title} - ${boardInfo.name}`,
        description: contentPreview + '...',
        ...(firstImage && { images: [firstImage] }),
      },
    };
  } catch (error) {
    console.error('메타데이터 생성 오류:', error);
    return {
      title: '게시글을 찾을 수 없습니다 - Inschoolz',
      description: '요청하신 게시글을 찾을 수 없습니다.',
      robots: 'noindex, nofollow',
    };
  }
}

export default async function NationalPostDetailPage({ params }: PostViewPageProps) {
  const { boardCode, postId } = await params;
  
  try {
    // 게시글 상세 정보 가져오기 (이미 직렬화됨)
    const { post, comments } = await getPostDetail(postId);
    
    // 게시판 정보 가져오기
    const boards = await getBoardsByType('national');
    const board = boards.find(b => b.code === boardCode);
    
    if (!board) {
      notFound();
    }

    // 게시글이 해당 게시판에 속하는지 확인
    if ((post as Post).boardCode !== boardCode) {
      notFound();
    }

    const postUrl = `https://inschoolz.com/community/national/${boardCode}/${postId}`;

    // 브레드크럼 데이터
    const breadcrumbItems = [
      { name: '홈', url: 'https://inschoolz.com' },
      { name: '커뮤니티', url: 'https://inschoolz.com/community' },
      { name: '전국', url: 'https://inschoolz.com/community?tab=national' },
      { name: board.name, url: `https://inschoolz.com/community/national/${boardCode}` },
      { name: (post as Post).title, url: postUrl },
    ];

    return (
      <>
        {/* SEO 구조화 데이터 */}
        <ArticleStructuredData
          post={post as Post}
          board={board}
          url={postUrl}
          regionName="전국"
        />
        <BreadcrumbStructuredData items={breadcrumbItems} />
        
        <PostViewClient
          post={post as unknown as Post}
          initialComments={comments as unknown as Comment[]}
        />
      </>
    );
  } catch (error) {
    console.error('National 게시글 상세 페이지 오류:', error);
    notFound();
  }
} 