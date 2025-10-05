import { NextRequest, NextResponse } from 'next/server';

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const body = await request.json();
    const { title, content, authorNickname } = body;

    // 입력 검증
    if (!title?.trim() || !content?.trim()) {
      return NextResponse.json(
        { success: false, error: '제목과 내용은 필수입니다.' },
        { status: 400 }
      );
    }

    // 임시로 성공 응답 반환 (실제 Firebase 연동은 추후)
    console.log(`✅ AI 게시글 수정 요청: ${id}`, {
      title: title.trim(),
      content: content.trim(),
      authorNickname: authorNickname?.trim() || '익명'
    });

    return NextResponse.json({
      success: true,
      message: 'AI 게시글이 수정되었습니다.',
      data: {
        id,
        title: title.trim(),
        content: content.trim(),
        authorNickname: authorNickname?.trim() || '익명',
        updatedAt: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('AI 게시글 수정 오류:', error);
    return NextResponse.json(
      { success: false, error: `게시글 수정 중 오류가 발생했습니다: ${error.message}` },
      { status: 500 }
    );
  }
}
