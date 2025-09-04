'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, RotateCcw, Trophy, Star, Zap } from 'lucide-react';
import Link from 'next/link';
import { updateGameScore, getUserGameStats } from '@/lib/api/games';
import { useAuth } from '@/providers/AuthProvider';
import { useExperience } from '@/providers/experience-provider';
import { toast } from 'sonner';

type GameState = 'waiting' | 'playing' | 'finished';

interface Tile {
  id: number;
  value: number;
  isFlipped: boolean;
  isMatched: boolean;
}

export default function TileGamePage() {
  const { user } = useAuth();
  const { showExpGain, showLevelUp, refreshUserStats } = useExperience();
  const [gameState, setGameState] = useState<GameState>('waiting');
  const [tiles, setTiles] = useState<Tile[]>([]);
  const [flippedTiles, setFlippedTiles] = useState<number[]>([]);
  const [moves, setMoves] = useState(0);
  const [matches, setMatches] = useState(0);
  const [timeElapsed, setTimeElapsed] = useState(0);
  const [finalScore, setFinalScore] = useState(0);
  const [gameStartTime, setGameStartTime] = useState<number>(0);
  const [remainingAttempts, setRemainingAttempts] = useState(5);
  const [isLoadingStats, setIsLoadingStats] = useState(false);

  const totalPairs = 8; // 4x4 grid with 8 pairs
  const maxTime = 120; // 2 minutes
  const maxAttempts = 5;

  // 남은 기회 실시간 조회
  const loadRemainingAttempts = async () => {
    if (!user?.uid) return;
    
    try {
      setIsLoadingStats(true);
      const statsResponse = await getUserGameStats(user.uid);
      
      if (statsResponse.success && statsResponse.data) {
        const todayPlays = statsResponse.data.todayPlays.tileGame || 0;
        const maxPlays = statsResponse.data.maxPlays || 5;
        const remaining = Math.max(0, maxPlays - todayPlays);
        
        setRemainingAttempts(remaining);
      }
    } catch (error) {
      console.error('게임 통계 로드 실패:', error);
    } finally {
      setIsLoadingStats(false);
    }
  };
  
  // 게임 초기화
  const initializeGame = useCallback(() => {
    const values = [];
    for (let i = 1; i <= totalPairs; i++) {
      values.push(i, i); // 각 숫자를 두 번씩 추가
    }
    
    // 카드 섞기
    const shuffled = values.sort(() => Math.random() - 0.5);
    
    const newTiles: Tile[] = shuffled.map((value, index) => ({
      id: index,
      value,
      isFlipped: false,
      isMatched: false,
    }));
    
    setTiles(newTiles);
    setFlippedTiles([]);
    setMoves(0);
    setMatches(0);
    setTimeElapsed(0);
    setFinalScore(0);
  }, [totalPairs]);

  // 게임 시작
  const startGame = async () => {
    if (!user?.uid) {
      return;
    }
    
    // 플레이 전 제한 재확인
    try {
      const { checkDailyLimit } = await import('@/lib/experience');
      const limitCheck = await checkDailyLimit(user.uid, 'games', 'tileGame');
      if (!limitCheck.canEarnExp) {
        toast.error(`오늘의 타일 게임 플레이 횟수를 모두 사용했습니다. (${limitCheck.currentCount}/${limitCheck.limit})`);
        return;
      }
    } catch (error) {
      console.error('제한 확인 오류:', error);
      toast.error('게임을 시작할 수 없습니다.');
      return;
    }
    
    initializeGame();
    setGameState('playing');
    setGameStartTime(performance.now());
  };

  // 타일 클릭 처리
  const handleTileClick = (tileId: number) => {
    if (gameState !== 'playing') return;
    
    const tile = tiles.find(t => t.id === tileId);
    if (!tile || tile.isFlipped || tile.isMatched) return;
    
    const newFlippedTiles = [...flippedTiles, tileId];
    setFlippedTiles(newFlippedTiles);
    
    // 타일 뒤집기
    setTiles(prev => prev.map(t => 
      t.id === tileId ? { ...t, isFlipped: true } : t
    ));

    if (newFlippedTiles.length === 2) {
      setMoves(prev => prev + 1);
      
      const [firstId, secondId] = newFlippedTiles;
      const firstTile = tiles.find(t => t.id === firstId);
      const secondTile = tiles.find(t => t.id === secondId);
      
      if (firstTile && secondTile && firstTile.value === secondTile.value) {
        // 매치 성공
        setTimeout(() => {
          setTiles(prev => prev.map(t => 
            t.id === firstId || t.id === secondId 
              ? { ...t, isMatched: true }
              : t
          ));
          setMatches(prev => prev + 1);
          setFlippedTiles([]);
          
          // 모든 매치 완료 체크
          if (matches + 1 === totalPairs) {
            finishGame();
          }
        }, 1000);
      } else {
        // 매치 실패
        setTimeout(() => {
          setTiles(prev => prev.map(t => 
            t.id === firstId || t.id === secondId 
              ? { ...t, isFlipped: false }
              : t
          ));
          setFlippedTiles([]);
        }, 1000);
      }
    }
  };

  // 게임 종료
  const finishGame = async () => {
    const endTime = performance.now();
    const totalTime = Math.floor((endTime - gameStartTime) / 1000);
    setTimeElapsed(totalTime);
    
    // 점수 계산: 기본 점수 1000에서 시간과 움직임에 따라 감점
    const timeBonus = Math.max(0, maxTime - totalTime) * 10;
    const moveBonus = Math.max(0, (totalPairs * 2) - moves) * 20;
    const score = Math.max(100, 1000 + timeBonus + moveBonus);
    
    setFinalScore(score);
    setGameState('finished');

    // Firebase에 점수 저장
    if (user?.uid) {
      try {
        const result = await updateGameScore(user.uid, 'tileGame', score);
        if (result.success) {
          // 경험치 모달 표시
          if (result.leveledUp && result.oldLevel && result.newLevel) {
            showLevelUp(result.xpEarned || 0, result.oldLevel, result.newLevel);
          } else if (result.xpEarned && result.xpEarned > 0) {
            showExpGain(
              result.xpEarned, 
              `타일 게임 완료! ${score}점 획득`
            );
          } else {
            toast.info(`게임 완료! ${score}점 획득 (경험치 없음)`);
          }
          
          // 성공 시 남은 기회 업데이트
          loadRemainingAttempts();
          refreshUserStats(); // 실시간 사용자 통계 새로고침
        } else {
          toast.error(result.message || '점수 저장에 실패했습니다.');
        }
      } catch (error) {
        console.error('게임 점수 저장 실패:', error);
        toast.error('게임 결과 저장 중 오류가 발생했습니다.');
      }
    }
  };

  // 타이머
  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (gameState === 'playing') {
      interval = setInterval(() => {
        const elapsed = Math.floor((performance.now() - gameStartTime) / 1000);
        setTimeElapsed(elapsed);
        
        if (elapsed >= maxTime) {
          finishGame();
        }
      }, 1000);
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [gameState, gameStartTime]);

  // 게임 초기화 및 사용자 데이터 로드 (컴포넌트 마운트 시)
  useEffect(() => {
    initializeGame();
    if (user?.uid) {
      loadRemainingAttempts();
    }
  }, [initializeGame, user?.uid]);

  const getEmojiForValue = (value: number) => {
    const emojis = ['🍎', '🍌', '🍇', '🍊', '🍓', '🥝', '🍑', '🥭'];
    return emojis[value - 1] || '❓';
  };

  const progressPercentage = (matches / totalPairs) * 100;
  const timeProgress = ((maxTime - timeElapsed) / maxTime) * 100;

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 p-4">
      <div className="max-w-4xl mx-auto">
        {/* 헤더 */}
        <div className="flex items-center justify-between mb-6">
          <Link href="/games">
            <Button variant="ghost" size="sm" className="gap-2">
              <ArrowLeft className="w-4 h-4" />
              게임 목록
            </Button>
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">🧩 타일 매칭 게임</h1>
          <div className="flex items-center gap-4">
            {isLoadingStats ? (
              <div className="text-sm text-gray-500">로딩 중...</div>
            ) : (
              <div className="text-right">
                <div className="text-sm text-gray-500">오늘 남은 기회</div>
                <div className="text-xl font-bold text-blue-600">
                  {remainingAttempts}/{maxAttempts}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 게임 상태 */}
        {gameState === 'playing' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <Trophy className="w-5 h-5 text-yellow-500" />
                  <div>
                    <p className="text-sm text-gray-600">매치</p>
                    <p className="text-lg font-bold">{matches}/{totalPairs}</p>
                  </div>
                </div>
                <Progress value={progressPercentage} className="mt-2" />
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <Zap className="w-5 h-5 text-blue-500" />
                  <div>
                    <p className="text-sm text-gray-600">움직임</p>
                    <p className="text-lg font-bold">{moves}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <Star className="w-5 h-5 text-green-500" />
                  <div>
                    <p className="text-sm text-gray-600">시간</p>
                    <p className="text-lg font-bold">{timeElapsed}초</p>
                  </div>
                </div>
                <Progress value={timeProgress} className="mt-2" />
              </CardContent>
            </Card>
          </div>
        )}

        {/* 게임 영역 */}
        <Card className="mb-6">
          <CardContent className="p-6">
            {gameState === 'waiting' && (
              <div className="text-center py-12">
                <div className="text-6xl mb-4">🧩</div>
                <h2 className="text-2xl font-bold mb-4">타일 매칭 게임</h2>
                <p className="text-gray-600 mb-6">
                  같은 그림의 타일 두 개를 찾아 매칭하세요!<br />
                  빠른 시간과 적은 움직임으로 높은 점수를 획득하세요.
                </p>
                
                {!user ? (
                  <div className="space-y-4">
                    <p className="text-amber-600 font-medium">로그인이 필요합니다</p>
                    <Button asChild size="lg" className="gap-2">
                      <Link href="/login">
                        <Zap className="w-5 h-5" />
                        로그인하기
                      </Link>
                    </Button>
                  </div>
                ) : remainingAttempts <= 0 ? (
                  <div className="space-y-4">
                    <p className="text-red-600 font-medium">오늘의 기회를 모두 사용했습니다</p>
                    <Button disabled size="lg" className="gap-2">
                      <Zap className="w-5 h-5" />
                      기회 소진
                    </Button>
                  </div>
                ) : (
                  <Button onClick={startGame} size="lg" className="gap-2">
                    <Zap className="w-5 h-5" />
                    게임 시작
                  </Button>
                )}
              </div>
            )}

            {gameState === 'playing' && (
              <div className="grid grid-cols-4 gap-3 max-w-md mx-auto">
                {tiles.map((tile) => (
                  <button
                    key={tile.id}
                    onClick={() => handleTileClick(tile.id)}
                    className={`
                      aspect-square rounded-lg border-2 text-3xl font-bold transition-all duration-300
                      ${tile.isMatched 
                        ? 'bg-green-100 border-green-300 text-green-600' 
                        : tile.isFlipped 
                          ? 'bg-blue-100 border-blue-300 text-blue-600' 
                          : 'bg-gray-100 border-gray-300 hover:bg-gray-200 text-gray-400'
                      }
                      ${!tile.isFlipped && !tile.isMatched ? 'hover:scale-105' : ''}
                    `}
                    disabled={tile.isFlipped || tile.isMatched}
                  >
                    {tile.isFlipped || tile.isMatched ? getEmojiForValue(tile.value) : '?'}
                  </button>
                ))}
              </div>
            )}

            {gameState === 'finished' && (
              <div className="text-center py-8">
                <div className="text-6xl mb-4">🎉</div>
                <h2 className="text-2xl font-bold mb-4">게임 완료!</h2>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-md mx-auto mb-6">
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <p className="text-sm text-gray-600">최종 점수</p>
                    <p className="text-2xl font-bold text-blue-600">{finalScore}점</p>
                  </div>
                  <div className="bg-green-50 p-4 rounded-lg">
                    <p className="text-sm text-gray-600">완료 시간</p>
                    <p className="text-2xl font-bold text-green-600">{timeElapsed}초</p>
                  </div>
                  <div className="bg-purple-50 p-4 rounded-lg">
                    <p className="text-sm text-gray-600">총 움직임</p>
                    <p className="text-2xl font-bold text-purple-600">{moves}회</p>
                  </div>
                </div>

                {/* Firebase 설정에서 실제 경험치 계산됨 */}

                <div className="flex gap-3 justify-center">
                  <Button onClick={startGame} className="gap-2">
                    <RotateCcw className="w-4 h-4" />
                    다시 플레이
                  </Button>
                  <Link href="/games">
                    <Button variant="outline">게임 목록으로</Button>
                  </Link>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* 게임 설명 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="w-5 h-5" />
              게임 방법
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <h4 className="font-semibold mb-2">🎯 목표</h4>
                <ul className="space-y-1 text-gray-600">
                  <li>• 4x4 격자에서 8쌍의 타일을 모두 매칭</li>
                  <li>• 빠른 시간과 적은 움직임으로 고득점 달성</li>
                  <li>• 800점 이상으로 경험치를 획득하세요!</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold mb-2">📊 점수 계산</h4>
                <ul className="space-y-1 text-gray-600">
                  <li>• 기본 점수: 1000점</li>
                  <li>• 시간 보너스: 남은 시간 × 10점</li>
                  <li>• 움직임 보너스: 최소 움직임 대비 × 20점</li>
                  <li>• 제한 시간: 2분</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 