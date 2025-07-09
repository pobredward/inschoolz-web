import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  limit,
  addDoc,
  updateDoc,
  serverTimestamp
  // deleteDoc,
  // Timestamp,
  // increment
} from 'firebase/firestore';
import { db, storage } from '@/lib/firebase';
import { User, UserRelationship, Post, Comment } from '@/types';
import { getDownloadURL, ref, uploadBytes, deleteObject } from 'firebase/storage';

/**
 * 사용자 정보 조회
 */
export const getUserById = async (userId: string): Promise<User | null> => {
  try {
    const userRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userRef);
    
    if (userDoc.exists()) {
      return { 
        ...userDoc.data(),
        uid: userDoc.id
      } as User;
    } else {
      return null;
    }
  } catch (error) {
    console.error('사용자 정보 조회 오류:', error);
    throw new Error('사용자 정보를 가져오는 중 오류가 발생했습니다.');
  }
};

/**
 * userName으로 사용자 정보 조회
 */
export const getUserByUserName = async (userName: string): Promise<User | null> => {
  try {
    const usersRef = collection(db, 'users');
    const q = query(
      usersRef,
      where('profile.userName', '==', userName),
      limit(1)
    );
    
    const querySnapshot = await getDocs(q);
    
    if (!querySnapshot.empty) {
      const userDoc = querySnapshot.docs[0];
      return { 
        ...userDoc.data(),
        uid: userDoc.id
      } as User;
    } else {
      return null;
    }
  } catch (error) {
    console.error('사용자 정보 조회 오류:', error);
    throw new Error('사용자 정보를 가져오는 중 오류가 발생했습니다.');
  }
};

/**
 * 사용자 작성 게시글 조회
 */
export const getUserPosts = async (
  userId: string, 
  page = 1, 
  pageSize = 10,
  sortBy: 'latest' | 'popular' = 'latest'
): Promise<{ posts: Post[], totalCount: number, hasMore: boolean }> => {
  try {
    if (!userId) {
      return {
        posts: [],
        totalCount: 0,
        hasMore: false
      };
    }

    const postsRef = collection(db, 'posts');
    let q;
    
    if (sortBy === 'latest') {
      q = query(
        postsRef,
        where('authorId', '==', userId),
        where('status.isDeleted', '==', false),
        orderBy('createdAt', 'desc'),
        limit(pageSize * page)
      );
    } else {
      q = query(
        postsRef,
        where('authorId', '==', userId),
        where('status.isDeleted', '==', false),
        orderBy('stats.likeCount', 'desc'),
        limit(pageSize * page)
      );
    }
    
    const querySnapshot = await getDocs(q);
    const posts: Post[] = [];
    
    querySnapshot.forEach((doc) => {
      posts.push({ id: doc.id, ...doc.data() } as Post);
    });
    
    // 전체 게시글 수 가져오기
    const countQuery = query(
      postsRef,
      where('authorId', '==', userId),
      where('status.isDeleted', '==', false)
    );
    
    const countSnapshot = await getDocs(countQuery);
    const totalCount = countSnapshot.size;
    
    // 페이징 처리
    const startIndex = (page - 1) * pageSize;
    const paginatedPosts = posts.slice(startIndex, startIndex + pageSize);
    
    return {
      posts: paginatedPosts,
      totalCount,
      hasMore: totalCount > page * pageSize
    };
  } catch (error) {
    console.error('사용자 게시글 조회 오류:', error);
    throw new Error('사용자 게시글을 가져오는 중 오류가 발생했습니다.');
  }
};

/**
 * 사용자 작성 댓글 조회
 */
export const getUserComments = async (
  userId: string,
  page = 1,
  pageSize = 10
): Promise<{ comments: Comment[], totalCount: number, hasMore: boolean }> => {
  try {
    if (!userId) {
      return {
        comments: [],
        totalCount: 0,
        hasMore: false
      };
    }
    
    // Firestore에서는 하위 컬렉션에 대한 전체 쿼리가 불가능하므로 
    // 실제 구현에서는 별도의 comments 컬렉션을 만들거나 다른 방법 필요
    // 여기서는 개념적으로 구현
    
    // 모든 게시글의 comments 하위 컬렉션을 조회해야 함
    // 실제로는 사용자의 댓글을 추적하는 별도 컬렉션을 사용하는 것이 좋음
    const postsRef = collection(db, 'posts');
    const postsSnapshot = await getDocs(postsRef);
    
    const allComments: Comment[] = [];
    
    // 각 게시글의 comments 하위 컬렉션 조회
    for (const postDoc of postsSnapshot.docs) {
      const commentsRef = collection(db, `posts/${postDoc.id}/comments`);
      const commentsQuery = query(
        commentsRef,
        where('authorId', '==', userId),
        where('status.isDeleted', '==', false),
        orderBy('createdAt', 'desc')
      );
      
      const commentsSnapshot = await getDocs(commentsQuery);
      
      commentsSnapshot.forEach((commentDoc) => {
        allComments.push({ 
          id: commentDoc.id, 
          ...commentDoc.data(),
          postId: postDoc.id  // 명시적으로 postId 추가
        } as Comment);
      });
    }
    
    // 생성일 기준 정렬
    allComments.sort((a, b) => b.createdAt - a.createdAt);
    
    // 페이징 처리
    const totalCount = allComments.length;
    const startIndex = (page - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    const paginatedComments = allComments.slice(startIndex, endIndex);
    
    return {
      comments: paginatedComments,
      totalCount,
      hasMore: totalCount > endIndex
    };
  } catch (error) {
    console.error('사용자 댓글 조회 오류:', error);
    throw new Error('사용자 댓글을 가져오는 중 오류가 발생했습니다.');
  }
};

/**
 * 팔로우 상태 확인
 */
export const checkFollowStatus = async (
  userId: string,
  targetId: string
): Promise<boolean> => {
  try {
    const relationshipsRef = collection(db, 'userRelationships');
    const q = query(
      relationshipsRef,
      where('userId', '==', userId),
      where('targetId', '==', targetId),
      where('type', '==', 'follow'),
      where('status', '==', 'active')
    );
    
    const querySnapshot = await getDocs(q);
    return !querySnapshot.empty;
  } catch (error) {
    console.error('팔로우 상태 확인 오류:', error);
    throw new Error('팔로우 상태를 확인하는 중 오류가 발생했습니다.');
  }
};

/**
 * 팔로워 수 조회 (나를 팔로우하는 사용자)
 */
export const getFollowersCount = async (userId: string): Promise<number> => {
  try {
    const relationshipsRef = collection(db, 'userRelationships');
    const q = query(
      relationshipsRef,
      where('targetId', '==', userId),
      where('type', '==', 'follow'),
      where('status', '==', 'active')
    );
    
    const querySnapshot = await getDocs(q);
    return querySnapshot.size;
  } catch (error) {
    console.error('팔로워 수 조회 오류:', error);
    throw new Error('팔로워 수를 조회하는 중 오류가 발생했습니다.');
  }
};

/**
 * 팔로잉 수 조회 (내가 팔로우하는 사용자)
 */
export const getFollowingCount = async (userId: string): Promise<number> => {
  try {
    const relationshipsRef = collection(db, 'userRelationships');
    const q = query(
      relationshipsRef,
      where('userId', '==', userId),
      where('type', '==', 'follow'),
      where('status', '==', 'active')
    );
    
    const querySnapshot = await getDocs(q);
    return querySnapshot.size;
  } catch (error) {
    console.error('팔로잉 수 조회 오류:', error);
    throw new Error('팔로잉 수를 조회하는 중 오류가 발생했습니다.');
  }
};

/**
 * 팔로워 목록 조회 (나를 팔로우하는 사용자)
 */
export const getFollowers = async (
  userId: string,
  page = 1,
  pageSize = 20
): Promise<{ users: User[], totalCount: number, hasMore: boolean }> => {
  try {
    const relationshipsRef = collection(db, 'userRelationships');
    const q = query(
      relationshipsRef,
      where('targetId', '==', userId),
      where('type', '==', 'follow'),
      where('status', '==', 'active'),
      orderBy('createdAt', 'desc'),
      limit(pageSize * page)
    );
    
    const querySnapshot = await getDocs(q);
    const relationships = querySnapshot.docs.map(doc => doc.data() as UserRelationship);
    
    // 팔로워 사용자 정보 조회
    const users: User[] = [];
    for (const relationship of relationships) {
      const user = await getUserById(relationship.userId);
      if (user) {
        users.push(user);
      }
    }
    
    // 전체 팔로워 수 조회
    const totalCount = await getFollowersCount(userId);
    
    // 페이징 처리
    const startIndex = (page - 1) * pageSize;
    const paginatedUsers = users.slice(startIndex, startIndex + pageSize);
    
    return {
      users: paginatedUsers,
      totalCount,
      hasMore: totalCount > page * pageSize
    };
  } catch (error) {
    console.error('팔로워 목록 조회 오류:', error);
    throw new Error('팔로워 목록을 조회하는 중 오류가 발생했습니다.');
  }
};

/**
 * 팔로잉 목록 조회 (내가 팔로우하는 사용자)
 */
export const getFollowings = async (
  userId: string,
  page = 1,
  pageSize = 20
): Promise<{ users: User[], totalCount: number, hasMore: boolean }> => {
  try {
    const relationshipsRef = collection(db, 'userRelationships');
    const q = query(
      relationshipsRef,
      where('userId', '==', userId),
      where('type', '==', 'follow'),
      where('status', '==', 'active'),
      orderBy('createdAt', 'desc'),
      limit(pageSize * page)
    );
    
    const querySnapshot = await getDocs(q);
    const relationships = querySnapshot.docs.map(doc => doc.data() as UserRelationship);
    
    // 팔로잉 사용자 정보 조회
    const users: User[] = [];
    for (const relationship of relationships) {
      const user = await getUserById(relationship.targetId);
      if (user) {
        users.push(user);
      }
    }
    
    // 전체 팔로잉 수 조회
    const totalCount = await getFollowingCount(userId);
    
    // 페이징 처리
    const startIndex = (page - 1) * pageSize;
    const paginatedUsers = users.slice(startIndex, startIndex + pageSize);
    
    return {
      users: paginatedUsers,
      totalCount,
      hasMore: totalCount > page * pageSize
    };
  } catch (error) {
    console.error('팔로잉 목록 조회 오류:', error);
    throw new Error('팔로잉 목록을 조회하는 중 오류가 발생했습니다.');
  }
};

/**
 * 팔로우/언팔로우 토글
 */
export const toggleFollow = async (
  userId: string,
  targetId: string
): Promise<{ isFollowing: boolean }> => {
  try {
    // 자기 자신을 팔로우할 수 없음
    if (userId === targetId) {
      throw new Error('자기 자신을 팔로우할 수 없습니다.');
    }
    
    // 대상 사용자 존재 여부 확인
    const targetUser = await getUserById(targetId);
    if (!targetUser) {
      throw new Error('존재하지 않는 사용자입니다.');
    }
    
    // 현재 팔로우 상태 확인
    const relationshipsRef = collection(db, 'userRelationships');
    const q = query(
      relationshipsRef,
      where('userId', '==', userId),
      where('targetId', '==', targetId),
      where('type', '==', 'follow')
    );
    
    const querySnapshot = await getDocs(q);
    
    // 팔로우 관계가 존재하면 상태 변경 또는 제거
    if (!querySnapshot.empty) {
      const relationshipDoc = querySnapshot.docs[0];
      const relationship = relationshipDoc.data() as UserRelationship;
      
      if (relationship.status === 'active') {
        // 활성 상태면 비활성화 (언팔로우)
        await updateDoc(doc(db, 'userRelationships', relationshipDoc.id), {
          status: 'inactive',
          updatedAt: Date.now()
        });
        return { isFollowing: false };
      } else {
        // 비활성 상태면 활성화 (다시 팔로우)
        await updateDoc(doc(db, 'userRelationships', relationshipDoc.id), {
          status: 'active',
          updatedAt: Date.now()
        });
        return { isFollowing: true };
      }
    } else {
      // 팔로우 관계가 없으면 새로 생성
      const newRelationship: UserRelationship = {
        id: '',
        userId,
        targetId,
        type: 'follow',
        status: 'active',
        createdAt: Date.now(),
        updatedAt: Date.now()
      };
      
      const relationshipRef = await addDoc(relationshipsRef, newRelationship);
      
      // ID 업데이트
      await updateDoc(relationshipRef, {
        id: relationshipRef.id
      });
      
      return { isFollowing: true };
    }
  } catch (error) {
    console.error('팔로우 토글 오류:', error);
    throw new Error('팔로우 상태를 변경하는 중 오류가 발생했습니다.');
  }
};

/**
 * 차단 상태 확인
 */
export const checkBlockStatus = async (
  userId: string,
  targetId: string
): Promise<boolean> => {
  try {
    const relationshipsRef = collection(db, 'userRelationships');
    const q = query(
      relationshipsRef,
      where('userId', '==', userId),
      where('targetId', '==', targetId),
      where('type', '==', 'block'),
      where('status', '==', 'active')
    );
    
    const querySnapshot = await getDocs(q);
    return !querySnapshot.empty;
  } catch (error) {
    console.error('차단 상태 확인 오류:', error);
    throw new Error('차단 상태를 확인하는 중 오류가 발생했습니다.');
  }
};

/**
 * 차단/차단해제 토글
 */
export const toggleBlock = async (
  userId: string,
  targetId: string
): Promise<{ isBlocked: boolean }> => {
  try {
    // 자기 자신을 차단할 수 없음
    if (userId === targetId) {
      throw new Error('자기 자신을 차단할 수 없습니다.');
    }
    
    // 대상 사용자 존재 여부 확인
    const targetUser = await getUserById(targetId);
    if (!targetUser) {
      throw new Error('존재하지 않는 사용자입니다.');
    }
    
    // 현재 차단 상태 확인
    const relationshipsRef = collection(db, 'userRelationships');
    const q = query(
      relationshipsRef,
      where('userId', '==', userId),
      where('targetId', '==', targetId),
      where('type', '==', 'block')
    );
    
    const querySnapshot = await getDocs(q);
    
    // 차단 관계가 존재하면 상태 변경 또는 제거
    if (!querySnapshot.empty) {
      const relationshipDoc = querySnapshot.docs[0];
      const relationship = relationshipDoc.data() as UserRelationship;
      
      if (relationship.status === 'active') {
        // 활성 상태면 비활성화 (차단 해제)
        await updateDoc(doc(db, 'userRelationships', relationshipDoc.id), {
          status: 'inactive',
          updatedAt: Date.now()
        });
        return { isBlocked: false };
      } else {
        // 비활성 상태면 활성화 (다시 차단)
        await updateDoc(doc(db, 'userRelationships', relationshipDoc.id), {
          status: 'active',
          updatedAt: Date.now()
        });
        return { isBlocked: true };
      }
    } else {
      // 차단 관계가 없으면 새로 생성
      const newRelationship: UserRelationship = {
        id: '',
        userId,
        targetId,
        type: 'block',
        status: 'active',
        createdAt: Date.now(),
        updatedAt: Date.now()
      };
      
      const relationshipRef = await addDoc(relationshipsRef, newRelationship);
      
      // ID 업데이트
      await updateDoc(relationshipRef, {
        id: relationshipRef.id
      });
      
      // 차단하면 자동으로 팔로우 관계 비활성화
      const followQ = query(
        relationshipsRef,
        where('userId', '==', userId),
        where('targetId', '==', targetId),
        where('type', '==', 'follow'),
        where('status', '==', 'active')
      );
      
      const followSnapshot = await getDocs(followQ);
      
      if (!followSnapshot.empty) {
        const followDoc = followSnapshot.docs[0];
        await updateDoc(doc(db, 'userRelationships', followDoc.id), {
          status: 'inactive',
          updatedAt: Date.now()
        });
      }
      
      return { isBlocked: true };
    }
  } catch (error) {
    console.error('차단 토글 오류:', error);
    throw new Error('차단 상태를 변경하는 중 오류가 발생했습니다.');
  }
};

/**
 * 사용자 활동 요약 정보 조회
 */
export const getUserActivitySummary = async (userId: string) => {
  try {
    // 가장 활발한 게시판 Top 3
    const postsRef = collection(db, 'posts');
    const postsQuery = query(
      postsRef,
      where('authorId', '==', userId),
      where('status.isDeleted', '==', false)
    );
    
    const postsSnapshot = await getDocs(postsQuery);
    const posts = postsSnapshot.docs.map(doc => doc.data() as Post);
    
    // 게시판별 게시글 수 집계
    const boardPostCounts: Record<string, number> = {};
    
    posts.forEach(post => {
      if (boardPostCounts[post.boardCode]) {
        boardPostCounts[post.boardCode]++;
      } else {
        boardPostCounts[post.boardCode] = 1;
      }
    });
    
    // 게시글 수가 많은 순으로 정렬
    const sortedBoards = Object.entries(boardPostCounts)
      .sort(([, countA], [, countB]) => countB - countA)
      .slice(0, 3)
      .map(([boardCode, count]) => ({ boardCode, count }));
    
    // 가장 인기있는 게시글 Top 3
    const popularPostsQuery = query(
      postsRef,
      where('authorId', '==', userId),
      where('status.isDeleted', '==', false),
      orderBy('stats.likeCount', 'desc'),
      limit(3)
    );
    
    const popularPostsSnapshot = await getDocs(popularPostsQuery);
    const popularPosts = popularPostsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as Post));
    
    return {
      mostActiveBoards: sortedBoards,
      topPosts: popularPosts
    };
  } catch (error) {
    console.error('사용자 활동 요약 조회 오류:', error);
    throw new Error('사용자 활동 요약을 조회하는 중 오류가 발생했습니다.');
  }
};

/**
 * 게임 기록 조회
 */
export const getUserGameStats = async (userId: string) => {
  try {
    const userRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userRef);
    
    if (!userDoc.exists()) {
      throw new Error('사용자를 찾을 수 없습니다.');
    }
    
    const userData = userDoc.data() as User;
    
    // 게임 통계 정보가 없으면 빈 객체 반환
    return userData.gameStats || {};
  } catch (error) {
    console.error('게임 기록 조회 오류:', error);
    throw new Error('게임 기록을 조회하는 중 오류가 발생했습니다.');
  }
};

/**
 * 사용자 프로필 업데이트
 */
export const updateUserProfile = async (
  userId: string,
  profileData: {
    userName?: string;
    realName?: string;
    gender?: string;
    birthYear?: string | number;
    birthMonth?: string | number;
    birthDay?: string | number;
    phoneNumber?: string;
    referrerId?: string;
    sido?: string;
    sigungu?: string;
    address?: string;
  }
): Promise<boolean> => {
  try {
    const userRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userRef);
    
    if (!userDoc.exists()) {
      throw new Error('사용자를 찾을 수 없습니다.');
    }
    
    const updates: Record<string, any> = {};
    
    // 프로필 필드 업데이트
    if (profileData.userName) {
      updates['profile.userName'] = profileData.userName;
    }
    
    if (profileData.realName !== undefined) {
      updates['profile.realName'] = profileData.realName;
    }
    
    if (profileData.gender !== undefined) {
      updates['profile.gender'] = profileData.gender;
    }
    
    if (profileData.birthYear !== undefined) {
      updates['profile.birthYear'] = Number(profileData.birthYear) || null;
    }
    
    if (profileData.birthMonth !== undefined) {
      updates['profile.birthMonth'] = Number(profileData.birthMonth) || null;
    }
    
    if (profileData.birthDay !== undefined) {
      updates['profile.birthDay'] = Number(profileData.birthDay) || null;
    }
    
    if (profileData.phoneNumber !== undefined) {
      updates['profile.phoneNumber'] = profileData.phoneNumber;
    }
    
    // 추천인 업데이트
    if (profileData.referrerId !== undefined) {
      updates['referrerId'] = profileData.referrerId;
    }
    
    // 지역 정보 업데이트
    if (profileData.sido || profileData.sigungu || profileData.address) {
      // 지역 정보가 아직 없는 경우 초기화
      if (!userDoc.data()?.regions) {
        updates['regions'] = {
          sido: '',
          sigungu: '',
          address: ''
        };
      }
      
      if (profileData.sido !== undefined) {
        updates['regions.sido'] = profileData.sido;
      }
      
      if (profileData.sigungu !== undefined) {
        updates['regions.sigungu'] = profileData.sigungu;
      }
      
      if (profileData.address !== undefined) {
        updates['regions.address'] = profileData.address;
      }
    }
    
    // 변경된 필드가 있는 경우에만 업데이트
    if (Object.keys(updates).length > 0) {
      updates.updatedAt = serverTimestamp();
      await updateDoc(userRef, updates);
    }
    
    return true;
  } catch (error) {
    console.error('사용자 프로필 업데이트 오류:', error);
    throw new Error('프로필을 업데이트하는 중 오류가 발생했습니다.');
  }
};

/**
 * 프로필 이미지 업로드 및 업데이트
 */
export const updateProfileImage = async (
  userId: string,
  imageFile: File
): Promise<{ success: boolean; url?: string; error?: string }> => {
  try {
    if (!imageFile) {
      return { success: false, error: '이미지 파일이 제공되지 않았습니다.' };
    }

    // 파일 크기 검증 (5MB 제한)
    if (imageFile.size > 5 * 1024 * 1024) {
      return { success: false, error: '이미지 크기는 5MB 이하여야 합니다.' };
    }

    // 파일 형식 검증
    if (!imageFile.type.startsWith('image/')) {
      return { success: false, error: '이미지 파일만 업로드 가능합니다.' };
    }

    // 이전 프로필 이미지 URL 가져오기 (삭제를 위해)
    const userRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userRef);
    
    if (!userDoc.exists()) {
      return { success: false, error: '사용자를 찾을 수 없습니다.' };
    }
    
    const userData = userDoc.data();
    const oldImageUrl = userData?.profile?.profileImageUrl;
    
    // Firebase Storage 경로 설정
    const fileExtension = imageFile.name.split('.').pop();
    const fileName = `${userId}_${Date.now()}.${fileExtension}`;
    const storageRef = ref(storage, `profile_images/${fileName}`);
    
    // 이미지 업로드
    await uploadBytes(storageRef, imageFile);
    
    // 다운로드 URL 가져오기
    const downloadUrl = await getDownloadURL(storageRef);
    
    // Firestore 업데이트
    await updateDoc(userRef, {
      'profile.profileImageUrl': downloadUrl,
      updatedAt: serverTimestamp()
    });
    
    // 이전 이미지가 있고 기본 이미지가 아니라면 삭제
    if (oldImageUrl && !oldImageUrl.includes('default-profile')) {
      try {
        // URL에서 파일 경로 추출
        const oldImagePath = decodeURIComponent(oldImageUrl.split('?')[0].split('/o/')[1]);
        const oldImageRef = ref(storage, oldImagePath);
        await deleteObject(oldImageRef);
      } catch (err) {
        console.error('이전 프로필 이미지 삭제 오류:', err);
        // 이전 이미지 삭제 실패해도 계속 진행
      }
    }
    
    return { success: true, url: downloadUrl };
  } catch (error) {
    console.error('프로필 이미지 업로드 오류:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : '프로필 이미지를 업로드하는 중 오류가 발생했습니다.' 
    };
  }
}; 