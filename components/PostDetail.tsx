import React, { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { useRecoilValue, useRecoilState } from "recoil";
import {
  postsState,
  userState,
  commentsState,
  selectedCategoryState,
} from "../store/atoms";
import styled from "@emotion/styled";
import Layout from "./Layout";
import CategoryList from "./CategoryList";
import {
  collection,
  doc,
  getDoc,
  addDoc,
  deleteDoc,
  query,
  where,
  getDocs,
  updateDoc,
  increment,
  arrayUnion,
  arrayRemove,
} from "firebase/firestore";
import { db } from "../lib/firebase";

const PostDetail: React.FC = () => {
  const router = useRouter();
  const { id } = router.query;
  const [post, setPost] = useState<any>(null);
  const [comments, setComments] = useRecoilState(commentsState);
  const user = useRecoilValue(userState);
  const selectedCategory = useRecoilValue(selectedCategoryState);
  const [liked, setLiked] = useState(false);
  const [newComment, setNewComment] = useState("");

  useEffect(() => {
    const fetchPost = async () => {
      if (id) {
        const docRef = doc(db, "posts", id as string);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setPost(docSnap.data());
        } else {
          setPost(null);
        }
      }
    };

    const fetchComments = async () => {
      if (id) {
        const q = query(collection(db, "comments"), where("postId", "==", id));
        const querySnapshot = await getDocs(q);
        const commentsData = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setComments(commentsData);
      }
    };

    const checkIfLiked = async () => {
      if (id && user) {
        const docRef = doc(db, "posts", id as string);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists() && docSnap.data().likedBy.includes(user.uid)) {
          setLiked(true);
        }
      }
    };

    fetchPost();
    fetchComments();
    checkIfLiked();
  }, [id, setComments, user]);

  useEffect(() => {
    const incrementViewCount = async () => {
      if (id) {
        const docRef = doc(db, "posts", id as string);
        await updateDoc(docRef, {
          views: increment(1),
        });
      }
    };
    if (id) {
      incrementViewCount();
    }
  }, [id]);

  if (!post) return <div>게시글을 찾을 수 없습니다.</div>;

  const postDate = post.date.toDate
    ? post.date.toDate()
    : new Date(post.date.seconds * 1000);

  const handleCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newComment.trim()) return;

    const commentData = {
      postId: id,
      author: user?.name || "익명",
      content: newComment,
      date: new Date(),
    };

    try {
      await addDoc(collection(db, "comments"), commentData);
      setComments((prevComments) => [...prevComments, commentData]);
      setNewComment("");

      const postRef = doc(db, "posts", id as string);
      await updateDoc(postRef, {
        comments: increment(1),
      });
    } catch (e) {
      console.error("Error adding comment: ", e);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm("정말 삭제하시겠습니까?")) return;

    try {
      await deleteDoc(doc(db, "posts", id as string));
      router.push(`/community/${selectedCategory}`);
    } catch (e) {
      console.error("Error deleting post: ", e);
    }
  };

  const handleEdit = () => {
    router.push(`/posts/edit/${id}`);
  };

  const handleBackToList = () => {
    router.back();
  };

  const handleLike = async () => {
    if (!user || user.uid === post.authorId) return;

    const docRef = doc(db, "posts", id as string);
    if (liked) {
      await updateDoc(docRef, {
        likes: increment(-1),
        likedBy: arrayRemove(user.uid),
      });
      setLiked(false);
    } else {
      await updateDoc(docRef, {
        likes: increment(1),
        likedBy: arrayUnion(user.uid),
      });
      setLiked(true);
    }

    // Update local post state
    const updatedPost = { ...post };
    if (liked) {
      updatedPost.likes -= 1;
      updatedPost.likedBy = updatedPost.likedBy.filter(
        (uid: string) => uid !== user.uid,
      );
    } else {
      updatedPost.likes += 1;
      updatedPost.likedBy.push(user.uid);
    }
    setPost(updatedPost);
  };

  const formatDate = (date: any) => {
    const postDate = date.toDate
      ? date.toDate()
      : new Date(date.seconds * 1000);
    return new Intl.DateTimeFormat("ko-KR", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      weekday: "short",
    }).format(postDate);
  };

  return (
    <Layout>
      <Container>
        <CategorySection>
          <CategoryList />
        </CategorySection>
        <ContentSection>
          <PostContainer>
            <PostTitle>{post.title}</PostTitle>
            <PostDate>{formatDate(post.date)}</PostDate>
            <PostContent>{post.content}</PostContent>
            <PostAuthor>작성자: {post.author}</PostAuthor>
            <PostActions>
              <ActionItem
                onClick={handleLike}
                disabled={!user || user.uid === post.authorId}
              >
                {liked ? "❤️ 좋아요 취소" : "🤍 좋아요"} {post.likes}
              </ActionItem>
              <ActionItem>💬 댓글 {post.comments}</ActionItem>
              <ActionItem>👁️ 조회수 {post.views}</ActionItem>
            </PostActions>
            <ButtonContainer>
              <TextButton onClick={handleBackToList}>목록</TextButton>
              {user?.uid === post.authorId && (
                <>
                  <EditButton onClick={handleEdit}>수정</EditButton>
                  <DeleteButton onClick={handleDelete}>삭제</DeleteButton>
                </>
              )}
            </ButtonContainer>
          </PostContainer>
          <CommentsSection>
            <h3>댓글</h3>
            {comments.map((comment) => (
              <CommentItem key={comment.id}>
                <CommentAuthor>{comment.author}</CommentAuthor>
                <CommentDate>{formatDate(comment.date)}</CommentDate>
                <CommentContent>{comment.content}</CommentContent>
              </CommentItem>
            ))}
            {user && (
              <CommentForm onSubmit={handleCommentSubmit}>
                <CommentTextarea
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="댓글을 입력하세요..."
                  required
                />
                <CommentButton type="submit">댓글 작성</CommentButton>
              </CommentForm>
            )}
          </CommentsSection>
        </ContentSection>
      </Container>
    </Layout>
  );
};

const Container = styled.div`
  display: flex;
  gap: 2rem;
  max-width: 100%;
  @media (max-width: 768px) {
    flex-direction: column;
  }
`;

const CategorySection = styled.div`
  flex: 1;
  @media (max-width: 768px) {
    order: 2;
  }
`;

const ContentSection = styled.div`
  flex: 3;
  @media (max-width: 768px) {
    order: 1;
  }
`;

const PostContainer = styled.div`
  padding: 2rem;
  border-radius: 4px;
  background-color: #fff;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  max-width: 100%;
  box-sizing: border-box;
  position: relative;
`;

const PostTitle = styled.h2`
  margin: 0 0 1rem 0;
`;

const PostDate = styled.div`
  font-size: 0.9rem;
  color: #6c757d;
  margin-bottom: 1rem;
`;

const PostContent = styled.div`
  margin-bottom: 2rem;
`;

const PostAuthor = styled.div`
  font-size: 0.9rem;
  color: #495057;
`;

const PostActions = styled.div`
  display: flex;
  gap: 1rem;
  margin-top: 1rem;
  font-size: 1rem;
`;

const ActionItem = styled.span`
  cursor: pointer;
  &:disabled {
    cursor: not-allowed;
    color: #ccc;
  }
`;

const ButtonContainer = styled.div`
  display: flex;
  gap: 0.5rem;
  position: absolute;
  bottom: 1rem;
  right: 1rem;
`;

const TextButton = styled.button`
  padding: 0.5rem;
  background: none;
  color: #0070f3;
  border: none;
  cursor: pointer;
  font-size: 1rem;
  font-weight: bold;

  &:hover {
    text-decoration: underline;
  }
`;

const EditButton = styled.button`
  padding: 0.5rem;
  background-color: #28a745;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 1rem;

  &:hover {
    background-color: #218838;
  }
`;

const DeleteButton = styled.button`
  padding: 0.5rem;
  background-color: #dc3545;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 1rem;

  &:hover {
    background-color: #c82333;
  }
`;

const CommentsSection = styled.div`
  margin-top: 2rem;
`;

const CommentItem = styled.div`
  border-top: 1px solid #ccc;
  padding-top: 1rem;
  margin-top: 1rem;
`;

const CommentAuthor = styled.div`
  font-weight: bold;
`;

const CommentDate = styled.div`
  font-size: 0.8rem;
  color: #6c757d;
  margin-bottom: 0.5rem;
`;

const CommentContent = styled.div`
  margin-bottom: 0.5rem;
`;

const CommentForm = styled.form`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  margin-top: 1rem;
`;

const CommentTextarea = styled.textarea`
  padding: 0.75rem;
  border: 1px solid #ccc;
  border-radius: 4px;
  font-size: 1rem;
  resize: vertical;
`;

const CommentButton = styled.button`
  padding: 0.75rem;
  background-color: #0070f3;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 1rem;
  font-weight: bold;

  &:hover {
    background-color: #0056b3;
  }
`;

export default PostDetail;
