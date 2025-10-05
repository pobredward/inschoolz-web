import { NextRequest, NextResponse } from 'next/server';
import { spawn } from 'child_process';
import path from 'path';

interface BulkOperation {
  id: string;
  type: 'create_bots' | 'generate_posts' | 'delete_posts' | 'cleanup' | 'delete_bots' | 'generate_comments';
  status: 'pending' | 'running' | 'completed' | 'failed';
  progress: number;
  total: number;
  message: string;
  startedAt: string;
  completedAt?: string;
  params: any;
}

// 메모리에 작업 상태 저장 (실제 운영에서는 Redis나 DB 사용 권장)
declare global {
  var bulkOperations: Map<string, BulkOperation> | undefined;
}

const operations = globalThis.bulkOperations ?? new Map<string, BulkOperation>();
globalThis.bulkOperations = operations;

/**
 * POST /api/admin/bulk-operations
 * 대량 작업 시작
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { type, params } = body;

    console.log('⚡ 대량 작업 시작:', { type, params });

    // 입력 유효성 검사
    const validationError = validateOperationParams(type, params);
    if (validationError) {
      return NextResponse.json(
        { success: false, error: validationError },
        { status: 400 }
      );
    }

    // 동시 실행 중인 같은 타입의 작업이 있는지 확인
    const runningOperations = Array.from(operations.values()).filter(
      op => op.status === 'running' && op.type === type
    );
    
    if (runningOperations.length > 0) {
      const runningOperation = runningOperations[0];
      return NextResponse.json(
        { 
          success: false, 
          error: `이미 실행 중인 ${getOperationTypeName(type)} 작업이 있습니다.`,
          details: {
            operationId: runningOperation.id,
            progress: runningOperation.progress,
            total: runningOperation.total,
            message: runningOperation.message,
            startedAt: runningOperation.startedAt
          }
        },
        { status: 409 }
      );
    }

    // 작업 ID 생성
    const operationId = `${type}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // 작업 정보 초기화
    const operation: BulkOperation = {
      id: operationId,
      type,
      status: 'pending',
      progress: 0,
      total: 0,
      message: '작업을 준비하는 중...',
      startedAt: new Date().toISOString(),
      params
    };

    operations.set(operationId, operation);

    // 백그라운드에서 작업 실행
    executeOperation(operationId, type, params);

    return NextResponse.json({
      success: true,
      operationId,
      message: '대량 작업이 시작되었습니다.',
      operation
    });

  } catch (error) {
    console.error('❌ 대량 작업 시작 오류:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: `대량 작업을 시작할 수 없습니다: ${error instanceof Error ? error.message : 'Unknown error'}` 
      },
      { status: 500 }
    );
  }
}

/**
 * 작업 파라미터 유효성 검사
 */
function validateOperationParams(type: string, params: any): string | null {
  switch (type) {
    case 'create_bots':
      if (params.schoolCount && (params.schoolCount < 1 || params.schoolCount > 15000)) {
        return '학교 수는 1개 이상 15,000개 이하여야 합니다.';
      }
      if (params.schoolIds && (!Array.isArray(params.schoolIds) || params.schoolIds.length === 0)) {
        return '학교 ID 목록이 유효하지 않습니다.';
      }
      break;
      
    case 'generate_posts':
      if (params.schoolLimit && (params.schoolLimit < 1 || params.schoolLimit > 15000)) {
        return '대상 학교 수는 1개 이상 15,000개 이하여야 합니다.';
      }
      if (params.postsPerSchool && (params.postsPerSchool < 1 || params.postsPerSchool > 10)) {
        return '학교당 게시글 수는 1개 이상 10개 이하여야 합니다.';
      }
      break;
      
    case 'cleanup':
      if (params.olderThanDays && (params.olderThanDays < 1 || params.olderThanDays > 365)) {
        return '삭제 기준 일수는 1일 이상 365일 이하여야 합니다.';
      }
      break;
      
    case 'delete_posts':
      // 모든 게시글 삭제는 특별한 확인이 필요하므로 여기서는 허용
      break;
      
    case 'delete_bots':
      // withPosts 매개변수 검증
      if (params.withPosts !== undefined && typeof params.withPosts !== 'boolean') {
        return 'withPosts 매개변수는 boolean 타입이어야 합니다.';
      }
      break;
      
    case 'generate_comments':
      if (params.schoolLimit && (params.schoolLimit < 1 || params.schoolLimit > 100)) {
        return '학교 수는 1개 이상 100개 이하여야 합니다.';
      }
      if (params.commentsPerSchool && (params.commentsPerSchool < 1 || params.commentsPerSchool > 10)) {
        return '학교당 게시글 수는 1개 이상 10개 이하여야 합니다.';
      }
      if (params.maxCommentsPerPost && (params.maxCommentsPerPost < 1 || params.maxCommentsPerPost > 5)) {
        return '게시글당 댓글 수는 1개 이상 5개 이하여야 합니다.';
      }
      break;
      
    default:
      return `알 수 없는 작업 유형: ${type}`;
  }
  
  return null;
}

/**
 * 작업 유형 이름 반환
 */
function getOperationTypeName(type: string): string {
  switch (type) {
    case 'create_bots': return '봇 계정 생성';
    case 'generate_posts': return 'AI 게시글 생성';
    case 'delete_posts': return '게시글 삭제';
    case 'cleanup': return '데이터 정리';
    case 'delete_bots': return '봇 삭제';
    case 'generate_comments': return '댓글 생성';
    default: return type;
  }
}

/**
 * GET /api/admin/bulk-operations
 * 모든 대량 작업 상태 조회
 */
export async function GET() {
  try {
    const allOperations = Array.from(operations.values())
      .sort((a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime())
      .slice(0, 20); // 최근 20개만

    return NextResponse.json({
      success: true,
      data: allOperations,
      total: allOperations.length
    });

  } catch (error) {
    console.error('❌ 대량 작업 목록 조회 오류:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: `대량 작업 목록을 조회할 수 없습니다: ${error instanceof Error ? error.message : 'Unknown error'}` 
      },
      { status: 500 }
    );
  }
}

/**
 * 대량 작업 실행 함수
 */
async function executeOperation(operationId: string, type: string, params: any) {
  const operation = operations.get(operationId);
  if (!operation) return;

  try {
    // 상태 업데이트: 실행 중
    operation.status = 'running';
    operation.message = '작업을 실행하는 중...';
    operations.set(operationId, operation);

    switch (type) {
      case 'create_bots':
        await executeBotCreation(operationId, params);
        break;
      case 'generate_posts':
        await executePostGeneration(operationId, params);
        break;
      case 'delete_posts':
        await executePostDeletion(operationId, params);
        break;
      case 'cleanup':
        await executeCleanup(operationId, params);
        break;
      case 'delete_bots':
        await executeBotDeletion(operationId, params);
        break;
      case 'generate_comments':
        await executeCommentGeneration(operationId, params);
        break;
      default:
        throw new Error(`알 수 없는 작업 유형: ${type}`);
    }

    // 완료 상태 업데이트
    const finalOperation = operations.get(operationId);
    if (finalOperation) {
      finalOperation.status = 'completed';
      finalOperation.completedAt = new Date().toISOString();
      finalOperation.message = '작업이 성공적으로 완료되었습니다.';
      operations.set(operationId, finalOperation);
    }

  } catch (error) {
    console.error(`❌ 대량 작업 실행 오류 (${operationId}):`, error);
    
    const failedOperation = operations.get(operationId);
    if (failedOperation) {
      failedOperation.status = 'failed';
      failedOperation.completedAt = new Date().toISOString();
      failedOperation.message = `작업 실패: ${error instanceof Error ? error.message : 'Unknown error'}`;
      operations.set(operationId, failedOperation);
    }
  }
}

/**
 * 봇 계정 대량 생성
 */
async function executeBotCreation(operationId: string, params: any) {
  const { schoolCount = 100, schoolIds } = params;
  
  return new Promise<void>((resolve, reject) => {
    const operation = operations.get(operationId);
    if (!operation) return reject(new Error('작업을 찾을 수 없습니다.'));

    // 총 작업량 설정
    operation.total = schoolIds ? schoolIds.length : schoolCount;
    operation.message = `${operation.total}개 학교에 봇 계정을 생성하는 중...`;
    operations.set(operationId, operation);

    // Node.js 스크립트 실행 (상위 디렉토리의 scripts 폴더)
    const scriptPath = path.join(process.cwd(), '..', 'scripts', 'create-school-bots.js');
    const args = schoolIds ? 
      ['--school-ids', schoolIds.join(',')] : 
      [schoolCount.toString(), '3']; // 학교당 3개 봇

    const child = spawn('node', [scriptPath, ...args], {
      cwd: path.join(process.cwd(), '..'), // 상위 디렉토리에서 실행
      stdio: ['pipe', 'pipe', 'pipe']
    });

    let output = '';
    
    child.stdout.on('data', (data) => {
      output += data.toString();
      
      // 진행률 파싱 (스크립트에서 "Progress: X/Y" 형태로 출력한다고 가정)
      const progressMatch = output.match(/Progress: (\d+)\/(\d+)/g);
      if (progressMatch) {
        const lastProgress = progressMatch[progressMatch.length - 1];
        const [, current, total] = lastProgress.match(/Progress: (\d+)\/(\d+)/) || [];
        
        if (current && total) {
          const updatedOperation = operations.get(operationId);
          if (updatedOperation) {
            updatedOperation.progress = parseInt(current);
            updatedOperation.total = parseInt(total);
            updatedOperation.message = `봇 계정 생성 중... (${current}/${total})`;
            operations.set(operationId, updatedOperation);
          }
        }
      }
    });

    child.stderr.on('data', (data) => {
      console.error(`봇 생성 스크립트 오류: ${data}`);
    });

    child.on('close', (code) => {
      if (code === 0) {
        const finalOperation = operations.get(operationId);
        if (finalOperation) {
          finalOperation.progress = finalOperation.total;
          finalOperation.message = `${finalOperation.total}개 학교에 봇 계정 생성 완료`;
          operations.set(operationId, finalOperation);
        }
        resolve();
      } else {
        reject(new Error(`봇 생성 스크립트가 오류 코드 ${code}로 종료되었습니다.`));
      }
    });

    child.on('error', (error) => {
      reject(new Error(`봇 생성 스크립트 실행 오류: ${error.message}`));
    });
  });
}

/**
 * AI 게시글 대량 생성
 */
async function executePostGeneration(operationId: string, params: any) {
  const { schoolLimit = 100, postsPerSchool = 1, schoolIds } = params;
  
  return new Promise<void>((resolve, reject) => {
    const operation = operations.get(operationId);
    if (!operation) return reject(new Error('작업을 찾을 수 없습니다.'));

    const totalPosts = schoolIds ? 
      schoolIds.length * postsPerSchool : 
      schoolLimit * postsPerSchool;

    operation.total = totalPosts;
    operation.message = `${totalPosts}개 AI 게시글을 생성하는 중...`;
    operations.set(operationId, operation);

    // 실제 게시글 생성 API 호출
    const generatePosts = async () => {
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/admin/fake-posts/generate`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            schoolLimit: schoolIds ? schoolIds.length : schoolLimit,
            postsPerSchool,
            delayBetweenPosts: 500, // 더 빠른 생성을 위해 딜레이 단축
            operationId // 진행률 추적을 위해 operationId 전달
          })
        });

        if (!response.ok) {
          throw new Error(`게시글 생성 API 오류: ${response.statusText}`);
        }

        const result = await response.json();
        
        if (result.success) {
          // API에서 실제 생성된 게시글 수 반환
          const finalOperation = operations.get(operationId);
          if (finalOperation) {
            finalOperation.progress = result.data?.totalGenerated || totalPosts;
            finalOperation.total = result.data?.totalGenerated || totalPosts;
            finalOperation.message = `${result.data?.totalGenerated || totalPosts}개 AI 게시글 생성 완료`;
            operations.set(operationId, finalOperation);
          }
          resolve();
        } else {
          throw new Error(result.error || '게시글 생성 실패');
        }

      } catch (error) {
        reject(error);
      }
    };

    generatePosts();
  });
}

/**
 * AI 게시글 대량 삭제
 */
async function executePostDeletion(operationId: string, params: any) {
  const { all = false, olderThanDays } = params;
  
  return new Promise<void>((resolve, reject) => {
    const operation = operations.get(operationId);
    if (!operation) return reject(new Error('작업을 찾을 수 없습니다.'));

    operation.total = 100; // 예상 삭제 수 (실제로는 먼저 카운트해야 함)
    operation.message = 'AI 게시글을 삭제하는 중...';
    operations.set(operationId, operation);

    // 삭제 스크립트 실행 (상위 디렉토리의 scripts 폴더)
    const scriptPath = path.join(process.cwd(), '..', 'scripts', 'cleanup-fake-posts.js');
    const args = all ? ['--all'] : ['--days', olderThanDays.toString()];

    const child = spawn('node', [scriptPath, ...args], {
      cwd: path.join(process.cwd(), '..'), // 상위 디렉토리에서 실행
      stdio: ['pipe', 'pipe', 'pipe']
    });

    let deletedCount = 0;

    child.stdout.on('data', (data) => {
      const output = data.toString();
      
      // 삭제된 게시글 수 파싱
      const deleteMatch = output.match(/삭제 완료: (\d+)개/);
      if (deleteMatch) {
        deletedCount = parseInt(deleteMatch[1]);
        
        const updatedOperation = operations.get(operationId);
        if (updatedOperation) {
          updatedOperation.progress = deletedCount;
          updatedOperation.message = `AI 게시글 삭제 중... (${deletedCount}개 삭제됨)`;
          operations.set(operationId, updatedOperation);
        }
      }
    });

    child.on('close', (code) => {
      if (code === 0) {
        const finalOperation = operations.get(operationId);
        if (finalOperation) {
          finalOperation.progress = deletedCount;
          finalOperation.total = deletedCount;
          finalOperation.message = `${deletedCount}개 AI 게시글 삭제 완료`;
          operations.set(operationId, finalOperation);
        }
        resolve();
      } else {
        reject(new Error(`삭제 스크립트가 오류 코드 ${code}로 종료되었습니다.`));
      }
    });

    child.on('error', (error) => {
      reject(new Error(`삭제 스크립트 실행 오류: ${error.message}`));
    });
  });
}

/**
 * 데이터 정리
 */
async function executeCleanup(operationId: string, params: any) {
  const { olderThanDays = 30 } = params;
  
  // 게시글 삭제와 동일한 로직 사용
  return executePostDeletion(operationId, { olderThanDays });
}

/**
 * 봇 삭제 작업 실행
 */
async function executeBotDeletion(operationId: string, params: any): Promise<void> {
  const { withPosts = false } = params;
  
  return new Promise<void>((resolve, reject) => {
    const operation = operations.get(operationId);
    if (!operation) return reject(new Error('작업을 찾을 수 없습니다.'));

    operation.total = 100; // 예상 봇 수 (실제로는 먼저 카운트해야 함)
    operation.message = withPosts ? '모든 봇과 게시글을 삭제하는 중...' : '모든 봇을 삭제하는 중...';
    operations.set(operationId, operation);

    // 봇 삭제 스크립트 실행 (상위 디렉토리의 scripts 폴더)
    const scriptPath = path.join(process.cwd(), '..', 'scripts', 'delete-all-bots.js');
    const args = withPosts ? ['--with-posts'] : ['--bots-only'];

    const child = spawn('node', [scriptPath, ...args], {
      cwd: path.join(process.cwd(), '..'), // 상위 디렉토리에서 실행
      stdio: ['pipe', 'pipe', 'pipe']
    });

    let deletedCount = 0;

    child.stdout.on('data', (data) => {
      const output = data.toString();
      console.log('봇 삭제 출력:', output);

      // 진행률 파싱
      const progressMatch = output.match(/Progress: (\d+)\/(\d+)/);
      if (progressMatch) {
        const current = parseInt(progressMatch[1]);
        const total = parseInt(progressMatch[2]);
        operation.progress = current;
        operation.total = total;
        operation.message = withPosts 
          ? `봇과 게시글 삭제 중... (${current}/${total})` 
          : `봇 삭제 중... (${current}/${total})`;
        operations.set(operationId, operation);
      }

      // 삭제된 봇 수 파싱
      const deletedMatch = output.match(/삭제된 봇 계정: (\d+)개/);
      if (deletedMatch) {
        deletedCount = parseInt(deletedMatch[1]);
      }
    });

    child.stderr.on('data', (data) => {
      console.error('봇 삭제 오류:', data.toString());
    });

    child.on('close', (code) => {
      if (code === 0) {
        const finalOperation = operations.get(operationId);
        if (finalOperation) {
          finalOperation.progress = deletedCount;
          finalOperation.total = deletedCount;
          finalOperation.message = withPosts 
            ? `${deletedCount}개 봇과 관련 게시글 삭제 완료` 
            : `${deletedCount}개 봇 삭제 완료`;
          operations.set(operationId, finalOperation);
        }
        resolve();
      } else {
        reject(new Error(`봇 삭제 스크립트가 오류 코드 ${code}로 종료되었습니다.`));
      }
    });

    child.on('error', (error) => {
      reject(new Error(`봇 삭제 스크립트 실행 오류: ${error.message}`));
    });
  });
}

/**
 * 댓글 생성 실행
 */
async function executeCommentGeneration(operationId: string, params: any) {
  return new Promise<void>((resolve, reject) => {
    try {
      console.log(`💬 댓글 생성 시작 (${operationId}):`, params);
      
      const operation = operations.get(operationId);
      if (!operation) return reject(new Error('작업을 찾을 수 없습니다.'));

      const { schoolLimit = 5, commentsPerSchool = 3, maxCommentsPerPost = 2 } = params;
      
      // 예상 댓글 수 계산
      const expectedComments = schoolLimit * commentsPerSchool * maxCommentsPerPost;
      operation.total = expectedComments;
      operation.message = `${expectedComments}개 AI 댓글을 생성하는 중...`;
      operations.set(operationId, operation);

      const scriptPath = path.join(process.cwd(), '..', 'scripts', 'comment-generator.js');
      const args = [schoolLimit.toString(), commentsPerSchool.toString(), maxCommentsPerPost.toString()];

      const child = spawn('node', [scriptPath, ...args], {
        cwd: path.join(process.cwd(), '..'),
        stdio: 'pipe'
      });

      let generatedCount = 0;

      child.stdout.on('data', (data) => {
        const output = data.toString();
        console.log('댓글 생성 출력:', output);
        
        // 진행률 파싱 (댓글 생성 완료 메시지 감지)
        const commentMatch = output.match(/✅ (\d+)개 댓글 생성 완료/);
        if (commentMatch) {
          generatedCount += parseInt(commentMatch[1]);
          const currentOperation = operations.get(operationId);
          if (currentOperation) {
            currentOperation.progress = generatedCount;
            currentOperation.message = `${generatedCount}/${expectedComments}개 댓글 생성 중...`;
            operations.set(operationId, currentOperation);
          }
        }
      });

      child.stderr.on('data', (data) => {
        console.error('댓글 생성 오류:', data.toString());
      });

      child.on('close', (code) => {
        if (code === 0) {
          console.log(`✅ 댓글 생성 완료 (${operationId}): ${generatedCount}개`);
          const finalOperation = operations.get(operationId);
          if (finalOperation) {
            finalOperation.progress = generatedCount;
            finalOperation.message = `${generatedCount}개 댓글 생성 완료`;
            operations.set(operationId, finalOperation);
          }
          resolve();
        } else {
          reject(new Error(`댓글 생성 스크립트가 오류 코드 ${code}로 종료되었습니다.`));
        }
      });

      child.on('error', (error) => {
        reject(new Error(`댓글 생성 스크립트 실행 실패: ${error.message}`));
      });

    } catch (error) {
      console.error(`❌ 댓글 생성 실패 (${operationId}):`, error);
      const operation = operations.get(operationId);
      if (operation) {
        operation.status = 'failed';
        operation.message = `작업 실패: ${error instanceof Error ? error.message : '알 수 없는 오류'}`;
        operation.completedAt = new Date().toISOString();
        operations.set(operationId, operation);
      }
      reject(error);
    }
  });
}
