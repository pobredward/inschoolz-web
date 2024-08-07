import React, { useState, useEffect } from "react";
import Layout from "../../components/Layout";
import styled from "@emotion/styled";
import { db } from "../../lib/firebase";
import { collection, query, orderBy, limit, getDocs } from "firebase/firestore";

interface LeaderboardEntry {
  userId: string;
  schoolName: string;
  address1: string;
  address2: string;
  bestScore: number;
}

const Leaderboard: React.FC = () => {
  const [reactionGameScores, setReactionGameScores] = useState<
    LeaderboardEntry[]
  >([]);
  const [flappyBirdScores, setFlappyBirdScores] = useState<LeaderboardEntry[]>(
    [],
  );
  const [activeGame, setActiveGame] = useState<"reaction" | "flappyBird">(
    "reaction",
  );

  useEffect(() => {
    fetchLeaderboard("reactionGameScores", setReactionGameScores, "asc");
    fetchLeaderboard("flappyBirdScores", setFlappyBirdScores, "desc");
  }, []);

  const fetchLeaderboard = async (
    gameCollection: string,
    setScores: React.Dispatch<React.SetStateAction<LeaderboardEntry[]>>,
    sortDirection: "asc" | "desc",
  ) => {
    const scoresRef = collection(db, gameCollection);
    const q = query(scoresRef, orderBy("bestScore", sortDirection), limit(10));
    const querySnapshot = await getDocs(q);
    const leaderboard = querySnapshot.docs.map(
      (doc) => doc.data() as LeaderboardEntry,
    );
    setScores(leaderboard);
  };

  return (
    <Layout>
      <LeaderboardContainer>
        <h1>게임 리더보드</h1>
        <GameSelector>
          <GameButton
            active={activeGame === "reaction"}
            onClick={() => setActiveGame("reaction")}
          >
            반응속도 게임
          </GameButton>
          <GameButton
            active={activeGame === "flappyBird"}
            onClick={() => setActiveGame("flappyBird")}
          >
            플래피 버드
          </GameButton>
        </GameSelector>
        <LeaderboardTable>
          <thead>
            <tr>
              <th>순위</th>
              <th>유저명</th>
              <th>학교명</th>
              <th>점수</th>
              <th>지역</th>
            </tr>
          </thead>
          <tbody>
            {(activeGame === "reaction"
              ? reactionGameScores
              : flappyBirdScores
            ).map((entry, index) => (
              <tr key={entry.userId}>
                <td>{index + 1}</td>
                <td>{entry.userId}</td>
                <td>{entry.schoolName}</td>
                <td>
                  {activeGame === "reaction"
                    ? `${entry.bestScore}ms`
                    : entry.bestScore}
                </td>
                <td>{`${entry.address1} ${entry.address2}`}</td>
              </tr>
            ))}
          </tbody>
        </LeaderboardTable>
      </LeaderboardContainer>
    </Layout>
  );
};

const LeaderboardContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 1rem;
`;

const GameSelector = styled.div`
  display: flex;
  justify-content: center;
  margin-bottom: 2rem;
`;

const GameButton = styled.button<{ active: boolean }>`
  padding: 0.5rem 1rem;
  margin: 0 0.5rem;
  font-size: 16px;
  background-color: ${(props) => (props.active ? "#4CAF50" : "#ddd")};
  color: ${(props) => (props.active ? "white" : "black")};
  border: none;
  border-radius: 5px;
  cursor: pointer;
  transition: background-color 0.3s;

  &:hover {
    background-color: ${(props) => (props.active ? "#45a049" : "#ccc")};
  }
`;

const LeaderboardTable = styled.table`
  width: 100%;
  max-width: 800px;
  border-collapse: collapse;

  th,
  td {
    padding: 0.5rem;
    text-align: left;
    border-bottom: 1px solid #ddd;
  }

  th {
    background-color: #f2f2f2;
    font-weight: bold;
  }

  tr:nth-of-type(even) {
    background-color: #f8f8f8;
  }

  tr:hover {
    background-color: #e8e8e8;
  }
`;

export default Leaderboard;
