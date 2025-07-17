"use client";

import React from "react";
import Link from "next/link";
import { formatRelativeTime, getPostPreviewImages } from "@/lib/utils";
import { FirebaseTimestamp } from "@/types";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";

interface PostListItemProps {
  post: {
    id: string;
    title: string;
    content: string;
    authorInfo?: {
      displayName?: string;
      isAnonymous?: boolean;
      profileImageUrl?: string;
    };
    createdAt: FirebaseTimestamp;
    stats?: {
      viewCount?: number;
      likeCount?: number;
      commentCount?: number;
    };
    attachments?: Array<{
      type: string;
      url: string;
    }>;
    tags?: string[];
    boardName?: string;
    previewContent?: string;
  };
  href: string;
  showBadges?: boolean;
  variant?: 'home' | 'community' | 'profile';
  className?: string;
  typeBadgeText?: string;
  boardBadgeText?: string;
}

const PostListItem: React.FC<PostListItemProps> = ({
  post,
  href,
  showBadges = true,
  className = '',
  typeBadgeText,
  boardBadgeText
}) => {
  const previewImages = getPostPreviewImages(post);

  return (
    <Link key={post.id} href={href} className={`block group ${className}`}>
      <div className="bg-white p-4 rounded-lg border border-gray-100 hover:shadow-md transition-all duration-200">
        {/* 상단 뱃지들 */}
        {showBadges && (
          <div className="flex items-center gap-2 mb-3">
            {typeBadgeText && (
              <span className="text-xs font-bold text-gray-700 bg-blue-100 px-2 py-1 rounded">
                {typeBadgeText}
              </span>
            )}
            {boardBadgeText && (
              <span className="text-xs font-bold text-gray-700 bg-green-100 px-2 py-1 rounded">
                {boardBadgeText}
              </span>
            )}
            {/* 콘텐츠 뱃지 */}
            <div className="flex items-center gap-1">
              {previewImages.length > 0 && (
                <Badge variant="outline" className="flex items-center gap-1 px-2 py-0.5 h-5 text-xs">
                  📷 사진
                </Badge>
              )}
              {(post as any).poll && (
                <Badge variant="outline" className="flex items-center gap-1 px-2 py-0.5 h-5 text-xs bg-blue-50 text-blue-700 border-blue-200">
                  📊 투표
                </Badge>
              )}
            </div>
          </div>
        )}
        
        {/* 제목과 이미지 미리보기를 포함한 컨테이너 */}
        <div className="flex items-start gap-3 mb-2">
          <div className="flex-1 min-w-0">
            {/* 제목 */}
            <h3 className="font-semibold text-gray-900 group-hover:text-green-600 line-clamp-2 leading-relaxed mb-2">
              {post.title}
            </h3>
            
            {/* 내용 미리보기 */}
            {(post.previewContent || post.content) && (
              <div className="text-sm text-gray-600 mb-3 line-clamp-2 whitespace-pre-line break-words">
                {post.previewContent || post.content?.replace(/<[^>]*>/g, '').slice(0, 150) || ''}
              </div>
            )}
          </div>
          
          {/* 이미지 미리보기 (오른쪽) */}
          {previewImages.length > 0 && (
            <div className="flex gap-1 flex-shrink-0">
              {previewImages.map((imageUrl, index) => (
                <div
                  key={index}
                  className="w-16 h-16 rounded-lg overflow-hidden bg-gray-100 border border-gray-200"
                >
                  <img
                    src={imageUrl}
                    alt={`미리보기 ${index + 1}`}
                    className="w-full h-full object-cover"
                    loading="lazy"
                    onError={(e) => {
                      // 이미지 로드 실패 시 숨김 처리
                      e.currentTarget.style.display = 'none';
                    }}
                  />
                </div>
              ))}
            </div>
          )}
        </div>
        
        {/* 하단 정보 */}
        <div className="flex items-center justify-between">
          {/* 작성자 정보 */}
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
            <div className="flex items-center gap-1 min-w-0">
              <Avatar className="h-5 w-5">
                <AvatarImage 
                  src={post.authorInfo?.profileImageUrl} 
                  alt={post.authorInfo?.displayName || '사용자'} 
                />
                <AvatarFallback className="text-xs">
                  {post.authorInfo?.isAnonymous ? '익명' : post.authorInfo?.displayName?.substring(0, 2) || 'NA'}
                </AvatarFallback>
              </Avatar>
              <span className="truncate">
                {post.authorInfo?.isAnonymous ? '익명' : post.authorInfo?.displayName || '알 수 없음'}
              </span>
              <span className="text-xs">|</span>
              <span className="text-xs">
                {formatRelativeTime(post.createdAt)}
              </span>
            </div>
            
            {post.tags && post.tags.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {post.tags.map((tag: string) => (
                  <Badge key={tag} variant="outline" className="px-1.5 py-0 h-5 text-xs">
                    {tag}
                  </Badge>
                ))}
              </div>
            )}
          </div>
          
          {/* 통계 정보 */}
          <div className="flex items-center gap-3 text-sm text-gray-500">
            <span className="flex items-center gap-1">
              <span>👁</span>
              {post.stats?.viewCount || 0}
            </span>
            <span className="flex items-center gap-1">
              <span>👍</span>
              {post.stats?.likeCount || 0}
            </span>
            <span className="flex items-center gap-1">
              <span>💬</span>
              {post.stats?.commentCount || 0}
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
};

export default PostListItem; 