'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Gamepad2, 
  Zap, 
  Brain, 
  Calculator, 
  Type, 
  Play, 
  Lock, 
  Trophy,
  Clock,
  Gift
} from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/providers/AuthProvider';
import { toast } from 'sonner';

interface Game {
  id: string;
  name: string;
  icon: React.ReactNode;
  description: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  xpReward: number;
  threshold: number;
  path: string;
}

interface GameStats {
  todayPlays: number;
  maxPlays: number;
  bestScore: number;
  totalXpEarned: number;
}

export default function GamesPage() {
  const { user } = useAuth();
  const [gameStats, setGameStats] = useState<Record<string, GameStats>>({});

  const games: Game[] = [
    {
      id: 'reaction',
      name: '반응속도 게임',
      icon: <Zap className="w-6 h-6" />,
      description: '빠른 반응속도로 높은 점수를 얻어보세요! 500점 이상 시 경험치 획득',
      difficulty: 'Easy',
      xpReward: 15,
      threshold: 500,
      path: '/games/reaction'
    },
    {
      id: 'tile',
      name: '타일 매칭 게임',
      icon: <Brain className="w-6 h-6" />,
      description: '같은 그림의 타일 두 개를 찾아 매칭하세요! 800점 이상 시 경험치 획득',
      difficulty: 'Medium',
      xpReward: 20,
      threshold: 800,
      path: '/games/tile'
    },
    {
      id: 'math',
      name: '빠른 계산',
      icon: <Calculator className="w-6 h-6" />,
      description: '제한시간 내에 수학 문제를 풀어보세요! 1000점 이상 시 경험치 획득',
      difficulty: 'Medium',
      xpReward: 18,
      threshold: 1000,
      path: '/games/math'
    },
    {
      id: 'word',
      name: '단어 맞추기',
      icon: <Type className="w-6 h-6" />,
      description: '주어진 글자로 단어를 만들어보세요! 1200점 이상 시 경험치 획득',
      difficulty: 'Hard',
      xpReward: 25,
      threshold: 1200,
      path: '/games/word'
    },
  ];

  useEffect(() => {
    if (user) {
      loadGameStats();
    }
  }, [user]);

  const loadGameStats = async () => {
    try {
      // 실제 구현에서는 Firebase에서 게임 통계를 가져옴
      // 현재는 샘플 데이터 사용
      const sampleStats: Record<string, GameStats> = {
        reaction: { todayPlays: 3, maxPlays: 5, bestScore: 750, totalXpEarned: 45 },
        tile: { todayPlays: 2, maxPlays: 5, bestScore: 850, totalXpEarned: 20 },
        math: { todayPlays: 1, maxPlays: 5, bestScore: 890, totalXpEarned: 0 },
        word: { todayPlays: 0, maxPlays: 5, bestScore: 0, totalXpEarned: 0 }
      };
      setGameStats(sampleStats);
    } catch (error) {
      console.error('게임 통계 로드 오류:', error);
      toast.error('게임 통계를 불러오는 중 오류가 발생했습니다.');
    }
  };

  const getTotalPlays = () => {
    return Object.values(gameStats).reduce((sum, stats) => sum + stats.todayPlays, 0);
  };

  const getTotalMaxPlays = () => {
    return Object.values(gameStats).reduce((sum, stats) => sum + stats.maxPlays, 0);
  };

  const getTotalXpEarned = () => {
    return Object.values(gameStats).reduce((sum, stats) => sum + stats.totalXpEarned, 0);
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'Easy': return 'bg-green-100 text-green-800';
      case 'Medium': return 'bg-yellow-100 text-yellow-800';
      case 'Hard': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const canPlayGame = (gameId: string) => {
    const stats = gameStats[gameId];
    if (!stats) return true;
    return stats.todayPlays < stats.maxPlays;
  };

  const handleGameClick = (game: Game) => {
    if (!user) {
      toast.error('로그인이 필요합니다.');
      return;
    }

    if (!canPlayGame(game.id)) {
      toast.error('오늘의 플레이 횟수를 모두 사용했습니다. 광고를 시청하여 추가 플레이가 가능합니다.');
      return;
    }

    // 게임 페이지로 이동
    window.location.href = game.path;
  };

  if (!user) {
    return (
      <div className="container mx-auto py-8 px-4 md:px-6">
        <div className="max-w-4xl mx-auto text-center">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-8">
            <Gamepad2 className="w-16 h-16 text-blue-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-blue-900 mb-2">로그인이 필요합니다</h2>
            <p className="text-blue-700 mb-6">
              미니게임을 플레이하고 경험치를 획득하려면 로그인해주세요.
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
      <div className="max-w-6xl mx-auto">
        {/* 헤더 */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-4 flex items-center justify-center gap-3">
            <Gamepad2 className="w-8 h-8 text-primary" />
            미니게임
          </h1>
          <p className="text-muted-foreground text-lg">
            재미있는 게임을 플레이하고 경험치를 획득해보세요!
          </p>
        </div>

        {/* 오늘의 게임 현황 */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="w-5 h-5" />
              오늘의 게임 현황
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-primary mb-1">
                  {getTotalPlays()}
                </div>
                <div className="text-sm text-muted-foreground">오늘 플레이</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-green-600 mb-1">
                  {getTotalMaxPlays() - getTotalPlays()}
                </div>
                <div className="text-sm text-muted-foreground">남은 횟수</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-yellow-600 mb-1">
                  {getTotalXpEarned()}
                </div>
                <div className="text-sm text-muted-foreground">획득 경험치</div>
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>진행률</span>
                <span>{getTotalPlays()}/{getTotalMaxPlays()}</span>
              </div>
              <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                <div className="h-2 bg-primary" style={{ width: `${(getTotalPlays() / getTotalMaxPlays()) * 100}%` }}></div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 게임 목록 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {games.map((game) => {
            const stats = gameStats[game.id];
            const playable = canPlayGame(game.id);
            
            return (
              <Card key={game.id} className={`cursor-pointer transition-all duration-200 ${
                playable ? 'hover:shadow-lg hover:scale-[1.02]' : 'opacity-60'
              }`}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-3 bg-primary/10 rounded-lg">
                        {game.icon}
                      </div>
                      <div>
                        <CardTitle className="text-lg">{game.name}</CardTitle>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="secondary" className={getDifficultyColor(game.difficulty)}>
                            {game.difficulty}
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            +{game.xpReward} XP
                          </Badge>
                        </div>
                      </div>
                    </div>
                    {stats && (
                      <div className="text-right text-sm">
                        <div className="font-medium">
                          {stats.todayPlays}/{stats.maxPlays}
                        </div>
                        <div className="text-muted-foreground text-xs">
                          오늘 플레이
                        </div>
                      </div>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4">
                    {game.description}
                  </p>
                  
                  {stats && (
                    <div className="grid grid-cols-2 gap-4 mb-4 p-3 bg-muted rounded-lg">
                      <div className="text-center">
                        <div className="font-bold text-lg">{stats.bestScore}</div>
                        <div className="text-xs text-muted-foreground">최고 점수</div>
                      </div>
                      <div className="text-center">
                        <div className="font-bold text-lg text-yellow-600">{stats.totalXpEarned}</div>
                        <div className="text-xs text-muted-foreground">획득 XP</div>
                      </div>
                    </div>
                  )}
                  
                  <Button 
                    className="w-full" 
                    onClick={() => handleGameClick(game)}
                    disabled={!playable}
                  >
                    {playable ? (
                      <>
                        <Play className="w-4 h-4 mr-2" />
                        플레이하기
                      </>
                    ) : (
                      <>
                        <Lock className="w-4 h-4 mr-2" />
                        플레이 완료
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* 광고 안내 */}
        <Card className="border-2 border-yellow-200 bg-yellow-50">
          <CardContent className="text-center py-6">
            <Gift className="w-12 h-12 text-yellow-600 mx-auto mb-3" />
            <h3 className="text-lg font-bold text-yellow-800 mb-2">
              광고 시청으로 추가 플레이!
            </h3>
            <p className="text-yellow-700 text-sm mb-4">
              오늘의 무료 플레이를 모두 사용했나요?<br />
              짧은 광고를 시청하면 게임을 더 플레이할 수 있습니다.
            </p>
            <Button variant="outline" className="border-yellow-600 text-yellow-600 hover:bg-yellow-100">
              <Clock className="w-4 h-4 mr-2" />
              광고 시청하기 (준비 중)
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 