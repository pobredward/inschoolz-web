import React, { useState, useEffect } from "react";
import styled from "@emotion/styled";
import {
  collection,
  getDocs,
  query,
  orderBy,
  limit,
  doc,
  getDoc,
  setDoc,
} from "firebase/firestore";
import { db } from "../../lib/firebase";
import { useAuth } from "../../hooks/useAuth";

const ReactionGame: React.FC = () => {
  const { user } = useAuth();
  const [startTime, setStartTime] = useState<number | null>(null);
  const [endTime, setEndTime] = useState<number | null>(null);
  const [waiting, setWaiting] = useState(false);
  const [bestScores, setBestScores] = useState<number[]>([]);

  useEffect(() => {
    const fetchScores = async () => {
      const q = query(collection(db, "scores"), orderBy("time"), limit(10));
      const querySnapshot = await getDocs(q);
      const scores = querySnapshot.docs.map((doc) => doc.data().time);
      setBestScores(scores);
    };
    fetchScores();
  }, []);

  const startGame = () => {
    setWaiting(true);
    const delay = Math.floor(Math.random() * 5000) + 2000; // 2-7초 랜덤 지연
    setTimeout(() => {
      setStartTime(Date.now());
      setWaiting(false);
    }, delay);
  };

  const handleClick = async () => {
    if (startTime) {
      const reactionTime = Date.now() - startTime;
      setEndTime(reactionTime);
      if (user) {
        const userDocRef = doc(db, "scores", user.uid);
        const userDoc = await getDoc(userDocRef);

        if (!userDoc.exists() || reactionTime < userDoc.data()?.time) {
          await setDoc(userDocRef, {
            user: user.email,
            schoolName: user.schoolName,
            address1: user.address1,
            address2: user.address2,
            time: reactionTime,
          });
        }
      }
      setStartTime(null);
    }
  };

  return (
    <GameContainer>
      <GameArea onClick={handleClick} waiting={waiting}>
        {startTime ? (
          waiting ? (
            <p>Wait for green...</p>
          ) : (
            <p>Click!</p>
          )
        ) : (
          <button onClick={startGame}>Start</button>
        )}
      </GameArea>
      {endTime && <p>Your reaction time: {endTime} ms</p>}
      <ScoreBoard>
        <h2>Leaderboard</h2>
        <ul>
          {bestScores.map((score, index) => (
            <li key={index}>{score} ms</li>
          ))}
        </ul>
      </ScoreBoard>
    </GameContainer>
  );
};

const GameContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
`;

const GameArea = styled.div<{ waiting: boolean }>`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 300px;
  height: 300px;
  background-color: ${({ waiting }) => (waiting ? "red" : "green")};
  cursor: pointer;
  margin-bottom: 20px;

  p {
    color: white;
    font-size: 24px;
  }

  button {
    padding: 10px 20px;
    font-size: 18px;
    cursor: pointer;
  }
`;

const ScoreBoard = styled.div`
  margin-top: 20px;

  h2 {
    margin-bottom: 10px;
  }

  ul {
    list-style-type: none;
    padding: 0;
  }

  li {
    margin-bottom: 5px;
  }
`;

export default ReactionGame;
