'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Zap, Grid3X3, Calculator, BookOpen } from 'lucide-react';
import { useAuth } from '@/providers/AuthProvider';
import { useRouter } from 'next/navigation';

interface Game {
  id: string;
  name: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  route: string;
  isActive: boolean;
}

const games: Game[] = [
  {
    id: 'reaction',
    name: '반응속도 게임',
    description: '빠른 반응속도로 높은 점수를 획득하세요!',
    icon: Zap,
    route: '/games/reaction',
    isActive: true
  },
  {
    id: 'tile',
    name: '타일 매칭 게임',
    description: '곧 출시 예정입니다',
    icon: Grid3X3,
    route: '/games/tile',
    isActive: false
  },
  {
    id: 'calculation',
    name: '빠른 계산',
    description: '곧 출시 예정입니다',
    icon: Calculator,
    route: '/games/calculation',
    isActive: false
  },
  {
    id: 'word',
    name: '단어 맞추기',
    description: '곧 출시 예정입니다',
    icon: BookOpen,
    route: '/games/word',
    isActive: false
  }
];

export default function GamesPage() {
  const { user } = useAuth();
  const router = useRouter();

  const handleGameClick = (game: Game) => {
    if (!game.isActive) {
      alert('이 게임은 곧 출시될 예정입니다! 🚀');
      return;
    }
    
    if (!user) {
      alert('게임을 플레이하려면 로그인이 필요합니다.');
      router.push('/auth/login');
      return;
    }
    
    router.push(game.route);
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold mb-2">🎮 미니게임</h1>
        <p className="text-muted-foreground">
          게임을 플레이하고 경험치를 획득하세요!
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
        {games.map((game) => {
          const IconComponent = game.icon;
          return (
            <Card 
              key={game.id}
              className={`relative cursor-pointer transition-all duration-200 hover:shadow-lg ${
                !game.isActive ? 'border-dashed opacity-70' : 'hover:scale-105'
              }`}
              onClick={() => handleGameClick(game)}
            >
              {!game.isActive && (
                <Badge 
                  variant="secondary" 
                  className="absolute top-2 right-2 z-10"
                >
                  곧 출시
                </Badge>
              )}
              
              <CardHeader className="text-center pb-4">
                <div className="flex justify-center mb-3">
                  <IconComponent className={`w-12 h-12 ${game.isActive ? 'text-green-500' : 'text-gray-400'}`} />
                </div>
                <CardTitle className="text-lg">{game.name}</CardTitle>
              </CardHeader>
              
              <CardContent className="text-center">
                <p className="text-sm text-muted-foreground mb-4">
                  {game.description}
                </p>
                
                <Button 
                  className="w-full"
                  variant={game.isActive ? "default" : "outline"}
                  disabled={!game.isActive}
                >
                  {game.isActive ? '플레이하기' : '준비 중'}
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
} 