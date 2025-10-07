import FirebaseService from './firebase-service';

// OpenAI 타입 정의
interface OpenAIMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface OpenAIResponse {
  choices: Array<{
    message: {
      content: string;
    };
  }>;
}

interface Bot {
  uid: string;
  nickname: string;
  profileImage?: string;
  schoolId: string;
  schoolName: string;
}

interface Post {
  id: string;
  title: string;
  content: string;
  authorId: string;
  authorNickname: string;
  schoolId: string;
  schoolName: string;
  commentCount: number;
  createdAt: FirebaseFirestore.Timestamp | Date;
  fake?: boolean;
}

interface Comment {
  id: string;
  content: string;
  authorId: string;
  authorNickname: string;
  isReply?: boolean;
  parentCommentId?: string;
  fake?: boolean;
}

interface ProgressCallback {
  (current: number, total: number, message?: string): void;
}

/**
 * AI 댓글 생성 및 관리 서비스
 * 루트 스크립트의 comment-generator.js 로직을 통합
 */
export class CommentService {
  private firebaseService: FirebaseService;
  private db: FirebaseFirestore.Firestore;
  private FieldValue: typeof FirebaseFirestore.FieldValue;

  // 댓글 유형별 설정
  private commentTypes = {
    own_post: {
      probability: 0.3, // 30% 확률로 본인 글에 댓글
      styles: ['추가설명', '감사인사', '정정', '업데이트']
    },
    others_post: {
      probability: 0.7, // 70% 확률로 타인 글에 댓글
      styles: ['공감', '질문', '경험공유', '조언', '반박', '칭찬']
    },
    reply: {
      probability: 0.4, // 40% 확률로 대댓글
      styles: ['동의', '반박', '추가질문', '감사', '농담']
    }
  };

  constructor() {
    this.firebaseService = FirebaseService.getInstance();
    this.db = this.firebaseService.getFirestore();
    this.FieldValue = this.firebaseService.getFieldValue();
  }

  /**
   * 학교 유형 판별
   */
  private getSchoolType(schoolName: string): 'elementary' | 'middle' | 'high' {
    if (schoolName.includes('초등학교') || schoolName.includes('초교')) {
      return 'elementary';
    } else if (schoolName.includes('중학교') || schoolName.includes('중교')) {
      return 'middle';
    } else {
      return 'high';
    }
  }

  /**
   * 댓글을 달 게시글 선택 (스마트 선택)
   */
  private async selectPostsForComments(
    schoolLimit: number = 5, 
    commentsPerSchool: number = 3
  ): Promise<Post[]> {
    try {
      console.log('📝 댓글을 달 게시글 선택 중...');

      // 1단계: 봇이 있는 학교들 조회
      const botsQuery = await this.db
        .collection('users')
        .where('fake', '==', true)
        .get();

      if (botsQuery.empty) {
        console.log('❌ 봇 계정이 없습니다.');
        return [];
      }

      const schoolsWithBots = new Set<string>();
      botsQuery.docs.forEach(doc => {
        const data = doc.data();
        if (data.schoolId) {
          schoolsWithBots.add(data.schoolId);
        }
      });

      console.log(`📊 봇이 있는 학교: ${schoolsWithBots.size}개`);
      console.log(`🔍 봇이 있는 학교 ID들:`, Array.from(schoolsWithBots).slice(0, 5));

      // 2단계: 봇이 있는 학교의 게시글 조회 (댓글이 적은 순으로 우선)
      const selectedPosts: Post[] = [];
      const schoolIds = Array.from(schoolsWithBots).slice(0, schoolLimit);

      for (const schoolId of schoolIds) {
        try {
          console.log(`🔍 ${schoolId} 학교의 게시글 조회 중...`);
          
          // 해당 학교의 게시글 조회 (최근 3일 이내, 댓글 수 고려)
          const threeDaysAgo = new Date();
          threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
          
          const postsQuery = await this.db
            .collection('posts')
            .where('schoolId', '==', schoolId)
            .where('createdAt', '>=', threeDaysAgo)
            .where('status.isDeleted', '==', false)
            .orderBy('createdAt', 'desc')
            .limit(20) // 더 많은 후보 중에서 선택
            .get();

          console.log(`   📝 ${schoolId} 학교 게시글 수: ${postsQuery.docs.length}개`);

          if (!postsQuery.empty) {
            const posts: Post[] = [];
            postsQuery.docs.forEach(doc => {
              const data = doc.data();
              posts.push({
                id: doc.id,
                title: data.title,
                content: data.content,
                authorId: data.authorId,
                authorNickname: data.authorNickname,
                schoolId: data.schoolId,
                schoolName: data.schoolName || '알 수 없는 학교',
                commentCount: data.stats?.commentCount || 0,
                createdAt: data.createdAt,
                fake: data.fake || false
              });
            });

            // 댓글이 적고 최근 게시글 우선 선택 (0-3개 댓글인 게시글 선호)
            const suitablePosts = posts.filter(post => (post.commentCount || 0) <= 3);
            const postsToSelect = suitablePosts.length > 0 ? suitablePosts : posts.slice(0, 10);
            
            // 댓글 수와 시간을 고려한 스코어링
            const scoredPosts = postsToSelect.map(post => {
              const commentScore = Math.max(1, 4 - (post.commentCount || 0)); // 댓글 적을수록 높은 점수
              const timeScore = post.createdAt ? 1 : 0.5; // 최근 게시글 선호
              return {
                ...post,
                score: commentScore * timeScore
              };
            });
            
            // 스코어 기반 정렬 후 선택
            scoredPosts.sort((a, b) => b.score - a.score);
            const selectedFromSchool = scoredPosts.slice(0, Math.min(commentsPerSchool, scoredPosts.length));
            selectedPosts.push(...selectedFromSchool);
          }
        } catch (error) {
          console.warn(`학교 ${schoolId} 게시글 조회 실패:`, error);
        }
      }

      console.log(`📊 선택된 게시글: ${selectedPosts.length}개`);
      return selectedPosts;

    } catch (error) {
      console.error('게시글 선택 실패:', error);
      return [];
    }
  }

  /**
   * OpenAI API 호출 (간단한 fetch 구현)
   */
  private async callOpenAI(messages: OpenAIMessage[]): Promise<string> {
    try {
      const openaiApiKey = process.env.OPENAI_API_KEY;
      
      if (!openaiApiKey) {
        throw new Error('OpenAI API 키가 설정되지 않았습니다.');
      }

      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${openaiApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-3.5-turbo',
          messages,
          max_tokens: 150,
          temperature: 0.8
        })
      });

      if (!response.ok) {
        throw new Error(`OpenAI API 오류: ${response.statusText}`);
      }

      const data: OpenAIResponse = await response.json();
      return data.choices[0].message.content.trim();

    } catch (error) {
      console.error('OpenAI API 호출 실패:', error);
      throw error;
    }
  }

  /**
   * GPT를 이용한 대댓글 생성
   */
  private async generateReplyComment(
    post: Post,
    commenter: Bot,
    parentComment: Comment,
    existingComments: Comment[] = []
  ): Promise<string> {
    try {
      const schoolType = this.getSchoolType(post.schoolName);
      const style = this.commentTypes.reply.styles[Math.floor(Math.random() * this.commentTypes.reply.styles.length)];
      
      // 해당 댓글의 기존 대댓글들 조회
      const existingReplies = await this.getRepliesForComment(parentComment.id);
      
      // 전체 댓글 맥락 구성
      const allCommentsText = existingComments.length > 0 
        ? existingComments.map(c => `- ${c.authorNickname}: ${c.content}`).join('\n')
        : '아직 댓글이 없음';
        
      // 해당 댓글의 기존 대댓글들
      const repliesText = existingReplies.length > 0
        ? existingReplies.map(r => `  └ ${r.authorNickname}: ${r.content}`).join('\n')
        : '아직 대댓글이 없음';

      const prompt = `
당신은 ${schoolType === 'elementary' ? '초등학생' : schoolType === 'middle' ? '중학생' : '고등학생'}입니다.
닉네임: ${commenter.nickname}
학교: ${post.schoolName}

다음 게시글의 댓글에 대댓글을 작성해주세요:

**게시글 제목**: ${post.title}
**게시글 내용**: ${post.content}

**답글을 달 댓글**:
작성자: ${parentComment.authorNickname}
내용: ${parentComment.content}

**전체 댓글 맥락**:
${allCommentsText}

**이 댓글에 달린 기존 대댓글들**:
${repliesText}

**대댓글 스타일**: ${style}

**작성 가이드라인**:
${this.getCommentGuidelines(schoolType, style)}

**중요 규칙**:
- 1-2줄로 간단하게 작성
- 자연스러운 학생 말투 사용
- ${parentComment.authorNickname}님의 댓글에 대한 응답으로 작성
- 기존 대댓글들과 중복되지 않게 작성
- 이미 나온 의견이면 다른 관점에서 접근
- 구체적인 개인정보나 실명 언급 금지
- 부적절한 내용 금지
- 대댓글 체인의 흐름을 고려하여 자연스럽게 작성

대댓글만 작성해주세요:`;

      const messages: OpenAIMessage[] = [
        {
          role: 'system',
          content: '당신은 자연스러운 학생 댓글을 작성하는 AI입니다. 주어진 가이드라인에 따라 적절한 대댓글을 작성해주세요.'
        },
        {
          role: 'user',
          content: prompt
        }
      ];

      return await this.callOpenAI(messages);

    } catch (error) {
      console.error('대댓글 생성 실패:', error);
      throw error;
    }
  }

  /**
   * GPT를 이용한 댓글 생성
   */
  private async generateComment(
    post: Post, 
    commenter: Bot, 
    commentType: string, 
    existingComments: Comment[] = []
  ): Promise<string> {
    try {
      const schoolType = this.getSchoolType(post.schoolName);
      const isOwnPost = post.authorId === commenter.uid;
      
      // 댓글 스타일 결정
      let style: string, context: string;
      if (isOwnPost) {
        style = this.commentTypes.own_post.styles[Math.floor(Math.random() * this.commentTypes.own_post.styles.length)];
        context = '본인이 작성한 게시글';
      } else {
        style = this.commentTypes.others_post.styles[Math.floor(Math.random() * this.commentTypes.others_post.styles.length)];
        context = '다른 사람이 작성한 게시글';
      }

      // 기존 댓글들 요약
      const existingCommentsText = existingComments.length > 0 
        ? existingComments.map(c => `- ${c.authorNickname}: ${c.content}`).join('\n')
        : '아직 댓글이 없음';

      const prompt = `
당신은 ${schoolType === 'elementary' ? '초등학생' : schoolType === 'middle' ? '중학생' : '고등학생'}입니다.
닉네임: ${commenter.nickname}
학교: ${post.schoolName}

다음 게시글에 댓글을 작성해주세요:

**게시글 제목**: ${post.title}
**게시글 내용**: ${post.content}
**작성자**: ${post.authorNickname}
**상황**: ${context}

**기존 댓글들**:
${existingCommentsText}

**댓글 스타일**: ${style}

**작성 가이드라인**:
${this.getCommentGuidelines(schoolType, style)}

**중요 규칙**:
- 1-2줄로 간단하게 작성
- 자연스러운 학생 말투 사용
- 게시글 내용과 관련된 댓글만 작성
- 기존 댓글과 중복되지 않게 작성
- 구체적인 개인정보나 실명 언급 금지
- 부적절한 내용 금지

댓글만 작성해주세요:`;

      const messages: OpenAIMessage[] = [
        {
          role: 'system',
          content: '당신은 자연스러운 학생 댓글을 작성하는 AI입니다. 간단하고 자연스러운 댓글을 작성해주세요.'
        },
        {
          role: 'user',
          content: prompt
        }
      ];

      const comment = await this.callOpenAI(messages);
      
      // 댓글 길이 제한 (너무 길면 자르기)
      const maxLength = 200;
      return comment.length > maxLength ? comment.substring(0, maxLength) + '...' : comment;

    } catch (error) {
      console.error('댓글 생성 실패:', error);
      // 기본 댓글 반환
      const defaultComments = [
        '좋은 글이네요!',
        '공감해요 ㅎㅎ',
        '저도 비슷한 경험 있어요',
        '재밌네요!',
        '정보 감사합니다'
      ];
      return defaultComments[Math.floor(Math.random() * defaultComments.length)];
    }
  }

  /**
   * 학교 유형별 댓글 가이드라인
   */
  private getCommentGuidelines(
    schoolType: 'elementary' | 'middle' | 'high', 
    style: string
  ): string {
    const baseGuidelines = {
      elementary: {
        추가설명: '게시글에 빠진 내용을 귀엽게 추가 설명',
        감사인사: '댓글 달아준 친구들에게 고마워하는 마음 표현',
        공감: '와! 저도요! 같은 느낌으로 공감 표현',
        질문: '궁금한 것을 순수하게 질문',
        경험공유: '비슷한 경험을 간단하게 공유',
        칭찬: '친구를 칭찬하는 따뜻한 말'
      },
      middle: {
        추가설명: '게시글 내용에 대한 추가 정보나 설명',
        감사인사: '댓글에 대한 감사 표현',
        공감: '완전 공감이에요, 저도 그래요 스타일',
        질문: '구체적이고 실용적인 질문',
        경험공유: '자신의 경험을 구체적으로 공유',
        반박: '다른 의견을 정중하게 표현',
        조언: '도움이 될 만한 조언 제공'
      },
      high: {
        추가설명: '게시글의 부족한 부분을 보완하는 설명',
        감사인사: '진심어린 감사 표현',
        공감: '깊이 있는 공감과 이해 표현',
        질문: '심도 있는 질문이나 토론 유도',
        경험공유: '자세한 경험담과 교훈 공유',
        반박: '논리적이고 건설적인 반박',
        조언: '실질적이고 도움되는 조언'
      }
    };

    return baseGuidelines[schoolType][style as keyof typeof baseGuidelines[typeof schoolType]] || '자연스럽고 친근한 댓글 작성';
  }

  /**
   * 댓글 생성 및 저장
   */
  private async createComment(
    postId: string, 
    commentContent: string, 
    commenter: Bot, 
    parentCommentId?: string
  ): Promise<string> {
    try {
      const commentData = {
        postId,
        content: commentContent,
        authorId: commenter.uid,
        authorNickname: commenter.nickname,
        authorInfo: {
          displayName: commenter.nickname,
          profileImageUrl: commenter.profileImage || '',
          isAnonymous: false
        },
        parentId: parentCommentId || null, // types/index.ts의 Comment 인터페이스에 맞춤
        isAnonymous: false,
        stats: {
          likeCount: 0,
          replyCount: 0
        },
        status: {
          isDeleted: false,
          isHidden: false,
          isBlocked: false
        },
        fake: true, // AI 생성 댓글 표시
        createdAt: this.FieldValue.serverTimestamp(),
        updatedAt: this.FieldValue.serverTimestamp()
      };

      // 댓글 저장
      const commentRef = await this.db.collection('comments').add(commentData);
      
      // 게시글의 댓글 수 증가
      await this.db.collection('posts').doc(postId).update({
        'stats.commentCount': this.FieldValue.increment(1),
        updatedAt: this.FieldValue.serverTimestamp()
      });

      // 대댓글인 경우 부모 댓글의 대댓글 수 증가
      if (parentCommentId) {
        await this.db.collection('comments').doc(parentCommentId).update({
          'stats.replyCount': this.FieldValue.increment(1),
          updatedAt: this.FieldValue.serverTimestamp()
        });
      }

      console.log(`✅ 댓글 생성: ${commenter.nickname} → "${commentContent.substring(0, 30)}..."`);
      return commentRef.id;

    } catch (error) {
      console.error('댓글 저장 실패:', error);
      throw error;
    }
  }

  /**
   * 학교의 봇들 조회
   */
  private async getSchoolBots(schoolId: string): Promise<Bot[]> {
    try {
      const botsQuery = await this.db
        .collection('users')
        .where('fake', '==', true)
        .where('schoolId', '==', schoolId)
        .get();

      const bots: Bot[] = [];
      botsQuery.docs.forEach(doc => {
        const data = doc.data();
        bots.push({
          uid: doc.id,
          nickname: data.profile?.userName || data.nickname,
          profileImage: data.profile?.profileImageUrl || '',
          schoolId: data.schoolId,
          schoolName: data.schoolName
        });
      });

      return bots;
    } catch (error) {
      console.error('봇 조회 실패:', error);
      return [];
    }
  }

  /**
   * 기존 댓글들 조회 (계층 구조 고려)
   */
  private async getExistingComments(postId: string): Promise<Comment[]> {
    try {
      const commentsQuery = await this.db
        .collection('comments')
        .where('postId', '==', postId)
        .where('status.isDeleted', '==', false)
        .orderBy('createdAt', 'asc')
        .limit(20) // 더 많은 댓글 조회
        .get();

      const comments: Comment[] = [];
      commentsQuery.docs.forEach(doc => {
        const data = doc.data();
        comments.push({
          id: doc.id,
          content: data.content,
          authorId: data.authorId,
          authorNickname: data.authorNickname,
          isReply: !!data.parentId, // parentId가 있으면 대댓글
          parentCommentId: data.parentId,
          fake: data.fake || false
        });
      });

      return comments;
    } catch (error) {
      console.error('댓글 조회 실패:', error);
      return [];
    }
  }

  /**
   * 특정 댓글의 모든 대댓글 조회
   */
  private async getRepliesForComment(commentId: string): Promise<Comment[]> {
    try {
      const repliesQuery = await this.db
        .collection('comments')
        .where('parentId', '==', commentId)
        .where('status.isDeleted', '==', false)
        .orderBy('createdAt', 'asc')
        .get();

      const replies: Comment[] = [];
      repliesQuery.docs.forEach(doc => {
        const data = doc.data();
        replies.push({
          id: doc.id,
          content: data.content,
          authorId: data.authorId,
          authorNickname: data.authorNickname,
          isReply: true,
          parentCommentId: data.parentId,
          fake: data.fake || false
        });
      });

      return replies;

    } catch (error) {
      console.error('대댓글 조회 실패:', error);
      return [];
    }
  }

  /**
   * 댓글 생성 메인 로직
   */
  public async generateCommentsForPosts(
    schoolLimit: number = 5, 
    commentsPerSchool: number = 3, 
    maxCommentsPerPost: number = 2,
    onProgress?: ProgressCallback
  ): Promise<number> {
    try {
      console.log('💬 AI 댓글 생성 시작...');
      console.log(`📊 설정: ${schoolLimit}개 학교, 학교당 ${commentsPerSchool}개 게시글, 게시글당 최대 ${maxCommentsPerPost}개 댓글\n`);

      // 1단계: 댓글을 달 게시글 선택
      const selectedPosts = await this.selectPostsForComments(schoolLimit, commentsPerSchool);
      
      if (selectedPosts.length === 0) {
        console.log('❌ 댓글을 달 게시글이 없습니다.');
        return 0;
      }

      let totalCommentsGenerated = 0;
      const totalPosts = selectedPosts.length;

      // 2단계: 각 게시글에 댓글 생성
      for (let postIndex = 0; postIndex < selectedPosts.length; postIndex++) {
        const post = selectedPosts[postIndex];
        
        try {
          console.log(`\n📝 "${post.title}" (${post.schoolName}) 처리 중...`);

          // 해당 학교의 봇들 조회
          const schoolBots = await this.getSchoolBots(post.schoolId);
          if (schoolBots.length === 0) {
            console.warn(`⚠️ ${post.schoolName}에 봇이 없습니다.`);
            continue;
          }

          // 기존 댓글들 조회
          const existingComments = await this.getExistingComments(post.id);
          
          // 댓글을 달 봇 선택 (작성자 포함 가능)
          const availableBots = schoolBots.filter(bot => 
            // 이미 댓글을 단 봇은 제외 (중복 방지)
            !existingComments.some(comment => comment.authorId === bot.uid)
          );

          if (availableBots.length === 0) {
            console.log(`   ⚠️ 댓글을 달 수 있는 봇이 없습니다.`);
            continue;
          }

          // 랜덤하게 1-2개 댓글 생성
          const commentsToGenerate = Math.min(
            Math.floor(Math.random() * maxCommentsPerPost) + 1,
            availableBots.length
          );

          // 봇들을 랜덤하게 섞어서 선택
          const shuffledBots = availableBots.sort(() => Math.random() - 0.5);
          const selectedBots = shuffledBots.slice(0, commentsToGenerate);

          for (const bot of selectedBots) {
            try {
              // 실시간으로 최신 댓글들 다시 조회 (새로 생성된 댓글 반영)
              const currentComments = await this.getExistingComments(post.id);
              
              // 대댓글 생성 여부 결정 (40% 확률)
              const shouldCreateReply = Math.random() < this.commentTypes.reply.probability && currentComments.length > 0;
              
              let commentContent: string;
              let parentCommentId: string | undefined;
              
              if (shouldCreateReply) {
                // 대댓글 생성
                const parentComment = currentComments[Math.floor(Math.random() * currentComments.length)];
                parentCommentId = parentComment.id;
                commentContent = await this.generateReplyComment(post, bot, parentComment, currentComments);
              } else {
                // 일반 댓글 생성
                commentContent = await this.generateComment(post, bot, 'comment', currentComments);
              }
              
              // 댓글 저장
              await this.createComment(post.id, commentContent, bot, parentCommentId);
              totalCommentsGenerated++;

              // 자연스러운 시간차 생성 (1-5분 랜덤)
              const naturalDelay = Math.random() * (300000 - 60000) + 60000; // 1-5분
              await new Promise(resolve => setTimeout(resolve, Math.min(naturalDelay, 3000))); // 개발 시에는 최대 3초로 제한

            } catch (commentError) {
              console.error(`댓글 생성 실패 (${bot.nickname}):`, commentError);
            }
          }

          console.log(`   ✅ ${commentsToGenerate}개 댓글 생성 완료`);

          // 진행률 콜백 호출
          if (onProgress) {
            onProgress(postIndex + 1, totalPosts, `게시글 처리 중... (${postIndex + 1}/${totalPosts})`);
          }

        } catch (postError) {
          console.error(`게시글 처리 실패 (${post.title}):`, postError);
        }
      }

      console.log(`\n🎉 댓글 생성 완료!`);
      console.log(`📊 총 ${totalCommentsGenerated}개 댓글 생성됨`);
      
      return totalCommentsGenerated;

    } catch (error) {
      console.error('댓글 생성 프로세스 실패:', error);
      throw error;
    }
  }

  /**
   * 랜덤 게시글들에 댓글 생성 (배치 처리용)
   */
  public async generateCommentsForRandomPosts(
    commentCount: number,
    onProgress?: ProgressCallback
  ): Promise<number> {
    try {
      console.log(`💬 랜덤 게시글들에 ${commentCount}개 댓글 생성 시작...`);

      // 댓글이 필요한 게시글들 조회 (댓글 수가 적은 순으로)
      const postsQuery = await this.db
        .collection('posts')
        .where('boardCode', '==', 'free')
        .orderBy('stats.commentCount', 'asc')
        .limit(commentCount * 2) // 여유분 확보
        .get();

      if (postsQuery.empty) {
        throw new Error('댓글을 달 게시글이 없습니다.');
      }

      const availablePosts = postsQuery.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as (Post & { id: string })[];

      let generatedCount = 0;

      for (let i = 0; i < commentCount && i < availablePosts.length; i++) {
        try {
          const post = availablePosts[i];
          
          // 해당 학교의 봇들 조회
          const schoolBots = await this.getSchoolBots(post.schoolId);
          if (schoolBots.length === 0) {
            console.warn(`${post.schoolName}에 봇이 없습니다.`);
            continue;
          }

          // 기존 댓글들 조회
          const existingComments = await this.getExistingComments(post.id);
          
          // 댓글을 달 수 있는 봇 선택 (중복 방지)
          const availableBots = schoolBots.filter(bot => 
            !existingComments.some(comment => comment.authorId === bot.uid)
          );

          if (availableBots.length === 0) {
            console.warn(`게시글 ${post.id}에 댓글을 달 수 있는 봇이 없습니다.`);
            continue;
          }

          // 랜덤하게 봇 선택
          const randomBot = availableBots[Math.floor(Math.random() * availableBots.length)];
          
          // 실시간으로 최신 댓글들 다시 조회 (새로 생성된 댓글 반영)
          const currentComments = await this.getExistingComments(post.id);
          
          // 대댓글 생성 여부 결정 (40% 확률)
          const shouldCreateReply = Math.random() < this.commentTypes.reply.probability && currentComments.length > 0;
          
          let commentContent: string;
          let parentCommentId: string | undefined;
          
          if (shouldCreateReply) {
            // 대댓글 생성
            const parentComment = currentComments[Math.floor(Math.random() * currentComments.length)];
            parentCommentId = parentComment.id;
            commentContent = await this.generateReplyComment(post as Post, randomBot, parentComment, currentComments);
          } else {
            // 일반 댓글 생성
            commentContent = await this.generateComment(
              post as Post, 
              randomBot, 
              'comment', 
              currentComments
            );
          }
          
          // 댓글 저장
          await this.createComment(post.id, commentContent, randomBot, parentCommentId);
          generatedCount++;

          if (onProgress) {
            onProgress(i + 1, commentCount, `댓글 생성 중... (${i + 1}/${commentCount})`);
          }

          // 딜레이 (API 부하 방지)
          await new Promise(resolve => setTimeout(resolve, 1000));

        } catch (commentError) {
          console.error(`댓글 생성 실패:`, commentError);
        }
      }

      console.log(`✅ ${generatedCount}개 댓글 생성 완료`);
      return generatedCount;

    } catch (error) {
      console.error('랜덤 댓글 생성 실패:', error);
      throw error;
    }
  }

  /**
   * 특정 게시글에 댓글 생성
   */
  public async generateCommentsForPost(
    postId: string, 
    maxComments: number = 3,
    onProgress?: ProgressCallback
  ): Promise<number> {
    try {
      console.log(`💬 게시글 ${postId}에 댓글 생성 시작...`);

      // 게시글 정보 조회
      const postDoc = await this.db.collection('posts').doc(postId).get();
      if (!postDoc.exists) {
        throw new Error('게시글을 찾을 수 없습니다.');
      }

      const postData = postDoc.data()!;
      const post: Post = {
        id: postDoc.id,
        title: postData.title,
        content: postData.content,
        authorId: postData.authorId,
        authorNickname: postData.authorNickname,
        schoolId: postData.schoolId,
        schoolName: postData.schoolName || '알 수 없는 학교',
        commentCount: postData.stats?.commentCount || 0,
        createdAt: postData.createdAt,
        fake: postData.fake || false
      };

      // 해당 학교의 봇들 조회
      const schoolBots = await this.getSchoolBots(post.schoolId);
      if (schoolBots.length === 0) {
        throw new Error(`${post.schoolName}에 봇이 없습니다.`);
      }

      // 기존 댓글들 조회
      const existingComments = await this.getExistingComments(post.id);
      
      // 댓글을 달 봇 선택
      const availableBots = schoolBots.filter(bot => 
        !existingComments.some(comment => comment.authorId === bot.uid)
      );

      if (availableBots.length === 0) {
        throw new Error('댓글을 달 수 있는 봇이 없습니다.');
      }

      const commentsToGenerate = Math.min(maxComments, availableBots.length);
      const shuffledBots = availableBots.sort(() => Math.random() - 0.5);
      const selectedBots = shuffledBots.slice(0, commentsToGenerate);

      let generatedCount = 0;

      for (let i = 0; i < selectedBots.length; i++) {
        const bot = selectedBots[i];
        
        try {
          // 실시간으로 최신 댓글들 다시 조회 (새로 생성된 댓글 반영)
          const currentComments = await this.getExistingComments(post.id);
          
          // 대댓글 생성 여부 결정 (40% 확률)
          const shouldCreateReply = Math.random() < this.commentTypes.reply.probability && currentComments.length > 0;
          
          let commentContent: string;
          let parentCommentId: string | undefined;
          
          if (shouldCreateReply) {
            // 대댓글 생성
            const parentComment = currentComments[Math.floor(Math.random() * currentComments.length)];
            parentCommentId = parentComment.id;
            commentContent = await this.generateReplyComment(post, bot, parentComment, currentComments);
          } else {
            // 일반 댓글 생성
            commentContent = await this.generateComment(post, bot, 'comment', currentComments);
          }
          
          // 댓글 저장
          await this.createComment(post.id, commentContent, bot, parentCommentId);
          generatedCount++;

          if (onProgress) {
            onProgress(i + 1, selectedBots.length, `댓글 생성 중... (${i + 1}/${selectedBots.length})`);
          }

          // 딜레이 (API 부하 방지)
          await new Promise(resolve => setTimeout(resolve, 1000));

        } catch (commentError) {
          console.error(`댓글 생성 실패 (${bot.nickname}):`, commentError);
        }
      }

      console.log(`✅ ${generatedCount}개 댓글 생성 완료`);
      return generatedCount;

    } catch (error) {
      console.error('게시글 댓글 생성 실패:', error);
      throw error;
    }
  }
}

export default CommentService;
