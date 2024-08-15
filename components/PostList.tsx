import React, { useState, useEffect } from "react";
import styled from "@emotion/styled";
import { useRecoilState } from "recoil";
import { postsState, categoriesState, Post } from "../store/atoms";
import {
  collection,
  query,
  where,
  getDocs,
  Timestamp,
} from "firebase/firestore";
import { db } from "../lib/firebase";
import { useRouter } from "next/router";
import { formatDate } from "../utils/dateUtils";
import {
  FaThumbsUp,
  FaComment,
  FaEye,
  FaBookmark,
  FaSearch,
} from "react-icons/fa";

const PostList = ({ selectedCategory, isLoggedIn, isNationalCategory }) => {
  const [posts, setPosts] = useRecoilState(postsState);
  const [categories] = useRecoilState(categoriesState);
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [currentPageGroup, setCurrentPageGroup] = useState(1); // 페이지 그룹 상태
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredPosts, setFilteredPosts] = useState([]);
  const [dateFilter, setDateFilter] = useState("all");
  const [searchScope, setSearchScope] = useState("all");

  useEffect(() => {
    const fetchPosts = async () => {
      if (isNationalCategory || isLoggedIn) {
        let q;
        try {
          if (selectedCategory === "national-hot") {
            const oneWeekAgo = new Date();
            oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
            q = query(
              collection(db, "posts"),
              where("categoryId", "==", "national-free"),
              where("likes", ">=", 3),
              where("createdAt", ">=", oneWeekAgo),
            );
          } else {
            q = query(
              collection(db, "posts"),
              where("categoryId", "==", selectedCategory),
            );
          }
          const querySnapshot = await getDocs(q);
          const postsData = querySnapshot.docs.map((doc) => ({
            id: doc.id,
            ...(doc.data() as Post),
          }));

          // 클라이언트 측에서 정렬
          const sortedPosts = postsData.sort((a, b) => {
            return b.createdAt.toMillis() - a.createdAt.toMillis();
          });

          setPosts(sortedPosts);
          setFilteredPosts(sortedPosts); // 전체 게시글을 기본으로 설정
        } catch (error) {
          console.error("Error fetching posts: ", error);
        } finally {
          setLoading(false);
        }
      } else {
        setLoading(false);
      }
    };

    fetchPosts();
  }, [selectedCategory, isLoggedIn, isNationalCategory, setPosts]);

  const handlePostClick = (postId) => {
    router.push(`/posts/${postId}`);
  };

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  const handleDateFilterChange = (e) => {
    setDateFilter(e.target.value);
  };

  const handleSearchScopeChange = (e) => {
    setSearchScope(e.target.value);
  };

  const handleSearchSubmit = () => {
    const searchTermLower = searchTerm.toLowerCase();
    const now = new Date();
    let filtered = posts;

    // 날짜 필터 적용
    if (dateFilter !== "all") {
      let dateThreshold;
      if (dateFilter === "1day") {
        dateThreshold = new Date(now.setDate(now.getDate() - 1));
      } else if (dateFilter === "1week") {
        dateThreshold = new Date(now.setDate(now.getDate() - 7));
      } else if (dateFilter === "1month") {
        dateThreshold = new Date(now.setMonth(now.getMonth() - 1));
      }
      filtered = filtered.filter(
        (post) => post.createdAt.toDate() >= dateThreshold,
      );
    }

    // 검색 범위 필터 적용
    if (searchScope === "title") {
      filtered = filtered.filter((post) =>
        post.title.toLowerCase().includes(searchTermLower),
      );
    } else if (searchScope === "author") {
      filtered = filtered.filter((post) =>
        post.author.toLowerCase().includes(searchTermLower),
      );
    } else if (searchScope === "comments") {
      filtered = filtered.filter((post) =>
        post.comments.some((comment) =>
          comment.toLowerCase().includes(searchTermLower),
        ),
      );
    } else {
      filtered = filtered.filter(
        (post) =>
          post.title.toLowerCase().includes(searchTermLower) ||
          post.content.toLowerCase().includes(searchTermLower) ||
          post.author.toLowerCase().includes(searchTermLower) ||
          post.comments.some((comment) =>
            comment.toLowerCase().includes(searchTermLower),
          ),
      );
    }

    setFilteredPosts(filtered);
    setCurrentPage(1); // 검색 결과 페이지를 1로 초기화
  };

  const indexOfLastPost = currentPage * 10;
  const indexOfFirstPost = indexOfLastPost - 10;
  const currentPosts = filteredPosts.slice(indexOfFirstPost, indexOfLastPost);

  const totalPages = Math.ceil(filteredPosts.length / 10);
  const pagesPerGroup = 10; // 한 페이지 그룹에 표시할 페이지 수
  const totalPageGroups = Math.ceil(totalPages / pagesPerGroup); // 전체 페이지 그룹 수
  const startPage = (currentPageGroup - 1) * pagesPerGroup + 1;
  const endPage = Math.min(currentPageGroup * pagesPerGroup, totalPages);

  const changePage = (pageNumber) => {
    setCurrentPage(pageNumber);
    window.scrollTo({ top: 0, behavior: "smooth" }); // 페이지 변경 시 화면 맨 위로 스크롤
  };

  const nextPageGroup = () => {
    if (currentPageGroup < totalPageGroups) {
      setCurrentPageGroup(currentPageGroup + 1);
    }
  };

  const prevPageGroup = () => {
    if (currentPageGroup > 1) {
      setCurrentPageGroup(currentPageGroup - 1);
    }
  };

  if (loading) {
    return <LoadingMessage>로딩 중...</LoadingMessage>;
  }

  return (
    <div>
      <PostContainer>
        {currentPosts.map((post) => (
          <PostItem key={post.id} onClick={() => handlePostClick(post.id)}>
            <PostMainContent>
              <PostHeader>
                <PostTitle>{post.title}</PostTitle>
              </PostHeader>
              <PostContent>{post.content.slice(0, 100)}...</PostContent>
            </PostMainContent>
            <ImagePreviewContainer>
              {post.imageUrls &&
                post.imageUrls
                  .slice(0, 2)
                  .map((imageUrl, index) => (
                    <ImagePreview
                      key={index}
                      src={imageUrl}
                      alt={`Preview ${index + 1}`}
                    />
                  ))}
            </ImagePreviewContainer>
            <PostFooter>
              <PostDateAuthor>
                {formatDate(post.createdAt)} | {post.author}
              </PostDateAuthor>
              <PostActions>
                <ActionItem>👍 {post.likes || 0}</ActionItem>
                <ActionItem>💬 {post.comments || 0}</ActionItem>
                <ActionItem>👁️ {post.views || 0}</ActionItem>
                <ActionItem>🔖 {post.scraps || 0}</ActionItem>
              </PostActions>
            </PostFooter>
          </PostItem>
        ))}
      </PostContainer>
      <Pagination>
        {currentPageGroup > 1 && (
          <PageNavigationButton onClick={prevPageGroup}>
            {"< 이전"}
          </PageNavigationButton>
        )}
        {Array.from({ length: endPage - startPage + 1 }, (_, index) => (
          <PageNumber
            key={startPage + index}
            onClick={() => changePage(startPage + index)}
            isActive={startPage + index === currentPage}
          >
            {startPage + index}
          </PageNumber>
        ))}
        {currentPageGroup < totalPageGroups && (
          <PageNavigationButton onClick={nextPageGroup}>
            {"다음 >"}
          </PageNavigationButton>
        )}
      </Pagination>
      <ControlBar>
        <Filters>
          <Filter>
            <label></label>
            <select value={dateFilter} onChange={handleDateFilterChange}>
              <option value="all">기간</option>
              <option value="1day">1일</option>
              <option value="1week">1주일</option>
              <option value="1month">1개월</option>
            </select>
          </Filter>
          <Filter>
            <label></label>
            <select value={searchScope} onChange={handleSearchScopeChange}>
              <option value="all">내용</option>
              <option value="title">제목</option>
              <option value="author">작성자</option>
              <option value="comments">댓글</option>
            </select>
          </Filter>
        </Filters>
        <SearchBar>
          <SearchInput
            type="text"
            placeholder="검색어 입력"
            value={searchTerm}
            onChange={handleSearchChange}
          />
          <SearchButton onClick={handleSearchSubmit}>
            <FaSearch />
          </SearchButton>
        </SearchBar>
      </ControlBar>
    </div>
  );
};

const ControlBar = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  margin: 1rem 0;
  gap: 0.5rem;
`;

const SearchBar = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;

  @media (max-width: 768px) {
    gap: 0.3rem;
  }
`;

const SearchInput = styled.input`
  padding: 0.5rem;
  font-size: 1rem;
  border-radius: 4px;
  border: 1px solid #ccc;

  @media (max-width: 768px) {
    padding: 0.3rem;
    width: 100px;
  }
`;

const SearchButton = styled.button`
  padding: 0.5rem 1rem;
  font-size: 1rem;
  color: white;
  background-color: #007bff;
  border: none;
  border-radius: 4px;
  cursor: pointer;

  &:hover {
    background-color: #0056b3;
  }


  @media (max-width: 768px) {
    padding: 0.5rem 0.8rem;
    font-size: 0.8rem;
`;

const Filters = styled.div`
  display: flex;
  gap: 0.1rem;
`;

const Filter = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;

  @media (max-width: 768px) {
    gap: 0.3rem;
  }

  label {
    font-size: 1rem;
  }

  select {
    padding: 0.5rem;
    font-size: 1rem;
    border-radius: 4px;
    border: 1px solid #ccc;

    @media (max-width: 768px) {
      padding: 0.4rem;
      font-size: 0.8rem;
    }
  }
`;

const PostContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.8rem;
`;

const LoadingMessage = styled.div`
  text-align: center;
  font-size: 1.2rem;
  color: #666;
`;

const PostHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const PostTitle = styled.h4`
  margin: 0;
  flex-grow: 1;
`;

const PostItem = styled.div`
  padding: 1rem;
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
  cursor: pointer;
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;

  &:hover {
    background-color: #f1f1f1;
  }
`;

const PostMainContent = styled.div`
  flex: 1;
  min-width: 60%;
  margin-right: 1rem;
`;

const PostContent = styled.p`
  margin: 0.5rem 0;
  color: #8e9091;
  line-height: 1.2;
  font-size: 0.9rem;
`;

const ImagePreviewContainer = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 0.5rem;
  max-width: 40%;
`;

const ImagePreview = styled.img`
  width: 50px;
  height: 50px;
  object-fit: cover;
  border-radius: 4px;
`;

const PostFooter = styled.div`
  width: 100%;
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 0.5rem;
`;

const PostDateAuthor = styled.span`
  font-size: 0.8rem;
  color: #6c757d;
`;

const PostActions = styled.div`
  display: flex;
  gap: 0.5rem;
  font-size: 0.7rem;
  color: #6c757d;
`;

const ActionItem = styled.span`
  display: flex;
  align-items: center;
  cursor: pointer;
`;

const Pagination = styled.div`
  display: flex;
  justify-content: center;
  margin-top: 1rem;
`;

const PageNumber = styled.span<{ isActive: boolean }>`
  margin: 0 0.5rem;
  cursor: pointer;
  font-weight: ${(props) => (props.isActive ? "bold" : "normal")};
`;

const PageNavigationButton = styled.span`
  margin: 0 0.5rem;
  cursor: pointer;
  font-weight: bold;
`;

export default PostList;
