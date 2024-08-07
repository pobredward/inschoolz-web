import React, { useState, useEffect } from "react";
import styled from "@emotion/styled";
import { useRecoilState } from "recoil";
import { postsState, userState, categoriesState, Post } from "../store/atoms";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "../lib/firebase";
import { useRouter } from "next/router";

interface PostListProps {
  selectedCategory: string;
}

const PostList: React.FC<PostListProps> = ({ selectedCategory }) => {
  const [posts, setPosts] = useRecoilState(postsState);
  const [user] = useRecoilState(userState);
  const [categories] = useRecoilState(categoriesState);
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPosts = async () => {
      if (!user || !user.schoolId || !user.address1 || !user.address2) return;

      try {
        let q;
        if (selectedCategory.startsWith("school-")) {
          q = query(
            collection(db, "posts"),
            where("categoryId", "==", selectedCategory),
            where("schoolId", "==", user.schoolId),
          );
        } else if (selectedCategory.startsWith("regional-")) {
          q = query(
            collection(db, "posts"),
            where("categoryId", "==", selectedCategory),
            where("address1", "==", user.address1),
            where("address2", "==", user.address2),
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

        setPosts(postsData);
      } catch (error) {
        console.error("Error fetching posts: ", error);
      } finally {
        setLoading(false);
      }
    };

    fetchPosts();
  }, [selectedCategory, user, setPosts]);

  const getCategoryName = (categoryId: string) => {
    for (let cat of categories) {
      if (cat.subcategories) {
        for (let subcat of cat.subcategories) {
          if (subcat.id === categoryId) {
            return `${cat.name} | ${subcat.name}`;
          }
        }
      }
    }
    return "";
  };

  const filteredPosts = posts.filter((post) => {
    if (selectedCategory.startsWith("school-")) {
      return post.schoolId === user?.schoolId;
    } else if (selectedCategory.startsWith("regional-")) {
      return (
        post.address1 === user?.address1 && post.address2 === user?.address2
      );
    }
    return post.categoryId === selectedCategory;
  });

  const handlePostClick = (postId: string) => {
    router.push(`/posts/${postId}`);
  };

  const formatPostMeta = (post: Post) => {
    const postDate =
      post.createdAt instanceof Date
        ? post.createdAt
        : new Date(post.createdAt.seconds * 1000);
    const date = new Intl.DateTimeFormat("ko-KR", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(postDate);
    const author = post.author;
    const schoolName = post.schoolName;

    if (selectedCategory.startsWith("national-")) {
      return `${date} | ${author} | ${schoolName}`;
    } else {
      return `${date} | ${author}`;
    }
  };

  const renderPostContent = (content: string) => {
    return content.length > 35 ? `${content.slice(0, 35)}...` : content;
  };

  return (
    <PostContainer>
      {loading ? (
        <LoadingMessage>로딩 중...</LoadingMessage>
      ) : (
        filteredPosts.map((post) => (
          <PostItem key={post.id} onClick={() => handlePostClick(post.id)}>
            <PostHeader>
              <PostTitle>{post.title}</PostTitle>
              <PostCategory>{getCategoryName(post.categoryId)}</PostCategory>
            </PostHeader>
            <PostContent>{renderPostContent(post.content)}</PostContent>
            <PostFooter>
              <PostDateAuthor>{formatPostMeta(post)}</PostDateAuthor>
              <PostActions>
                <ActionItem>👍 {post.likes || 0}</ActionItem>
                <ActionItem>💬 {post.comments || 0}</ActionItem>
                <ActionItem>👁️ {post.views || 0}</ActionItem>
              </PostActions>
            </PostFooter>
          </PostItem>
        ))
      )}
    </PostContainer>
  );
};

const PostContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.8rem;

  @media (max-width: 769px) {
    gap: 0.2rem;
  }
`;

const LoadingMessage = styled.div`
  text-align: center;
  font-size: 1.2rem;
  color: #666;
`;

const PostItem = styled.div`
  padding: 1.2rem;
  cursor: pointer;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  box-shadow: 0 2px 3px rgba(0, 0, 0, 0.1);

  &:hover {
    background-color: #f9f9f9;
  }
`;

const PostHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const PostCategory = styled.span`
  font-size: 0.8rem;
  color: #6c757d;
`;

const PostTitle = styled.h4`
  margin: 0;
  flex-grow: 1;
`;

const PostContent = styled.p`
  margin: 0.2rem 0 0;
  color: #495057;
  line-height: 1.2;
`;

const PostFooter = styled.div`
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
  font-size: 0.8rem;
  color: #6c757d;
`;

const ActionItem = styled.span`
  display: flex;
  align-items: center;
  cursor: pointer;
`;

export default PostList;
