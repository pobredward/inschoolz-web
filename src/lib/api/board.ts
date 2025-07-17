import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  addDoc, 
  updateDoc, 
  query, 
  where, 
  orderBy, 
  limit, 
  increment,
  serverTimestamp,
  writeBatch,
  Timestamp,
  QueryDocumentSnapshot,
  DocumentData,
  arrayUnion,
  arrayRemove,
  deleteField
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { 
  Post, 
  Board,
  User
} from '@/types';
import { 
  BoardType,
  PopularPost,
  PostFormData,
  BoardFilterOptions
} from '@/types/board';
import { 
  getDocument, 
  getDocuments,
  getPaginatedDocuments,
  updateDocument,
  addDocument
} from '@/lib/firestore';
import { awardExperience } from '@/lib/experience';
import { 
  createPostCommentNotification, 
  createCommentReplyNotification 
} from './notifications';
import { serializeObject, serializeTimestamp } from '@/lib/utils';

// 게시판 목록 가져오기
export const getBoardsByType = async (type: BoardType) => {
  try {
    const boards = await getDocuments<Board>('boards', [
      where('type', '==', type),
      where('isActive', '==', true),
      orderBy('order', 'asc')
    ]);
    
    // Board 객체들의 Firebase Timestamp 직렬화
    return boards.map(board => serializeObject<Board>(board, ['createdAt', 'updatedAt']));
  } catch (error) {
    console.error('게시판 목록 가져오기 오류:', error);
    throw new Error('게시판 목록을 가져오는 중 오류가 발생했습니다.');
  }
};

// 즐겨찾는 게시판 목록 가져오기
export const getFavoriteBoards = async (userId: string, type: BoardType) => {
  try {
    const userDoc = await getDocument('users', userId);
    if (!userDoc || !(userDoc as any).favorites || !(userDoc as any).favorites.boards) {
      return [];
    }
    
    const boardCodes = (userDoc as any).favorites.boards[type] || [];
    
    if (boardCodes.length === 0) {
      return [];
    }
    
    return await getDocuments<Board>('boards', [
      where('code', 'in', boardCodes),
      where('isActive', '==', true),
      orderBy('order', 'asc')
    ]);
  } catch (error) {
    console.error('즐겨찾는 게시판 목록 가져오기 오류:', error);
    throw new Error('즐겨찾는 게시판 목록을 가져오는 중 오류가 발생했습니다.');
  }
};

// 인기 게시글 가져오기
export const getPopularPosts = async (type: BoardType, count = 5) => {
  try {
    return await getDocuments<PopularPost>('hottestPosts', [
      where('boardType', '==', type),
      orderBy('score', 'desc'),
      limit(count)
    ]);
  } catch (error) {
    console.error('인기 게시글 가져오기 오류:', error);
    throw new Error('인기 게시글을 가져오는 중 오류가 발생했습니다.');
  }
};

// 홈 화면용 인기 게시글 가져오기 (14일 내 조회수 기준)
export const getPopularPostsForHome = async (count = 10) => {
  try {
    // 14일 전 Timestamp 계산
    const fourteenDaysAgo = Timestamp.fromDate(new Date(Date.now() - (14 * 24 * 60 * 60 * 1000)));
    
    const constraints = [
      where('createdAt', '>=', fourteenDaysAgo),
      where('status.isDeleted', '==', false),
      where('status.isHidden', '==', false),
      where('type', '==', 'national'), // 전국 커뮤니티만
      orderBy('createdAt', 'desc'), // 최신순으로 정렬
      limit(count * 3) // 더 많은 게시글을 가져와서 클라이언트에서 필터링
    ];
    
    const posts = await getDocuments<Post>('posts', constraints);
    
    // 조회수 기준으로 정렬하고 상위 게시글만 선택 (클라이언트 사이드)
    const sortedPosts = posts
      .sort((a, b) => (b.stats?.viewCount || 0) - (a.stats?.viewCount || 0))
      .slice(0, count);
    
    // 게시판 정보 추가 - code 필드로 검색
    const postsWithBoardInfo = await Promise.all(
      sortedPosts.map(async (post) => {
        try {
          // boardCode로 게시판 찾기
          const boardQuery = query(
            collection(db, 'boards'),
            where('code', '==', post.boardCode),
            where('type', '==', 'national'),
            limit(1)
          );
          const boardSnapshot = await getDocs(boardQuery);
          
          let boardName = post.boardCode; // fallback
          if (!boardSnapshot.empty) {
            const boardData = boardSnapshot.docs[0].data();
            boardName = boardData.name || post.boardCode;
          }
          
          return {
            ...post,
            boardName,
            previewContent: post.content?.replace(/<[^>]*>/g, '').slice(0, 150) || ''
          };
        } catch (error) {
          console.warn(`게시판 정보 조회 실패: ${post.boardCode}`, error);
          return {
            ...post,
            boardName: post.boardCode,
            previewContent: post.content?.replace(/<[^>]*>/g, '').slice(0, 150) || ''
          };
        }
      })
    );
    
    return postsWithBoardInfo;
  } catch (error) {
    console.error('홈 화면 인기 게시글 가져오기 오류:', error);
    throw new Error('인기 게시글을 가져오는 중 오류가 발생했습니다.');
  }
};

// 특정 게시판의 게시글 목록 가져오기
export const getPostsByBoard = async (
  boardCode: string, 
  pageSize = 20, 
  lastDoc?: QueryDocumentSnapshot<DocumentData>,
  filterOptions?: BoardFilterOptions
) => {
  try {
    const constraints = [
      where('code', '==', boardCode),
      where('status.isDeleted', '==', false),
      where('status.isHidden', '==', false)
    ];
    
    // 검색 필터 적용
    if (filterOptions?.keyword) {
      // 검색 대상에 따라 쿼리 조건 설정
      if (filterOptions.searchTarget === 'title') {
        constraints.push(where('title', '>=', filterOptions.keyword));
        constraints.push(where('title', '<=', filterOptions.keyword + '\uf8ff'));
      } else if (filterOptions.searchTarget === 'content') {
        constraints.push(where('content', '>=', filterOptions.keyword));
        constraints.push(where('content', '<=', filterOptions.keyword + '\uf8ff'));
      } else if (filterOptions.searchTarget === 'author') {
        constraints.push(where('authorInfo.displayName', '>=', filterOptions.keyword));
        constraints.push(where('authorInfo.displayName', '<=', filterOptions.keyword + '\uf8ff'));
      }
    }
    
    // 이미지 첨부 필터링
    if (filterOptions?.hasImage) {
      constraints.push(where('imageUrls', '!=', []));
    }
    
    // 투표 필터링
    if (filterOptions?.hasPoll) {
      constraints.push(where('poll.isActive', '==', true));
    }
    
    // 시간 필터링
    if (filterOptions?.timeFilter && filterOptions.timeFilter !== 'all') {
      let timestamp: Date;
      const now = new Date();
      
      if (filterOptions.timeFilter === 'today') {
        timestamp = new Date(now.setHours(0, 0, 0, 0));
      } else if (filterOptions.timeFilter === 'week') {
        const day = now.getDay();
        timestamp = new Date(now.setDate(now.getDate() - day));
        timestamp.setHours(0, 0, 0, 0);
      } else if (filterOptions.timeFilter === 'month') {
        timestamp = new Date(now.getFullYear(), now.getMonth(), 1);
      } else {
        timestamp = new Date();
      }
      
      constraints.push(where('createdAt', '>=', Timestamp.fromDate(timestamp)));
    }
    
    // 정렬 방식
    let sortField = 'createdAt';
    const sortDirection = 'desc';
    
    if (filterOptions?.sortBy === 'popular') {
      sortField = 'stats.likeCount';
    } else if (filterOptions?.sortBy === 'comments') {
      sortField = 'stats.commentCount';
    } else if (filterOptions?.sortBy === 'views') {
      sortField = 'stats.viewCount';
    }
    
    // orderBy 조건들을 별도로 추가
    const orderConstraints = [
      orderBy('status.isPinned', 'desc'),
      orderBy(sortField, sortDirection as 'asc' | 'desc')
    ];
    
    return await getPaginatedDocuments<Post>('posts', [...constraints, ...orderConstraints], pageSize, lastDoc);
  } catch (error) {
    console.error('게시글 목록 가져오기 오류:', error);
    throw new Error('게시글 목록을 가져오는 중 오류가 발생했습니다.');
  }
};

// 게시글 상세 정보 가져오기
export const getPostDetail = async (postId: string) => {
  try {
    const post = await getDocument<Post>('posts', postId);
    
    if (!post) {
      throw new Error('게시글을 찾을 수 없습니다.');
    }
    
    // 게시글 조회수 업데이트
    await updateDocument('posts', postId, {
      'stats.viewCount': increment(1)
    });
    
    // 게시글 Timestamp 직렬화 - serializeObject 사용
    const serializedPost = serializeObject<Post>(post, ['createdAt', 'updatedAt', 'deletedAt']);
    
    // 댓글 가져오기 (이미 직렬화됨)
    const comments = await getCommentsByPost(postId);
    
    return { post: serializedPost, comments };
  } catch (error) {
    console.error('게시글 상세 정보 가져오기 오류:', error);
    throw new Error('게시글 정보를 가져오는 중 오류가 발생했습니다.');
  }
};

// 게시글에 달린 댓글 가져오기
export const getCommentsByPost = async (postId: string) => {
  try {
    const commentsRef = collection(db, 'posts', postId, 'comments');
    const q = query(
      commentsRef,
      where('parentId', '==', null),
      orderBy('createdAt', 'asc')
    );
    
    const querySnapshot = await getDocs(q);
    const comments: any[] = [];
    
    for (const commentDoc of querySnapshot.docs) {
      const commentData = commentDoc.data();
      const comment = { id: commentDoc.id, ...commentData } as any;
      
      // 삭제된 댓글이지만 대댓글이 없는 경우 건너뛰기
      if (comment.status.isDeleted && comment.content !== '삭제된 댓글입니다.') {
        continue;
      }
      
      // 사용자 정보 가져오기
      let authorInfo = {
        displayName: '사용자',
        profileImageUrl: '',
        isAnonymous: comment.isAnonymous
      };
      
      // 익명 댓글 처리
      if (comment.isAnonymous || !comment.authorId) {
        if (comment.anonymousAuthor?.nickname) {
          authorInfo.displayName = comment.anonymousAuthor.nickname;
        } else {
          authorInfo.displayName = '익명';
        }
        authorInfo.isAnonymous = true;
      } else if (!comment.status.isDeleted) {
        try {
          const userDocRef = doc(db, 'users', comment.authorId);
          const userDocSnap = await getDoc(userDocRef);
          if (userDocSnap.exists()) {
            const userData = userDocSnap.data();
            if (userData && userData.profile) {
              authorInfo = {
                displayName: userData.profile.userName || '사용자',
                profileImageUrl: userData.profile.profileImageUrl || '',
                isAnonymous: false
              };
            }
          }
        } catch (error) {
          console.error('사용자 정보 조회 오류:', error);
        }
      }
      
      // 대댓글 가져오기
      const repliesRef = collection(db, 'posts', postId, 'comments');
      const repliesQuery = query(
        repliesRef,
        where('parentId', '==', comment.id),
        orderBy('createdAt', 'asc')
      );
      
      const repliesSnapshot = await getDocs(repliesQuery);
      const replies = [];
      
      for (const replyDoc of repliesSnapshot.docs) {
        const replyData = replyDoc.data();
        const reply = { id: replyDoc.id, ...replyData } as any;
        
        // 삭제된 대댓글이지만 내용이 "삭제된 댓글입니다."가 아닌 경우 건너뛰기
        if (reply.status.isDeleted && reply.content !== '삭제된 댓글입니다.') {
          continue;
        }
        
        // 대댓글 작성자 정보 가져오기
        let replyAuthorInfo = {
          displayName: '사용자',
          profileImageUrl: '',
          isAnonymous: reply.isAnonymous
        };
        
        // 익명 대댓글 처리
        if (reply.isAnonymous || !reply.authorId) {
          if (reply.anonymousAuthor?.nickname) {
            replyAuthorInfo.displayName = reply.anonymousAuthor.nickname;
          } else {
            replyAuthorInfo.displayName = '익명';
          }
          replyAuthorInfo.isAnonymous = true;
        } else if (!reply.status.isDeleted) {
          try {
            const replyUserDocRef = doc(db, 'users', reply.authorId);
            const replyUserDocSnap = await getDoc(replyUserDocRef);
            if (replyUserDocSnap.exists()) {
              const replyUserData = replyUserDocSnap.data();
              if (replyUserData && replyUserData.profile) {
                replyAuthorInfo = {
                  displayName: replyUserData.profile.userName || '사용자',
                  profileImageUrl: replyUserData.profile.profileImageUrl || '',
                  isAnonymous: false
                };
              }
            }
          } catch (error) {
            console.error('대댓글 사용자 정보 조회 오류:', error);
          }
        }
        
        const serializedReply = serializeObject(reply, ['createdAt', 'updatedAt', 'deletedAt']) as any;
        replies.push({
          ...serializedReply,
          author: replyAuthorInfo,
        });
      }
      
      // 대댓글도 시간순으로 정렬
      replies.sort((a, b) => a.createdAt - b.createdAt);
      
      const serializedComment = serializeObject(comment, ['createdAt', 'updatedAt', 'deletedAt']) as any;
      comments.push({
        ...serializedComment,
        author: authorInfo,
        replies,
      });
    }
    
    // 모든 댓글을 시간순으로 확실히 정렬 (익명 댓글 포함)
    comments.sort((a, b) => a.createdAt - b.createdAt);
    
    return comments;
  } catch (error) {
    console.error('댓글 조회 오류:', error);
    throw new Error('댓글을 불러오는 중 오류가 발생했습니다.');
  }
};

// 게시글 작성하기
export const createPost = async (boardCode: string, boardType: BoardType, data: PostFormData, userId: string) => {
  try {
    // 사용자 정보 가져오기
    const userDoc = await getDocument('users', userId);
    
    if (!userDoc) {
      throw new Error('사용자 정보를 찾을 수 없습니다.');
    }
    
    // 게시글 데이터 생성
    const postData: Partial<Post> = {
      title: data.title,
      content: data.content,
      authorId: userId,
      boardCode: boardCode,
      type: boardType,
      attachments: [],
      tags: data.tags || [],
      stats: {
        viewCount: 0,
        likeCount: 0,
        commentCount: 0
      },
      status: {
        isDeleted: false,
        isHidden: false,
        isBlocked: false,
        isPinned: false
      },
      authorInfo: {
        displayName: data.isAnonymous ? '익명' : (userDoc as any).profile?.userName || '사용자',
        profileImageUrl: data.isAnonymous ? '' : (userDoc as any).profile?.profileImageUrl || '',
        isAnonymous: data.isAnonymous
      }
    };
    
    // 학교 또는 지역 정보 설정
    if (boardType === 'school' && (userDoc as any).school?.id) {
      postData.schoolId = (userDoc as any).school.id;
    } else if (boardType === 'regional' && (userDoc as any).regions) {
      postData.regions = {
        sido: (userDoc as any).regions.sido,
        sigungu: (userDoc as any).regions.sigungu
      };
    }
    
    // 투표 정보 설정
    if (data.poll && data.poll.question && data.poll.options.length > 1) {
      postData.poll = {
        isActive: true,
        question: data.poll.question,
        options: data.poll.options.map((option, index) => ({
          text: option.text,
          imageUrl: option.imageUrl,
          voteCount: 0,
          index
        })),
        expiresAt: data.poll.expiresAt ? data.poll.expiresAt.getTime() : undefined,
        multipleChoice: data.poll.multipleChoice
      };
    }
    
    // 게시글 저장
    const postId = await addDocument('posts', postData);
    
    // 게시판 게시글 수 증가
    await updateDocument('boards', boardCode, {
      'stats.postCount': increment(1)
    });
    
    // 사용자 게시글 수 증가
    await updateDocument('users', userId, {
      'stats.postCount': increment(1)
    });

    // 경험치 부여 로직 제거 - 프론트엔드에서 처리
    
    return postId;
  } catch (error) {
    console.error('게시글 작성 오류:', error);
    throw new Error('게시글을 작성하는 중 오류가 발생했습니다.');
  }
};

// 게시글 좋아요 토글
export const togglePostLike = async (postId: string, userId: string) => {
  try {
    // 좋아요 중복 체크
    const likeRef = doc(db, 'posts', postId, 'likes', userId);
    const likeDoc = await getDoc(likeRef);
    const batch = writeBatch(db);
    
    let isLiked = false;
    
    if (likeDoc.exists()) {
      // 좋아요 취소
      batch.delete(likeRef);
      // 게시글 좋아요 수 감소
      batch.update(doc(db, 'posts', postId), {
        'stats.likeCount': increment(-1)
      });
    } else {
      // 좋아요 추가
      batch.set(likeRef, {
        createdAt: serverTimestamp()
      });
      // 게시글 좋아요 수 증가
      batch.update(doc(db, 'posts', postId), {
        'stats.likeCount': increment(1)
      });
      isLiked = true;
    }
    
    await batch.commit();

    // 좋아요 추가 시에만 경험치 지급 (좋아요 취소는 경험치 지급하지 않음)
    if (isLiked) {
      try {
        const expResult = await awardExperience(userId, 'like');
        if (expResult.success && expResult.leveledUp) {
          console.log(`🎉 레벨업! ${expResult.oldLevel} → ${expResult.newLevel} (좋아요)`);
        }
      } catch (expError) {
        console.error('좋아요 경험치 지급 오류:', expError);
        // 경험치 지급 실패는 좋아요 자체를 실패로 처리하지 않음
      }
    }
    
    return isLiked;
  } catch (error) {
    console.error('좋아요 토글 오류:', error);
    throw new Error('좋아요 처리 중 오류가 발생했습니다.');
  }
};

// 댓글 작성하기
export const createComment = async (postId: string, content: string, userId: string, isAnonymous: boolean, parentId?: string) => {
  try {
    // 사용자 정보 가져오기
    const userDoc = await getDocument('users', userId);
    
    if (!userDoc) {
      throw new Error('사용자 정보를 찾을 수 없습니다.');
    }
    
    // 댓글 데이터 생성
    const commentData = {
      postId,
      content,
      authorId: userId,
      isAnonymous,
      parentId: parentId || null,
      stats: {
        likeCount: 0
      },
      status: {
        isDeleted: false,
        isBlocked: false
      }
    };
    
    // 댓글 저장
    const commentRef = collection(db, 'posts', postId, 'comments');
    const commentDoc = await addDoc(commentRef, {
      ...commentData,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    
    // 게시글 댓글 수 업데이트
    await updateDocument('posts', postId, {
      'stats.commentCount': increment(1)
    });
    
    // 사용자 댓글 수 업데이트
    await updateDocument('users', userId, {
      'stats.commentCount': increment(1)
    });

    // 알림 발송 로직
    try {
      // 게시글 정보 조회
      const postDoc = await getDocument('posts', postId) as any;
      
      if (postDoc && postDoc.authorId !== userId) {
        // 대댓글인 경우
        if (parentId) {
          // 부모 댓글 작성자에게 알림
          const parentCommentDoc = await getDoc(doc(db, 'posts', postId, 'comments', parentId));
          
          if (parentCommentDoc.exists()) {
            const parentCommentData = parentCommentDoc.data();
            const parentAuthorId = parentCommentData?.authorId;
            
            // 부모 댓글 작성자가 자기 자신이 아닌 경우 알림 발송
            if (parentAuthorId && parentAuthorId !== userId) {
              await createCommentReplyNotification(
                parentAuthorId,
                postId,
                postDoc.title || '제목 없음',
                parentId,
                isAnonymous ? '익명' : (userDoc as any).displayName || '사용자',
                content,
                commentDoc.id
              );
            }
          }
        } else {
          // 일반 댓글인 경우 - 게시글 작성자에게 알림
          await createPostCommentNotification(
            postDoc.authorId,
            userId,
            postId,
            commentDoc.id,
            postDoc.title || '제목 없음',
            content
          );
        }
      }
    } catch (notificationError) {
      // 알림 발송 실패는 댓글 작성을 방해하지 않음
      console.error('알림 발송 실패:', notificationError);
    }

    // 경험치 부여 로직 제거 - 프론트엔드에서 처리
    
    return commentDoc.id;
  } catch (error) {
    console.error('댓글 작성 오류:', error);
    throw new Error('댓글을 작성하는 중 오류가 발생했습니다.');
  }
};

// 게시판 즐겨찾기 토글
export const toggleBoardFavorite = async (boardCode: string, boardType: BoardType, userId: string) => {
  try {
    const userRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userRef);
    
    if (!userDoc.exists()) {
      throw new Error('사용자 정보를 찾을 수 없습니다.');
    }
    
    const userData = userDoc.data();
    const favorites = (userData as any).favorites?.boards || {};
    const boardCodes = favorites[boardType] || [];
    
    let isFavorite = false;
    
    if (boardCodes.includes(boardCode)) {
      // 즐겨찾기 해제
      await updateDoc(userRef, {
        [`favorites.boards.${boardType}`]: arrayRemove(boardCode)
      });
    } else {
      // 즐겨찾기 추가
      await updateDoc(userRef, {
        [`favorites.boards.${boardType}`]: arrayUnion(boardCode)
      });
      isFavorite = true;
    }
    
    return isFavorite;
  } catch (error) {
    console.error('게시판 즐겨찾기 토글 오류:', error);
    throw new Error('즐겨찾기 처리 중 오류가 발생했습니다.');
  }
}; 

// 댓글 수정하기
export const updateComment = async (postId: string, commentId: string, content: string, userId: string) => {
  try {
    const commentRef = doc(db, 'posts', postId, 'comments', commentId);
    const commentDoc = await getDoc(commentRef);
    
    if (!commentDoc.exists()) {
      throw new Error('댓글을 찾을 수 없습니다.');
    }
    
    const commentData = commentDoc.data();
    
    // 권한 체크 (작성자만 수정 가능)
    if (commentData.authorId !== userId) {
      throw new Error('댓글을 수정할 권한이 없습니다.');
    }
    
    await updateDoc(commentRef, {
      content,
      updatedAt: serverTimestamp()
    });
    
    return true;
  } catch (error) {
    console.error('댓글 수정 오류:', error);
    throw new Error('댓글을 수정하는 중 오류가 발생했습니다.');
  }
};

// 대댓글 존재 여부 확인
const hasReplies = async (postId: string, commentId: string): Promise<boolean> => {
  try {
    const repliesRef = collection(db, 'posts', postId, 'comments');
    const repliesQuery = query(
      repliesRef,
      where('parentId', '==', commentId),
      where('status.isDeleted', '==', false),
      limit(1)
    );
    
    const repliesSnapshot = await getDocs(repliesQuery);
    return !repliesSnapshot.empty;
  } catch (error) {
    console.error('대댓글 확인 오류:', error);
    return false;
  }
};

// 댓글 삭제하기
export const deleteComment = async (postId: string, commentId: string, userId: string) => {
  try {
    const commentRef = doc(db, 'posts', postId, 'comments', commentId);
    const commentDoc = await getDoc(commentRef);
    
    if (!commentDoc.exists()) {
      throw new Error('댓글을 찾을 수 없습니다.');
    }
    
    const commentData = commentDoc.data();
    
    // 권한 체크 (작성자만 삭제 가능)
    if (commentData.authorId !== userId) {
      throw new Error('댓글을 삭제할 권한이 없습니다.');
    }
    
    // 대댓글 존재 여부 확인
    const hasRepliesExist = await hasReplies(postId, commentId);
    
    if (hasRepliesExist) {
      // 대댓글이 있는 경우: 소프트 삭제 (내용만 변경)
      await updateDoc(commentRef, {
        content: '삭제된 댓글입니다.',
        status: {
          ...commentData.status,
          isDeleted: true
        },
        updatedAt: serverTimestamp()
      });
    } else {
      // 대댓글이 없는 경우: 실제 삭제
    await updateDoc(commentRef, {
      status: {
        ...commentData.status,
        isDeleted: true
      },
      updatedAt: serverTimestamp()
    });
    }
    
    // 게시글 댓글 수 감소
    await updateDocument('posts', postId, {
      'stats.commentCount': increment(-1)
    });
    
    // 사용자 댓글 수 감소
    await updateDocument('users', userId, {
      'stats.commentCount': increment(-1)
    });
    
    return true;
  } catch (error) {
    console.error('댓글 삭제 오류:', error);
    throw new Error('댓글을 삭제하는 중 오류가 발생했습니다.');
  }
};

// 댓글 좋아요 토글
export const toggleCommentLike = async (postId: string, commentId: string, userId: string) => {
  try {
    // 좋아요 중복 체크
    const likeRef = doc(db, 'posts', postId, 'comments', commentId, 'likes', userId);
    const likeDoc = await getDoc(likeRef);
    const batch = writeBatch(db);
    
    let isLiked = false;
    
    if (likeDoc.exists()) {
      // 좋아요 취소
      batch.delete(likeRef);
      // 댓글 좋아요 수 감소
      batch.update(doc(db, 'posts', postId, 'comments', commentId), {
        'stats.likeCount': increment(-1)
      });
    } else {
      // 좋아요 추가
      batch.set(likeRef, {
        createdAt: serverTimestamp()
      });
      // 댓글 좋아요 수 증가
      batch.update(doc(db, 'posts', postId, 'comments', commentId), {
        'stats.likeCount': increment(1)
      });
      isLiked = true;
    }
    
    await batch.commit();
    return isLiked;
  } catch (error) {
    console.error('댓글 좋아요 토글 오류:', error);
    throw new Error('좋아요 처리 중 오류가 발생했습니다.');
  }
};

// 댓글 신고하기 함수는 제거됨 - 통합 신고 시스템 사용 (reports.ts)

// 특정 게시판의 게시글 목록 가져오기 (커뮤니티 페이지용)
export const getPostsByBoardType = async (
  boardType: BoardType,
  boardCode: string,
  pageSize = 20,
  schoolId?: string,
  regions?: { sido: string; sigungu: string }
) => {
  try {
    const whereConstraints = [
      where('type', '==', boardType),
      where('boardCode', '==', boardCode),
      where('status.isDeleted', '==', false),
      where('status.isHidden', '==', false)
    ];
    
    // 학교 커뮤니티인 경우 schoolId 필터링 추가
    if (boardType === 'school' && schoolId) {
      whereConstraints.push(where('schoolId', '==', schoolId));
    }
    
    // 지역 커뮤니티인 경우 지역 필터링 추가
    if (boardType === 'regional' && regions?.sido && regions?.sigungu) {
      whereConstraints.push(where('regions.sido', '==', regions.sido));
      whereConstraints.push(where('regions.sigungu', '==', regions.sigungu));
    }
    
    // 전체 constraints 배열 구성
    const allConstraints = [
      ...whereConstraints,
      orderBy('status.isPinned', 'desc'),
      orderBy('createdAt', 'desc'),
      limit(pageSize)
    ];
    
    return await getDocuments<Post>('posts', allConstraints);
  } catch (error) {
    console.error('게시글 목록 가져오기 오류:', error);
    throw new Error('게시글 목록을 가져오는 중 오류가 발생했습니다.');
  }
};

// 모든 게시판의 게시글 가져오기 (커뮤니티 페이지용)
export const getAllPostsByType = async (
  boardType: BoardType,
  pageSize = 50
) => {
  try {
    const constraints = [
      where('type', '==', boardType),
      where('status.isDeleted', '==', false),
      where('status.isHidden', '==', false),
      orderBy('status.isPinned', 'desc'),
      orderBy('createdAt', 'desc'),
      limit(pageSize)
    ];
    
    return await getDocuments<Post>('posts', constraints);
  } catch (error) {
    console.error('전체 게시글 목록 가져오기 오류:', error);
    throw new Error('게시글 목록을 가져오는 중 오류가 발생했습니다.');
  }
};

// 학교별 게시글 가져오기 (유저의 메인 학교 기준)
export const getAllPostsBySchool = async (
  schoolId: string,
  pageSize = 50
) => {
  try {
    const constraints = [
      where('type', '==', 'school'),
      where('schoolId', '==', schoolId),
      where('status.isDeleted', '==', false),
      where('status.isHidden', '==', false),
      orderBy('status.isPinned', 'desc'),
      orderBy('createdAt', 'desc'),
      limit(pageSize)
    ];
    
    return await getDocuments<Post>('posts', constraints);
  } catch (error) {
    console.error('학교별 게시글 목록 가져오기 오류:', error);
    throw new Error('학교별 게시글 목록을 가져오는 중 오류가 발생했습니다.');
  }
};

// 지역별 게시글 가져오기 (유저의 지역 기준)
export const getAllPostsByRegion = async (
  sido: string,
  sigungu: string,
  pageSize = 50
) => {
  try {
    const constraints = [
      where('type', '==', 'regional'),
      where('regions.sido', '==', sido),
      where('regions.sigungu', '==', sigungu),
      where('status.isDeleted', '==', false),
      where('status.isHidden', '==', false),
      orderBy('status.isPinned', 'desc'),
      orderBy('createdAt', 'desc'),
      limit(pageSize)
    ];
    
    return await getDocuments<Post>('posts', constraints);
  } catch (error) {
    console.error('지역별 게시글 목록 가져오기 오류:', error);
    throw new Error('지역별 게시글 목록을 가져오는 중 오류가 발생했습니다.');
  }
};

// 게시글 수정
export const updatePost = async (postId: string, data: PostFormData) => {
  try {
    // 게시글 정보 가져오기
    const postDoc = await getDocument('posts', postId);
    
    if (!postDoc) {
      throw new Error('게시글을 찾을 수 없습니다.');
    }
    
    // 수정할 데이터 준비
    const updateData: any = {
      title: data.title,
      content: data.content,
      tags: data.tags || [],
      updatedAt: serverTimestamp(),
      'authorInfo.isAnonymous': data.isAnonymous
    };
    
    // 익명 설정에 따른 작성자 정보 업데이트
    if (data.isAnonymous) {
      updateData['authorInfo.displayName'] = '익명';
      updateData['authorInfo.profileImageUrl'] = '';
    } else {
      // 사용자 정보 다시 가져오기
      const userDoc = await getDocument('users', (postDoc as any).authorId);
      if (userDoc) {
        updateData['authorInfo.displayName'] = (userDoc as any).profile?.userName || '사용자';
        updateData['authorInfo.profileImageUrl'] = (userDoc as any).profile?.profileImageUrl || '';
      }
    }
    
    // 투표 정보 업데이트
    if (data.poll && data.poll.question && data.poll.options && data.poll.options.length > 1) {
      const pollData: any = {
        isActive: true,
        question: data.poll.question,
        options: data.poll.options.map((option, index) => ({
          text: option.text,
          imageUrl: option.imageUrl || '', // undefined 대신 빈 문자열
          voteCount: 0,
          index
        })),
        multipleChoice: data.poll.multipleChoice || false
      };
      
      // expiresAt이 있을 때만 추가 (undefined 방지)
      if (data.poll.expiresAt) {
        pollData.expiresAt = data.poll.expiresAt.getTime();
      }
      
      updateData.poll = pollData;
    } else {
      // 투표 정보 제거 - undefined 대신 deleteField() 사용
      updateData.poll = deleteField();
    }
    
    // undefined 값들을 제거하는 함수
    const removeUndefined = (obj: any): any => {
      const cleaned: any = {};
      for (const [key, value] of Object.entries(obj)) {
        if (value !== undefined) {
          if (value && typeof value === 'object' && !Array.isArray(value) && 
              !(value as any).toDate && typeof (value as any).delete !== 'function') {
            const cleanedNested = removeUndefined(value);
            if (Object.keys(cleanedNested).length > 0) {
              cleaned[key] = cleanedNested;
            }
          } else {
            cleaned[key] = value;
          }
        }
      }
      return cleaned;
    };
    
    // undefined 값 제거
    const cleanedUpdateData = removeUndefined(updateData);
    
    // 게시글 업데이트
    await updateDocument('posts', postId, cleanedUpdateData);
    
    return postId;
  } catch (error) {
    console.error('게시글 수정 오류:', error);
    throw new Error('게시글을 수정하는 중 오류가 발생했습니다.');
  }
};

// 게시글 북마크/스크랩 토글
export const togglePostBookmark = async (postId: string, userId: string) => {
  try {
    // 사용자 문서에서 스크랩 목록 가져오기
    const userDoc = await getDocument('users', userId);
    if (!userDoc) {
      throw new Error('사용자를 찾을 수 없습니다.');
    }
    
    const userData = userDoc as User & { scraps?: string[] };
    const scraps = userData.scraps || [];
    const isBookmarked = scraps.includes(postId);
    
    let updatedScraps: string[];
    
    if (isBookmarked) {
      // 북마크 제거
      updatedScraps = scraps.filter((id: string) => id !== postId);
    } else {
      // 북마크 추가
      updatedScraps = [...scraps, postId];
    }
    
    // 사용자 문서 업데이트
    await updateDocument('users', userId, {
      scraps: updatedScraps,
      updatedAt: serverTimestamp()
    });
    
    return !isBookmarked; // 새로운 북마크 상태 반환
  } catch (error) {
    console.error('게시글 북마크 토글 오류:', error);
    throw new Error('북마크 처리 중 오류가 발생했습니다.');
  }
};

// 사용자가 북마크한 게시글 목록 가져오기
export const getBookmarkedPosts = async (userId: string) => {
  try {
    // 사용자 문서에서 스크랩 목록 가져오기
    const userDoc = await getDocument('users', userId);
    if (!userDoc) {
      return [];
    }
    
    const userData = userDoc as User & { scraps?: string[] };
    const scraps = userData.scraps || [];
    
    if (scraps.length === 0) {
      return [];
    }
    
    // 스크랩한 게시글들 가져오기
    const posts = [];
    for (const postId of scraps) {
      try {
        const post = await getDocument('posts', postId);
        if (post && !(post as any).status?.isDeleted) {
          posts.push(post);
        }
      } catch (error) {
        console.warn(`게시글 ${postId} 조회 실패:`, error);
      }
    }
    
    // 최신순으로 정렬
    return posts.sort((a: any, b: any) => b.createdAt - a.createdAt);
  } catch (error) {
    console.error('북마크 목록 조회 오류:', error);
    throw new Error('북마크 목록을 가져오는 중 오류가 발생했습니다.');
  }
};

// 사용자가 북마크한 게시글 개수 가져오기
export const getBookmarkedPostsCount = async (userId: string): Promise<number> => {
  try {
    // 사용자 문서에서 스크랩 목록 가져오기
    const userDoc = await getDocument('users', userId);
    if (!userDoc) {
      return 0;
    }
    
    const userData = userDoc as User & { scraps?: string[] };
    const scraps = userData.scraps || [];
    
    if (scraps.length === 0) {
      return 0;
    }
    
    // 유효한 게시글 개수 확인
    let validCount = 0;
    for (const postId of scraps) {
      try {
        const post = await getDocument('posts', postId);
        if (post && !(post as any).status?.isDeleted) {
          validCount++;
        }
      } catch (error) {
        console.warn(`게시글 ${postId} 조회 실패:`, error);
      }
    }
    
    return validCount;
  } catch (error) {
    console.error('북마크 개수 조회 오류:', error);
    return 0;
  }
};