import React from "react";
import { Metadata } from "next";
import { notFound } from "next/navigation";
import { PostViewClient } from "@/components/board/PostViewClient";
import { getPostDetail, getPostBasicInfo, getBoardsByType, getPostDetailOptimized } from "@/lib/api/board";
import { Post, Comment } from "@/types";
import { stripHtmlTags, serializeTimestamp } from "@/lib/utils";
import { 
  generateSeoTitle, 
  generateSeoDescription, 
  generateSeoKeywords,
  categorizePost
} from "@/lib/seo-utils";

interface PostViewPageProps {
  params: Promise<{
    schoolId: string;
    boardCode: string;
    postId: string;
  }>;
}

// 임시 학교 정보 (실제로는 Firebase에서 가져와야 함)
const getSchoolInfo = (schoolId: string) => {
  return {
    id: schoolId,
    name: '가락고등학교',
    address: '서울특별시 송파구',
    type: '고등학교'
  };
};

export async function generateMetadata({ params }: PostViewPageProps): Promise<Metadata> {
  const { schoolId, boardCode, postId } = await params;
  
  try {
    // 게시글과 게시판 정보를 병렬로 가져오기 (댓글은 메타데이터에 불필요)
    const [{ post }, boards] = await Promise.all([
      getPostDetailOptimized(postId, false), // 댓글 제외하고 가져오기
      getBoardsByType('school')
    ]);
    const boardInfo = boards.find(board => board.code === boardCode);
    const schoolInfo = getSchoolInfo(schoolId);
    
    if (!boardInfo || !post) {
      return {
        title: '게시글을 찾을 수 없습니다 - 인스쿨즈',
        description: '요청하신 게시글을 찾을 수 없습니다.',
        robots: 'noindex, nofollow',
      };
    }

    // 익명 게시글은 검색엔진에서 제외
    const isAnonymous = post.authorInfo?.isAnonymous;
    
    // 게시글 내용 정리 및 작성 정보 추가
    const cleanContent = stripHtmlTags(post.content);
    const authorName = isAnonymous ? '익명' : (post.authorInfo?.displayName || '사용자');
    const createdDate = serializeTimestamp(post.createdAt).toLocaleDateString('ko-KR');
    
    // 첨부 이미지 추출
    const images = post.attachments?.filter(att => att.type === 'image').map(att => att.url) || [];
    const firstImage = images.length > 0 ? images[0] : undefined;
    
    // SEO 최적화된 메타데이터 생성
    const locationInfo = { name: schoolInfo.name, address: schoolInfo.address };
    const seoTitle = generateSeoTitle(post, boardInfo.name, 'school', locationInfo);
    const seoDescription = generateSeoDescription(
      post, 
      cleanContent, 
      authorName, 
      createdDate, 
      'school',
      locationInfo
    );
    const seoKeywords = generateSeoKeywords(post, boardInfo.name, 'school', locationInfo);
    
    // 게시글 카테고리 분류
    const categories = categorizePost(post.title, post.content);

    return {
      title: seoTitle,
      description: seoDescription,
      keywords: seoKeywords,
      authors: [{ name: authorName }],
      robots: isAnonymous ? 'noindex, nofollow' : 'index, follow',
      alternates: {
        canonical: `https://inschoolz.com/community/school/${schoolId}/${boardCode}/${postId}`,
      },
      openGraph: {
        title: seoTitle,
        description: seoDescription,
        type: 'article',
        siteName: 'Inschoolz - 인스쿨즈',
        url: `https://inschoolz.com/community/school/${schoolId}/${boardCode}/${postId}`,
        publishedTime: serializeTimestamp(post.createdAt).toISOString(),
        modifiedTime: serializeTimestamp(post.updatedAt || post.createdAt).toISOString(),
        authors: [authorName],
        section: `${schoolInfo.name} ${boardInfo.name}`,
        tags: [...categories, ...seoKeywords.slice(0, 10)],
        ...(firstImage && { images: [{ url: firstImage, alt: post.title }] }),
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
        'article:section': `${schoolInfo.name} ${boardInfo.name}`,
        'article:tag': categories.join(','),
        'article:author': authorName,
        'article:published_time': serializeTimestamp(post.createdAt).toISOString(),
        'article:modified_time': serializeTimestamp(post.updatedAt || post.createdAt).toISOString(),
        'school:name': schoolInfo.name,
        'school:type': schoolInfo.type,
        'school:address': schoolInfo.address,
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

export default async function SchoolPostDetailPage({ params }: PostViewPageProps) {
  const { boardCode, postId } = await params;
  
  try {
    // 게시글 정보와 게시판 정보를 병렬로 가져오기
    const [{ post, comments }, boards] = await Promise.all([
      getPostDetailOptimized(postId, true),
      getBoardsByType('school')
    ]);
    
    const board = boards.find(b => b.code === boardCode);
    
    if (!board) {
      notFound();
    }

    // 게시글이 해당 게시판에 속하는지 확인
    if ((post as Post).boardCode !== boardCode) {
      notFound();
    }

    return (
      <PostViewClient
        post={post as unknown as Post}
        initialComments={comments as unknown as Comment[]}
      />
    );
  } catch (error) {
    console.error('School 게시글 상세 페이지 오류:', error);
    notFound();
  }
} 