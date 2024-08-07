import React, { useState, useEffect } from "react";
import styled from "@emotion/styled";
import {
  collection,
  query,
  orderBy,
  limit,
  getDocs,
  onSnapshot,
} from "firebase/firestore";
import { db } from "../../lib/firebase";
import { FaBolt, FaFeather, FaSync } from "react-icons/fa";
import { useAuth } from "../../hooks/useAuth";

interface LeaderboardEntry {
  userId: string;
  schoolName: string;
  bestScore: number;
  rank?: number;
}

const ENTRIES_PER_PAGE = 30;

const Leaderboard: React.FC = () => {
  const [activeGame, setActiveGame] = useState<"reactionGame" | "flappyBird">(
    "reactionGame",
  );
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [userRank, setUserRank] = useState<LeaderboardEntry | null>(null);
  const [userRankPosition, setUserRankPosition] = useState<number | null>(null);
  const { user } = useAuth();
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    const unsubscribe = subscribeToLeaderboard();
    return () => unsubscribe();
  }, [activeGame, currentPage, user]);

  const subscribeToLeaderboard = () => {
    const leaderboardRef = collection(db, `${activeGame}Scores`);
    const q = query(
      leaderboardRef,
      orderBy("bestScore", activeGame === "reactionGame" ? "asc" : "desc"),
    );

    return onSnapshot(
      q,
      async (querySnapshot) => {
        const allScores = querySnapshot.docs.map((doc) => ({
          userId: doc.data().userId,
          schoolName: doc.data().schoolName,
          bestScore: doc.data().bestScore,
        }));

        // 모든 점수를 정렬하고 rank 할당
        const sortedScores = allScores
          .sort((a, b) =>
            activeGame === "reactionGame"
              ? a.bestScore - b.bestScore
              : b.bestScore - a.bestScore,
          )
          .map((score, index) => ({ ...score, rank: index + 1 }));

        // 페이지에 해당하는 데이터만 선택
        const startIndex = (currentPage - 1) * ENTRIES_PER_PAGE;
        const leaderboardData = sortedScores.slice(
          startIndex,
          startIndex + ENTRIES_PER_PAGE,
        );

        setLeaderboard(leaderboardData);
        setTotalPages(Math.ceil(sortedScores.length / ENTRIES_PER_PAGE));

        // 사용자 순위 업데이트
        if (user) {
          const userScore = sortedScores.find(
            (score) => score.userId === user.userId,
          );
          if (userScore) {
            setUserRank(userScore);
            setUserRankPosition(userScore.rank);
          } else {
            setUserRank(null);
            setUserRankPosition(null);
          }
        }
      },
      (error) => {
        console.error("Error fetching leaderboard:", error);
      },
    );
  };

  const fetchLeaderboard = async () => {
    const leaderboardRef = collection(db, `${activeGame}Scores`);
    const q = query(
      leaderboardRef,
      orderBy("bestScore", activeGame === "reactionGame" ? "asc" : "desc"),
      limit(ENTRIES_PER_PAGE),
    );

    try {
      const querySnapshot = await getDocs(q);
      const leaderboardData = querySnapshot.docs.map((doc, index) => ({
        userId: doc.data().userId,
        schoolName: doc.data().schoolName,
        bestScore: doc.data().bestScore,
        rank: index + 1,
      }));
      setLeaderboard(leaderboardData);

      // 전체 문서 수를 가져와 총 페이지 수 계산
      const countSnapshot = await getDocs(
        collection(db, `${activeGame}Scores`),
      );
      setTotalPages(Math.ceil(countSnapshot.size / ENTRIES_PER_PAGE));
    } catch (error) {
      console.error("Error fetching leaderboard:", error);
      setLeaderboard([]);
    }
  };

  const fetchUserRank = async () => {
    if (!user) return;

    const leaderboardRef = collection(db, `${activeGame}Scores`);
    const q = query(
      leaderboardRef,
      orderBy("bestScore", activeGame === "reactionGame" ? "asc" : "desc"),
    );

    try {
      const querySnapshot = await getDocs(q);
      const allScores = querySnapshot.docs.map((doc, index) => ({
        userId: doc.data().userId,
        schoolName: doc.data().schoolName,
        bestScore: doc.data().bestScore,
        rank: index + 1,
      }));
      const userScore = allScores.find((score) => score.userId === user.userId);

      if (userScore) {
        setUserRank(userScore);
        setUserRankPosition(userScore.rank);
      } else {
        setUserRank(null);
        setUserRankPosition(null);
      }
    } catch (error) {
      console.error("Error fetching user rank:", error);
    }
  };

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
  };

  const renderLeaderboardRow = (
    entry: LeaderboardEntry & { rank: number },
    isUserRank: boolean,
  ) => (
    <LeaderboardRow key={entry.userId} isUserRank={isUserRank}>
      <td>{entry.rank}</td>
      <td>{entry.userId}</td>
      <td>{entry.schoolName}</td>
      <td>
        {activeGame === "reactionGame"
          ? `${entry.bestScore}ms`
          : entry.bestScore}
      </td>
    </LeaderboardRow>
  );

  const handleRefresh = () => {
    // 리더보드를 강제로 새로고침
    subscribeToLeaderboard();
  };

  return (
    <LeaderboardContainer>
      <LeaderboardNav>
        <NavItem
          active={activeGame === "reactionGame"}
          onClick={() => setActiveGame("reactionGame")}
        >
          <FaBolt /> 반응속도 게임
        </NavItem>
        <NavItem
          active={activeGame === "flappyBird"}
          onClick={() => setActiveGame("flappyBird")}
        >
          <FaFeather /> 플래피 버드
        </NavItem>
      </LeaderboardNav>

      <LeaderboardTable>
        <thead>
          <tr>
            <th>순위</th>
            <th>사용자</th>
            <th>학교</th>
            <th>최고 점수</th>
          </tr>
        </thead>
        <tbody>
          {userRank && renderLeaderboardRow(userRank, true)}
          {leaderboard.map((entry) => {
            if (userRank && entry.rank === userRank.rank) {
              return renderLeaderboardRow(userRank, true);
            }
            return renderLeaderboardRow(entry, false);
          })}
        </tbody>
      </LeaderboardTable>

      <Pagination>
        {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
          <PageButton
            key={page}
            onClick={() => handlePageChange(page)}
            active={currentPage === page}
          >
            {page}
          </PageButton>
        ))}
      </Pagination>
    </LeaderboardContainer>
  );
};

const LeaderboardContainer = styled.div`
  width: 100%;
`;

const LeaderboardNav = styled.div`
  display: flex;
  justify-content: center;
  margin-bottom: 1rem;
`;

const NavItem = styled.button<{ active: boolean }>`
  padding: 0.5rem 1rem;
  margin: 0 0.5rem;
  background-color: ${(props) => (props.active ? "#0070f3" : "#f0f0f0")};
  color: ${(props) => (props.active ? "white" : "#333")};
  border: none;
  border-radius: 5px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  transition: all 0.3s ease;

  &:hover {
    background-color: ${(props) => (props.active ? "#0070f3" : "#e0e0e0")};
  }
`;

const LeaderboardTable = styled.table`
  width: 100%;
  border-collapse: collapse;

  th,
  td {
    padding: 0.5rem;
    text-align: left;
    border-bottom: 1px solid #e0e0e0;
  }

  th {
    background-color: #f0f0f0;
    font-weight: bold;
  }

  tr:nth-of-type(even) {
    background-color: #f8f8f8;
  }

  tr.highlight {
    background-color: #fffde7;
  }
`;

const Pagination = styled.div`
  display: flex;
  justify-content: center;
  margin-top: 1rem;
`;

const PageButton = styled.button<{ active: boolean }>`
  padding: 0.5rem 1rem;
  margin: 0 0.25rem;
  background-color: ${(props) => (props.active ? "#0070f3" : "#f0f0f0")};
  color: ${(props) => (props.active ? "white" : "#333")};
  border: none;
  border-radius: 5px;
  cursor: pointer;
  transition: all 0.3s ease;

  &:hover {
    background-color: ${(props) => (props.active ? "#0070f3" : "#e0e0e0")};
  }
`;

const LeaderboardRow = styled.tr<{ isUserRank: boolean }>`
  background-color: ${(props) =>
    props.isUserRank ? "#f0f0f0" : "transparent"};
  font-weight: ${(props) => (props.isUserRank ? "bold" : "normal")};
`;

export default Leaderboard;
