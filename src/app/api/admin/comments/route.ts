import { NextRequest, NextResponse } from 'next/server';
import * as admin from 'firebase-admin';

// Firebase Admin SDK 초기화
if (admin.apps.length === 0) {
  const serviceAccount = {
    type: 'service_account',
    project_id: 'inschoolz',
    private_key_id: 'c275cfa0f454d6f4b89a11aa523712b845a772fb',
    private_key: '-----BEGIN PRIVATE KEY-----\nMIIEuwIBADANBgkqhkiG9w0BAQEFAASCBKUwggShAgEAAoIBAQDjNSkxYSc4W8hz\nSYiL0YKRJrDbE8oqrusQ7q2VNv4+trKEZlb4+L2wejXYfuBx2mtEA98klHz+msAA\n4IvDZd5780xFTRML7flTVdnnPfREI/JjRot3PJgBXlGy8gCH/URDx4TurxaU0w6k\nwRAL9uOYurMmggHEpn2T8B4ZAX4cEqWECtHI+/YxhZAs0vdbha1LQXOwMmzg/5lX\nt7qQhGsfs+hgUloZCGw/9LPHzbCUPoN9A9qQmpt1egzTwuk6VBlTcxiGmvxP5Bob\nktlXU2hOoClBZd/VmGJT6RYWHekpWhfKrPyNKk8704UNyQKOeBX9Xb4aUq0KrX1O\nJ3ErYbI5AgMBAAECggEAFs+P2tZJ2BMBlUQtAk8+0DsrMa4onjprfTVelgbXEGLK\nmheljwoiDpARId2IbnB4U8lzuLoeW81w42Wn19k9X1e2MOr5COSTzeBmUnIE47vG\n1QgQbnXV6PqYMeKxV6B/dF1D+laiahSlJA4CAhbVE3tYYHsC7xmsApND4kzPusTw\nDae1Xguw1Og+WA7YMRnjqlyHUBHmIzbQ9vUGKZP12H2UQVAItMtKepyEh5lWMGfG\nTJ0FUnbodqHExDJVPgC93ajU2u1aHRHcEJBGKfbs4c6DJsuQ8WLewTjN97uzXe3n\nSBa4A2CRy9gfQ/LYpjOWkxyUjzoR/z9vEc0QAGOalQKBgQDymGHa7V7RlylVClr+\nt27g0aJ0+bpO+5u7dZwONd2yv9Yr53wxDQ5aAIIOD8ugzKFtx0CYqJPeaC24JLrE\ncDYx3cNrQRjBFpywGqxN+Yp1PDBjEVbSv3Bfwvr5qA/8bjPjeITs723J0U1fM0fT\nMWEHC2atqd58bIvJy7xtxIjsTwKBgQDvwx1MLdzQVNrq9cGdKHM2tZv5DECm9rFg\ngV7z/FwrYZZm+6IWi93g5APH3L3+imnDliuPA/32CzN6rAg0Vuyw4enWPOBIYlPi\noINNJMF1kOkNHhgqbMJdUkRSwAhvUeFa+4jsomVIgmdQ0WIFyEjedv9j6rdmm/mW\ng5fUaNiu9wJ/EvPUsUXaIoWstPgaI8ww3V+DUaAw7fq6L+sARhvvNgfGs6diDHL4\nrA9eGbsiLW3PLsRiR4rkAnwhFkHIVZBuq3anzblINc2OcDOlQnI8XuxU22h/X/eU\nz+ZrtRVsKkxxwVOpDtmluh6f7NAUzGsPKX26h9a9ivrv8NP55Jl2GQKBgBrEyP+Z\nWz7zSmHTQGOggYSJMDnVEV7SyikBKK3K7it1wMoMrCMiSIp0SqvEzH2fzIEmwgQ8\nqN0QkRXQITZewhxZjLb7ovrR55W04BP715GdtTdetcn+zJCIv9IRWJ+9H5D95mKt\nGuvGi2xthCkrHF+iH49zRDizj2Erngb8Eb0vAoGBANZh79dagXDCRep2+ZIc/4f1\nRRoDQLMZ2+yWeRyJjA3fa1x5yBOicDKCACchmFNBPoYni1fMNttofa1ljG+Ekz0h\nwGrDmyZ1a7ChcdCwZmkGuhlfdTiqrPTLUum5acOGH4bcyzcQlkjOULVPUEj3CM6H\n5yYTJVEjbc/8BPSFqu5n\n-----END PRIVATE KEY-----\n',
    client_email: 'firebase-adminsdk-p6trg@inschoolz.iam.gserviceaccount.com',
    client_id: '109288666163900087649',
    auth_uri: 'https://accounts.google.com/o/oauth2/auth',
    token_uri: 'https://oauth2.googleapis.com/token',
    auth_provider_x509_cert_url: 'https://www.googleapis.com/oauth2/v1/certs',
    client_x509_cert_url: 'https://www.googleapis.com/robot/v1/metadata/x509/firebase-adminsdk-p6trg%40inschoolz.iam.gserviceaccount.com',
    universe_domain: 'googleapis.com'
  };

  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount as admin.ServiceAccount),
    databaseURL: 'https://inschoolz-default-rtdb.asia-southeast1.firebasedatabase.app'
  });
}

interface Comment {
  id: string;
  postId: string;
  content: string;
  authorId: string;
  authorNickname: string;
  postTitle: string;
  schoolName: string;
  schoolId: string;
  createdAt: string;
  fake: boolean;
}

/**
 * GET /api/admin/comments
 * AI 생성 댓글 목록 조회 (관리자 검토용)
 */
export async function GET(request: NextRequest) {
  try {
    console.log('💬 AI 댓글 목록 조회 시작');

    const db = admin.firestore();

    // URL 파라미터 파싱
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const status = searchParams.get('status') || 'all'; // all, pending, approved, rejected
    
    const offset = (page - 1) * limit;

    // AI 댓글 조회 (fake: true)
    let query = db.collection('comments').where('fake', '==', true);

    // 상태별 필터링 (승인 관련 필터링 제거)
    // 모든 AI 댓글을 표시

    // 댓글 조회 (인덱스 문제를 피하기 위해 orderBy 제거)
    const snapshot = await query.limit(limit + offset).get();
    
    // 페이지네이션을 위한 수동 슬라이싱
    const allDocs = snapshot.docs.slice(offset, offset + limit);
    
    const comments: Comment[] = [];
    
    for (const doc of allDocs) {
      const data = doc.data();
      
      // 게시글 정보 조회
      let postTitle = '게시글 제목 없음';
      let schoolName = '학교 정보 없음';
      let schoolId = '';
      
      try {
        if (data.postId) {
          const postDoc = await db.collection('posts').doc(data.postId).get();
          if (postDoc.exists) {
            const postData = postDoc.data();
            postTitle = postData?.title || '제목 없음';
            schoolId = postData?.schoolId || '';
            
            // 학교 정보 조회
            if (postData?.schoolId) {
              const schoolDoc = await db.collection('schools').doc(postData.schoolId).get();
              if (schoolDoc.exists) {
                const schoolData = schoolDoc.data();
                schoolName = schoolData?.KOR_NAME || '학교명 없음';
              }
            }
          }
        }
      } catch (err) {
        console.warn('게시글/학교 정보 조회 실패:', err);
      }

      comments.push({
        id: doc.id,
        postId: data.postId || '',
        content: data.content || '',
        authorId: data.authorId || '',
        authorNickname: data.authorNickname || '익명',
        postTitle,
        schoolName,
        schoolId,
        createdAt: data.createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
        fake: data.fake || false
      });
    }

    // 총 개수 조회 (별도 쿼리)
    const totalSnapshot = await db.collection('comments').where('fake', '==', true).get();
    const total = totalSnapshot.size;

    console.log(`✅ AI 댓글 조회 완료: ${comments.length}개 (전체: ${total}개)`);

    return NextResponse.json({
      success: true,
      data: comments,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      message: comments.length > 0 ? `AI 생성 댓글 ${comments.length}개를 조회했습니다.` : 'AI 생성 댓글이 없습니다.',
      lastUpdated: new Date().toISOString(),
      source: 'firebase_realtime'
    });

  } catch (error) {
    console.error('❌ AI 댓글 조회 오류:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: `댓글을 조회하는 중 오류가 발생했습니다: ${error instanceof Error ? error.message : 'Unknown error'}` 
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/comments/generate
 * AI 댓글 생성 시작
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { schoolLimit = 5, commentsPerSchool = 3, maxCommentsPerPost = 2 } = body;

    console.log('💬 AI 댓글 생성 시작:', { schoolLimit, commentsPerSchool, maxCommentsPerPost });

    // 백그라운드에서 댓글 생성 실행
    const { spawn } = require('child_process');
    const path = require('path');
    
    const scriptPath = path.join(process.cwd(), '..', 'scripts', 'comment-generator.js');
    const args = [schoolLimit.toString(), commentsPerSchool.toString(), maxCommentsPerPost.toString()];

    const child = spawn('node', [scriptPath, ...args], {
      cwd: path.join(process.cwd(), '..'),
      stdio: 'pipe'
    });

    // 프로세스 출력 로깅
    child.stdout.on('data', (data) => {
      console.log('댓글 생성 출력:', data.toString());
    });

    child.stderr.on('data', (data) => {
      console.error('댓글 생성 오류:', data.toString());
    });

    return NextResponse.json({
      success: true,
      message: 'AI 댓글 생성이 백그라운드에서 시작되었습니다.',
      config: {
        schoolLimit,
        commentsPerSchool,
        maxCommentsPerPost,
        expectedComments: schoolLimit * commentsPerSchool * maxCommentsPerPost
      }
    });

  } catch (error) {
    console.error('AI 댓글 생성 API 오류:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: `댓글 생성을 시작하는 중 오류가 발생했습니다: ${error instanceof Error ? error.message : 'Unknown error'}` 
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/comments/[id]
 * AI 댓글 삭제 (관리자용)
 */
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const commentId = searchParams.get('id');

    if (!commentId) {
      return NextResponse.json(
        { success: false, error: '댓글 ID가 필요합니다.' },
        { status: 400 }
      );
    }

    console.log(`🗑️ 댓글 삭제 처리:`, commentId);

    const db = admin.firestore();

    // 댓글 존재 확인
    const commentDoc = await db.collection('comments').doc(commentId).get();
    
    if (!commentDoc.exists) {
      return NextResponse.json(
        { success: false, error: '댓글을 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    const commentData = commentDoc.data();
    if (!commentData?.fake) {
      return NextResponse.json(
        { success: false, error: '실제 댓글은 삭제할 수 없습니다.' },
        { status: 403 }
      );
    }

    // 댓글 삭제 (soft delete)
    await db.collection('comments').doc(commentId).update({
      'status.isDeleted': true,
      'status.deletedAt': admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    // 게시글의 댓글 수 감소
    if (commentData.postId) {
      await db.collection('posts').doc(commentData.postId).update({
        'stats.commentCount': admin.firestore.FieldValue.increment(-1),
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });
    }

    console.log(`✅ 댓글 삭제 완료:`, commentId);

    return NextResponse.json({
      success: true,
      message: '댓글이 삭제되었습니다.',
      data: { id: commentId }
    });

  } catch (error) {
    console.error('❌ 댓글 삭제 오류:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: `댓글 삭제 중 오류가 발생했습니다: ${error instanceof Error ? error.message : 'Unknown error'}` 
      },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/admin/comments
 * AI 댓글 수정 (관리자용)
 */
export async function PUT(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const commentId = searchParams.get('id');
    const body = await request.json();

    if (!commentId) {
      return NextResponse.json(
        { success: false, error: '댓글 ID가 필요합니다.' },
        { status: 400 }
      );
    }

    const { content } = body;
    if (!content || content.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: '댓글 내용이 필요합니다.' },
        { status: 400 }
      );
    }

    if (content.length > 500) {
      return NextResponse.json(
        { success: false, error: '댓글은 500자 이하로 작성해주세요.' },
        { status: 400 }
      );
    }

    console.log(`✏️ 댓글 수정 처리:`, commentId);

    const db = admin.firestore();

    // 댓글 존재 확인
    const commentDoc = await db.collection('comments').doc(commentId).get();
    
    if (!commentDoc.exists) {
      return NextResponse.json(
        { success: false, error: '댓글을 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    const commentData = commentDoc.data();
    if (!commentData?.fake) {
      return NextResponse.json(
        { success: false, error: '실제 댓글은 수정할 수 없습니다.' },
        { status: 403 }
      );
    }

    // 댓글 내용 수정
    await db.collection('comments').doc(commentId).update({
      content: content.trim(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    console.log(`✅ 댓글 수정 완료:`, commentId);

    return NextResponse.json({
      success: true,
      message: '댓글이 수정되었습니다.',
      data: { 
        id: commentId,
        content: content.trim()
      }
    });

  } catch (error) {
    console.error('❌ 댓글 수정 오류:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: `댓글 수정 중 오류가 발생했습니다: ${error instanceof Error ? error.message : 'Unknown error'}` 
      },
      { status: 500 }
    );
  }
}
