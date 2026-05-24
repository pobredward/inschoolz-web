import React from "react";
import { cache } from "react";
import { Metadata } from "next";
import { notFound } from "next/navigation";
import { PostViewClient } from "@/components/board/PostViewClient";
import { getBoardsByType, getPostDetailOptimized, getPostDocument } from "@/lib/api/board";
import { Post, Comment } from "@/types";
import { stripHtmlTags, serializeTimestamp } from "@/lib/utils";
import { 
  generateSeoTitle, 
  generateSeoDescription, 
  generateSeoKeywords,
  categorizePost
} from "@/lib/seo-utils";

// generateMetadata: post 문서만 필요 → getPostDocumentCached
// page(): 댓글까지 필요 → getPostDetailCached
// getBoardsByType: unstable_cache(1시간) 적용
const getPostDocumentCached = cache(getPostDocument);
const getPostDetailCached = cache(getPostDetailOptimized);

interface PostViewPageProps {
  params: Promise<{
    schoolId: string;
    boardCode: string;
    postId: string;
  }>;
}

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
    const [post, boards] = await Promise.all([
      getPostDocumentCached(postId),
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

    const isAnonymous = post.authorInfo?.isAnonymous;
    const cleanContent = stripHtmlTags(post.content);
    const authorName = isAnonymous ? '익명' : (post.authorInfo?.displayName || '사용자');
    const createdDate = serializeTimestamp(post.createdAt).toLocaleDateString('ko-KR');
    const images = post.attachments?.filter(att => att.type === 'image').map(att => att.url) || [];
    const firstImage = images.length > 0 ? images[0] : undefined;
    
    const locationInfo = { name: schoolInfo.name, address: schoolInfo.address };
    const seoTitle = generateSeoTitle(post, boardInfo.name, 'school', locationInfo);
    const seoDescription = generateSeoDescription(post, cleanContent, authorName, createdDate, 'school', locationInfo);
    const seoKeywords = generateSeoKeywords(post, boardInfo.name, 'school', locationInfo);
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
    const [{ post, comments }, boards] = await Promise.all([
      getPostDetailCached(postId, true),
      getBoardsByType('school')
    ]);
    
    const board = boards.find(b => b.code === boardCode);
    
    if (!board) {
      notFound();
    }

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
