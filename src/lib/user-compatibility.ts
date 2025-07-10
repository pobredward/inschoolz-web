import { User, FormDataType } from '@/types';

/**
 * 기존 FormData 구조를 새로운 구조로 변환
 */
export function convertFormDataToNewStructure(oldFormData: any): FormDataType {
  return {
    userName: oldFormData.userName || '',
    email: oldFormData.email || '',
    password: oldFormData.password || '',
    passwordConfirm: oldFormData.passwordConfirm || '',
    realName: oldFormData.realName || '',
    gender: oldFormData.gender || '',
    birthYear: oldFormData.birthYear || '',
    birthMonth: oldFormData.birthMonth || '',
    birthDay: oldFormData.birthDay || '',
    phone: oldFormData.phoneNumber || oldFormData.phone || '',
    verificationCode: oldFormData.verificationCode || '',
    referral: oldFormData.referral || '',
    
    // 학교 정보 변환
    school: oldFormData.school?.id || oldFormData.school || '',
    schoolName: oldFormData.school?.name || oldFormData.schoolName || '',
    grade: oldFormData.school?.grade || oldFormData.grade || '',
    classNumber: oldFormData.school?.classNumber || oldFormData.classNumber || '',
    studentNumber: oldFormData.school?.studentNumber || oldFormData.studentNumber || '',
    favoriteSchools: oldFormData.favoriteSchools || [],
    
    // 지역 정보 변환
    province: oldFormData.regions?.sido || oldFormData.province || '',
    city: oldFormData.regions?.sigungu || oldFormData.city || '',
    
    // 약관 동의 변환
    termsAgreed: oldFormData.agreements?.terms || oldFormData.termsAgreed || false,
    privacyAgreed: oldFormData.agreements?.privacy || oldFormData.privacyAgreed || false,
    locationAgreed: oldFormData.agreements?.location || oldFormData.locationAgreed || false,
    marketingAgreed: oldFormData.agreements?.marketing || oldFormData.marketingAgreed || false,
    
    // 프로필 이미지
    profileImage: oldFormData.profileImage || null,
    
    interests: oldFormData.interests || [],
  };
}

/**
 * 새로운 FormData 구조를 기존 구조로 변환 (역방향)
 */
export function convertNewStructureToFormData(newFormData: FormDataType): any {
  return {
    userName: newFormData.userName,
    email: newFormData.email,
    password: newFormData.password,
    passwordConfirm: newFormData.passwordConfirm,
    realName: newFormData.realName,
    gender: newFormData.gender,
    birthYear: parseInt(newFormData.birthYear) || 0,
    birthMonth: parseInt(newFormData.birthMonth) || 0,
    birthDay: parseInt(newFormData.birthDay) || 0,
    phoneNumber: newFormData.phone,
    verificationCode: newFormData.verificationCode,
    referral: newFormData.referral,
    
    // 학교 정보 구조화
    school: {
      id: newFormData.school,
      name: newFormData.schoolName,
      grade: newFormData.grade,
      classNumber: newFormData.classNumber,
      studentNumber: newFormData.studentNumber,
      isGraduate: false,
    },
    favoriteSchools: newFormData.favoriteSchools,
    
    // 지역 정보 구조화
    regions: {
      sido: newFormData.province,
      sigungu: newFormData.city,
      address: '',
    },
    
    // 약관 동의 구조화
    agreements: {
      terms: newFormData.termsAgreed,
      privacy: newFormData.privacyAgreed,
      location: newFormData.locationAgreed,
      marketing: newFormData.marketingAgreed,
    },
    
    // 프로필 이미지
    profileImage: newFormData.profileImage,
    
    interests: newFormData.interests,
  };
}

/**
 * 기존 사용자 데이터를 새로운 구조로 변환
 */
export function convertLegacyUserToNewStructure(legacyUser: any): User {
  return {
    uid: legacyUser.uid,
    email: legacyUser.email,
    role: legacyUser.role || 'student',
    isVerified: legacyUser.isVerified || false,
    
    profile: {
      userName: legacyUser.profile?.userName || legacyUser.userName || '',
      realName: legacyUser.profile?.realName || '',
      gender: legacyUser.profile?.gender || '',
      birthYear: legacyUser.profile?.birthYear || 0,
      birthMonth: legacyUser.profile?.birthMonth || 0,
      birthDay: legacyUser.profile?.birthDay || 0,
      phoneNumber: legacyUser.profile?.phoneNumber || legacyUser.profile?.phone || '',
      profileImageUrl: legacyUser.profile?.profileImageUrl || '',
      createdAt: legacyUser.profile?.createdAt || legacyUser.createdAt || Date.now(),
      isAdmin: legacyUser.profile?.isAdmin || false,
    },
    
    school: legacyUser.school ? {
      id: legacyUser.school.id || '',
      name: legacyUser.school.name || legacyUser.school.schoolName || '',
      grade: legacyUser.school.grade || '',
      classNumber: legacyUser.school.classNumber || '',
      studentNumber: legacyUser.school.studentNumber || '',
      isGraduate: legacyUser.school.isGraduate || false,
    } : undefined,
    
    regions: legacyUser.regions ? {
      sido: legacyUser.regions.sido || legacyUser.regions.province || '',
      sigungu: legacyUser.regions.sigungu || legacyUser.regions.city || '',
      address: legacyUser.regions.address || '',
    } : undefined,
    
    stats: {
      level: legacyUser.stats?.level || 1,
      experience: legacyUser.stats?.experience || legacyUser.stats?.currentExp || 0,
      totalExperience: legacyUser.stats?.totalExperience || legacyUser.stats?.totalXP || 0,
      postCount: legacyUser.stats?.postCount || 0,
      commentCount: legacyUser.stats?.commentCount || 0,
      likeCount: legacyUser.stats?.likeCount || 0,
      streak: legacyUser.stats?.streak || 0,
    },
    
    gameStats: legacyUser.gameStats,
    
    agreements: {
      terms: legacyUser.agreements?.terms || legacyUser.profile?.termsAgreed || false,
      privacy: legacyUser.agreements?.privacy || legacyUser.profile?.privacyAgreed || false,
      location: legacyUser.agreements?.location || legacyUser.profile?.locationAgreed || false,
      marketing: legacyUser.agreements?.marketing || legacyUser.profile?.marketingAgreed || false,
    },
    
    createdAt: legacyUser.createdAt || Date.now(),
    updatedAt: legacyUser.updatedAt || Date.now(),
    lastLoginAt: legacyUser.lastLoginAt,
    referrerId: legacyUser.referrerId,
  };
}

/**
 * 새로운 사용자 구조를 기존 구조로 변환 (역방향)
 */
export function convertNewUserToLegacyStructure(newUser: User): any {
  return {
    uid: newUser.uid,
    email: newUser.email,
    role: newUser.role,
    isVerified: newUser.isVerified,
    
    profile: {
      userName: newUser.profile.userName,
      realName: newUser.profile.realName,
      gender: newUser.profile.gender,
      birthYear: newUser.profile.birthYear,
      birthMonth: newUser.profile.birthMonth,
      birthDay: newUser.profile.birthDay,
      phoneNumber: newUser.profile.phoneNumber,
      phone: newUser.profile.phoneNumber, // 호환성
      profileImageUrl: newUser.profile.profileImageUrl,
      createdAt: newUser.profile.createdAt,
      isAdmin: newUser.profile.isAdmin,
      
      // 기존 약관 필드들 (호환성)
      termsAgreed: newUser.agreements.terms,
      privacyAgreed: newUser.agreements.privacy,
      locationAgreed: newUser.agreements.location,
      marketingAgreed: newUser.agreements.marketing,
      
      // 기존 학교/지역 필드들 (호환성)
      schoolId: newUser.school?.id,
      schoolName: newUser.school?.name,
      province: newUser.regions?.sido,
      city: newUser.regions?.sigungu,
    },
    
    school: newUser.school,
    regions: newUser.regions,
    
    stats: {
      level: newUser.stats.level,
      experience: newUser.stats.experience,
      currentExp: newUser.stats.experience, // 호환성
      totalExperience: newUser.stats.totalExperience,
      totalXP: newUser.stats.totalExperience, // 호환성
      currentXP: newUser.stats.experience, // 호환성
      postCount: newUser.stats.postCount,
      commentCount: newUser.stats.commentCount,
      likeCount: newUser.stats.likeCount,
      streak: newUser.stats.streak,
    },
    
    gameStats: newUser.gameStats,
    agreements: newUser.agreements,
    
    createdAt: newUser.createdAt,
    updatedAt: newUser.updatedAt,
    lastLoginAt: newUser.lastLoginAt,
    referrerId: newUser.referrerId,
  };
} 