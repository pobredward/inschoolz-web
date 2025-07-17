'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { User } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CalendarDays, School, Users } from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import { ko } from 'date-fns/locale';
import { toggleFollow } from '@/lib/api/users';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { toDate } from '@/lib/utils';

interface ProfileSectionProps {
  user: User;
  isOwnProfile: boolean;
  isFollowing: boolean;
  isLoading: boolean;
  followersCount: number;
  followingCount: number;
}

export default function ProfileSection({
  user,
  isOwnProfile,
  isFollowing,
  isLoading,
  followersCount,
  followingCount,
}: ProfileSectionProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // 기본 프로필 이미지
  const defaultProfileImage = '/images/default-profile.png';
  
  // 가입일 포맷
  const formatJoinDate = () => {
    if (!user.createdAt) return '알 수 없음';
    
    const date = new Date(toDate(user.createdAt));
    return format(date, 'yyyy년 MM월 dd일', { locale: ko });
  };
  
  // 활동 기간 계산
  const getActivityDuration = () => {
    if (!user.createdAt) return '';
    
    const joinDate = new Date(toDate(user.createdAt));
    return formatDistanceToNow(joinDate, { locale: ko, addSuffix: true });
  };
  
  // 팔로우/언팔로우 처리
  const handleToggleFollow = async () => {
    setIsSubmitting(true);
    try {
      await toggleFollow(user.uid, user.uid);
      router.refresh();
    } catch (error) {
      console.error('팔로우 상태 변경 오류:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
          {/* 프로필 이미지 */}
          <div className="relative w-24 h-24 rounded-full overflow-hidden">
            <Image
              src={user.profile.profileImageUrl || defaultProfileImage}
              alt={user.profile.userName}
              fill
              sizes="96px"
              className="object-cover"
            />
          </div>
          
          {/* 사용자 정보 */}
          <div className="flex-1">
            <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-4 mb-2">
              <h1 className="text-2xl font-bold">{user.profile.userName}</h1>
              
              {/* 특별 배지 */}
              {user.role === 'admin' && (
                <Badge variant="secondary" className="bg-green-100 text-green-800">관리자</Badge>
              )}
              {user.role === 'teacher' && (
                <Badge variant="secondary" className="bg-green-100 text-green-800">선생님</Badge>
              )}
              {user.isVerified && (
                <Badge variant="secondary" className="bg-purple-100 text-purple-800">인증 회원</Badge>
              )}
            </div>
            
            {/* 팔로우 버튼 */}
            {!isOwnProfile && (
              <Button
                onClick={handleToggleFollow}
                disabled={isLoading || isSubmitting}
                variant={isFollowing ? "outline" : "default"}
                size="sm"
                className="mb-4"
              >
                {isLoading ? '로딩 중...' : isFollowing ? '팔로잉' : '팔로우'}
              </Button>
            )}
            
            {/* 팔로워/팔로잉 정보 */}
            <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
              <Link href={`/users/${user.uid}/followers`} className="hover:underline flex items-center">
                <Users className="h-4 w-4 mr-1" />
                <span>팔로워 {followersCount}</span>
              </Link>
              <Link href={`/users/${user.uid}/following`} className="hover:underline flex items-center">
                <Users className="h-4 w-4 mr-1" />
                <span>팔로잉 {followingCount}</span>
              </Link>
            </div>
            
            {/* 레벨 정보 */}
            {user.stats && (
              <div className="mb-3">
                <p className="text-sm">
                  <span className="font-medium">Lv.{user.stats.level}</span>
                  {user.stats.totalExperience && (
                    <span className="text-muted-foreground ml-1">
                      (경험치: {user.stats.totalExperience})
                    </span>
                  )}
                </p>
              </div>
            )}
            
            {/* 가입일 정보 */}
            <div className="flex flex-col md:flex-row gap-1 md:gap-4 text-sm text-muted-foreground">
              {user.createdAt && (
                <div className="flex items-center">
                  <CalendarDays className="h-4 w-4 mr-1" />
                  <span>가입일: {formatJoinDate()} ({getActivityDuration()})</span>
                </div>
              )}
              
              {user.school && (
                <div className="flex items-center">
                  <School className="h-4 w-4 mr-1" />
                  <span>{user.school.name}</span>
                </div>
              )}
            </div>
          </div>
        </div>
        
        {/* 자기소개 */}
        <div className="mt-6 text-sm">
          <p className="text-muted-foreground">
            자기소개가 없습니다.
          </p>
        </div>
        
        {/* 활동 통계 */}
        <div className="grid grid-cols-3 gap-4 mt-6 text-center">
          <div className="bg-gray-50 p-3 rounded-md">
            <p className="text-2xl font-bold">{user.stats?.postCount || 0}</p>
            <p className="text-xs text-muted-foreground">게시글</p>
          </div>
          <div className="bg-gray-50 p-3 rounded-md">
            <p className="text-2xl font-bold">{user.stats?.commentCount || 0}</p>
            <p className="text-xs text-muted-foreground">댓글</p>
          </div>
          <div className="bg-gray-50 p-3 rounded-md">
            <p className="text-2xl font-bold">{user.stats?.likeCount || 0}</p>
            <p className="text-xs text-muted-foreground">받은 좋아요</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
} 