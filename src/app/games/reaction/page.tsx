'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Zap, 
  Play, 
  Home, 
  RotateCcw, 
  Trophy,
  Clock,
  Target
} from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/providers/AuthProvider';
import { toast } from 'sonner';

type GameState = 'waiting' | 'ready' | 'active' | 'clicked' | 'finished';

interface GameResult {
  reactionTime: number;
  round: number;
}

export default function ReactionGamePage() {
  const { user } = useAuth();
  const [gameState, setGameState] = useState<GameState>('waiting');
  const [currentRound, setCurrentRound] = useState(0);
  const [results, setResults] = useState<GameResult[]>([]);
  const [startTime, setStartTime] = useState(0);
  const [timeoutId, setTimeoutId] = useState<NodeJS.Timeout | null>(null);
  const [gameStarted, setGameStarted] = useState(false);

  const totalRounds = 5;

  // 게임 시작
  const startGame = () => {
    setGameStarted(true);
    setCurrentRound(1);
    setResults([]);
    startRound();
  };

  // 라운드 시작
  const startRound = useCallback(() => {
    setGameState('ready');
    
    // 2-6초 사이 랜덤 지연 후 색상 변경
    const delay = 2000 + Math.random() * 4000;
    
    const timeout = setTimeout(() => {
      setGameState('active');
      setStartTime(Date.now());
    }, delay);
    
    setTimeoutId(timeout);
  }, []);

  // 클릭 처리
  const handleClick = () => {
    if (gameState === 'ready') {
      // 너무 일찍 클릭함
      setGameState('clicked');
      toast.error('너무 빨라요! 초록색이 될 때까지 기다려주세요.');
      
      setTimeout(() => {
        if (currentRound < totalRounds) {
          startRound();
        } else {
          finishGame();
        }
      }, 1500);
      
    } else if (gameState === 'active') {
      // 올바른 타이밍에 클릭
      const reactionTime = Date.now() - startTime;
      const result: GameResult = {
        reactionTime,
        round: currentRound
      };
      
      setResults(prev => [...prev, result]);
      setGameState('clicked');
      
      toast.success(`${reactionTime}ms - 좋아요!`);
      
      setTimeout(() => {
        if (currentRound < totalRounds) {
          setCurrentRound(prev => prev + 1);
          startRound();
        } else {
          finishGame();
        }
      }, 1500);
    }
  };

  // 게임 종료
  const finishGame = async () => {
    setGameState('finished');
    
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
    
    const averageTime = results.reduce((sum, result) => sum + result.reactionTime, 0) / results.length;
    const score = Math.max(0, Math.round(1000 - averageTime * 2)); // 낮은 반응시간 = 높은 점수
    
    toast.success(`게임 완료! 평균 반응시간: ${Math.round(averageTime)}ms`);
    
    // 경험치 지급 로직은 실제 구현에서 추가
    if (score >= 500) {
      toast.success(`축하합니다! ${score}점을 달성하여 경험치를 획득했습니다!`);
    }
  };

  // 게임 재시작
  const resetGame = () => {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
    setGameState('waiting');
    setCurrentRound(0);
    setResults([]);
    setGameStarted(false);
  };

  // 컴포넌트 언마운트 시 타이머 정리
  useEffect(() => {
    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [timeoutId]);

  const getGameAreaColor = () => {
    switch (gameState) {
      case 'ready': return 'bg-red-500';
      case 'active': return 'bg-green-500';
      case 'clicked': return 'bg-blue-500';
      default: return 'bg-gray-200';
    }
  };

  const getGameAreaText = () => {
    switch (gameState) {
      case 'waiting': return gameStarted ? '준비...' : '시작하려면 버튼을 클릭하세요';
      case 'ready': return '잠깐! 초록색이 될 때까지 기다리세요...';
      case 'active': return '지금 클릭하세요!';
      case 'clicked': return '좋아요!';
      case 'finished': return '게임 완료!';
    }
  };

  const averageTime = results.length > 0 
    ? results.reduce((sum, result) => sum + result.reactionTime, 0) / results.length 
    : 0;
  
  const score = averageTime > 0 ? Math.max(0, Math.round(1000 - averageTime * 2)) : 0;

  if (!user) {
    return (
      <div className="container mx-auto py-8 px-4 md:px-6">
        <div className="max-w-2xl mx-auto text-center">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-8">
            <Zap className="w-16 h-16 text-blue-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-blue-900 mb-2">로그인이 필요합니다</h2>
            <p className="text-blue-700 mb-6">
              반응속도 게임을 플레이하려면 로그인해주세요.
            </p>
            <Button asChild>
              <Link href="/login">로그인하기</Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4 md:px-6">
      <div className="max-w-4xl mx-auto">
        {/* 헤더 */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2 flex items-center gap-3">
              <Zap className="w-8 h-8 text-yellow-500" />
              반응속도 게임
            </h1>
            <p className="text-muted-foreground">
              빠른 반응속도로 높은 점수를 달성해보세요! 500점 이상 시 경험치 획득
            </p>
          </div>
          <Button variant="outline" asChild>
            <Link href="/games">
              <Home className="w-4 h-4 mr-2" />
              게임 목록
            </Link>
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* 게임 영역 */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>게임 플레이</span>
                  {gameStarted && (
                    <Badge variant="outline">
                      라운드 {currentRound}/{totalRounds}
                    </Badge>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {/* 게임 영역 */}
                <div 
                  className={`w-full h-80 ${getGameAreaColor()} rounded-lg flex items-center justify-center cursor-pointer transition-colors duration-200 mb-6`}
                  onClick={handleClick}
                >
                  <div className="text-center text-white">
                    <div className="text-2xl font-bold mb-2">
                      {getGameAreaText()}
                    </div>
                    {gameState === 'active' && (
                      <Target className="w-16 h-16 mx-auto animate-pulse" />
                    )}
                  </div>
                </div>

                {/* 게임 컨트롤 */}
                <div className="flex gap-3 justify-center">
                  {!gameStarted && gameState === 'waiting' && (
                    <Button onClick={startGame} size="lg">
                      <Play className="w-4 h-4 mr-2" />
                      게임 시작
                    </Button>
                  )}
                  
                  {gameState === 'finished' && (
                    <Button onClick={resetGame} size="lg">
                      <RotateCcw className="w-4 h-4 mr-2" />
                      다시 플레이
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* 사이드바 - 통계 */}
          <div className="space-y-6">
            {/* 현재 점수 */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Trophy className="w-5 h-5" />
                  점수
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center">
                  <div className="text-4xl font-bold text-primary mb-2">
                    {score}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {score >= 500 ? '경험치 획득!' : '500점 이상 시 경험치 획득'}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* 평균 반응시간 */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="w-5 h-5" />
                  평균 반응시간
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center">
                  <div className="text-3xl font-bold text-blue-600 mb-2">
                    {averageTime > 0 ? `${Math.round(averageTime)}ms` : '-'}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    빠를수록 높은 점수
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* 라운드별 결과 */}
            {results.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>라운드별 결과</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {results.map((result, index) => (
                      <div key={index} className="flex justify-between items-center py-2 border-b last:border-b-0">
                        <span className="font-medium">라운드 {result.round}</span>
                        <Badge variant={result.reactionTime < 300 ? 'default' : result.reactionTime < 500 ? 'secondary' : 'outline'}>
                          {result.reactionTime}ms
                        </Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* 게임 설명 */}
            <Card>
              <CardHeader>
                <CardTitle>게임 방법</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <p>1. 빨간색 화면을 보고 기다리세요</p>
                  <p>2. 초록색으로 바뀌면 빠르게 클릭하세요</p>
                  <p>3. 5라운드 진행 후 평균 반응시간으로 점수 계산</p>
                  <p>4. 500점 이상 달성 시 경험치 획득</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
} 