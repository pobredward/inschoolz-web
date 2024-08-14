import React, { useState, useEffect } from "react";
import Layout from "../../components/Layout";
import styled from "@emotion/styled";
import { useAuth } from "../../hooks/useAuth";
import { db } from "../../lib/firebase";
import { doc, setDoc, getDoc } from "firebase/firestore";
import Link from "next/link";
import DefaultModal from "../../components/modal/DefaultModal";
import ExperienceModal from "../../components/modal/ExperienceModal";
import {
  updateUserExperience,
  getExperienceSettings,
} from "../../utils/experience";

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
  const [gamesPlayed, setGamesPlayed] = useState(0);

  useEffect(() => {
    if (user) {
      fetchBestScore();
      // updateRemainingPlays();
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

  // const updateRemainingPlays = async () => {
  //   if (user) {
  //     const gameInfo = await getUserGameInfo(user.uid);
  //     const settings = await getExperienceSettings();
  //     setRemainingPlays(settings.maxDailyGames - gameInfo.reactionGamePlays);
  //   }
  // };

  const startGame = () => {
    // if (!user || remainingPlays === 0) {
    //   setModalContent({
    //     title: "게임 불가",
    //     message: "오늘의 게임 횟수를 모두 사용했습니다.",
    //   });
    //   setShowModal(true);
    //   return;
    // }

    setGameState("ready");
    const delay = Math.floor(Math.random() * 3000) + 2000; // 2-5 seconds delay
    setTimeout(() => {
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
        await handleGameScore(user!.uid, "reactionGame", reactionTime);
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
      // ... 기존 로직 ...
    } else {
      startGame();
    }
  };

  const handleGameScore = async (
    userId: string,
    game: "reactionGame",
    score: number,
  ) => {
    const settings = await getExperienceSettings();
    if (score <= settings.reactionGameThreshold) {
      const result = await updateUserExperience(
        userId,
        settings.reactionGameExperience,
        "반응 게임 성공",
      );
      setExpGained(result.expGained);
      if (result.levelUp) {
        setNewLevel(result.newLevel);
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
      setModalContent({
        title: "게임 결과",
        message: `반응 시간: ${reactionTime}ms`,
      });
    }
    setShowModal(true);
  };

  return (
    <Layout>
      <GameContainer>
        <h1>반응속도 게임</h1>
        <GameArea onClick={handleClick} gameState={gameState}>
          {gameState === "waiting" && <p>클릭하여 시작</p>}
          {gameState === "ready" && <p>준비...</p>}
          {gameState === "clicking" && <p>클릭하세요!</p>}
        </GameArea>
        {bestScore && <p>최고 기록: {bestScore}ms</p>}
        {/* <p>남은 플레이 횟수: {remainingPlays}</p> */}
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
  padding: 2rem;
`;

const GameArea = styled.div<{ gameState: string }>`
  width: 300px;
  height: 300px;
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
  border-radius: 10px;
  margin: 2rem 0;
`;

const BackButton = styled(Link)`
  margin-top: 1rem;
  padding: 0.5rem 1rem;
  font-size: 16px;
  background-color: #f0f0f0;
  color: #333;
  text-decoration: none;
  border-radius: 5px;
  transition: background-color 0.3s;

  &:hover {
    background-color: #e0e0e0;
  }
`;

export default ReactionGame;
