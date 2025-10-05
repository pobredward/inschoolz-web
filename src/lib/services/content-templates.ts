/**
 * 학교 커뮤니티 게시글 템플릿 및 주제 생성기
 * scripts/content-templates.js 로직을 TypeScript로 이관
 */

interface Template {
  category: string;
  topics: string[];
  tones: string[];
}

interface TopicResult {
  topic: string;
  tone: string;
  category: string;
  schoolName: string;
  region: string;
  schoolType: 'elementary' | 'middle' | 'high';
}

export class ContentTemplates {
  private templates: Record<string, Template[]>;

  constructor() {
    this.templates = {
      자유게시판: this.getFreeboardTemplates(),
      정보공유: this.getInfoTemplates(),
      질문: this.getQuestionTemplates()
    };
  }

  /**
   * 자유게시판 템플릿
   */
  private getFreeboardTemplates(): Template[] {
    return [
      {
        category: '학교생활',
        topics: [
          '오늘 점심시간에 있었던 일',
          '우리 학교만의 특별한 전통',
          '가장 기억에 남는 학교 행사',
          '친구들과의 재미있는 에피소드',
          '학교에서 가장 좋아하는 장소',
          '선생님들의 특이한 습관',
          '교복 관련 이야기',
          '학교 급식 후기',
          '동아리 활동 후기',
          '체육시간 에피소드'
        ],
        tones: ['친근한', '유머러스한', '감성적인', '일상적인']
      },
      {
        category: '계절/날씨',
        topics: [
          '봄 소풍 준비하는 이야기',
          '여름 방학 계획',
          '가을 운동회 추억',
          '겨울 눈 오는 날 학교',
          '비 오는 날 학교생활',
          '더운 여름 교실 이야기',
          '추운 겨울 등교길',
          '벚꽃 피는 학교 풍경'
        ],
        tones: ['서정적인', '감성적인', '활기찬']
      },
      {
        category: '취미/관심사',
        topics: [
          '요즘 하고 있는 게임',
          '좋아하는 K-POP 아이돌',
          '최근 본 드라마/영화',
          '읽고 있는 웹툰/소설',
          '취미 생활 이야기',
          '운동 관련 이야기',
          '음악 추천',
          '책 추천'
        ],
        tones: ['열정적인', '추천하는', '공유하는']
      }
    ];
  }

  /**
   * 정보공유 템플릿
   */
  private getInfoTemplates(): Template[] {
    return [
      {
        category: '학습정보',
        topics: [
          '효과적인 공부 방법',
          '시험 준비 팁',
          '과목별 학습 노하우',
          '집중력 높이는 방법',
          '노트 정리 방법',
          '암기 요령',
          '문제집 추천',
          '인터넷 강의 후기'
        ],
        tones: ['도움이 되는', '경험 공유하는', '조언하는']
      },
      {
        category: '학교시설',
        topics: [
          '도서관 이용 팁',
          '컴퓨터실 사용법',
          '체육관 시설 안내',
          '매점 이용 시간',
          '화장실 위치 정보',
          '주차장 이용 안내',
          '교내 Wi-Fi 연결법',
          '프린터 사용법'
        ],
        tones: ['안내하는', '친절한', '실용적인']
      },
      {
        category: '주변정보',
        topics: [
          '학교 근처 맛집 추천',
          '문구점 정보',
          '카페 추천',
          '편의점 위치',
          '버스 정류장 안내',
          '지하철역 가는 길',
          '학원가 정보',
          '병원 위치'
        ],
        tones: ['추천하는', '상세한', '유용한']
      }
    ];
  }

  /**
   * 질문 템플릿
   */
  private getQuestionTemplates(): Template[] {
    return [
      {
        category: '학교생활',
        topics: [
          '동아리 선택 고민',
          '친구 사귀는 방법',
          '선생님께 질문하는 법',
          '학교 행사 참여 방법',
          '교복 구매 문의',
          '급식 메뉴 문의',
          '시간표 관련 질문',
          '학교 규칙 문의'
        ],
        tones: ['궁금한', '고민하는', '도움 요청하는']
      },
      {
        category: '학습관련',
        topics: [
          '어려운 과목 공부법',
          '진로 선택 고민',
          '성적 향상 방법',
          '과제 도움 요청',
          '시험 범위 문의',
          '참고서 추천 요청',
          '스터디 그룹 모집',
          '과외 정보 문의'
        ],
        tones: ['진지한', '간절한', '협력적인']
      },
      {
        category: '일상고민',
        topics: [
          '고민 상담 요청',
          '스트레스 해소법',
          '시간 관리 방법',
          '건강 관리 팁',
          '용돈 관리법',
          '취미 추천 요청',
          '운동 방법 문의',
          '독서 추천 요청'
        ],
        tones: ['진솔한', '고민하는', '조언 구하는']
      }
    ];
  }

  /**
   * 랜덤 템플릿 선택
   */
  public getRandomTemplate(postType: string): { category: string; topic: string; tone: string } {
    const templates = this.templates[postType] || this.templates['자유게시판'];
    const randomCategory = templates[Math.floor(Math.random() * templates.length)];
    const randomTopic = randomCategory.topics[Math.floor(Math.random() * randomCategory.topics.length)];
    const randomTone = randomCategory.tones[Math.floor(Math.random() * randomCategory.tones.length)];

    return {
      category: randomCategory.category,
      topic: randomTopic,
      tone: randomTone
    };
  }

  /**
   * 학교 타입별 특화 주제 생성
   */
  public getSchoolSpecificTopics(schoolType: 'elementary' | 'middle' | 'high'): string[] {
    const specificTopics = {
      elementary: [
        '급식시간 이야기',
        '방과후 활동',
        '현장학습 후기',
        '운동회 준비',
        '친구들과 놀이',
        '선생님과의 추억'
      ],
      middle: [
        '중간고사 준비',
        '동아리 활동',
        '체육대회 이야기',
        '수학여행 계획',
        '진로 탐색',
        '친구 관계 고민'
      ],
      high: [
        '수능 준비',
        '대학 입시 정보',
        '진로 선택',
        '취업 준비',
        '동아리 활동',
        '축제 준비',
        '졸업 준비'
      ]
    };

    return specificTopics[schoolType] || specificTopics['middle'];
  }

  /**
   * 지역별 특화 주제 생성
   */
  public getRegionSpecificTopics(region: string): string {
    const regionKeywords: Record<string, string[]> = {
      '서울': ['지하철', '버스', '도심', '한강'],
      '부산': ['바다', '해운대', '부산역', '국제시장'],
      '대구': ['동성로', '팔공산', '대구역'],
      '인천': ['인천공항', '차이나타운', '송도'],
      '광주': ['무등산', '광주역', '상무지구'],
      '대전': ['유성', '대전역', '엑스포'],
      '울산': ['현대', '태화강', '울산역'],
      '세종': ['세종시', '정부청사', '호수공원'],
      '경기': ['수도권', '전철', '신도시'],
      '강원': ['산', '스키장', '바다', '자연'],
      '충북': ['청주', '충주', '제천'],
      '충남': ['천안', '아산', '공주'],
      '전북': ['전주', '한옥마을', '비빔밥'],
      '전남': ['목포', '여수', '순천'],
      '경북': ['경주', '안동', '포항'],
      '경남': ['창원', '진주', '통영'],
      '제주': ['한라산', '바다', '관광지', '감귤']
    };

    const keywords = regionKeywords[region] || ['우리 지역'];
    return keywords[Math.floor(Math.random() * keywords.length)];
  }

  /**
   * 시간대별 주제 생성
   */
  public getTimeBasedTopics(): string[] {
    const hour = new Date().getHours();
    
    if (hour >= 6 && hour < 9) {
      return ['등교길 이야기', '아침 일찍 일어나기', '조회시간 이야기'];
    } else if (hour >= 9 && hour < 12) {
      return ['1교시 수업', '쉬는시간 이야기', '오전 수업 후기'];
    } else if (hour >= 12 && hour < 14) {
      return ['점심시간', '급식 후기', '친구들과 점심'];
    } else if (hour >= 14 && hour < 17) {
      return ['오후 수업', '체육시간', '동아리 활동'];
    } else if (hour >= 17 && hour < 20) {
      return ['하교길', '방과후 활동', '학원 가는 길'];
    } else {
      return ['저녁 시간', '숙제하기', '내일 준비'];
    }
  }

  /**
   * 계절별 주제 생성
   */
  public getSeasonalTopics(): string[] {
    const month = new Date().getMonth() + 1;
    
    if (month >= 3 && month <= 5) {
      return ['봄 소풍', '벚꽃 구경', '새 학기 시작', '체육대회'];
    } else if (month >= 6 && month <= 8) {
      return ['여름 방학', '수영장', '에어컨', '시원한 음료'];
    } else if (month >= 9 && month <= 11) {
      return ['가을 운동회', '단풍 구경', '중간고사', '수학여행'];
    } else {
      return ['겨울 방학', '눈 오는 날', '기말고사', '크리스마스'];
    }
  }

  /**
   * 종합 주제 생성기
   */
  public generateComprehensiveTopic(
    schoolName: string, 
    region: string, 
    schoolType: 'elementary' | 'middle' | 'high', 
    postType: string = '자유게시판'
  ): TopicResult {
    const template = this.getRandomTemplate(postType);
    const schoolSpecific = this.getSchoolSpecificTopics(schoolType);
    const regionSpecific = this.getRegionSpecificTopics(region);
    const timeBased = this.getTimeBasedTopics();
    const seasonal = this.getSeasonalTopics();

    // 랜덤하게 다양한 요소 조합
    const elements = [
      template.topic,
      ...schoolSpecific,
      regionSpecific,
      ...timeBased,
      ...seasonal
    ];

    const selectedTopic = elements[Math.floor(Math.random() * elements.length)];

    return {
      topic: selectedTopic,
      tone: template.tone,
      category: template.category,
      schoolName,
      region,
      schoolType
    };
  }
}

export default ContentTemplates;
