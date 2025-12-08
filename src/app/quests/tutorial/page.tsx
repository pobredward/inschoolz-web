'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/providers/AuthProvider';
import { tutorialChain } from '@/lib/quests/chains/tutorial';
import { QUEST_GUIDES, initializeUserQuests } from '@/lib/quests/questService';
import { QuestStep, UserQuestProgress } from '@/types';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export default function TutorialQuestPage() {
  const router = useRouter();
  const { user } = useAuth();
  
  const [loading, setLoading] = useState(true);
  const [progress, setProgress] = useState<UserQuestProgress | null>(null);
  const [steps, setSteps] = useState<QuestStep[]>(tutorialChain.steps);
  
  useEffect(() => {
    if (user?.uid) {
      loadQuestData();
    }
  }, [user?.uid]);
  
  const loadQuestData = async () => {
    if (!user?.uid) return;
    
    try {
      setLoading(true);
      const questRef = doc(db, 'quests', user.uid);
      const questDoc = await getDoc(questRef);
      
      let data: UserQuestProgress;
      
      if (questDoc.exists()) {
        data = questDoc.data() as UserQuestProgress;
      } else {
        // 퀘스트 데이터가 없으면 초기화
        data = await initializeUserQuests(user.uid);
      }
      
      setProgress(data);
      
      const chainProgress = data.chains.tutorial;
      const currentStepNum = chainProgress?.currentStep || 1;
      
      // 단계별 진행도 업데이트
      const updatedSteps = tutorialChain.steps.map(step => {
        const stepProgress = chainProgress?.stepProgress[step.id];
        
        // 현재 단계보다 앞선 단계: 완료됨
        // 현재 단계: 진행 중
        // 현재 단계보다 뒤: 잠김
        let status: 'completed' | 'in_progress' | 'locked' = 'locked';
        
        if (stepProgress?.status === 'completed') {
          status = 'completed';
        } else if (step.step === currentStepNum) {
          status = 'in_progress';
        } else if (step.step < currentStepNum) {
          status = 'completed';
        }
        
        return {
          ...step,
          objective: {
            ...step.objective,
            current: stepProgress?.progress || 0,
          },
          status,
        };
      });
      
      setSteps(updatedSteps);
    } catch (error) {
      console.error('퀘스트 데이터 로드 오류:', error);
    } finally {
      setLoading(false);
    }
  };
  
  const renderProgressBar = () => {
    if (!progress) return null;
    
    const chainProgress = progress.chains.tutorial;
    const currentStepNum = chainProgress?.currentStep || 0;
    const progressPercent = (currentStepNum / tutorialChain.totalSteps) * 100;
    
    return (
      <div className="bg-white rounded-xl p-6 shadow-sm mb-6">
        <div className="flex justify-between items-center mb-3">
          <h3 className="text-lg font-semibold text-gray-900">전체 진행도</h3>
          <span className="text-lg font-bold text-blue-600">
            {currentStepNum} / {tutorialChain.totalSteps}
          </span>
        </div>
        <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-blue-500 rounded-full transition-all duration-300"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>
    );
  };
  
  const renderStep = (step: QuestStep, index: number) => {
    const isCompleted = step.status === 'completed';
    const isInProgress = step.status === 'in_progress';
    const isLocked = step.status === 'locked';
    
    const progressValue = step.objective.current || 0;
    const targetValue = step.objective.target;
    const stepProgressPercent = (progressValue / targetValue) * 100;
    
    // 가이드 정보
    const guide = QUEST_GUIDES[step.id];
    
    // 잠긴 단계는 간략하게만 표시
    if (isLocked) {
      return (
        <div
          key={step.id}
          className="bg-gray-100 rounded-xl p-4 opacity-50"
        >
          <div className="flex items-center gap-3">
            <div className="relative">
              <span className="text-3xl grayscale">🔒</span>
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-gray-400">단계 {step.step}</span>
                <span className="text-xs font-semibold text-gray-500 bg-gray-200 px-2 py-1 rounded-full">
                  잠김
                </span>
              </div>
              <p className="text-sm text-gray-400">이전 단계를 완료하면 해금됩니다</p>
            </div>
          </div>
        </div>
      );
    }
    
    return (
      <div
        key={step.id}
        className={`bg-white rounded-xl p-6 shadow-sm transition-all ${
          isCompleted ? 'border-2 border-green-500 bg-green-50' : ''
        } ${isInProgress ? 'border-2 border-blue-500 ring-2 ring-blue-100' : ''}`}
      >
        {/* 단계 헤더 */}
        <div className="flex items-start gap-4 mb-4">
          <div className="relative">
            <span className="text-5xl">{step.icon || '🎯'}</span>
            {isCompleted && (
              <div className="absolute -bottom-1 -right-1 bg-green-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                ✓
              </div>
            )}
          </div>
          
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-sm font-medium text-gray-500">단계 {step.step}</span>
              {isCompleted && (
                <span className="text-xs font-semibold text-green-600 bg-green-100 px-2 py-1 rounded-full">
                  완료
                </span>
              )}
              {isInProgress && (
                <span className="text-xs font-semibold text-blue-600 bg-blue-100 px-2 py-1 rounded-full">
                  진행 중
                </span>
              )}
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-1">{step.title}</h3>
            <p className="text-sm text-gray-600">{step.description}</p>
          </div>
        </div>
        
        {/* 스토리 텍스트 */}
        <div className="bg-gray-50 rounded-lg p-4 mb-4">
          <p className="text-sm text-gray-600 italic">"{step.storyText}"</p>
        </div>
        
        {/* 구체적인 가이드 (진행 중인 경우만) */}
        {isInProgress && guide && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-4">
            <h4 className="text-sm font-bold text-amber-800 mb-2 flex items-center gap-2">
              <span>📍</span> 어떻게 하나요?
            </h4>
            <p className="text-sm text-amber-700 mb-2">{guide.howTo}</p>
            <p className="text-xs text-amber-600">
              <span className="font-medium">📌 위치:</span> {guide.where}
            </p>
            {guide.tip && (
              <p className="text-xs text-amber-600 mt-1">
                <span className="font-medium">💡 팁:</span> {guide.tip}
              </p>
            )}
          </div>
        )}
        
        {/* 진행도 바 (진행 중인 경우만) */}
        {isInProgress && (
          <div className="mb-4">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium text-gray-700">진행도</span>
              <span className="text-sm font-bold" style={{ color: step.color || '#3B82F6' }}>
                {progressValue} / {targetValue}
              </span>
            </div>
            <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-300"
                style={{
                  width: `${stepProgressPercent}%`,
                  backgroundColor: step.color || '#3B82F6',
                }}
              />
            </div>
          </div>
        )}
        
        {/* 보상 섹션 */}
        <div>
          <span className="text-sm font-medium text-gray-700 block mb-2">보상</span>
          <div className="flex flex-wrap gap-2">
            <div className="flex items-center gap-2 bg-yellow-100 text-yellow-800 px-3 py-1.5 rounded-full text-sm font-medium">
              <span>⭐</span>
              <span>{step.rewards.xp} XP</span>
            </div>
            {step.rewards.badge && (
              <div className="flex items-center gap-2 bg-purple-100 text-purple-800 px-3 py-1.5 rounded-full text-sm font-medium">
                <span>🎖️</span>
                <span>배지</span>
              </div>
            )}
            {step.rewards.title && (
              <div className="flex items-center gap-2 bg-amber-100 text-amber-800 px-3 py-1.5 rounded-full text-sm font-medium">
                <span>👑</span>
                <span>{step.rewards.title}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };
  
  const renderCompletionRewards = () => {
    const chainProgress = progress?.chains.tutorial;
    const isCompleted = chainProgress?.status === 'completed';
    
    return (
      <div
        className={`rounded-xl p-6 border-2 ${
          isCompleted
            ? 'bg-yellow-50 border-yellow-400'
            : 'bg-white border-amber-400 border-dashed'
        }`}
      >
        <h3 className="text-2xl font-bold text-gray-900 text-center mb-3">
          {isCompleted ? '🎉 체인 완료!' : '🏆 완료 보상'}
        </h3>
        <p className="text-center text-gray-600 mb-6">
          {isCompleted
            ? '축하합니다! 인스쿨즈 입학기를 완료했습니다!'
            : '모든 단계를 완료하면 다음 보상을 받을 수 있습니다:'}
        </p>
        
        <div className="space-y-3">
          <div className="flex items-center gap-3 bg-white p-4 rounded-lg">
            <span className="text-3xl">⭐</span>
            <span className="text-lg font-semibold text-gray-900">
              {tutorialChain.completionRewards.xp} XP
            </span>
          </div>
          
          {tutorialChain.completionRewards.badge && (
            <div className="flex items-center gap-3 bg-white p-4 rounded-lg">
              <span className="text-3xl">🎖️</span>
              <span className="text-lg font-semibold text-gray-900">
                {tutorialChain.completionRewards.badge}
              </span>
            </div>
          )}
          
          {tutorialChain.completionRewards.title && (
            <div className="flex items-center gap-3 bg-white p-4 rounded-lg">
              <span className="text-3xl">👑</span>
              <span className="text-lg font-semibold text-gray-900">
                칭호: {tutorialChain.completionRewards.title}
              </span>
            </div>
          )}
          
          {tutorialChain.completionRewards.frame && (
            <div className="flex items-center gap-3 bg-white p-4 rounded-lg">
              <span className="text-3xl">🖼️</span>
              <span className="text-lg font-semibold text-gray-900">
                {tutorialChain.completionRewards.frame}
              </span>
            </div>
          )}
          
          {tutorialChain.completionRewards.items && tutorialChain.completionRewards.items.length > 0 && (
            <div className="flex items-center gap-3 bg-white p-4 rounded-lg">
              <span className="text-3xl">📦</span>
              <span className="text-lg font-semibold text-gray-900">
                {tutorialChain.completionRewards.items.join(', ')}
              </span>
            </div>
          )}
        </div>
      </div>
    );
  };
  
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">퀘스트 불러오는 중...</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-gray-50">
      {/* 헤더 */}
      <div className="bg-white border-b sticky top-0 z-10 shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <button
            onClick={() => router.back()}
            className="text-blue-600 hover:text-blue-700 font-medium mb-4 flex items-center gap-2"
          >
            <span>←</span>
            <span>뒤로가기</span>
          </button>
          <div className="flex items-center gap-4">
            <span className="text-6xl">{tutorialChain.icon}</span>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{tutorialChain.name}</h1>
              <p className="text-gray-600 mt-1">{tutorialChain.description}</p>
            </div>
          </div>
        </div>
      </div>
      
      {/* 컨텐츠 */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* 전체 진행도 */}
        {renderProgressBar()}
        
        {/* 퀘스트 단계들 */}
        <div className="space-y-6 mb-8">
          {steps.map((step, index) => renderStep(step, index))}
        </div>
        
        {/* 완료 보상 */}
        {renderCompletionRewards()}
      </div>
    </div>
  );
}

