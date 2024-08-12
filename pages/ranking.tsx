import React, { useEffect, useState } from "react";
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
import Layout from "../components/Layout";
import { useAuth } from "../hooks/useAuth";

interface UserRank {
  userId: string;
  schoolName: string;
  address1: string;
  address2: string;
  level: number;
  experience: number;
  rank?: number;
}

const ITEMS_PER_PAGE = 10;

const RankingPage: React.FC = () => {
  const [rankings, setRankings] = useState<UserRank[]>([]);
  const [activeTab, setActiveTab] = useState<"national" | "school">("national");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResult, setSearchResult] = useState<UserRank | null>(null);
  const { user } = useAuth();
  const [lastVisible, setLastVisible] =
    useState<QueryDocumentSnapshot<DocumentData> | null>(null);

  useEffect(() => {
    fetchRankings();
  }, [activeTab, currentPage, user]);

  const fetchRankings = async () => {
    if (!user && activeTab === "school") {
      console.error("User not logged in for school rankings");
      return;
    }

    const usersRef = collection(db, "users");
    let q;

    if (activeTab === "national") {
      if (currentPage === 1) {
        q = query(
          usersRef,
          orderBy("level", "desc"),
          orderBy("experience", "desc"),
          limit(ITEMS_PER_PAGE),
        );
      } else if (lastVisible) {
        q = query(
          usersRef,
          orderBy("level", "desc"),
          orderBy("experience", "desc"),
          startAfter(lastVisible),
          limit(ITEMS_PER_PAGE),
        );
      } else {
        return; // Cannot fetch data without lastVisible
      }
    } else if (activeTab === "school" && user?.schoolId) {
      if (currentPage === 1) {
        q = query(
          usersRef,
          where("schoolId", "==", user.schoolId),
          orderBy("level", "desc"),
          orderBy("experience", "desc"),
          limit(ITEMS_PER_PAGE),
        );
      } else if (lastVisible) {
        q = query(
          usersRef,
          where("schoolId", "==", user.schoolId),
          orderBy("level", "desc"),
          orderBy("experience", "desc"),
          startAfter(lastVisible),
          limit(ITEMS_PER_PAGE),
        );
      } else {
        return; // Cannot fetch data without lastVisible
      }
    } else {
      console.error("Invalid activeTab or missing user schoolId");
      return;
    }

    try {
      const querySnapshot = await getDocs(q);
      const rankingsData: UserRank[] = [];
      querySnapshot.forEach((doc) => {
        rankingsData.push({
          ...(doc.data() as UserRank),
          rank: (currentPage - 1) * ITEMS_PER_PAGE + rankingsData.length + 1,
        });
      });

      setRankings(rankingsData);
      setLastVisible(querySnapshot.docs[querySnapshot.docs.length - 1]);

      // Get total count for pagination
      const countQuery =
        activeTab === "national"
          ? query(usersRef)
          : query(usersRef, where("schoolId", "==", user?.schoolId));
      const countSnapshot = await getDocs(countQuery);
      setTotalPages(Math.ceil(countSnapshot.size / ITEMS_PER_PAGE));
    } catch (error) {
      console.error("Error fetching rankings:", error);
    }
  };

  const handleSearch = async () => {
    if (!searchTerm) return;

    const usersRef = collection(db, "users");
    let q;

    if (activeTab === "national") {
      q = query(
        usersRef,
        where("userId", "==", searchTerm),
        orderBy("level", "desc"),
        orderBy("experience", "desc"),
      );
    } else if (activeTab === "school" && user?.schoolId) {
      q = query(
        usersRef,
        where("schoolId", "==", user.schoolId),
        where("userId", "==", searchTerm),
        orderBy("level", "desc"),
        orderBy("experience", "desc"),
      );
    } else {
      console.error("Invalid activeTab or missing user schoolId");
      return;
    }

    try {
      const querySnapshot = await getDocs(q);
      if (!querySnapshot.empty) {
        const userDoc = querySnapshot.docs[0];
        const userData = userDoc.data() as UserRank;

        // Get the rank of the user
        const rankQuery =
          activeTab === "national"
            ? query(
                usersRef,
                orderBy("level", "desc"),
                orderBy("experience", "desc"),
              )
            : query(
                usersRef,
                where("schoolId", "==", user?.schoolId),
                orderBy("level", "desc"),
                orderBy("experience", "desc"),
              );

        const rankSnapshot = await getDocs(rankQuery);
        const rank =
          rankSnapshot.docs.findIndex((doc) => doc.id === userDoc.id) + 1;

        setSearchResult({ ...userData, rank });
      } else {
        setSearchResult(null);
      }
    } catch (error) {
      console.error("Error searching user:", error);
    }
  };

  const handleTabChange = (tab: "national" | "school") => {
    setActiveTab(tab);
    setCurrentPage(1);
    setLastVisible(null);
    setSearchResult(null);
    setSearchTerm("");
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    if (page === 1) {
      setLastVisible(null);
    }
  };

  return (
    <Layout>
      <RankingContainer>
        <h1>랭킹</h1>
        <TabContainer>
          <Tab
            active={activeTab === "national"}
            onClick={() => handleTabChange("national")}
          >
            전국 랭킹
          </Tab>
          <Tab
            active={activeTab === "school"}
            onClick={() => handleTabChange("school")}
          >
            우리학교 랭킹
          </Tab>
        </TabContainer>
        <SearchContainer>
          <SearchInput
            type="text"
            placeholder="사용자 ID 검색"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <SearchButton onClick={handleSearch}>검색</SearchButton>
        </SearchContainer>
        {searchResult && (
          <SearchResult>
            검색 결과: {searchResult.userId} (랭킹: {searchResult.rank}위)
          </SearchResult>
        )}
        <RankingTable>
          <thead>
            <tr>
              <th>순위</th>
              <th>유저명</th>
              <th>학교</th>
              <th>지역</th>
              <th>레벨</th>
            </tr>
          </thead>
          <tbody>
            {rankings.map((user) => (
              <tr key={user.userId}>
                <td>{user.rank}</td>
                <td>{user.userId}</td>
                <td>{user.schoolName}</td>
                <td>{`${user.address1} ${user.address2}`}</td>
                <td>
                  <LevelText>Lv.{user.level}</LevelText>
                </td>
              </tr>
            ))}
          </tbody>
        </RankingTable>
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
      </RankingContainer>
    </Layout>
  );
};

const RankingContainer = styled.div`
  max-width: 1000px;
  margin: 0 auto;
  padding: 1rem;

  @media (max-width: 768px) {
    padding: 0.5rem;
  }
`;

const TabContainer = styled.div`
  display: flex;
  margin-bottom: 1rem;
`;

const Tab = styled.button<{ active: boolean }>`
  padding: 0.5rem 1rem;
  background-color: ${(props) => (props.active ? "#7ed957" : "#f2f2f2")};
  color: ${(props) => (props.active ? "white" : "black")};
  border: none;
  cursor: pointer;
  margin-right: 0.5rem;
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
  background-color: #7ed957;
  color: white;
  border: none;
  cursor: pointer;
`;

const SearchResult = styled.div`
  margin-bottom: 1rem;
  font-weight: bold;
`;

const RankingTable = styled.table`
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

const LevelText = styled.span`
  font-weight: bold;
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

export default RankingPage;
