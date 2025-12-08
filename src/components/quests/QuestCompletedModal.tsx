'use client';

import React, { useEffect, useState } from 'react';
import { QuestStep } from '@/types';
import { motion, AnimatePresence } from 'framer-motion';

interface QuestCompletedModalProps {
  isOpen: boolean;
  onClose: () => void;
  step: QuestStep | null;
  rewards: {
    xp: number;
    badge?: string;
    title?: string;
  } | null;
}

export default function QuestCompletedModal({
  isOpen,
  onClose,
  step,
  rewards,
}: QuestCompletedModalProps) {
  const [showConfetti, setShowConfetti] = useState(false);
  
  useEffect(() => {
    if (isOpen) {
      setShowConfetti(true);
      // 5초 후 자동 닫기
      const timer = setTimeout(() => {
        onClose();
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [isOpen, onClose]);
  
  if (!step || !rewards) return null;
  
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* 배경 오버레이 */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
          />
          
          {/* 모달 */}
          <motion.div
            initial={{ opacity: 0, scale: 0.5, y: 50 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.5, y: 50 }}
            transition={{ type: 'spring', damping: 15, stiffness: 300 }}
            className="fixed inset-0 flex items-center justify-center z-50 p-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div 
              className="relative bg-gradient-to-br from-amber-50 to-orange-100 dark:from-amber-900/90 dark:to-orange-900/90 rounded-3xl p-8 max-w-sm w-full shadow-2xl border-4 border-amber-400 dark:border-amber-500"
              onClick={onClose}
            >
              {/* 컨페티 효과 */}
              {showConfetti && (
                <div className="absolute inset-0 overflow-hidden rounded-3xl pointer-events-none">
                  {[...Array(20)].map((_, i) => (
                    <motion.div
                      key={i}
                      initial={{ 
                        y: -20, 
                        x: Math.random() * 300 - 150,
                        rotate: 0,
                        opacity: 1 
                      }}
                      animate={{ 
                        y: 400, 
                        x: Math.random() * 300 - 150,
                        rotate: Math.random() * 360,
                        opacity: 0 
                      }}
                      transition={{ 
                        duration: 2 + Math.random(), 
                        delay: Math.random() * 0.5,
                        ease: 'easeOut' 
                      }}
                      className="absolute w-3 h-3 rounded-full"
                      style={{
                        left: '50%',
                        backgroundColor: ['#FFD700', '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7'][i % 6],
                      }}
                    />
                  ))}
                </div>
              )}
              
              {/* 아이콘 */}
              <motion.div
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ delay: 0.2, type: 'spring', damping: 10 }}
                className="text-7xl text-center mb-4"
              >
                🎉
              </motion.div>
              
              {/* 타이틀 */}
              <motion.h2
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="text-2xl font-bold text-center text-amber-800 dark:text-amber-200 mb-2"
              >
                퀘스트 완료!
              </motion.h2>
              
              {/* 퀘스트 정보 */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="text-center mb-6"
              >
                <div className="flex items-center justify-center gap-2 mb-2">
                  <span className="text-3xl">{step.icon}</span>
                  <span className="text-lg font-semibold text-gray-800 dark:text-gray-200">
                    {step.title}
                  </span>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {step.storyText}
                </p>
              </motion.div>
              
              {/* 보상 */}
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.5 }}
                className="bg-white/50 dark:bg-black/20 rounded-2xl p-4 mb-4"
              >
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-3 text-center">
                  획득한 보상
                </p>
                <div className="flex items-center justify-center gap-4">
                  {/* XP */}
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.6, type: 'spring' }}
                    className="flex items-center gap-1 bg-blue-100 dark:bg-blue-900/50 px-3 py-2 rounded-xl"
                  >
                    <span className="text-xl">⭐</span>
                    <span className="font-bold text-blue-600 dark:text-blue-400">
                      +{rewards.xp} XP
                    </span>
                  </motion.div>
                  
                  {/* 배지 */}
                  {rewards.badge && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: 0.7, type: 'spring' }}
                      className="flex items-center gap-1 bg-purple-100 dark:bg-purple-900/50 px-3 py-2 rounded-xl"
                    >
                      <span className="text-xl">🏅</span>
                      <span className="font-bold text-purple-600 dark:text-purple-400">
                        배지
                      </span>
                    </motion.div>
                  )}
                  
                  {/* 칭호 */}
                  {rewards.title && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: 0.8, type: 'spring' }}
                      className="flex items-center gap-1 bg-amber-100 dark:bg-amber-900/50 px-3 py-2 rounded-xl"
                    >
                      <span className="text-xl">👑</span>
                      <span className="font-bold text-amber-600 dark:text-amber-400">
                        {rewards.title}
                      </span>
                    </motion.div>
                  )}
                </div>
              </motion.div>
              
              {/* 닫기 버튼 */}
              <motion.button
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.9 }}
                onClick={onClose}
                className="w-full py-3 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-bold rounded-xl shadow-lg transition-all"
              >
                확인
              </motion.button>
              
              {/* 자동 닫힘 표시 */}
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.5 }}
                transition={{ delay: 1 }}
                className="text-xs text-center text-gray-500 mt-2"
              >
                5초 후 자동으로 닫힙니다
              </motion.p>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}







