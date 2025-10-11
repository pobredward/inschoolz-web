import { NextRequest, NextResponse } from 'next/server';
import { PostService } from '@/lib/services/post-service';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { schoolLimit = 10, postsPerSchool = 1, delayBetweenPosts = 3000 } = body;

    console.log('🚀 AI 게시글 생성 시작 (개선된 PostService 사용):', { 
      schoolLimit, 
      postsPerSchool, 
      delayBetweenPosts 
    });

    const postService = new PostService();
    
    // 백그라운드에서 실행
    postService.generatePostsForSchools(schoolLimit, postsPerSchool, delayBetweenPosts)
      .then((result) => {
        console.log(`✅ 백그라운드 생성 완료: ${result.totalGenerated}개 게시글`);
        console.log(`📊 학교 통계 - 초등: ${result.summary.elementary}, 중학: ${result.summary.middle}, 고등: ${result.summary.high}`);
      })
      .catch((error) => {
        console.error('❌ 백그라운드 생성 실패:', error);
      });
    
    return NextResponse.json({
      success: true,
      message: 'AI 게시글 생성이 백그라운드에서 시작되었습니다. (개선된 PostService 사용 - JSON 스키마, 다양성, 메타 로깅 적용)',
      config: {
        schoolLimit,
        postsPerSchool,
        delayBetweenPosts,
        expectedPosts: schoolLimit * postsPerSchool
      },
      features: [
        'JSON 스키마 기반 안정적 출력',
        '다양성 옵션 (재미있는 썰 20%, 참여 질문 30%)',
        '메타 로깅 (프롬프트 버전, 정책 통과 여부)',
        '재시도 로직 및 안전장치'
      ]
    });

  } catch (error) {
    console.error('AI 게시글 생성 API 오류:', error);
    return NextResponse.json(
      { success: false, error: `AI 게시글 생성을 시작할 수 없습니다: ${error instanceof Error ? error.message : 'Unknown error'}` },
      { status: 500 }
    );
  }
}
