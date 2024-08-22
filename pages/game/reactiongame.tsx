import React, { useState, useEffect, useRef } from "react";
import Layout from "../../components/Layout";
import styled from "@emotion/styled";
import { useAuth } from "../../hooks/useAuth";
import { db } from "../../lib/firebase";
import { doc, setDoc, getDoc, updateDoc, increment } from "firebase/firestore";
import Link from "next/link";
import DefaultModal from "../../components/modal/DefaultModal";
import ExperienceModal from "../../components/modal/ExperienceModal";
import {
  updateUserExperience,
  getExperienceSettings,
} from "../../utils/experience";
import { useSetRecoilState, useRecoilState } from "recoil";
import { userExperienceState, userLevelState } from "../../store/atoms";

const ReactionGame: React.FC = () => {
  const [gameState, setGameState] = useState<"waiting" | "ready" | "clicking">(
    "waiting",
  );
  const [startTime, setStartTime] = useState(0);
  const [endTime, setEndTime] = useState(0);
  const [bestScore, setBestScore] = useState<number | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [modalContent, setModalContent] = useState({ title: "", message: "" });
  const [remainingPlays, setRemainingPlays] = useState<number | null>(null);
  const { user } = useAuth();
  const [showExpModal, setShowExpModal] = useState(false);
  const [expGained, setExpGained] = useState(0);
  const [newLevel, setNewLevel] = useState<number | undefined>(undefined);
  const timeoutRef = useRef<number | null>(null);
  const setUserExperience = useSetRecoilState(userExperienceState);
  const [userLevel, setUserLevel] = useRecoilState(userLevelState);
  const [lastLevelUp, setLastLevelUp] = useState<number | null>(null);

  useEffect(() => {
    if (user) {
      fetchBestScore();
      updateRemainingPlays();
    } else {
      const localBestScore = localStorage.getItem("reactionGameBestScore");
      if (localBestScore) {
        setBestScore(parseInt(localBestScore));
      }
      const localRemainingPlays = localStorage.getItem(
        "reactionGameRemainingPlays",
      );
      setRemainingPlays(
        localRemainingPlays ? parseInt(localRemainingPlays) : 5,
      );
    }
  }, [user]);

  const fetchBestScore = async () => {
    if (user) {
      const scoreDoc = await getDoc(doc(db, "reactionGameScores", user.uid));
      if (scoreDoc.exists()) {
        setBestScore(scoreDoc.data().bestScore);
      }
    }
  };

  const updateRemainingPlays = async () => {
    if (user) {
      const gameInfo = await getUserGameInfo(user.uid);
      const settings = await getExperienceSettings();

      const remaining = settings.maxDailyGames - gameInfo.reactionGamePlays;
      setRemainingPlays(remaining);
    }
  };

  const getUserGameInfo = async (userId: string) => {
    const userDoc = await getDoc(doc(db, "users", userId));
    if (!userDoc.exists()) {
      throw new Error("User data not found");
    }
    const gameInfo = userDoc.data().gameInfo || {
      reactionGamePlays: 0,
      flappyBirdPlays: 0,
    };

    const today = new Date().toISOString().split("T")[0];
    if (gameInfo.lastResetDate !== today) {
      gameInfo.reactionGamePlays = 0;
      gameInfo.flappyBirdPlays = 0;
      gameInfo.lastResetDate = today;

      await updateDoc(doc(db, "users", userId), {
        "gameInfo.reactionGamePlays": 0,
        "gameInfo.flappyBirdPlays": 0,
        "gameInfo.lastResetDate": today,
      });
    }

    return gameInfo;
  };

  const startGame = () => {
    if (remainingPlays === 0) {
      setModalContent({
        title: "게임 불가",
        message: user
          ? "오늘의 게임 횟수를 모두 사용했습니다."
          : "게임 횟수를 모두 사용했습니다. 로그인하여 내 점수를 기록하고 친구들과 비교해보세요!",
      });
      setShowModal(true);
      return;
    }

    setGameState("ready");
    const delay = Math.floor(Math.random() * 3000) + 2000; // 2-5 seconds delay
    timeoutRef.current = window.setTimeout(() => {
      setGameState("clicking");
      setStartTime(Date.now());
    }, delay);
  };

  const handleClick = async () => {
    if (gameState === "clicking") {
      const clickTime = Date.now();
      setEndTime(clickTime);
      const reactionTime = clickTime - startTime;
      setGameState("waiting");

      try {
        if (user) {
          await handleGameScore(user.uid, reactionTime);

          const userRef = doc(db, "users", user.uid);
          await updateDoc(userRef, {
            "gameInfo.reactionGamePlays": increment(1),
          });

          await updateRemainingPlays();
        } else {
          const newRemainingPlays = (remainingPlays || 5) - 1;
          setRemainingPlays(newRemainingPlays);
          localStorage.setItem(
            "reactionGameRemainingPlays",
            newRemainingPlays.toString(),
          );
        }
        showResult(reactionTime);
      } catch (error) {
        if (error instanceof Error) {
          setModalContent({
            title: "오류",
            message: error.message,
          });
          setShowModal(true);
        }
      }
    } else if (gameState === "ready") {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }

      setGameState("waiting");

      if (user) {
        const userRef = doc(db, "users", user.uid);
        await updateDoc(userRef, {
          "gameInfo.reactionGamePlays": increment(1),
        });

        await updateRemainingPlays();
      } else {
        const newRemainingPlays = (remainingPlays || 5) - 1;
        setRemainingPlays(newRemainingPlays);
        localStorage.setItem(
          "reactionGameRemainingPlays",
          newRemainingPlays.toString(),
        );
      }

      setModalContent({
        title: "너무 일찍 클릭했습니다!",
        message: "신호가 뜨고 나서 클릭해야 합니다. 기회가 소진되었습니다.",
      });
      setShowModal(true);
    } else {
      startGame();
    }
  };

  const handleGameScore = async (userId: string, reactionTime: number) => {
    const settings = await getExperienceSettings();
    if (reactionTime <= settings.reactionGameThreshold) {
      const result = await updateUserExperience(
        userId,
        settings.reactionGameExperience,
        "반응 게임 성공",
      );
      setExpGained(result.expGained);
      setUserExperience(result.newExperience);
      setUserLevel(result.newLevel);

      if (result.levelUp && result.newLevel !== lastLevelUp) {
        setLastLevelUp(result.newLevel);
        setNewLevel(result.newLevel);
      } else {
        setNewLevel(undefined);
      }

      setShowExpModal(true);
    }
  };

  const showResult = async (reactionTime: number) => {
    if (user) {
      if (!bestScore || reactionTime < bestScore) {
        await setDoc(doc(db, "reactionGameScores", user.uid), {
          userId: user.userId,
          schoolName: user.schoolName,
          address1: user.address1,
          address2: user.address2,
          bestScore: reactionTime,
        });
        setBestScore(reactionTime);
        setModalContent({
          title: "새로운 최고 기록!",
          message: `축하합니다! 새로운 최고 기록: ${reactionTime}ms`,
        });
      } else {
        setModalContent({
          title: "게임 결과",
          message: `반응 시간: ${reactionTime}ms\n최고 기록: ${bestScore}ms`,
        });
      }
    } else {
      const localBestScore = localStorage.getItem("reactionGameBestScore");
      if (!localBestScore || reactionTime < parseInt(localBestScore)) {
        localStorage.setItem("reactionGameBestScore", reactionTime.toString());
        setBestScore(reactionTime);
        setModalContent({
          title: "새로운 최고 기록!",
          message: `축하합니다! 새로운 최고 기록: ${reactionTime}ms\n회원가입하여 기록을 저장하고 랭킹에 등록하세요!`,
        });
      } else {
        setModalContent({
          title: "게임 결과",
          message: `반응 시간: ${reactionTime}ms\n최고 기록: ${localBestScore}ms`,
        });
      }
    }
    setShowModal(true);
  };

  return (
    <Layout>
      <GameContainer>
        <GameTitle>반응속도 게임</GameTitle>
        <GameArea onClick={handleClick} gameState={gameState}>
          {gameState === "waiting" && <GameText>클릭하여 시작</GameText>}
          {gameState === "ready" && <GameText>준비...</GameText>}
          {gameState === "clicking" && <GameText>클릭하세요!</GameText>}
        </GameArea>
        <ScoreBoard>
          {bestScore && <ScoreText>최고 기록: {bestScore}ms</ScoreText>}
          <ScoreText>남은 플레이 횟수: {remainingPlays}</ScoreText>
        </ScoreBoard>
        <BackButton href="/game">메인 메뉴로 돌아가기</BackButton>
      </GameContainer>
      <DefaultModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={modalContent.title}
        message={modalContent.message}
      />
      <ExperienceModal
        isOpen={showExpModal}
        onClose={() => setShowExpModal(false)}
        expGained={expGained}
        newLevel={newLevel}
      />
    </Layout>
  );
};

const GameContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 1rem;
  /* background-color: #f0f8ff; */
  border-radius: 15px;
  /* box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); */
  max-width: 500px;
  margin: 0rem auto;
`;

const GameTitle = styled.h1`
  font-size: 1.5rem;
  color: #2c3e50;
  text-align: center;
  text-align: center;
`;

const GameArea = styled.div<{ gameState: string }>`
  width: 250px;
  height: 250px;
  display: flex;
  justify-content: center;
  align-items: center;
  font-size: 24px;
  cursor: pointer;
  background-color: ${(props) =>
    props.gameState === "waiting"
      ? "#4CAF50"
      : props.gameState === "ready"
        ? "#FFC107"
        : "#F44336"};
  color: white;
  border-radius: 50%;
  margin: 1rem 0;
  transition: all 0.3s ease;
  box-shadow: 0 6px 10px rgba(0, 0, 0, 0.1);

  &:hover {
    transform: scale(1.05);
  }
`;

const GameText = styled.p`
  font-size: 1.5rem;
  font-weight: bold;
  text-align: center;
`;

const ScoreBoard = styled.div`
  background-color: #ffffff;
  padding: 1rem;
  border-radius: 10px;
  margin-top: 2rem;
  width: 100%;
  max-width: 300px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
`;

const ScoreText = styled.p`
  font-size: 1rem;
  color: #34495e;
  margin: 0.5rem 0;
  text-align: center;
`;

const BackButton = styled(Link)`
  margin-top: 1rem;
  padding: 0.75rem 1.5rem;
  font-size: 1rem;
  background-color: #ecf0f1;
  color: #34495e;
  text-decoration: none;
  border-radius: 5px;
  transition: background-color 0.3s;
  font-weight: bold;

  &:hover {
    background-color: #bdc3c7;
  }
`;

export default ReactionGame;
