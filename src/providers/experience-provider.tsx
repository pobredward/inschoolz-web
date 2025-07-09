"use client";

import { createContext, useContext, useState, ReactNode } from "react";
import { ExperienceAlert, ExperienceAlertContextType } from "@/components/ui/experience-alert";

// 컨텍스트 생성
export const ExperienceContext = createContext<ExperienceAlertContextType | null>(null);

// 컨텍스트 훅
export const useExperience = () => {
  const context = useContext(ExperienceContext);
  if (!context) {
    throw new Error("useExperience must be used within ExperienceProvider");
  }
  return context;
};

// 프로바이더 props
interface ExperienceProviderProps {
  children: ReactNode;
}

// 경험치 프로바이더 컴포넌트
export function ExperienceProvider({ children }: ExperienceProviderProps) {
  // 경험치 획득 알림 상태
  const [expGainState, setExpGainState] = useState({
    show: false,
    xp: 0,
    message: "",
  });

  // 레벨업 알림 상태
  const [levelUpState, setLevelUpState] = useState({
    show: false,
    xp: 0,
    oldLevel: 1,
    newLevel: 1,
  });

  // 경험치 획득 알림 표시
  const showExpGain = (xp: number, message?: string) => {
    setExpGainState({
      show: true,
      xp,
      message: message || "",
    });
  };

  // 레벨업 알림 표시
  const showLevelUp = (xp: number, oldLevel: number, newLevel: number) => {
    setLevelUpState({
      show: true,
      xp,
      oldLevel,
      newLevel,
    });
  };

  return (
    <ExperienceContext.Provider
      value={{
        showExpGain,
        showLevelUp,
      }}
    >
      {children}

      {/* 경험치 획득 알림 */}
      <ExperienceAlert
        show={expGainState.show}
        onClose={() => setExpGainState((prev) => ({ ...prev, show: false }))}
        xp={expGainState.xp}
        message={expGainState.message}
        type="gain"
      />

      {/* 레벨업 알림 */}
      <ExperienceAlert
        show={levelUpState.show}
        onClose={() => setLevelUpState((prev) => ({ ...prev, show: false }))}
        xp={levelUpState.xp}
        oldLevel={levelUpState.oldLevel}
        newLevel={levelUpState.newLevel}
        type="levelup"
      />
    </ExperienceContext.Provider>
  );
} 