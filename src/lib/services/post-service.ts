import FirebaseService from './firebase-service';
import { ContentTemplates } from './content-templates';

// 타입 정의
interface Bot {
  uid: string;
  nickname: string;
  profileImage?: string;
  schoolId: string;
  schoolName: string;
}

interface School {
  id: string;
  name: string;
  address: string;
  region: string;
}

interface PostData {
  title: string;
  content: string;
}

interface PostGenerationResult {
  totalGenerated: number;
  schoolsProcessed: number;
  summary: {
    elementary: number;
    middle: number;
    high: number;
  };
}

interface ProgressCallback {
  (current: number, total: number, message?: string): void;
}

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

/**
 * AI 게시글 생성 서비스
 * 기존 AutoPostGenerator 로직을 통합
 */
export class PostService {
  private firebaseService: FirebaseService;
  private db: FirebaseFirestore.Firestore;
  private FieldValue: typeof FirebaseFirestore.FieldValue;
  private boardCode: string;
  private boardName: string;
  private contentTemplates: ContentTemplates;

  constructor() {
    this.firebaseService = FirebaseService.getInstance();
    this.db = this.firebaseService.getFirestore();
    this.FieldValue = this.firebaseService.getFieldValue();
    this.boardCode = 'free';
    this.boardName = '자유';
    this.contentTemplates = new ContentTemplates();
  }

  /**
   * OpenAI API 호출
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
          max_tokens: 300,
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
   * 봇 성격 분석 및 말투 스타일 반환
   */
  private getBotPersonality(nickname: string, ageGroup: string): string {
    const personalities = {
      cute: {
        keywords: ['펭귄', '판다', '포켓몬', '곰돌이', '토끼', '고양이', '강아지', '꿀벌', '나비', '공주', '왕자'],
        style: `
- 잼민이 말투 사용 (ㅋㅋㅋ, ㅎㅎㅎ, ㅠㅠㅠ, 많이 사용)
- 이모티콘 자주 사용 (😊, 🥰, 😭, 🤔, 😂 등)
- 순수하고 밝은 톤
- "~해요", "~이에요" 같은 정중한 말투 섞어서
- 감탄사 많이 사용 (와!, 헉!, 어머!)
- 2-3줄로 짧고 귀엽게`
      },
      realistic: {
        keywords: ['무서워', '싫어', '망함', '피곤', '스트레스', '짜증', '걱정', '헬', '고사'],
        style: `
- 현실적이고 솔직한 말투
- 약간의 불만이나 푸념 섞어서
- "하..", "아..", "진짜.." 같은 한숨 표현
- 줄임말 적당히 사용 (ㅋㅋ, ㄹㅇ, 개)
- 학교생활의 현실적인 면 언급
- 2-3줄로 리얼하게`
      },
      energetic: {
        keywords: ['짱', '왕', '최고', '신나', '킹', '퀸', '맥스', '슈퍼', '울트라'],
        style: `
- 에너지 넘치는 활발한 말투
- 느낌표 많이 사용!!!
- "ㅋㅋㅋㅋ", "ㅎㅎㅎㅎ" 길게 사용
- 의성어/의태어 사용 (와아아, 우와, 헤헤)
- 긍정적이고 밝은 톤
- 2-3줄로 신나게`
      }
    };

    // 닉네임으로 성격 판단
    let selectedPersonality = personalities.realistic; // 기본값
    
    for (const [type, data] of Object.entries(personalities)) {
      if (data.keywords.some(keyword => nickname.includes(keyword))) {
        selectedPersonality = personalities[type as keyof typeof personalities];
        break;
      }
    }

    return selectedPersonality.style;
  }

  /**
   * 게시글 생성 프롬프트 생성 (ContentTemplates 사용)
   */
  private async createPrompt(schoolName: string, botNickname?: string): Promise<string> {
    // 학교 유형 판별
    let schoolType: 'elementary' | 'middle' | 'high' = 'middle';
    if (schoolName.includes('초등학교')) {
      schoolType = 'elementary';
    } else if (schoolName.includes('고등학교') || schoolName.includes('고교')) {
      schoolType = 'high';
    }

    // 지역 정보 (기본값 설정)
    const region = '서울'; // 실제로는 학교 정보에서 가져와야 함

    // ContentTemplates를 사용한 종합 주제 생성
    const topicResult = this.contentTemplates.generateComprehensiveTopic(
      schoolName,
      region,
      schoolType,
      '자유게시판'
    );

    // 봇별 개성 있는 말투 적용
    let styleGuide = '';
    if (botNickname) {
      const personalityStyle = this.getBotPersonality(botNickname, schoolType);
      styleGuide = `
${botNickname}의 개성 있는 말투: ${personalityStyle}`;
    } else {
      // 기본 스타일
      if (schoolType === 'elementary') {
        styleGuide = `
스타일 가이드:
- 초등학생다운 순수하고 밝은 말투 사용
- 기본적인 줄임말만 사용 (ㅋㅋ, ㅎㅎ, ㅠㅠ 정도)
- 욕설이나 강한 슬랭 사용 금지
- 친근하고 귀여운 톤으로 작성
- 2-3줄 정도로 짧게`;
      } else if (schoolType === 'middle') {
        styleGuide = `
스타일 가이드:
- 중학생다운 활발하고 솔직한 말투 사용
- 적당한 인터넷 슬랭 사용 (ㅋㅋ, ㄹㅇ, 개, 레알, 갓 등)
- 너무 심한 욕설은 피하되 캐주얼하게
- 2-3줄 정도로 짧게`;
      } else {
        styleGuide = `
스타일 가이드:
- 고등학생/대학생 커뮤니티 말투 사용
- 인터넷 슬랭 자유롭게 사용 (ㅋㅋ, ㄹㅇ, ㅇㅈ, 개, 존나, 레알, 갓 등)
- 솔직하고 직설적으로 작성
- 2-3줄 정도로 짧게`;
      }
    }

    return `당신은 ${schoolName}에 다니는 평범한 학생입니다.
온라인 커뮤니티에 "${topicResult.topic}"에 대한 짧은 게시글을 작성해주세요.

주제 카테고리: ${topicResult.category}
글의 톤: ${topicResult.tone}
학교 유형: ${schoolType === 'elementary' ? '초등학교' : schoolType === 'middle' ? '중학교' : '고등학교'}
${styleGuide}

⚠️ 절대 금지사항:
- 구체적인 날짜나 미래 일정 언급 금지 (시험, 축제, 행사 날짜 등)
- 급식 메뉴나 매점 관련 내용 금지 (학교마다 다름)
- 주말에 급식 이야기 금지 (학교 안 감)
- 구체적인 선생님 이름이나 실명 금지
- 학교 시설이 있다고 단정하지 말기 (매점, 급식실 등)
- 모르는 정보는 절대 지어내지 마세요

✅ 권장사항:
- 학교 이름 줄여서 사용 가능
- 일반적이고 보편적인 학교 경험 위주
- 개인적인 감정이나 생각 표현
- 친구들과의 일상적인 대화나 에피소드

형식:
제목: [솔직하고 직설적인 제목]
내용: [짧고 리얼한 내용]`;
  }

  /**
   * 학교별 게시글 생성
   */
  private async generateSchoolPost(schoolName: string, botNickname?: string): Promise<PostData> {
    const prompt = await this.createPrompt(schoolName, botNickname);
    
    try {
      const messages: OpenAIMessage[] = [
        {
          role: 'system',
          content: '당신은 한국 학생들의 일상적인 커뮤니티 게시글을 작성하는 AI입니다. 자연스럽고 현실적인 학교 생활 이야기를 만들어주세요.'
        },
        {
          role: 'user',
          content: prompt
        }
      ];

      const response = await this.callOpenAI(messages);

      // 제목과 내용 분리
      const lines = response.split('\n').filter(line => line.trim());
      let title = '';
      let content = '';

      for (const line of lines) {
        if (line.includes('제목:')) {
          title = line.replace('제목:', '').trim();
        } else if (line.includes('내용:')) {
          content = line.replace('내용:', '').trim();
        } else if (!title && line.trim()) {
          title = line.trim();
        } else if (title && !content && line.trim()) {
          content = line.trim();
        } else if (content) {
          content += '\n' + line;
        }
      }

      // 제목이나 내용이 없으면 전체를 내용으로 사용
      if (!title || !content) {
        const allText = response.replace(/제목:|내용:/g, '').trim();
        const sentences = allText.split(/[.!?]/).filter(s => s.trim());
        
        if (sentences.length > 1) {
          title = sentences[0].trim() + (sentences[0].includes('?') ? '' : '.');
          content = sentences.slice(1).join('. ').trim();
        } else {
          title = allText.length > 30 ? allText.substring(0, 30) + '...' : allText;
          content = allText;
        }
      }

      // 제목 길이 제한
      if (title.length > 50) {
        title = title.substring(0, 47) + '...';
      }

      // 내용 길이 제한
      if (content.length > 500) {
        content = content.substring(0, 497) + '...';
      }

      return { title, content };

    } catch (error) {
      console.error('게시글 생성 실패:', error);
      
      // 기본 게시글 반환
      const defaultPosts = [
        {
          title: '오늘 학교에서 있었던 일',
          content: '별거 없긴 한데 그냥 일상 이야기 ㅋㅋ'
        },
        {
          title: '요즘 생각',
          content: '학교생활 하다보니 이런저런 생각이 드네요'
        },
        {
          title: '친구들아 안녕',
          content: '오늘도 수고했어 모두들!'
        }
      ];
      
      return defaultPosts[Math.floor(Math.random() * defaultPosts.length)];
    }
  }

  /**
   * 게시글 저장
   */
  private async savePost(
    postData: PostData,
    author: Bot,
    schoolInfo: School
  ): Promise<string> {
    try {
      const postId = this.db.collection('posts').doc().id;
      
      const postDoc = {
        title: postData.title,
        content: postData.content,
        authorId: author.uid,
        authorNickname: author.nickname,
        authorInfo: {
          displayName: author.nickname,
          profileImageUrl: author.profileImage || '',
          isAnonymous: false
        },
        
        // 게시판 정보
        boardCode: this.boardCode,
        boardName: this.boardName,
        
        // 학교 정보
        schoolId: schoolInfo.id,
        schoolName: schoolInfo.name,
        region: schoolInfo.region,
        
        // 통계
        stats: {
          viewCount: 0,
          likeCount: 0,
          commentCount: 0,
          shareCount: 0
        },
        
        // 상태
        status: {
          isDeleted: false,
          isHidden: false,
          isBlocked: false,
          isPinned: false
        },
        
        // 추가 정보
        tags: ['AI생성', '자유게시판', '학교생활'], // AI 게시글 구분용 태그
        type: 'text',
        fake: true, // AI 생성 게시글 표시
        
        createdAt: this.FieldValue.serverTimestamp(),
        updatedAt: this.FieldValue.serverTimestamp()
      };

      await this.db.collection('posts').doc(postId).set(postDoc);
      
      console.log(`✅ 게시글 생성: "${postData.title}" by ${author.nickname} (${schoolInfo.name})`);
      return postId;

    } catch (error) {
      console.error('게시글 저장 실패:', error);
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
   * 학교 정보 조회
   */
  private async getSchoolInfo(schoolId: string): Promise<School | null> {
    try {
      const schoolDoc = await this.db.collection('schools').doc(schoolId).get();
      
      if (!schoolDoc.exists) {
        return null;
      }

      const data = schoolDoc.data()!;
      return {
        id: schoolDoc.id,
        name: data.KOR_NAME,
        address: data.ADDRESS,
        region: data.REGION || '서울'
      };
    } catch (error) {
      console.error('학교 정보 조회 실패:', error);
      return null;
    }
  }

  /**
   * 여러 학교에 대해 게시글 생성
   */
  public async generatePostsForSchools(
    schoolLimit: number = 10, 
    postsPerSchool: number = 1, 
    delayBetweenPosts: number = 3000,
    onProgress?: ProgressCallback
  ): Promise<PostGenerationResult> {
    try {
      console.log('🤖 AI 게시글 생성 시작...');
      console.log(`📊 설정: ${schoolLimit}개 학교, 학교당 ${postsPerSchool}개 게시글, 게시글간 ${delayBetweenPosts}ms 딜레이\n`);

      // 1단계: 봇이 있는 학교들 조회
      const botsQuery = await this.db
        .collection('users')
        .where('fake', '==', true)
        .get();

      if (botsQuery.empty) {
        console.log('❌ 봇 계정이 없습니다.');
        return {
          totalGenerated: 0,
          schoolsProcessed: 0,
          summary: { elementary: 0, middle: 0, high: 0 }
        };
      }

      const schoolsWithBots = new Set<string>();
      botsQuery.docs.forEach(doc => {
        const data = doc.data();
        if (data.schoolId) {
          schoolsWithBots.add(data.schoolId);
        }
      });

      console.log(`📊 봇이 있는 학교: ${schoolsWithBots.size}개`);

      // 2단계: 학교 선택 (랜덤)
      const schoolIds = Array.from(schoolsWithBots)
        .sort(() => Math.random() - 0.5)
        .slice(0, schoolLimit);

      console.log(`📋 선택된 학교: ${schoolIds.length}개\n`);

      let totalGenerated = 0;
      const summary = {
        elementary: 0,
        middle: 0,
        high: 0
      };

      // 3단계: 각 학교별로 게시글 생성
      for (let schoolIndex = 0; schoolIndex < schoolIds.length; schoolIndex++) {
        const schoolId = schoolIds[schoolIndex];
        
        try {
          // 학교 정보 조회
          const schoolInfo = await this.getSchoolInfo(schoolId);
          if (!schoolInfo) {
            console.warn(`⚠️ 학교 ${schoolId} 정보를 찾을 수 없습니다.`);
            continue;
          }

          console.log(`🏫 [${schoolIndex + 1}/${schoolIds.length}] ${schoolInfo.name} 처리 중...`);

          // 해당 학교의 봇들 조회
          const schoolBots = await this.getSchoolBots(schoolId);
          if (schoolBots.length === 0) {
            console.warn(`⚠️ ${schoolInfo.name}에 봇이 없습니다.`);
            continue;
          }

          // 학교 유형 판별
          let schoolType: 'elementary' | 'middle' | 'high' = 'middle';
          if (schoolInfo.name.includes('초등학교')) {
            schoolType = 'elementary';
          } else if (schoolInfo.name.includes('고등학교') || schoolInfo.name.includes('고교')) {
            schoolType = 'high';
          }

          // 해당 학교에서 게시글 생성
          for (let postIndex = 0; postIndex < postsPerSchool; postIndex++) {
            try {
              // 랜덤하게 봇 선택
              const randomBot = schoolBots[Math.floor(Math.random() * schoolBots.length)];
              
              // 게시글 생성
              const postData = await this.generateSchoolPost(schoolInfo.name, randomBot.nickname);
              
              // 게시글 저장
              await this.savePost(postData, randomBot, schoolInfo);
              
              totalGenerated++;
              summary[schoolType]++;

              // 딜레이 (API 부하 방지)
              if (delayBetweenPosts > 0) {
                await new Promise(resolve => setTimeout(resolve, delayBetweenPosts));
              }

            } catch (postError) {
              console.error(`게시글 생성 실패 (${schoolInfo.name}):`, postError);
            }
          }

          // 진행률 콜백 호출
          if (onProgress) {
            onProgress(
              schoolIndex + 1, 
              schoolIds.length, 
              `학교 처리 중... (${schoolIndex + 1}/${schoolIds.length})`
            );
          }

        } catch (schoolError) {
          console.error(`학교 처리 실패 (${schoolId}):`, schoolError);
        }
      }

      console.log('\n🎉 AI 게시글 생성 완료!');
      console.log('📊 생성 결과:');
      console.log(`   - 총 게시글: ${totalGenerated}개`);
      console.log(`   - 초등학교 게시글: ${summary.elementary}개`);
      console.log(`   - 중학교 게시글: ${summary.middle}개`);
      console.log(`   - 고등학교 게시글: ${summary.high}개`);
      console.log(`   - 처리된 학교: ${schoolIds.length}개\n`);

      return {
        totalGenerated,
        schoolsProcessed: schoolIds.length,
        summary
      };

    } catch (error) {
      console.error('❌ AI 게시글 생성 프로세스 실패:', error);
      throw error;
    }
  }

  /**
   * 랜덤 학교들에 게시글 생성 (배치 처리용)
   */
  public async generatePostsForRandomSchools(
    postCount: number,
    onProgress?: ProgressCallback
  ): Promise<number> {
    try {
      console.log(`🤖 랜덤 학교들에 ${postCount}개 게시글 생성 시작...`);

      // 봇이 있는 학교들 조회
      const botsQuery = await this.db
        .collection('users')
        .where('fake', '==', true)
        .get();

      if (botsQuery.empty) {
        throw new Error('봇 계정이 없습니다.');
      }

      const schoolsWithBots = new Set<string>();
      botsQuery.docs.forEach(doc => {
        const data = doc.data();
        if (data.schoolId) {
          schoolsWithBots.add(data.schoolId);
        }
      });

      if (schoolsWithBots.size === 0) {
        throw new Error('봇이 있는 학교가 없습니다.');
      }

      const schoolIds = Array.from(schoolsWithBots);
      let generatedCount = 0;

      for (let i = 0; i < postCount; i++) {
        try {
          // 랜덤하게 학교 선택
          const randomSchoolId = schoolIds[Math.floor(Math.random() * schoolIds.length)];
          
          // 학교 정보 조회
          const schoolInfo = await this.getSchoolInfo(randomSchoolId);
          if (!schoolInfo) {
            console.warn(`학교 ${randomSchoolId} 정보를 찾을 수 없습니다.`);
            continue;
          }

          // 해당 학교의 봇들 조회
          const schoolBots = await this.getSchoolBots(randomSchoolId);
          if (schoolBots.length === 0) {
            console.warn(`${schoolInfo.name}에 봇이 없습니다.`);
            continue;
          }

          // 랜덤하게 봇 선택
          const randomBot = schoolBots[Math.floor(Math.random() * schoolBots.length)];
          
          // 게시글 생성
          const postData = await this.generateSchoolPost(schoolInfo.name, randomBot.nickname);
          
          // 게시글 저장
          await this.savePost(postData, randomBot, schoolInfo);
          
          generatedCount++;

          if (onProgress) {
            onProgress(i + 1, postCount, `게시글 생성 중... (${i + 1}/${postCount})`);
          }

          // 딜레이 (API 부하 방지)
          await new Promise(resolve => setTimeout(resolve, 1000));

        } catch (postError) {
          console.error(`게시글 생성 실패:`, postError);
        }
      }

      console.log(`✅ ${generatedCount}개 게시글 생성 완료`);
      return generatedCount;

    } catch (error) {
      console.error('랜덤 게시글 생성 실패:', error);
      throw error;
    }
  }

  /**
   * 특정 학교에 게시글 생성
   */
  public async generatePostsForSchool(
    schoolId: string, 
    postCount: number = 1,
    onProgress?: ProgressCallback
  ): Promise<number> {
    try {
      console.log(`🤖 학교 ${schoolId}에 ${postCount}개 게시글 생성 시작...`);

      // 학교 정보 조회
      const schoolInfo = await this.getSchoolInfo(schoolId);
      if (!schoolInfo) {
        throw new Error(`학교 ${schoolId} 정보를 찾을 수 없습니다.`);
      }

      // 해당 학교의 봇들 조회
      const schoolBots = await this.getSchoolBots(schoolId);
      if (schoolBots.length === 0) {
        throw new Error(`${schoolInfo.name}에 봇이 없습니다.`);
      }

      let generatedCount = 0;

      for (let i = 0; i < postCount; i++) {
        try {
          // 랜덤하게 봇 선택
          const randomBot = schoolBots[Math.floor(Math.random() * schoolBots.length)];
          
          // 게시글 생성
          const postData = await this.generateSchoolPost(schoolInfo.name, randomBot.nickname);
          
          // 게시글 저장
          await this.savePost(postData, randomBot, schoolInfo);
          
          generatedCount++;

          if (onProgress) {
            onProgress(i + 1, postCount, `게시글 생성 중... (${i + 1}/${postCount})`);
          }

          // 딜레이 (API 부하 방지)
          await new Promise(resolve => setTimeout(resolve, 1000));

        } catch (postError) {
          console.error(`게시글 생성 실패:`, postError);
        }
      }

      console.log(`✅ ${generatedCount}개 게시글 생성 완료`);
      return generatedCount;

    } catch (error) {
      console.error('학교별 게시글 생성 실패:', error);
      throw error;
    }
  }
}

export default PostService;
