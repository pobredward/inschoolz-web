import React, { useState, useCallback, useEffect } from "react";
import styled from "@emotion/styled";
import {
  collection,
  query,
  where,
  getDocs,
  getDoc,
  updateDoc,
  arrayUnion,
  arrayRemove,
  doc,
} from "firebase/firestore";
import { db } from "../lib/firebase";
import { FaSearch, FaStar } from "react-icons/fa";
import { debounce } from "lodash";
import { useRecoilState } from "recoil";
import { searchResultsState, selectedSchoolState } from "../store/atoms";
import { useAuth } from "../hooks/useAuth";
import { School } from "../types";

interface SchoolSearchProps {
  initialSchool?: { KOR_NAME: string; ADDRESS: string }; // 기존 학교 정보
  setSchool: (school: any) => void;
}

const SchoolSearch: React.FC<SchoolSearchProps> = ({
  initialSchool,
  setSchool,
}) => {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useRecoilState(searchResultsState);
  const [selectedSchool, setSelectedSchool] =
    useRecoilState(selectedSchoolState);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [favoriteSchools, setFavoriteSchools] = useState<School[]>([]);

  useEffect(() => {
    if (user) {
      const fetchFavoriteSchools = async () => {
        const userDocRef = doc(db, "users", user.uid);
        const userDoc = await getDoc(userDocRef);
        if (userDoc.exists()) {
          const favoriteSchoolIds = userDoc.data().favoriteSchools || [];
          const favoriteSchoolDocs = await Promise.all(
            favoriteSchoolIds.map((id: string) =>
              getDoc(doc(db, "schools", id)),
            ),
          );
          setFavoriteSchools(
            favoriteSchoolDocs.map(
              (doc) => ({ id: doc.id, ...doc.data() }) as School,
            ),
          );
        }
      };
      fetchFavoriteSchools();
    }
  }, [user]);

  const toggleFavoriteSchool = async (school: School) => {
    if (!user || !school.id) return;

    const userRef = doc(db, "users", user.uid);
    const isFavorite = favoriteSchools.some((fav) => fav.id === school.id);

    try {
      // Firebase에서 학교 ID 추가 또는 제거
      await updateDoc(userRef, {
        favoriteSchools: isFavorite
          ? arrayRemove(school.id)
          : arrayUnion(school.id),
      });

      // 상태 업데이트: School 객체 배열로 유지
      setFavoriteSchools((prev) =>
        isFavorite
          ? prev.filter((fav) => fav.id !== school.id)
          : [...prev, school],
      );
    } catch (error) {
      console.error("Error updating favorite schools: ", error);
    }
  };

  const handleSearch = async (term: string) => {
    if (term.length < 2) {
      setError("검색어는 2글자 이상이어야 합니다.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const schoolsRef = collection(db, "schools");
      const q = query(
        schoolsRef,
        where("KOR_NAME", ">=", term),
        where("KOR_NAME", "<=", term + "\uf8ff"),
      );

      const querySnapshot = await getDocs(q);
      const results: School[] = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        KOR_NAME: doc.data().KOR_NAME,
        ADDRESS: doc.data().ADDRESS,
        SCHOOL_CODE: doc.data().SCHOOL_CODE,
      }));

      setSearchResults(results);
      if (results.length === 0) {
        setError("검색된 학교가 없습니다.");
      }
    } catch (error) {
      setError("학교 검색 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  const debouncedSearch = useCallback(
    debounce((term: string) => handleSearch(term), 500),
    [],
  );

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const term = event.target.value;
    setSearchTerm(term);
    debouncedSearch(term);
  };

  const handleKeyPress = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") {
      event.preventDefault();
      handleSearch(searchTerm);
    }
  };

  const handleSchoolSelect = async (school: School) => {
    setSelectedSchool(school);
    setSchool(school);

    if (user) {
      const userRef = doc(db, "users", user.uid);
      try {
        await updateDoc(userRef, {
          schoolName: school.KOR_NAME,
          schoolAddress: school.ADDRESS,
        });
      } catch (error) {
        console.error("Error updating school information: ", error);
      }
    }

    // isOpen을 닫는 작업을 안전하게 비동기 처리 후 진행
    setTimeout(() => {
      setIsOpen(false);
    }, 100);
  };

  const handleEditButtonClick = (e: React.MouseEvent<HTMLDivElement>) => {
    e.stopPropagation();
    setIsOpen(true);
  };

  return (
    <Container>
      {selectedSchool ? (
        <SelectedSchoolContainer>
          <SelectedSchoolInfo>
            <SchoolName>{selectedSchool.KOR_NAME}</SchoolName>
            <SchoolAddress>{selectedSchool.ADDRESS}</SchoolAddress>
          </SelectedSchoolInfo>
          <EditButtonContainer onClick={handleEditButtonClick}>
            <FaSearch size={20} />
            <EditButtonText>재검색</EditButtonText>
          </EditButtonContainer>
        </SelectedSchoolContainer>
      ) : (
        <SearchButton onClick={() => setIsOpen(true)} type="button">
          학교 검색
        </SearchButton>
      )}
      {isOpen && (
        <Overlay>
          <PopupContent>
            <CloseButton onClick={() => setIsOpen(false)}>&times;</CloseButton>
            {user && <h2>내 학교</h2>}
            {loading ? (
              <div>Loading...</div>
            ) : (
              <ResultsList>
                {favoriteSchools.length > 0 && (
                  <FavoriteSection>
                    {/* <SectionTitle>관심 학교</SectionTitle> */}
                    <ResultsList>
                      {favoriteSchools.map((school) => (
                        <ResultItem
                          key={school.id}
                          onClick={() => handleSchoolSelect(school)}
                        >
                          <InfoWrapper>
                            <SchoolName>{school.KOR_NAME}</SchoolName>
                            <SchoolAddress>{school.ADDRESS}</SchoolAddress>
                          </InfoWrapper>
                          <StarIcon
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleFavoriteSchool(school);
                            }}
                            isFavorite={true}
                          >
                            <FaStar />
                          </StarIcon>
                        </ResultItem>
                      ))}
                    </ResultsList>
                  </FavoriteSection>
                )}
                <SearchSection>
                  <h2>학교 검색</h2>
                  <SearchInputContainer>
                    <SearchInput
                      type="text"
                      placeholder="학교 이름 입력"
                      value={searchTerm}
                      onChange={handleInputChange}
                      onKeyPress={handleKeyPress}
                    />
                    <SearchActionButton
                      onClick={() => handleSearch(searchTerm)}
                      type="button"
                    >
                      <FaSearch />
                    </SearchActionButton>
                  </SearchInputContainer>
                  {error && <NoResultsMessage>{error}</NoResultsMessage>}
                  <ResultsList>
                    {searchResults.map((school) => (
                      <ResultItem
                        key={school.id}
                        onClick={() => handleSchoolSelect(school)}
                      >
                        <InfoWrapper>
                          <SchoolName>{school.KOR_NAME}</SchoolName>
                          <SchoolAddress>{school.ADDRESS}</SchoolAddress>
                        </InfoWrapper>
                        <StarIcon
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleFavoriteSchool(school);
                          }}
                          isFavorite={favoriteSchools.some(
                            (fav) => fav.id === school.id,
                          )}
                        >
                          <FaStar />
                        </StarIcon>
                      </ResultItem>
                    ))}
                  </ResultsList>
                </SearchSection>
              </ResultsList>
            )}
            <ClosePopupButton onClick={() => setIsOpen(false)}>
              닫기
            </ClosePopupButton>
          </PopupContent>
        </Overlay>
      )}
    </Container>
  );
};

const SectionTitle = styled.h3`
  margin-bottom: 10px;
`;

const SearchSection = styled.div``;

const FavoriteSection = styled.div`
  margin-bottom: 20px;
`;

const InfoWrapper = styled.div`
  flex-grow: 1;
`;

const StarIcon = styled.div<{ isFavorite: boolean }>`
  color: ${({ isFavorite }) => (isFavorite ? "gold" : "#ccc")};
  cursor: pointer;
  margin-left: 10px;
`;

const ResultItem = styled.li`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px;
  border-bottom: 1px solid #dee2e6;
  cursor: pointer;
  transition: background-color 0.2s;

  &:hover {
    background-color: #f8f9fa;
  }
`;

const ResultsList = styled.ul`
  list-style-type: none;
  padding: 0;
  margin: 0;
`;

const Container = styled.div`
  margin-bottom: 20px;
`;

const SelectedSchoolContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  background-color: #f8f9fa;
  padding: 12px;
  border-radius: 4px;
  border: 1px solid #ced4da;
`;

const SelectedSchoolInfo = styled.div`
  flex-grow: 1;
`;

const SchoolName = styled.div`
  font-weight: bold;
  color: #495057;
`;

const SchoolAddress = styled.div`
  font-size: 0.9em;
  color: #6c757d;
  margin-top: 4px;
`;

const EditButtonContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  cursor: pointer;
  color: #0056b3;
`;

const EditButtonText = styled.span`
  font-size: 0.8em;
  margin-top: 4px;
`;

const SearchButton = styled.button`
  width: 100%;
  padding: 12px;
  background-color: #f8f9fa;
  color: #495057;
  border: 1px solid #ced4da;
  border-radius: 4px;
  font-size: 16px;
  cursor: pointer;
  text-align: left;
  transition: background-color 0.2s;

  &:hover {
    background-color: #e9ecef;
  }
`;

const Overlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
`;

const PopupContent = styled.div`
  background-color: white;
  padding: 24px;
  border-radius: 8px;
  width: 90%;
  max-width: 500px;
  max-height: 80vh;
  overflow-y: auto;
  position: relative;

  @media (max-width: 768px) {
    width: 80%;
  }
`;

const CloseButton = styled.button`
  position: absolute;
  top: 12px;
  right: 12px;
  font-size: 24px;
  background: none;
  border: none;
  cursor: pointer;
  color: #6c757d;
`;

const SearchInputContainer = styled.div`
  display: flex;
  margin-bottom: 16px;
`;

const SearchInput = styled.input`
  flex-grow: 1;
  padding: 10px;
  border: 1px solid #ced4da;
  border-radius: 4px 0 0 4px;
  font-size: 16px;
`;

const SearchActionButton = styled.button`
  padding: 10px 15px;
  background-color: var(--primary-color);
  color: white;
  border: none;
  border-radius: 0 4px 4px 0;
  cursor: pointer;
  transition: background-color 0.2s;

  &:hover {
    background-color: var(--hover-color);
  }
`;

const ClosePopupButton = styled.button`
  margin-top: 20px;
  padding: 10px 15px;
  background-color: #6c757d;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.2s;

  &:hover {
    background-color: #5a6268;
  }
`;

const NoResultsMessage = styled.div`
  padding: 12px;
  text-align: center;
  color: #6c757d;
`;

export default SchoolSearch;
