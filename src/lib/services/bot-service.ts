import FirebaseService from './firebase-service';

// 타입 정의
interface BotCreationResult {
  id: string;
  nickname: string;
  schoolType: string;
}

interface BotCreationSummary {
  totalCreated: number;
  summary: {
    elementary: number;
    middle: number;
    high: number;
  };
  schoolsProcessed: number;
}

interface BotDeletionResult {
  deletedCount: number;
  stats: {
    elementary: number;
    middle: number;
    high: number;
    schoolsAffected: number;
  };
  deletedPosts?: number;
  deletedComments?: number;
}

interface ProgressCallback {
  (current: number, total: number, message?: string): void;
}

/**
 * 봇 계정 생성 및 관리 서비스
 * 루트 스크립트의 create-school-bots.js와 delete-all-bots.js 로직을 통합
 */
export class BotService {
  private firebaseService: FirebaseService;
  private db: FirebaseFirestore.Firestore;
  private FieldValue: typeof FirebaseFirestore.FieldValue;

  // 학교 유형별 닉네임 풀
  private nicknameComponents = {
    elementary: {
      animals: [
        '토끼', '코알라', '햄스터', '펭귄', '강아지', '고양이', '판다', '곰돌이', '다람쥐', '나비',
        '꿀벌', '사자', '호랑이', '기린', '코끼리', '원숭이', '여우', '늑대', '사슴', '말',
        '돼지', '양', '염소', '닭', '오리', '거북이', '물고기', '상어', '고래', '돌고래',
        '새', '독수리', '부엉이', '까마귀', '참새', '비둘기', '앵무새', '카나리아', '개구리', '뱀',
        '도마뱀', '거미', '개미', '벌', '잠자리', '메뚜기', '귀뚜라미', '무당벌레', '나비', '애벌레'
      ],
      characters: [
        '피카츄', '뽀로로', '크롱', '도라에몽', '미니언즈', '포켓몬', '아기공룡', '헬로키티',
        '마이멜로디', '쿠로미', '시나모롤', '폼폼푸린', '배드바츠마루', '케로피', '라이언',
        '어피치', '프로도', '네오', '튜브', '제이지', '콘', '무지', '짱구', '철수',
        '유리', '맹구', '훈이', '수지', '보니', '흰둥이', '짱아', '신형만', '봉미선',
        '디즈니', '미키', '미니', '도널드', '구피', '플루토', '칩', '데일', '스티치'
      ],
      colors: [
        '빨강', '파랑', '노랑', '초록', '보라', '분홍', '주황', '검정', '하양', '회색',
        '금색', '은색', '무지개', '별빛', '달빛', '햇빛', '구름', '하늘', '바다', '숲',
        '꽃', '나무', '잎사귀', '열매', '씨앗', '뿌리', '가지', '줄기', '꽃잎', '꽃봉오리'
      ],
      foods: [
        '초콜릿', '사탕', '젤리', '쿠키', '케이크', '아이스크림', '딸기', '사과', '바나나', '포도',
        '오렌지', '수박', '메론', '복숭아', '배', '체리', '블루베리', '키위', '망고', '파인애플',
        '우유', '요거트', '치즈', '버터', '꿀', '잼', '빵', '도넛', '마카롱', '와플',
        '팬케이크', '푸딩', '젤라또', '솜사탕', '츄러스', '프레첼', '팝콘', '과자', '비스킷', '크래커'
      ],
      suffixes: ['공주', '왕자', '맨', '이', '짱', '뀽', '팬더', '푸', '야', '님', '킹', '퀸', '베이비', '꼬마', '미니', '맥스', '슈퍼', '울트라']
    },
    middle: {
      school: [
        '공부', '시험', '숙제', '과제', '발표', '수행평가', '중간고사', '기말고사', '모의고사',
        '내신', '생기부', '동아리', '학급', '반장', '부반장', '학생회', '방과후', '야자', '보충',
        '체육', '음악', '미술', '과학', '수학', '국어', '영어', '사회', '역사', '지리',
        '급식', '매점', '도서관', '운동장', '교실', '복도', '계단', '화장실', '보건실', '교무실',
        '선생님', '친구', '선배', '후배', '짝꿍', '조별과제', '청소', '당번', '출석', '지각',
        '조회', '종례', '쉬는시간', '점심시간', '하교', '등교', '버스', '지하철', '도보', '자전거'
      ],
      emotions: [
        '행복', '슬픔', '화남', '짜증', '스트레스', '피곤', '졸림', '배고픔', '목마름', '추위',
        '더위', '아픔', '기쁨', '신남', '우울', '불안', '걱정', '두려움', '놀람', '당황',
        '실망', '후회', '부러움', '질투', '미움', '사랑', '좋아함', '싫어함', '관심', '무관심',
        '집중', '산만', '열정', '의욕', '무기력', '활기', '침울', '밝음', '어둠', '희망'
      ],
      hobbies: [
        '게임', '만화', '애니', '드라마', '영화', '음악', '댄스', '노래', '랩', '힙합',
        '아이돌', '케이팝', '팝송', '발라드', '록', '재즈', '클래식', '트로트', '인디', '밴드',
        '기타', '피아노', '드럼', '바이올린', '첼로', '플루트', '색소폰', '하모니카', '우쿨렐레', '베이스',
        '축구', '농구', '야구', '배구', '탁구', '테니스', '배드민턴', '수영', '태권도', '유도',
        '검도', '복싱', '레슬링', '체조', '육상', '마라톤', '사이클', '스케이트', '스키', '스노보드'
      ],
      suffixes: ['학생', '라이프', '싫어', '왕', '시간', '망함', '최고', '무서워', '짱', '부장', '회장', '킹', '러버', '헬', '고사', '걱정', '관리', '나무', '맨', '러', '족', '충']
    },
    high: {
      entrance: [
        '수능', '내신', '생기부', '학종', '정시', '수시', '모의고사', '전국연합', '교육청', '평가원',
        '국어', '수학', '영어', '탐구', '과탐', '사탐', '한국사', '제2외국어', '한문', '논술',
        '면접', '자소서', '포트폴리오', '실기', '적성', '입학사정관', '학교추천', '일반전형', '특별전형', '지역균형',
        '의대', '치대', '한의대', '약대', '수의대', '간호대', '공대', '경영', '경제', '법대',
        '사범대', '예체능', '미대', '음대', '체대', '연극영화', '신문방송', '컴공', '전자', '기계',
        '화공', '건축', '토목', '환경', '생명', '화학', '물리', '지구과학', '생물', '심리'
      ],
      university: [
        '대학', '캠퍼스', '학과', '전공', '복수전공', '부전공', '교양', '전선', '전필', '학점',
        '출석', '과제', '레포트', '발표', '팀플', '중간', '기말', '재시', '계절학기', '휴학',
        '복학', '졸업', '취업', '대학원', '석사', '박사', '연구', '논문', '학회', '인턴',
        '동아리', '학생회', '축제', '엠티', '새터', '오티', '종강', '개강', '수강신청', '폐강'
      ],
      future: [
        '꿈', '목표', '비전', '계획', '미래', '희망', '도전', '성공', '실패', '노력',
        '열정', '의지', '각오', '다짐', '결심', '포기', '극복', '인내', '끈기', '집중',
        '취업', '창업', '사업', '직장', '회사', '공무원', '교사', '의사', '변호사', '엔지니어',
        '디자이너', '개발자', '프로그래머', '연구원', '교수', '기자', '작가', '예술가', '운동선수', '연예인',
        'CEO', '임원', '팀장', '대리', '과장', '부장', '이사', '사장', '회장', '대표'
      ],
      suffixes: ['전사', '킬러', '장인', '준비생', '파이터', '왕', '달인', '중독', '부족', '맥스', '갈거야', '크게', '이다', '힘들어', '고민', '없음', '소중해', '감사', '맛없어', '싫어', '짧아', '최고', '기원', '러', '족']
    }
  };

  constructor() {
    this.firebaseService = FirebaseService.getInstance();
    this.db = this.firebaseService.getFirestore();
    this.FieldValue = this.firebaseService.getFieldValue();
  }

  /**
   * 학교 이름으로부터 학교 유형 판별
   */
  private getSchoolType(schoolName: string): 'elementary' | 'middle' | 'high' {
    if (schoolName.includes('초등학교') || schoolName.includes('초교')) {
      return 'elementary';
    } else if (schoolName.includes('중학교') || schoolName.includes('중교')) {
      return 'middle';
    } else if (schoolName.includes('고등학교') || schoolName.includes('고교') || schoolName.includes('고')) {
      return 'high';
    }
    return 'middle'; // 기본값
  }

  /**
   * 닉네임 생성 (조합 방식)
   */
  private generateNickname(schoolType: 'elementary' | 'middle' | 'high'): string {
    const components = this.nicknameComponents[schoolType];
    const rand = Math.random();
    
    if (rand < 0.4) {
      // 40%: 단어 + 접미사 조합
      const categories = Object.keys(components).filter(key => key !== 'suffixes');
      const randomCategory = categories[Math.floor(Math.random() * categories.length)];
      const word = components[randomCategory as keyof typeof components][Math.floor(Math.random() * components[randomCategory as keyof typeof components].length)];
      const suffix = components.suffixes[Math.floor(Math.random() * components.suffixes.length)];
      return word + suffix;
    } else if (rand < 0.7) {
      // 30%: 단어 + 숫자
      const categories = Object.keys(components).filter(key => key !== 'suffixes');
      const randomCategory = categories[Math.floor(Math.random() * categories.length)];
      const word = components[randomCategory as keyof typeof components][Math.floor(Math.random() * components[randomCategory as keyof typeof components].length)];
      const number = Math.floor(Math.random() * 999) + 1;
      return word + number;
    } else if (rand < 0.85) {
      // 15%: 두 단어 조합
      const categories = Object.keys(components).filter(key => key !== 'suffixes');
      const category1 = categories[Math.floor(Math.random() * categories.length)];
      const category2 = categories[Math.floor(Math.random() * categories.length)];
      const word1 = components[category1 as keyof typeof components][Math.floor(Math.random() * components[category1 as keyof typeof components].length)];
      const word2 = components[category2 as keyof typeof components][Math.floor(Math.random() * components[category2 as keyof typeof components].length)];
      return word1 + word2;
    } else {
      // 15%: 단어만 (심플)
      const categories = Object.keys(components).filter(key => key !== 'suffixes');
      const randomCategory = categories[Math.floor(Math.random() * categories.length)];
      const word = components[randomCategory as keyof typeof components][Math.floor(Math.random() * components[randomCategory as keyof typeof components].length)];
      return word;
    }
  }

  /**
   * 닉네임 전역 중복 체크
   */
  private async checkNicknameExists(nickname: string): Promise<boolean> {
    try {
      const query = await this.db
        .collection('users')
        .where('profile.userName', '==', nickname)
        .limit(1)
        .get();
      
      return !query.empty;
    } catch (error) {
      console.warn(`닉네임 중복 체크 실패 (${nickname}):`, (error as Error).message);
      return false; // 오류 시 중복 없다고 가정
    }
  }

  /**
   * 학교별 봇 계정 생성
   */
  private async createBotsForSchool(
    schoolId: string, 
    schoolName: string, 
    botCount: number = 3,
    onProgress?: ProgressCallback
  ): Promise<BotCreationResult[]> {
    try {
      const schoolType = this.getSchoolType(schoolName);
      
      // 기존 봇 계정 확인
      const existingBotsQuery = await this.db
        .collection('users')
        .where('fake', '==', true)
        .where('schoolId', '==', schoolId)
        .get();
      
      const existingCount = existingBotsQuery.size;
      
      if (existingCount >= botCount) {
        console.log(`   ⚠️ ${schoolName}에 이미 ${existingCount}개의 봇이 있습니다. 건너뜁니다.`);
        return [];
      }
      
      const needToCreate = botCount - existingCount;
      console.log(`   📝 ${schoolName}: ${existingCount}개 존재, ${needToCreate}개 추가 생성`);
      
      const createdBots: BotCreationResult[] = [];

      for (let i = 1; i <= needToCreate; i++) {
        // Firebase 스타일 UID 생성
        const botId = await this.firebaseService.generateUniqueFirebaseUID();
        
        // 닉네임 생성 (전역 중복 방지)
        let nickname: string;
        let attempts = 0;
        do {
          nickname = this.generateNickname(schoolType);
          attempts++;
          
          // 1. 현재 학교 내 중복 체크
          const localDuplicate = createdBots.some(bot => bot.nickname === nickname);
          
          // 2. 전체 데이터베이스 중복 체크
          const globalDuplicate = await this.checkNicknameExists(nickname);
          
          if (!localDuplicate && !globalDuplicate) {
            break; // 중복 없음, 사용 가능
          }
        } while (attempts < 50);
        
        if (attempts >= 50) {
          console.warn(`⚠️ ${schoolName}: 유니크한 닉네임 생성 실패, 강제로 숫자 추가`);
          nickname = this.generateNickname(schoolType) + '_' + Date.now().toString().slice(-6);
        }

        // 봇 계정 데이터
        const botData = {
          uid: botId,
          email: `${botId}@bot.inschoolz.com`,
          role: 'student',
          status: 'active',
          isVerified: true,
          
          profile: {
            userName: nickname,
            realName: '',
            profileImageUrl: '',
            createdAt: this.FieldValue.serverTimestamp(),
            isAdmin: false
          },
          
          stats: {
            level: 1,
            totalExperience: 0,
            currentExp: 0,
            currentLevelRequiredXp: 100,
            postCount: 0,
            commentCount: 0,
            likeCount: 0,
            streak: 0
          },
          
          agreements: {
            terms: true,
            privacy: true,
            location: false,
            marketing: false
          },
          
          // 학교 정보
          schoolId: schoolId,
          schoolName: schoolName,
          schoolType: schoolType,
          
          // 봇 구분자
          fake: true,
          
          createdAt: this.FieldValue.serverTimestamp(),
          updatedAt: this.FieldValue.serverTimestamp()
        };

        // Firestore에 봇 계정 생성
        await this.db.collection('users').doc(botId).set(botData);
        
        createdBots.push({
          id: botId,
          nickname: nickname,
          schoolType: schoolType
        });

        console.log(`   ✅ 봇 생성: ${nickname} (${botId}) - ${schoolName}`);
        
        if (onProgress) {
          onProgress(i, needToCreate, `봇 계정 생성 중... (${i}/${needToCreate})`);
        }
      }

      return createdBots;
      
    } catch (error) {
      console.error(`❌ ${schoolName} 봇 생성 실패:`, error);
      return [];
    }
  }

  /**
   * 여러 학교에 대해 봇 계정 생성
   */
  public async createBotsForSchools(
    schoolLimit: number = 50, 
    botsPerSchool: number = 3,
    onProgress?: ProgressCallback
  ): Promise<BotCreationSummary> {
    try {
      console.log(`🤖 학교별 봇 계정 생성 시작...`);
      console.log(`📊 설정: ${schoolLimit}개 학교, 학교당 ${botsPerSchool}개 봇\n`);

      // 1단계: 봇이 있는 학교들 조회
      console.log('🔍 기존 봇이 있는 학교들 조회 중...');
      const existingBotsQuery = await this.db
        .collection('users')
        .where('fake', '==', true)
        .get();

      const schoolsWithBots = new Set<string>();
      existingBotsQuery.docs.forEach(doc => {
        const data = doc.data();
        if (data.schoolId) {
          schoolsWithBots.add(data.schoolId);
        }
      });

      console.log(`📊 이미 봇이 있는 학교: ${schoolsWithBots.size}개`);

      // 2단계: 전체 학교 목록 가져오기
      console.log('🏫 전체 학교 목록 조회 중...');
      const allSchoolsQuery = await this.db
        .collection('schools')
        .get();

      if (allSchoolsQuery.empty) {
        console.log('❌ 학교 데이터가 없습니다.');
        return {
          totalCreated: 0,
          summary: { elementary: 0, middle: 0, high: 0 },
          schoolsProcessed: 0
        };
      }

      // 3단계: 봇이 없는 학교들만 필터링
      const schoolsWithoutBots: Array<{id: string, name: string, address: string, region: string}> = [];
      allSchoolsQuery.docs.forEach(doc => {
        const data = doc.data();
        if (!schoolsWithBots.has(doc.id)) {
          schoolsWithoutBots.push({
            id: doc.id,
            name: data.KOR_NAME,
            address: data.ADDRESS,
            region: data.REGION || '서울'
          });
        }
      });

      console.log(`📊 봇이 없는 학교: ${schoolsWithoutBots.length}개`);

      if (schoolsWithoutBots.length === 0) {
        console.log('✅ 모든 학교에 이미 봇이 있습니다.');
        return {
          totalCreated: 0,
          summary: { elementary: 0, middle: 0, high: 0 },
          schoolsProcessed: 0
        };
      }

      // 4단계: 요청된 수만큼 학교 선택 (랜덤 셔플)
      const shuffledSchools = schoolsWithoutBots.sort(() => Math.random() - 0.5);
      const selectedSchools = shuffledSchools.slice(0, Math.min(schoolLimit, schoolsWithoutBots.length));

      console.log(`📋 선택된 학교: ${selectedSchools.length}개 (봇이 없는 학교 중에서 랜덤 선택)\n`);

      let totalCreated = 0;
      const summary = {
        elementary: 0,
        middle: 0,
        high: 0
      };

      // 각 학교별로 봇 생성
      for (let index = 0; index < selectedSchools.length; index++) {
        const school = selectedSchools[index];
        
        console.log(`🏫 [${index + 1}/${selectedSchools.length}] ${school.name} 처리 중...`);
        
        const createdBots = await this.createBotsForSchool(
          school.id, 
          school.name, 
          botsPerSchool
        );

        totalCreated += createdBots.length;

        // 학교 유형별 통계
        createdBots.forEach(bot => {
          summary[bot.schoolType as keyof typeof summary]++;
        });

        // 진행률 콜백 호출
        if (onProgress) {
          onProgress(index + 1, selectedSchools.length, `학교 처리 중... (${index + 1}/${selectedSchools.length})`);
        }
        
        // API 부하 방지를 위한 딜레이
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      // 최종 결과 출력
      console.log('🎉 봇 계정 생성 완료!\n');
      console.log('📊 생성 결과:');
      console.log(`   - 총 봇 계정: ${totalCreated}개`);
      console.log(`   - 초등학교 봇: ${summary.elementary}개`);
      console.log(`   - 중학교 봇: ${summary.middle}개`);
      console.log(`   - 고등학교 봇: ${summary.high}개`);
      console.log(`   - 처리된 학교: ${selectedSchools.length}개\n`);

      return {
        totalCreated,
        summary,
        schoolsProcessed: selectedSchools.length
      };

    } catch (error) {
      console.error('❌ 봇 계정 생성 프로세스 실패:', error);
      throw error;
    }
  }

  /**
   * 모든 봇 계정 삭제
   */
  public async deleteAllBots(onProgress?: ProgressCallback): Promise<BotDeletionResult> {
    try {
      console.log('🤖 모든 봇 계정 삭제 시작...\n');

      // 1단계: 모든 봇 계정 조회
      console.log('🔍 봇 계정 조회 중...');
      const botsQuery = await this.db
        .collection('users')
        .where('fake', '==', true)
        .get();

      if (botsQuery.empty) {
        console.log('📝 삭제할 봇 계정이 없습니다.');
        return { 
          deletedCount: 0,
          stats: { elementary: 0, middle: 0, high: 0, schoolsAffected: 0 }
        };
      }

      const totalBots = botsQuery.size;
      console.log(`📊 총 ${totalBots}개의 봇 계정을 찾았습니다.`);

      // 2단계: 봇별 통계 수집
      const stats = {
        elementary: 0,
        middle: 0,
        high: 0,
        schools: new Set<string>()
      };

      const botIds: string[] = [];
      botsQuery.docs.forEach(doc => {
        const data = doc.data();
        botIds.push(doc.id);
        
        if (data.schoolType) {
          stats[data.schoolType as keyof Omit<typeof stats, 'schools'>]++;
        }
        if (data.schoolId) {
          stats.schools.add(data.schoolId);
        }
      });

      console.log('📈 삭제 대상 봇 통계:');
      console.log(`   - 초등학교 봇: ${stats.elementary}개`);
      console.log(`   - 중학교 봇: ${stats.middle}개`);
      console.log(`   - 고등학교 봇: ${stats.high}개`);
      console.log(`   - 관련 학교: ${stats.schools.size}개\n`);

      // 3단계: 배치 삭제 실행
      console.log('🗑️  봇 계정 삭제 중...');
      let deletedCount = 0;

      await this.firebaseService.executeBatch(
        botIds,
        500, // Firestore 배치 제한
        async (batchIds: string[]) => {
          const batch = this.db.batch();
          
          batchIds.forEach(botId => {
            const botRef = this.db.collection('users').doc(botId);
            batch.delete(botRef);
          });

          await batch.commit();
          deletedCount += batchIds.length;
        },
        (processed, total) => {
          if (onProgress) {
            onProgress(processed, total, `봇 계정 삭제 중... (${processed}/${total}개 삭제됨)`);
          }
        }
      );

      console.log('\n🎉 모든 봇 계정 삭제 완료!');
      console.log('📊 삭제 결과:');
      console.log(`   - 삭제된 봇 계정: ${deletedCount}개`);
      console.log(`   - 초등학교 봇: ${stats.elementary}개`);
      console.log(`   - 중학교 봇: ${stats.middle}개`);
      console.log(`   - 고등학교 봇: ${stats.high}개`);
      console.log(`   - 영향받은 학교: ${stats.schools.size}개\n`);

      return {
        deletedCount,
        stats: {
          elementary: stats.elementary,
          middle: stats.middle,
          high: stats.high,
          schoolsAffected: stats.schools.size
        }
      };

    } catch (error) {
      console.error('❌ 봇 계정 삭제 실패:', error);
      throw error;
    }
  }

  /**
   * 봇이 작성한 게시글과 댓글도 함께 삭제
   */
  public async deleteBotsAndPosts(onProgress?: ProgressCallback): Promise<BotDeletionResult> {
    try {
      console.log('🤖 봇 계정 및 관련 데이터 삭제 시작...\n');

      // 1단계: 봇 계정 삭제
      const botResult = await this.deleteAllBots(onProgress);

      // 2단계: 봇이 작성한 게시글 삭제
      console.log('📝 봇이 작성한 게시글 삭제 중...');
      const postsQuery = await this.db
        .collection('posts')
        .where('fake', '==', true)
        .get();

      let deletedPosts = 0;
      const postIds: string[] = [];

      if (!postsQuery.empty) {
        const totalPosts = postsQuery.size;
        console.log(`📊 총 ${totalPosts}개의 봇 게시글을 찾았습니다.`);

        // 게시글 ID 수집
        postsQuery.docs.forEach(doc => {
          postIds.push(doc.id);
        });

        await this.firebaseService.executeBatch(
          postsQuery.docs,
          500,
          async (batchDocs) => {
            const batch = this.db.batch();
            
            batchDocs.forEach(doc => {
              batch.delete(doc.ref);
            });

            await batch.commit();
            deletedPosts += batchDocs.length;
          },
          (processed, total) => {
            const progress = (processed / total * 100).toFixed(1);
            console.log(`📈 게시글 삭제 진행률: ${progress}% (${processed}/${total}개)`);
          }
        );

        console.log(`✅ ${deletedPosts}개의 봇 게시글이 삭제되었습니다.`);
      } else {
        console.log('📝 삭제할 봇 게시글이 없습니다.');
      }

      // 3단계: AI 댓글 삭제
      console.log('\n💬 AI 댓글 삭제 중...');
      const commentsQuery = await this.db
        .collection('comments')
        .where('fake', '==', true)
        .get();

      let deletedComments = 0;

      if (!commentsQuery.empty) {
        const totalComments = commentsQuery.size;
        console.log(`📊 총 ${totalComments}개의 AI 댓글을 찾았습니다.`);

        await this.firebaseService.executeBatch(
          commentsQuery.docs,
          500,
          async (batchDocs) => {
            const batch = this.db.batch();
            
            batchDocs.forEach(doc => {
              batch.delete(doc.ref);
            });

            await batch.commit();
            deletedComments += batchDocs.length;
          },
          (processed, total) => {
            const progress = (processed / total * 100).toFixed(1);
            console.log(`📈 댓글 삭제 진행률: ${progress}% (${processed}/${total}개)`);
          }
        );

        console.log(`✅ ${deletedComments}개의 AI 댓글이 삭제되었습니다.`);
      } else {
        console.log('💬 삭제할 AI 댓글이 없습니다.');
      }

      // 4단계: 삭제된 게시글에 달린 일반 댓글 정리 (orphan 댓글 방지)
      if (postIds.length > 0) {
        console.log('\n🧹 삭제된 게시글의 orphan 댓글 정리 중...');
        
        let orphanComments = 0;

        await this.firebaseService.executeBatch(
          postIds,
          10, // postId로 쿼리하므로 작은 배치 사용
          async (batchPostIds: string[]) => {
            for (const postId of batchPostIds) {
              try {
                // 해당 게시글의 모든 댓글 조회 (fake가 아닌 일반 댓글들)
                const orphanQuery = await this.db
                  .collection('comments')
                  .where('postId', '==', postId)
                  .where('fake', '==', false)
                  .get();

                if (!orphanQuery.empty) {
                  const batch = this.db.batch();
                  orphanQuery.docs.forEach(doc => {
                    batch.delete(doc.ref);
                  });
                  await batch.commit();
                  
                  orphanComments += orphanQuery.size;
                  console.log(`   🗑️ 게시글 ${postId}의 orphan 댓글 ${orphanQuery.size}개 삭제`);
                }
              } catch (error) {
                console.warn(`⚠️ 게시글 ${postId}의 orphan 댓글 정리 실패:`, (error as Error).message);
              }
            }
          }
        );

        if (orphanComments > 0) {
          console.log(`✅ ${orphanComments}개의 orphan 댓글이 정리되었습니다.`);
        } else {
          console.log('✅ 정리할 orphan 댓글이 없습니다.');
        }
      }

      console.log('\n🎉 모든 봇 데이터 삭제 완료!');
      console.log('📊 최종 삭제 결과:');
      console.log(`   - 삭제된 봇 계정: ${botResult.deletedCount}개`);
      console.log(`   - 삭제된 봇 게시글: ${deletedPosts}개`);
      console.log(`   - 삭제된 AI 댓글: ${deletedComments}개`);
      
      return {
        ...botResult,
        deletedPosts,
        deletedComments
      };

    } catch (error) {
      console.error('❌ 봇 데이터 삭제 실패:', error);
      throw error;
    }
  }

  /**
   * 기존 봇 계정 통계 조회
   */
  public async getBotStats(): Promise<{
    total: number;
    byType: { elementary: number; middle: number; high: number };
    bySchool: Record<string, number>;
  }> {
    try {
      console.log('📊 기존 봇 계정 현황 조회...\n');

      const botsQuery = await this.db
        .collection('users')
        .where('fake', '==', true)
        .get();

      if (botsQuery.empty) {
        console.log('✅ 기존 봇 계정이 없습니다.\n');
        return { total: 0, byType: { elementary: 0, middle: 0, high: 0 }, bySchool: {} };
      }

      const stats = {
        total: botsQuery.size,
        byType: { elementary: 0, middle: 0, high: 0 },
        bySchool: {} as Record<string, number>
      };

      botsQuery.docs.forEach(doc => {
        const data = doc.data();
        const schoolType = data.schoolType || 'middle';
        const schoolName = data.schoolName || '알 수 없는 학교';

        stats.byType[schoolType as keyof typeof stats.byType]++;
        
        if (!stats.bySchool[schoolName]) {
          stats.bySchool[schoolName] = 0;
        }
        stats.bySchool[schoolName]++;
      });

      console.log('📈 현재 봇 계정 현황:');
      console.log(`   - 총 봇 계정: ${stats.total}개`);
      console.log(`   - 초등학교 봇: ${stats.byType.elementary}개`);
      console.log(`   - 중학교 봇: ${stats.byType.middle}개`);
      console.log(`   - 고등학교 봇: ${stats.byType.high}개\n`);

      return stats;

    } catch (error) {
      console.error('❌ 봇 통계 조회 실패:', error);
      return { total: 0, byType: { elementary: 0, middle: 0, high: 0 }, bySchool: {} };
    }
  }
}

export default BotService;
