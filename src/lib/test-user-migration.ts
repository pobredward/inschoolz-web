import { convertLegacyUserToNewStructure, convertNewUserToLegacyStructure } from './user-compatibility';
import { User } from '@/types';

/**
 * 사용자 데이터 마이그레이션 테스트
 */
export function testUserMigration() {
  console.log('🧪 사용자 데이터 마이그레이션 테스트 시작...');
  
  // 기존 사용자 데이터 (예시)
  const legacyUser = {
    uid: 'test-user-123',
    email: 'test@example.com',
    role: 'student',
    isVerified: true,
    profile: {
      userName: 'testuser',
      realName: '테스트유저',
      gender: '남성',
      birthYear: 2005,
      birthMonth: 3,
      birthDay: 15,
      phoneNumber: '010-1234-5678',
      profileImageUrl: 'https://example.com/profile.jpg',
      createdAt: 1640995200000,
      isAdmin: false,
      termsAgreed: true,
      privacyAgreed: true,
      locationAgreed: true,
      marketingAgreed: false,
      schoolId: 'school-123',
      schoolName: '테스트고등학교',
      province: '서울특별시',
      city: '강남구',
    },
    school: {
      id: 'school-123',
      name: '테스트고등학교',
      grade: '2',
      classNumber: '3',
      studentNumber: '15',
      isGraduate: false,
    },
    regions: {
      sido: '서울특별시',
      sigungu: '강남구',
      address: '테헤란로 123',
    },
    stats: {
      level: 5,
      currentExp: 250,
      totalXP: 1500,
      postCount: 10,
      commentCount: 25,
      likeCount: 100,
      streak: 7,
    },
    createdAt: 1640995200000,
    updatedAt: 1640995200000,
  };

  try {
    // 1. 기존 구조 → 새로운 구조 변환
    const newUser = convertLegacyUserToNewStructure(legacyUser);
    console.log('✅ 기존 구조 → 새로운 구조 변환 성공');
    console.log('새로운 구조:', {
      uid: newUser.uid,
      email: newUser.email,
      profile: newUser.profile,
      school: newUser.school,
      regions: newUser.regions,
      stats: newUser.stats,
      agreements: newUser.agreements,
    });

    // 2. 새로운 구조 → 기존 구조 변환 (역방향)
    const backToLegacy = convertNewUserToLegacyStructure(newUser);
    console.log('✅ 새로운 구조 → 기존 구조 변환 성공');
    console.log('기존 구조로 복원:', {
      uid: backToLegacy.uid,
      email: backToLegacy.email,
      profile: backToLegacy.profile,
      school: backToLegacy.school,
      regions: backToLegacy.regions,
      stats: backToLegacy.stats,
    });

    // 3. 데이터 무결성 검증
    const isValid = validateUserDataIntegrity(legacyUser, newUser, backToLegacy);
    if (isValid) {
      console.log('✅ 데이터 무결성 검증 통과');
    } else {
      console.log('❌ 데이터 무결성 검증 실패');
    }

    return { success: true, newUser, backToLegacy };
  } catch (error) {
    console.error('❌ 테스트 실패:', error);
    return { success: false, error: error instanceof Error ? error.message : '알 수 없는 오류' };
  }
}

/**
 * 데이터 무결성 검증
 */
function validateUserDataIntegrity(original: any, converted: User, restored: any): boolean {
  try {
    // 기본 정보 검증
    if (original.uid !== converted.uid || converted.uid !== restored.uid) {
      console.error('UID 불일치');
      return false;
    }

    if (original.email !== converted.email || converted.email !== restored.email) {
      console.error('이메일 불일치');
      return false;
    }

    // 프로필 정보 검증
    if (original.profile.userName !== converted.profile.userName) {
      console.error('사용자명 불일치');
      return false;
    }

    if (original.profile.realName !== converted.profile.realName) {
      console.error('실명 불일치');
      return false;
    }

    // 통계 정보 검증
    if (original.stats.level !== converted.stats.level) {
      console.error('레벨 불일치');
      return false;
    }

    if (original.stats.currentExp !== converted.stats.experience) {
      console.error('현재 경험치 불일치');
      return false;
    }

    if (original.stats.totalXP !== converted.stats.totalExperience) {
      console.error('총 경험치 불일치');
      return false;
    }

    // 약관 동의 검증
    if (original.profile.termsAgreed !== converted.agreements.terms) {
      console.error('이용약관 동의 불일치');
      return false;
    }

    if (original.profile.privacyAgreed !== converted.agreements.privacy) {
      console.error('개인정보 동의 불일치');
      return false;
    }

    return true;
  } catch (error) {
    console.error('검증 중 오류:', error);
    return false;
  }
}

/**
 * 개발 환경에서 테스트 실행
 */
if (process.env.NODE_ENV === 'development') {
  // testUserMigration(); // 필요시 주석 해제
} 