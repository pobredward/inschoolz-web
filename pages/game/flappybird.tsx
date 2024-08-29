import React, { useState, useEffect, useRef } from "react";
import Layout from "../../components/Layout";
import styled from "@emotion/styled";
import { useAuth } from "../../hooks/useAuth";
import { db } from "../../lib/firebase";
import { doc, setDoc, getDoc, updateDoc, increment } from "firebase/firestore";
import Link from "next/link";
import DefaultModal from "../../components/modal/DefaultModal";
import { useMediaQuery } from "react-responsive";
import {
  updateUserExperience,
  getExperienceSettings,
} from "../../utils/experience";
import ExperienceModal from "../../components/modal/ExperienceModal";
import { useSetRecoilState, useRecoilState } from "recoil";
import { userExperienceState, userLevelState } from "../../store/atoms";

// config 객체로 상수 관리
const config = {
  GRAVITY: 0.3,
  JUMP_STRENGTH: -6.0,
  PIPE_SPEED: 3.5,
  PIPE_WIDTH: 50,
  PIPE_GAP: 180,
  BIRD_START_Y: 250,
  BIRD_START_VELOCITY: 0,
  BIRD_SIZE: { width: 20, height: 20 },
  CANVAS: {
    MOBILE: { width: 300, height: 450 },
    DESKTOP: { width: 400, height: 600 },
  },
};

const FlappyBird: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [gameOver, setGameOver] = useState(true);
  const [score, setScore] = useState(0);
  const [bestScore, setBestScore] = useState(0);
  const { user } = useAuth();
  const [remainingPlays, setRemainingPlays] = useState<number | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [modalContent, setModalContent] = useState({ title: "", message: "" });
  const isMobile = useMediaQuery({ query: "(max-width: 768px)" });
  const birdRef = useRef({
    y: config.BIRD_START_Y,
    velocity: config.BIRD_START_VELOCITY,
  });
  const pipesRef = useRef<{ x: number; topHeight: number; passed: boolean }[]>(
    [],
  );
  const scoreRef = useRef(0);
  const gameOverRef = useRef(true);
  const animationFrameId = useRef<number | null>(null);
  const [showExpModal, setShowExpModal] = useState(false);
  const [expGained, setExpGained] = useState(0);
  const [newLevel, setNewLevel] = useState<number | undefined>(undefined);
  const setUserExperience = useSetRecoilState(userExperienceState);
  const [userLevel, setUserLevel] = useRecoilState(userLevelState);
  const [lastLevelUp, setLastLevelUp] = useState<number | null>(null);

  useEffect(() => {
    if (user) {
      fetchBestScore();
      updateRemainingPlays();
    } else {
      const localBestScore = localStorage.getItem("flappyBirdBestScore");
      if (localBestScore) {
        setBestScore(parseInt(localBestScore));
      }
      const localRemainingPlays = localStorage.getItem(
        "flappyBirdRemainingPlays",
      );
      setRemainingPlays(
        localRemainingPlays ? parseInt(localRemainingPlays) : 5,
      );
    }
  }, [user]);

  const fetchBestScore = async () => {
    if (user) {
      const scoreDoc = await getDoc(doc(db, "flappyBirdScores", user.uid));
      if (scoreDoc.exists()) {
        setBestScore(scoreDoc.data().bestScore);
      }
    }
  };

  const updateRemainingPlays = async () => {
    if (user) {
      const gameInfo = await getUserGameInfo(user.uid);
      const settings = await getExperienceSettings();

      const remaining = settings.maxDailyGames - gameInfo.flappyBirdPlays;
      setRemainingPlays(remaining);
    }
  };

  const getUserGameInfo = async (userId: string) => {
    const userDoc = await getDoc(doc(db, "users", userId));
    if (!userDoc.exists()) {
      throw new Error("User data not found");
    }
    const gameInfo = userDoc.data().gameInfo || {
      flappyBirdPlays: 0,
    };

    const today = new Date().toISOString().split("T")[0];
    if (gameInfo.lastResetDate !== today) {
      gameInfo.flappyBirdPlays = 0;
      gameInfo.lastResetDate = today;

      await updateDoc(doc(db, "users", userId), {
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

    setGameOver(false);
    gameOverRef.current = false;
    setScore(0);
    scoreRef.current = 0;
    birdRef.current = {
      y: config.BIRD_START_Y,
      velocity: config.BIRD_START_VELOCITY,
    };
    pipesRef.current = [];
    if (canvasRef.current) {
      const ctx = canvasRef.current.getContext("2d");
      if (ctx) {
        ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
      }
    }
    requestAnimationFrame(gameLoop);
  };

  const gameLoop = () => {
    if (gameOverRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    birdRef.current.velocity += config.GRAVITY;
    birdRef.current.y += birdRef.current.velocity;

    const pipeSpeed = isMobile ? config.PIPE_SPEED * 0.8 : config.PIPE_SPEED;
    const pipeGap = isMobile ? config.PIPE_GAP * 1.2 : config.PIPE_GAP;

    pipesRef.current.forEach((pipe) => {
      pipe.x -= pipeSpeed;
    });

    // 파이프 생성 및 passed 초기화
    pipesRef.current = pipesRef.current.filter(
      (pipe) => pipe.x > -config.PIPE_WIDTH,
    );

    if (
      pipesRef.current.length === 0 ||
      pipesRef.current[pipesRef.current.length - 1].x < canvas.width - 200
    ) {
      const topHeight = Math.random() * (canvas.height - pipeGap - 100) + 50;
      pipesRef.current.push({ x: canvas.width, topHeight, passed: false });
    }

    const bird = birdRef.current;

    // 충돌 감지 로직
    let collisionDetected = false;
    pipesRef.current.forEach((pipe) => {
      if (
        (bird.y < pipe.topHeight || bird.y > pipe.topHeight + pipeGap) &&
        pipe.x < 50 &&
        pipe.x + config.PIPE_WIDTH > 30
      ) {
        collisionDetected = true;
      }
    });

    if (collisionDetected || bird.y > canvas.height - 20 || bird.y < 0) {
      endGame();
      return;
    }

    // 점수 계산 로직
    pipesRef.current.forEach((pipe) => {
      if (pipe.x + config.PIPE_WIDTH < 30 && !pipe.passed) {
        pipe.passed = true; // 한 번만 점수를 올리도록 처리
        scoreRef.current++;
        setScore(scoreRef.current);
      }
    });

    ctx.fillStyle = "yellow";
    ctx.fillRect(30, bird.y, config.BIRD_SIZE.width, config.BIRD_SIZE.height);

    ctx.fillStyle = "green";
    pipesRef.current.forEach((pipe) => {
      ctx.fillRect(pipe.x, 0, config.PIPE_WIDTH, pipe.topHeight);
      ctx.fillRect(
        pipe.x,
        pipe.topHeight + pipeGap,
        config.PIPE_WIDTH,
        canvas.height - pipe.topHeight - pipeGap,
      );
    });

    ctx.fillStyle = "black";
    ctx.font = "24px Arial";
    ctx.fillText(`Score: ${scoreRef.current}`, 10, 30);

    animationFrameId.current = requestAnimationFrame(gameLoop);
  };

  const endGame = async () => {
    if (gameOverRef.current) return;

    gameOverRef.current = true;
    setGameOver(true);

    let message = `점수: ${scoreRef.current}\n최고 점수: ${bestScore}`;
    let newBestScore = false;

    if (user) {
      if (scoreRef.current > bestScore) {
        await setDoc(doc(db, "flappyBirdScores", user.uid), {
          userId: user.userId,
          schoolName: user.schoolName,
          address1: user.address1,
          address2: user.address2,
          bestScore: scoreRef.current,
        });
        setBestScore(scoreRef.current);
        newBestScore = true;
        message += "\n새로운 최고 점수를 달성했습니다!";
      }

      try {
        await handleGameScore(user.uid, scoreRef.current);
        await updateDoc(doc(db, "users", user.uid), {
          "gameInfo.flappyBirdPlays": increment(1),
        });
        await updateRemainingPlays();
      } catch (error) {
        console.error("Error updating experience:", error);
      }
    } else {
      const localBestScore = localStorage.getItem("flappyBirdBestScore");
      if (!localBestScore || scoreRef.current > parseInt(localBestScore)) {
        localStorage.setItem(
          "flappyBirdBestScore",
          scoreRef.current.toString(),
        );
        setBestScore(scoreRef.current);
        newBestScore = true;
        message +=
          "\n새로운 최고 점수를 달성했습니다!\n회원가입하여 기록을 저장하고 랭킹에 등록하세요!";
      }
      const newRemainingPlays = (remainingPlays || 5) - 1;
      setRemainingPlays(newRemainingPlays);
      localStorage.setItem(
        "flappyBirdRemainingPlays",
        newRemainingPlays.toString(),
      );
    }

    setModalContent({
      title: "게임 오버",
      message: message,
    });
    setShowModal(true);
  };

  const handleGameScore = async (userId: string, score: number) => {
    const settings = await getExperienceSettings();
    if (score >= settings.flappyBirdThreshold) {
      const result = await updateUserExperience(
        userId,
        settings.flappyBirdExperience,
        "Flappy Bird 게임 성공",
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

  const handleExpModalClose = () => {
    setShowExpModal(false);
  };

  const handleDefaultModalClose = () => {
    setShowModal(false);
  };

  const handleJump = () => {
    if (!gameOverRef.current) {
      birdRef.current.velocity = config.JUMP_STRENGTH;
    }
  };

  return (
    <Layout>
      <GameContainer>
        <h1>Flappy Bird</h1>
        <Canvas
          ref={canvasRef}
          width={
            isMobile ? config.CANVAS.MOBILE.width : config.CANVAS.DESKTOP.width
          }
          height={
            isMobile
              ? config.CANVAS.MOBILE.height
              : config.CANVAS.DESKTOP.height
          }
          onClick={handleJump}
        />
        {gameOver && <StartButton onClick={startGame}>게임 시작</StartButton>}
        <p>최고 점수: {bestScore}</p>
        <p>남은 플레이 횟수: {remainingPlays}</p>
        <BackButton href="/game">메인 메뉴로 돌아가기</BackButton>
      </GameContainer>
      <DefaultModal
        isOpen={showModal}
        onClose={handleDefaultModalClose}
        title={modalContent.title}
        message={modalContent.message}
      />
      <ExperienceModal
        isOpen={showExpModal}
        onClose={handleExpModalClose}
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

const Canvas = styled.canvas<{ width: number; height: number }>`
  border: 1px solid black;
  width: ${(props) => props.width}px;
  height: ${(props) => props.height}px;
`;

const StartButton = styled.button`
  margin-top: 1rem;
  padding: 0.5rem 1rem;
  font-size: 18px;
  background-color: #4caf50;
  color: white;
  border: none;
  border-radius: 5px;
  cursor: pointer;

  &:hover {
    background-color: #45a049;
  }
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

export default FlappyBird;
