'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/providers/AuthProvider';
import ProfileHeader from './ProfileHeader';
import ProfileSection from './ProfileSection';
import ContentTabs from './ContentTabs';
import SidePanel from './SidePanel';
import { User } from '@/types';
import {
  checkFollowStatus,
  checkBlockStatus,
  getFollowersCount,
  getFollowingCount
} from '@/lib/api/users';

interface UserProfileContainerProps {
  user: User;
}

export default function UserProfileContainer({ user }: UserProfileContainerProps) {
  const { user: currentUser } = useAuth();
  const [isFollowing, setIsFollowing] = useState(false);
  const [isBlocked, setIsBlocked] = useState(false);
  const [followersCount, setFollowersCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  // 팔로우, 차단 상태 및 팔로워/팔로잉 수 조회
  useEffect(() => {
    const fetchUserRelationship = async () => {
      if (!currentUser) {
        setIsLoading(false);
        return;
      }

      try {
        const [followStatus, blockStatus, followerCount, followingCount] = await Promise.all([
          checkFollowStatus(currentUser.uid, user.uid),
          checkBlockStatus(currentUser.uid, user.uid),
          getFollowersCount(user.uid),
          getFollowingCount(user.uid)
        ]);

        setIsFollowing(followStatus);
        setIsBlocked(blockStatus);
        setFollowersCount(followerCount);
        setFollowingCount(followingCount);
      } catch (error) {
        console.error('사용자 관계 정보 조회 오류:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserRelationship();
  }, [currentUser, user.uid]);

  // 자신의 프로필인지 확인
  const isOwnProfile = !!(currentUser && currentUser.uid === user.uid);

  return (
    <div className="container mx-auto py-6 px-4 md:px-6">
      <ProfileHeader user={user} isOwnProfile={isOwnProfile} isBlocked={!!isBlocked} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
        <div className="lg:col-span-2">
          <ProfileSection 
            user={user} 
            isOwnProfile={isOwnProfile}
            isFollowing={!!isFollowing}
            isLoading={isLoading}
            followersCount={followersCount}
            followingCount={followingCount}
          />
          
          <div className="mt-8">
            <ContentTabs 
              userId={user.uid}
              isOwnProfile={isOwnProfile}
            />
          </div>
        </div>
        
        <div className="mt-6 lg:mt-0">
          <SidePanel
            userId={user.uid}
            isOwnProfile={isOwnProfile}
          />
        </div>
      </div>
    </div>
  );
} 