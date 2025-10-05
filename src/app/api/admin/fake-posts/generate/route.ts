import { NextRequest, NextResponse } from 'next/server';

// Firebase Admin SDK를 동적으로 로드
async function getFirebaseAdmin() {
  const admin = await import('firebase-admin');
  
  // 이미 초기화된 앱이 있는지 확인
  if (admin.default.apps.length > 0) {
    return admin.default.app();
  }

  // 서비스 계정 정보 (환경변수에서 가져오기)
  const serviceAccount = {
    type: 'service_account',
    project_id: process.env.FIREBASE_PROJECT_ID,
    private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
    private_key: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    client_email: process.env.FIREBASE_CLIENT_EMAIL,
    client_id: process.env.FIREBASE_CLIENT_ID,
    auth_uri: 'https://accounts.google.com/o/oauth2/auth',
    token_uri: 'https://oauth2.googleapis.com/token',
    auth_provider_x509_cert_url: 'https://www.googleapis.com/oauth2/v1/certs',
    client_x509_cert_url: `https://www.googleapis.com/robot/v1/metadata/x509/${process.env.FIREBASE_CLIENT_EMAIL?.replace('@', '%40')}`,
    universe_domain: 'googleapis.com'
  };

  // Firebase Admin 초기화
  return admin.default.initializeApp({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    credential: admin.default.credential.cert(serviceAccount as any),
    databaseURL: 'https://inschoolz-default-rtdb.asia-southeast1.firebasedatabase.app'
  }, 'generate-api'); // 다른 이름으로 초기화
}

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

// AutoPostGenerator 클래스를 직접 구현
class AutoPostGenerator {
  private openaiApiKey: string;
  private boardCode: string;
  private boardName: string;

  constructor(openaiApiKey: string) {
    this.openaiApiKey = openaiApiKey;
    this.boardCode = 'free';
    this.boardName = '자유';
  }

  getBotPersonality(nickname: string, _ageGroup: string): string {
    // 닉네임 기반 성격 분류
    const personalities = {
      // 잼민이/귀여운 컨셉
      cute: {
        keywords: ['펭귄', '판다', '포켓몬', '곰돌이', '토끼', '고양이', '강아지'],
        style: `
- 잼민이 말투 사용 (ㅋㅋㅋ, ㅎㅎㅎ, ㅠㅠㅠ, 많이 사용)
- 이모티콘 자주 사용 (😊, 🥰, 😭, 🤔, 😂 등)
- 순수하고 밝은 톤
- "~해요", "~이에요" 같은 정중한 말투 섞어서
- 감탄사 많이 사용 (와!, 헉!, 어머!)
- 2-3줄로 짧고 귀엽게`
      },
      // 현실적/솔직한 컨셉  
      realistic: {
        keywords: ['선생님무서워', '방학언제', '시험싫어', '숙제많아', '피곤해'],
        style: `
- 현실적이고 솔직한 말투
- 약간의 불만이나 푸념 섞어서
- "하..", "아..", "진짜.." 같은 한숨 표현
- 줄임말 적당히 사용 (ㅋㅋ, ㄹㅇ, 개)
- 학교생활의 현실적인 면 언급
- 2-3줄로 리얼하게`
      },
      // 활발한/에너지 넘치는 컨셉
      energetic: {
        keywords: ['방과후짱', '체육왕', '놀자', '신나', '달려', '점프'],
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

  async createPrompt(schoolName: string, botNickname?: string): Promise<string> {
    const casualTopics = [
      '오늘 있었던 웃긴 일', '친구랑 있었던 일', '쌤이 한 말 중에 기억에 남는 거',
      '화장실에서 들은 소문', '체육시간에 일어난 일', '학교 주변에서 본 연예인 닮은 사람',
      '교복 관련 불만', '선생님 몰래 한 일', '학교 와이파이 속도', '복도에서 들은 대화',
      '쉬는시간 에피소드', '방과후 활동 후기', '학교에서 본 신기한 일', '친구들 사이 유행',
      '오늘 날씨 어땠는지', '학교 건물에서 발견한 것', '수업시간 졸린 이야기',
      '학교 앞 문구점 이야기', '버스/지하철에서 본 일', '집에 가는 길에 본 것',
      '요즘 하고 있는 게임', '주말에 뭐 했는지', '친구랑 놀 계획', '학교 행사 후기',
      '동아리 활동 이야기', '선후배 관계', '학교 생활 꿀팁'
    ];
    const randomTopic = casualTopics[Math.floor(Math.random() * casualTopics.length)];

    let ageGroup = 'middle';
    if (schoolName.includes('초등학교')) {
      ageGroup = 'elementary';
    } else if (schoolName.includes('고등학교') || schoolName.includes('고교')) {
      ageGroup = 'high';
    }

    // 봇별 개성 있는 말투 적용
    let styleGuide = '';
    if (botNickname) {
      const personalityStyle = this.getBotPersonality(botNickname, ageGroup);
      styleGuide = `
${botNickname}의 개성 있는 말투:${personalityStyle}`;
    } else {
      // 기본 스타일 (기존 로직)
      if (ageGroup === 'elementary') {
        styleGuide = `
스타일 가이드:
- 초등학생다운 순수하고 밝은 말투 사용
- 기본적인 줄임말만 사용 (ㅋㅋ, ㅎㅎ, ㅠㅠ 정도)
- 욕설이나 강한 슬랭 사용 금지
- 친근하고 귀여운 톤으로 작성
- 2-3줄 정도로 짧게`;
      } else if (ageGroup === 'middle') {
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
온라인 커뮤니티에 "${randomTopic}"에 대한 짧은 게시글을 작성해주세요.
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

  async generateSchoolPost(schoolName: string, botNickname?: string): Promise<PostData> {
    const prompt = await this.createPrompt(schoolName, botNickname);
    
    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.openaiApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-3.5-turbo',
          messages: [
            {
              role: 'system',
              content: '당신은 한국의 학생 커뮤니티 게시글을 작성하는 AI입니다. 자연스러운 인터넷 슬랭과 캐주얼한 톤을 사용하되, 구체적인 날짜나 일정은 언급하지 마세요.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          max_tokens: 500,
          temperature: 0.8,
        }),
      });

      const data = await response.json();
      
      if (data.choices && data.choices[0]) {
        const content = data.choices[0].message.content;
        const lines = content.split('\n').filter((line: string) => line.trim());
        
        let title = '학교 이야기';
        let postContent = content;
        
        // 제목과 내용 분리
        for (const line of lines) {
          if ((line as string).includes('제목:')) {
            title = (line as string).replace('제목:', '').trim();
            break;
          }
        }
        
        // 내용 추출
        const contentStartIndex = content.indexOf('내용:');
        if (contentStartIndex !== -1) {
          postContent = content.substring(contentStartIndex + 3).trim();
        }
        
        return { title, content: postContent };
      }
      
      throw new Error('OpenAI 응답이 비어있습니다.');
      
    } catch (error) {
      console.error('OpenAI API 오류:', error);
      throw error;
    }
  }

  // 더 이상 사용하지 않는 메서드들 (봇 계정 시스템으로 대체됨)
  // generateRandomNickname, generateRandomUserId 제거

  /**
   * 봇 계정에 경험치 부여 (실제 유저 시스템과 동일)
   */
  async awardBotExperience(db: FirebaseFirestore.Firestore, userId: string, activityType: 'post' | 'comment'): Promise<void> {
    try {
      // 시스템 설정에서 경험치 값 가져오기 (기본값 사용)
      const postReward = 10; // 기본 게시글 경험치
      const commentReward = 5; // 기본 댓글 경험치
      
      const expToAward = activityType === 'post' ? postReward : commentReward;
      
      // 사용자 문서 조회
      const userRef = db.collection('users').doc(userId);
      const userDoc = await userRef.get();
      
      if (!userDoc.exists) {
        console.warn(`⚠️ 봇 사용자 ${userId}를 찾을 수 없습니다.`);
        return;
      }
      
      const userData = userDoc.data();
      const currentLevel = userData?.stats?.level || 1;
      const totalExperience = userData?.stats?.totalExperience || 0;
      
      // 새로운 총 경험치 계산
      const newTotalExperience = totalExperience + expToAward;
      
      // 실제 앱과 동일한 레벨 계산 로직 사용
      const progress = this.calculateCurrentLevelProgress(newTotalExperience);
      
      // 경험치 및 레벨, 게시글 수 업데이트
      const admin = await import('firebase-admin');
      const currentPostCount = userData?.stats?.postCount || 0;
      const updateData = {
        'stats.totalExperience': newTotalExperience,
        'stats.level': progress.level,
        'stats.currentExp': progress.currentExp,
        'stats.currentLevelRequiredXp': progress.currentLevelRequiredXp,
        'stats.postCount': currentPostCount + 1, // 게시글 수 증가
        updatedAt: admin.default.firestore.FieldValue.serverTimestamp()
      };
      
      await userRef.update(updateData);
      
      const leveledUp = progress.level > currentLevel;
      if (leveledUp) {
        console.log(`🎉 봇 ${userId}가 레벨 ${currentLevel}에서 레벨 ${progress.level}로 레벨업! (총 ${newTotalExperience}XP)`);
      } else {
        console.log(`✨ 봇 ${userId}에게 ${expToAward} 경험치 부여 (총 ${newTotalExperience}XP, 레벨 ${progress.level}, 현재 ${progress.currentExp}/${progress.currentLevelRequiredXp})`);
      }
      
    } catch (error) {
      console.error('봇 경험치 부여 실패:', error);
    }
  }

  /**
   * 실제 앱과 동일한 레벨 계산 로직
   */
  calculateCurrentLevelProgress(totalExp: number): {
    level: number;
    currentExp: number;
    expToNextLevel: number;
    currentLevelRequiredXp: number;
    progressPercentage: number;
  } {
    // 레벨별 누적 경험치 (실제 앱과 동일)
    const CUMULATIVE_REQUIREMENTS: { [key: number]: number } = {
      1: 0,
      2: 10,   // 1→2레벨 10exp
      3: 30,   // 10 + 20 = 30
      4: 60,   // 30 + 30 = 60
      5: 100,  // 60 + 40 = 100
      6: 150,  // 100 + 50 = 150
      7: 210,  // 150 + 60 = 210
      8: 280,  // 210 + 70 = 280
      9: 360,  // 280 + 80 = 360
      10: 450, // 360 + 90 = 450
      11: 550, // 450 + 100 = 550
      12: 660, // 550 + 110 = 660
      13: 780, // 660 + 120 = 780
      14: 910, // 780 + 130 = 910
      15: 1050, // 910 + 140 = 1050
      16: 1200, // 1050 + 150 = 1200
      17: 1360, // 1200 + 160 = 1360
      18: 1530, // 1360 + 170 = 1530
      19: 1710, // 1530 + 180 = 1710
      20: 1900  // 1710 + 190 = 1900
    };

    // 레벨별 필요 경험치
    const LEVEL_REQUIREMENTS: { [key: number]: number } = {
      1: 10,   // 1레벨 → 2레벨
      2: 20,   // 2레벨 → 3레벨
      3: 30,   // 3레벨 → 4레벨
      4: 40,   // 4레벨 → 5레벨
      5: 50,   // 5레벨 → 6레벨
      6: 60,   // 6레벨 → 7레벨
      7: 70,   // 7레벨 → 8레벨
      8: 80,   // 8레벨 → 9레벨
      9: 90,   // 9레벨 → 10레벨
      10: 100, // 10레벨 → 11레벨
      11: 110, // 11레벨 → 12레벨
      12: 120, // 12레벨 → 13레벨
      13: 130,
      14: 140,
      15: 150,
      16: 160,
      17: 170,
      18: 180,
      19: 190,
      20: 200
    };

    // 총 경험치에서 현재 레벨 계산
    let level = 1;
    for (const [levelStr, requiredExp] of Object.entries(CUMULATIVE_REQUIREMENTS)) {
      const levelNum = parseInt(levelStr);
      if (totalExp >= requiredExp) {
        level = levelNum;
      } else {
        break;
      }
    }

    const currentLevelStartExp = CUMULATIVE_REQUIREMENTS[level] || 0;
    const currentExp = totalExp - currentLevelStartExp;
    const currentLevelRequiredXp = LEVEL_REQUIREMENTS[level] || (level * 10);
    const expToNextLevel = currentLevelRequiredXp - currentExp;
    
    const progressPercentage = Math.min(100, Math.floor((currentExp / currentLevelRequiredXp) * 100));
    
    return {
      level,
      currentExp,
      expToNextLevel: Math.max(0, expToNextLevel),
      currentLevelRequiredXp,
      progressPercentage
    };
  }

  /**
   * Firebase 스타일 UID 생성 (28자 영숫자)
   */
  generateFirebaseStyleUID(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    
    for (let i = 0; i < 28; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    
    return result;
  }

  /**
   * UID 중복 확인
   */
  async isUIDUnique(db: FirebaseFirestore.Firestore, uid: string): Promise<boolean> {
    try {
      const userDoc = await db.collection('users').doc(uid).get();
      return !userDoc.exists;
    } catch (error) {
      console.error('UID 중복 확인 실패:', error);
      return false;
    }
  }

  /**
   * 고유한 Firebase 스타일 UID 생성
   */
  async generateUniqueFirebaseUID(db: FirebaseFirestore.Firestore): Promise<string> {
    let attempts = 0;
    let uid: string;
    
    do {
      uid = this.generateFirebaseStyleUID();
      attempts++;
      
      if (attempts > 10) {
        throw new Error('고유한 UID 생성에 실패했습니다.');
      }
    } while (!(await this.isUIDUnique(db, uid)));
    
    return uid;
  }

  /**
   * 해당 학교의 봇 계정 중 랜덤 선택
   */
  async selectSchoolBot(db: FirebaseFirestore.Firestore, schoolId: string): Promise<Bot | null> {
    try {
      // 해당 학교의 봇 계정들 조회
      const botsQuery = await db
        .collection('users')
        .where('fake', '==', true)
        .where('schoolId', '==', schoolId)
        .get();

      if (botsQuery.empty) {
        console.warn(`⚠️ ${schoolId} 학교에 봇 계정이 없습니다.`);
        return null;
      }

      // 봇 계정들 중 랜덤 선택
      const bots: Bot[] = [];
      botsQuery.docs.forEach((doc: FirebaseFirestore.QueryDocumentSnapshot) => {
        const data = doc.data();
        bots.push({
          uid: data.uid,
          nickname: data.profile?.userName || data.nickname,
          profileImage: data.profile?.profileImageUrl || data.profileImage,
          schoolId: data.schoolId,
          schoolName: data.schoolName
        });
      });

      const selectedBot = bots[Math.floor(Math.random() * bots.length)];
      console.log(`🤖 선택된 봇: ${selectedBot.nickname} (${selectedBot.uid})`);
      
      return selectedBot;

    } catch (error) {
      console.error('❌ 봇 선택 실패:', error);
      return null;
    }
  }

  async createPost(schoolId: string, schoolName: string, title: string, content: string): Promise<string | null> {
    const app = await getFirebaseAdmin();
    const db = app.firestore();
    
    try {
      // 해당 학교의 봇 계정 중 랜덤 선택
      const selectedBot = await this.selectSchoolBot(db, schoolId);
      
      if (!selectedBot) {
        console.warn(`⚠️ ${schoolName}에 봇 계정이 없어서 게시글 생성을 건너뜁니다.`);
        return null; // 봇이 없으면 게시글 생성 건너뛰기
      }
      
      // 게시판 존재 확인
      await this.ensureBoardExists(db, schoolId);
      
      // 게시글 생성 (선택된 봇 계정 사용)
      const admin = await import('firebase-admin');
      const postData = {
        title,
        content,
        schoolId,
        authorId: selectedBot.uid,
        authorNickname: selectedBot.nickname,
        authorInfo: {
          displayName: selectedBot.nickname,
          profileImageUrl: selectedBot.profileImage || '',
          isAnonymous: false
        },
        boardCode: this.boardCode,
        boardName: this.boardName,
        type: 'school',
        regions: {
          sido: '서울',
          sigungu: '서울'
        },
        stats: {
          viewCount: Math.floor(Math.random() * 5) + 1,
          likeCount: 0,
          commentCount: 0,
          scrapCount: 0
        },
        status: {
          isDeleted: false,
          isHidden: false,
          isBlocked: false,
          isPinned: false
        },
        attachments: [],
        // tags 제거 (실제 게시글과 구분하기 위해)
        fake: true, // AI 생성 게시글 구분자
        createdAt: admin.default.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.default.firestore.FieldValue.serverTimestamp()
      };

      const postRef = await db.collection('posts').add(postData);
      console.log(`✅ 게시글 생성 완료: ${schoolName} - "${title}" (작성자: ${selectedBot.nickname})`);
      
      // 봇 계정에 경험치 부여 (실제 유저처럼)
      await this.awardBotExperience(db, selectedBot.uid, 'post');
      
      return postRef.id;
    } catch (error) {
      console.error(`❌ 게시글 생성 실패 (${schoolName}):`, error);
      throw error;
    }
  }

  async getSystemUser(db: FirebaseFirestore.Firestore): Promise<FirebaseFirestore.DocumentData | null> {
    const userRef = db.collection('users').doc('system-auto-poster');
    const userDoc = await userRef.get();
    
    if (!userDoc.exists) {
      await userRef.set({
        uid: 'system-auto-poster',
        nickname: '시스템',
        email: 'system@inschoolz.com',
        createdAt: new Date(),
        isActive: true,
        role: 'system'
      });
      console.log('시스템 사용자 생성 완료');
    }
    
    return userDoc.exists ? (userDoc.data() || null) : null;
  }

  async ensureBoardExists(db: FirebaseFirestore.Firestore, schoolId: string): Promise<void> {
    const boardRef = db.collection('boards')
      .where('schoolId', '==', schoolId)
      .where('code', '==', this.boardCode);
    
    const boardSnapshot = await boardRef.get();
    
    if (boardSnapshot.empty) {
      await db.collection('boards').add({
        schoolId,
        code: this.boardCode,
        name: this.boardName,
        description: '자유롭게 이야기하는 게시판입니다.',
        createdAt: new Date(),
        isActive: true,
        order: 1
      });
      console.log(`게시판 생성 완료: ${schoolId} - ${this.boardName}`);
    }
  }

  async generatePostsForSchools(schoolLimit = 10, postsPerSchool = 1, delayBetweenPosts = 3000): Promise<number> {
    const app = await getFirebaseAdmin();
    const db = app.firestore();
    
    try {
      console.log('📚 봇이 있는 학교 목록을 가져오는 중...');
      
      // 1단계: 봇이 있는 학교들 조회
      const botsQuery = await db
        .collection('users')
        .where('fake', '==', true)
        .get();

      if (botsQuery.empty) {
        console.log('❌ 봇 계정이 없습니다. 먼저 봇을 생성해주세요.');
        return 0;
      }

      // 봇이 있는 학교 ID들 수집
      const schoolsWithBots = new Set<string>();
      botsQuery.docs.forEach(doc => {
        const data = doc.data();
        if (data.schoolId) {
          schoolsWithBots.add(data.schoolId);
        }
      });

      console.log(`📊 봇이 있는 학교: ${schoolsWithBots.size}개`);

      if (schoolsWithBots.size === 0) {
        console.log('❌ 봇이 연결된 학교가 없습니다.');
        return 0;
      }

      // 2단계: 봇이 있는 학교들의 정보 가져오기
      const schoolIds = Array.from(schoolsWithBots);
      const selectedSchoolIds = schoolIds
        .sort(() => Math.random() - 0.5) // 랜덤 셔플
        .slice(0, Math.min(schoolLimit, schoolIds.length)); // 요청된 수만큼 선택

      console.log(`🎯 선택된 학교: ${selectedSchoolIds.length}개 (봇이 있는 학교 중에서 랜덤 선택)`);

      // 3단계: 선택된 학교들의 상세 정보 조회
      const schools: School[] = [];
      for (const schoolId of selectedSchoolIds) {
        try {
          const schoolDoc = await db.collection('schools').doc(schoolId).get();
          if (schoolDoc.exists) {
            const data = schoolDoc.data();
            schools.push({
              id: schoolId,
              name: data?.KOR_NAME || '알 수 없는 학교',
              address: data?.ADDRESS || '',
              region: data?.REGION || '서울'
            });
          }
        } catch (error) {
          console.warn(`학교 정보 조회 실패 (${schoolId}):`, error);
        }
      }

      console.log(`📋 총 ${schools.length}개 학교에 게시글을 생성합니다.`);
      
      let totalGenerated = 0;
      
      for (const school of schools) {
        try {
          console.log(`\n🎯 ${school.name} 처리 중...`);
          
          for (let i = 0; i < postsPerSchool; i++) {
            try {
              // 먼저 봇을 선택
              const app = await getFirebaseAdmin();
              const db = app.firestore();
              const selectedBot = await this.selectSchoolBot(db, school.id);
              
              if (!selectedBot) {
                console.warn(`⚠️ ${school.name}에 봇 계정이 없어서 게시글 생성을 건너뜁니다.`);
                continue;
              }
              
              // 선택된 봇의 성격에 맞는 게시글 생성
              const postData = await this.generateSchoolPost(school.name, selectedBot.nickname);
              await this.createPost(school.id, school.name, postData.title, postData.content);
              totalGenerated++;
              
              // 딜레이 적용
              if (delayBetweenPosts > 0) {
                await new Promise(resolve => setTimeout(resolve, delayBetweenPosts));
              }
            } catch (postError) {
              console.error(`게시글 생성 실패 (${school.name}):`, postError);
            }
          }
        } catch (schoolError) {
          console.error(`학교 처리 실패 (${school.name}):`, schoolError);
        }
      }
      
      console.log(`\n🎉 생성 완료! 총 ${totalGenerated}개 게시글이 생성되었습니다.`);
      return totalGenerated;
      
    } catch (error) {
      console.error('게시글 생성 프로세스 오류:', error);
      throw error;
    }
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { schoolLimit = 10, postsPerSchool = 1, delayBetweenPosts = 3000 } = body;

    console.log('AI 게시글 생성 시작:', { schoolLimit, postsPerSchool, delayBetweenPosts });

    const openaiApiKey = process.env.OPENAI_API_KEY;
    
    if (!openaiApiKey) {
      throw new Error('OpenAI API 키가 설정되지 않았습니다.');
    }
    
    const generator = new AutoPostGenerator(openaiApiKey);
    
    // 백그라운드에서 실행
    generator.generatePostsForSchools(schoolLimit, postsPerSchool, delayBetweenPosts)
      .then((totalGenerated) => {
        console.log(`✅ 백그라운드 생성 완료: ${totalGenerated}개 게시글`);
      })
      .catch((error) => {
        console.error('❌ 백그라운드 생성 실패:', error);
      });
    
    return NextResponse.json({
      success: true,
      message: 'AI 게시글 생성이 백그라운드에서 시작되었습니다.',
      config: {
        schoolLimit,
        postsPerSchool,
        delayBetweenPosts,
        expectedPosts: schoolLimit * postsPerSchool
      }
    });

  } catch (error) {
    console.error('AI 게시글 생성 API 오류:', error);
    return NextResponse.json(
      { success: false, error: `AI 게시글 생성을 시작할 수 없습니다: ${error instanceof Error ? error.message : 'Unknown error'}` },
      { status: 500 }
    );
  }
}
