import React, { useState, useEffect } from "react";
import styled from "@emotion/styled";
import {
  collection,
  query,
  orderBy,
  limit,
  getDocs,
  startAfter,
  where,
  QueryDocumentSnapshot,
  DocumentData,
} from "firebase/firestore";
import { db } from "../lib/firebase";
import { FaBolt, FaFeather, FaTh } from "react-icons/fa";
import { useAuth } from "../hooks/useAuth";

interface LeaderboardEntry {
  userId: string;
  schoolName: string;
  bestScore: number;
  rank?: number;
}

const ENTRIES_PER_PAGE = 10;

const Leaderboard: React.FC = () => {
  const [activeGame, setActiveGame] = useState<
    "reactionGame" | "flappyBird" | "tileGame"
  >("reactionGame");
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [isSearchActive, setIsSearchActive] = useState(false);
  const { user } = useAuth();
  const [lastVisible, setLastVisible] =
    useState<QueryDocumentSnapshot<DocumentData> | null>(null);

  useEffect(() => {
    fetchLeaderboard();
  }, [activeGame, currentPage]);

  const fetchLeaderboard = async () => {
    const leaderboardRef = collection(db, `${activeGame}Scores`);
    let q;

    if (currentPage === 1) {
      q = query(
        leaderboardRef,
        orderBy("bestScore", activeGame === "reactionGame" ? "asc" : "desc"),
        limit(ENTRIES_PER_PAGE),
      );
    } else if (lastVisible) {
      q = query(
        leaderboardRef,
        orderBy("bestScore", activeGame === "reactionGame" ? "asc" : "desc"),
        startAfter(lastVisible),
        limit(ENTRIES_PER_PAGE),
      );
    } else {
      return;
    }

    const querySnapshot = await getDocs(q);
    const leaderboardData: LeaderboardEntry[] = [];
    querySnapshot.forEach((doc) => {
      leaderboardData.push({
        ...(doc.data() as LeaderboardEntry),
        rank: (currentPage - 1) * ENTRIES_PER_PAGE + leaderboardData.length + 1,
      });
    });

    setLeaderboard(leaderboardData);
    setLastVisible(querySnapshot.docs[querySnapshot.docs.length - 1]);

    const countQuery = query(leaderboardRef);
    const countSnapshot = await getDocs(countQuery);
    setTotalPages(Math.ceil(countSnapshot.size / ENTRIES_PER_PAGE));
  };

  const handleSearch = () => {
    if (!searchTerm) return;

    const filteredData = leaderboard.filter((entry) =>
      entry.userId.toLowerCase().includes(searchTerm.toLowerCase()),
    );

    setLeaderboard(filteredData);
    setIsSearchActive(true);
  };

  const handleReset = () => {
    setSearchTerm("");
    setIsSearchActive(false);
    setCurrentPage(1);
    fetchLeaderboard(); // 리더보드를 원래 상태로 초기화
  };

  const handleGameChange = (
    game: "reactionGame" | "flappyBird" | "tileGame",
  ) => {
    setActiveGame(game);
    setCurrentPage(1);
    setLastVisible(null);
    setIsSearchActive(false);
    setSearchTerm("");
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    if (page === 1) {
      setLastVisible(null);
    }
  };

  const handleKeyPress = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") {
      handleSearch();
    }
  };

  return (
    <LeaderboardContainer>
      <TabContainer>
        <Tab
          active={activeGame === "reactionGame"}
          onClick={() => handleGameChange("reactionGame")}
        >
          <FaBolt />
        </Tab>
        <Tab
          active={activeGame === "tileGame"}
          onClick={() => handleGameChange("tileGame")}
        >
          <FaTh />
        </Tab>
        <Tab
          active={activeGame === "flappyBird"}
          onClick={() => handleGameChange("flappyBird")}
        >
          <FaFeather />
        </Tab>
      </TabContainer>
      <SearchContainer>
        <SearchInput
          type="text"
          placeholder="사용자 ID 검색"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          onKeyPress={handleKeyPress} // 엔터키로 검색 실행
        />
        <SearchButton onClick={handleSearch}>검색</SearchButton>
        <ResetButton onClick={handleReset}>초기화</ResetButton>
      </SearchContainer>
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
          {leaderboard.map((entry) => (
            <tr key={entry.userId}>
              <td>{entry.rank}</td>
              <td>{entry.userId}</td>
              <td>{entry.schoolName}</td>
              <td>
                {activeGame === "reactionGame"
                  ? `${entry.bestScore}ms`
                  : entry.bestScore}
              </td>
            </tr>
          ))}
        </tbody>
      </LeaderboardTable>
      {!isSearchActive && (
        <Pagination>
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
            <PageButton
              key={page}
              active={currentPage === page}
              onClick={() => handlePageChange(page)}
            >
              {page}
            </PageButton>
          ))}
        </Pagination>
      )}
    </LeaderboardContainer>
  );
};

const LeaderboardContainer = styled.div`
  max-width: 1000px;
  margin: 0 auto;
`;

const TabContainer = styled.div`
  display: flex;
  justify-content: center;
  margin-bottom: 1rem;
`;

const Tab = styled.button<{ active: boolean }>`
  padding: 0.5rem 1rem;
  margin: 0 0.5rem;
  background-color: ${(props) => (props.active ? "#7ed957" : "#f0f0f0")};
  color: ${(props) => (props.active ? "white" : "#333")};
  border: none;
  border-radius: 5px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  transition: all 0.3s ease;

  &:hover {
    background-color: ${(props) => (props.active ? "#7ed957" : "#e0e0e0")};
  }
`;

const SearchContainer = styled.div`
  display: flex;
  margin-bottom: 1rem;
`;

const SearchInput = styled.input`
  flex-grow: 1;
  padding: 0.5rem;
  margin-right: 0.5rem;
`;

const SearchButton = styled.button`
  padding: 0.5rem 1rem;
  background-color: var(--primary-button);
  color: white;
  border: none;
  cursor: pointer;

  &:hover {
    background-color: var(--primary-hover);
  }
`;

const ResetButton = styled.button`
  padding: 0.5rem 1rem;
  background-color: var(--gray-button);
  color: white;
  border: none;
  cursor: pointer;
  margin-left: 0.5rem;

  &:hover {
    background-color: var(--gray-hover);
  }
`;

const LeaderboardTable = styled.table`
  width: 100%;
  border-collapse: collapse;
  margin-top: 2rem;

  th,
  td {
    border: 1px solid #ddd;
    padding: 0.5rem;
    text-align: left;
  }

  th {
    background-color: #f2f2f2;
    font-weight: bold;
  }

  tr:nth-of-type(even) {
    background-color: #f8f8f8;
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
  background-color: ${(props) => (props.active ? "#7ed957" : "#f2f2f2")};
  color: ${(props) => (props.active ? "white" : "black")};
  border: none;
  cursor: pointer;
`;

export default Leaderboard;
