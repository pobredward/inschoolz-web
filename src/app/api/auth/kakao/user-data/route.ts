import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function GET(request: NextRequest) {
  try {
    const cookieStore = cookies();
    const kakaoUserDataCookie = cookieStore.get('kakao_user_data');

    if (!kakaoUserDataCookie) {
      return NextResponse.json(
        { error: '카카오 사용자 데이터를 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    const userData = JSON.parse(kakaoUserDataCookie.value);
    
    // 쿠키에서 데이터를 가져온 후 삭제 (보안)
    cookieStore.delete('kakao_user_data');

    return NextResponse.json(userData);

  } catch (error) {
    console.error('카카오 사용자 데이터 가져오기 오류:', error);
    return NextResponse.json(
      { error: '사용자 데이터 처리 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
