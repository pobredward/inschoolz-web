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
import { FaUserCircle } from "react-icons/fa";
import { updatePost } from "../services/postService";
import { Post } from "../types";

const PostDetail: React.FC = () => {
  const router = useRouter();
  const { id } = router.query;
  const [post, setPost] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [comments, setComments] = useRecoilState(commentsState);
  const user = useRecoilValue(userState);
  const selectedCategory = useRecoilValue(selectedCategoryState);
  const [liked, setLiked] = useState(false);
  const [newComment, setNewComment] = useState("");
  const [replyComment, setReplyComment] = useState("");
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editedTitle, setEditedTitle] = useState("");
  const [editedContent, setEditedContent] = useState("");

  useEffect(() => {
    const fetchPost = async () => {
      if (id) {
        const docRef = doc(db, "posts", id as string);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const postData = docSnap.data();
          const formattedPost: Post = {
            id: docSnap.id,
            ...postData,
            createdAt: postData.createdAt
              ? new Date(postData.createdAt.seconds * 1000)
              : new Date(),
            updatedAt: postData.updatedAt
              ? new Date(postData.updatedAt.seconds * 1000)
              : new Date(),
          } as Post; // 타입 단언 사용
          setPost(formattedPost);
          setEditedTitle(formattedPost.title);
          setEditedContent(formattedPost.content);
        } else {
          setPost(null);
        }
        setLoading(false);
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

  if (loading) {
    return <LoadingMessage>로딩 중...</LoadingMessage>;
  }

  if (!post) {
    return <ErrorMessage>게시글을 찾을 수 없습니다.</ErrorMessage>;
  }

  const handleCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newComment.trim()) return;

    const commentData = {
      postId: id,
      author: user?.name || "익명",
      content: newComment,
      createdAt: new Date(),
      parentId: null,
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

  const handleReplySubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!replyComment.trim() || !replyingTo) return;

    const commentData = {
      postId: id,
      author: user?.name || "익명",
      content: replyComment,
      createdAt: new Date(),
      parentId: replyingTo,
    };

    try {
      await addDoc(collection(db, "comments"), commentData);
      setComments((prevComments) => [...prevComments, commentData]);
      setReplyComment("");
      setReplyingTo(null);

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
    setIsEditing(!isEditing);
    setEditedTitle(post?.title || "");
    setEditedContent(post?.content || "");
  };

  const handleSaveEdit = async () => {
    if (!post) return;

    try {
      await updatePost(post.id, {
        title: editedTitle,
        content: editedContent,
        updatedAt: new Date(),
      });
      setPost({
        ...post,
        title: editedTitle,
        content: editedContent,
        updatedAt: new Date(),
      });
      setIsEditing(false);
    } catch (error) {
      console.error("Error updating post:", error);
    }
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditedTitle(post?.title || "");
    setEditedContent(post?.content || "");
  };

  const handleBackToList = () => {
    router.back();
  };

  const handleLike = async () => {
    if (!user || !user.uid || user.uid === post.authorId) return;

    const docRef = doc(db, "posts", id as string);
    try {
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
    } catch (error) {
      console.error("Error updating likes: ", error);
    }
  };

  const handleReply = (commentId: string) => {
    setReplyingTo(commentId);
  };

  const formatDate = (date: any) => {
    let postDate;
    if (date instanceof Date) {
      postDate = date;
    } else if (date?.toDate) {
      postDate = date.toDate();
    } else if (date?.seconds) {
      postDate = new Date(date.seconds * 1000);
    } else {
      postDate = new Date(date);
    }
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
        <ContentWrapper>
          <ContentSection>
            <PostContainer>
              <PostHeader>
                <ProfileImage />
                <PostInfo>
                  <PostAuthor>{post.author}</PostAuthor>
                  <UploadTime>{formatDate(post.createdAt)}</UploadTime>
                </PostInfo>
              </PostHeader>
              {isEditing ? (
                <EditForm>
                  <EditInput
                    type="text"
                    value={editedTitle}
                    onChange={(e) => setEditedTitle(e.target.value)}
                  />
                  <EditTextarea
                    value={editedContent}
                    onChange={(e) => setEditedContent(e.target.value)}
                  />
                  <ButtonContainer>
                    <SaveButton onClick={handleSaveEdit}>저장</SaveButton>
                    <CancelButton onClick={handleCancelEdit}>취소</CancelButton>
                  </ButtonContainer>
                </EditForm>
              ) : (
                <>
                  <PostTitle>{post.title}</PostTitle>
                  <PostContent>{post.content}</PostContent>
                  <ActionsAndButtonsContainer>
                    <PostActions>
                      <ActionItem onClick={handleLike}>
                        {liked ? "❤️ 좋아요" : "🤍 좋아요"} {post.likes}
                      </ActionItem>
                      <ActionItem>💬 댓글 {post.comments}</ActionItem>
                      <ActionItem>👁️ 조회수 {post.views}</ActionItem>
                    </PostActions>
                    <ButtonContainer>
                      <TextButton onClick={handleBackToList}>목록</TextButton>
                      {user?.uid === post.authorId && (
                        <>
                          <EditButton onClick={handleEdit}>수정</EditButton>
                          <DeleteButton onClick={handleDelete}>
                            삭제
                          </DeleteButton>
                        </>
                      )}
                    </ButtonContainer>
                  </ActionsAndButtonsContainer>
                </>
              )}
            </PostContainer>
            <CommentsSection>
              <h3>댓글</h3>
              {comments.map((comment) => (
                <CommentItem key={comment.id}>
                  <CommentAuthor>{comment.author}</CommentAuthor>
                  <CommentDate>{formatDate(comment.createdAt)}</CommentDate>
                  <CommentContent>{comment.content}</CommentContent>
                  <CommentActions>
                    <CommentActionItem onClick={() => handleReply(comment.id)}>
                      답글 달기
                    </CommentActionItem>
                  </CommentActions>
                  {comment.parentId === comment.id && (
                    <ReplyForm onSubmit={handleReplySubmit}>
                      <ReplyTextarea
                        value={replyComment}
                        onChange={(e) => setReplyComment(e.target.value)}
                        placeholder="답글을 입력하세요..."
                        required
                      />
                      <ReplyButton type="submit">답글 작성</ReplyButton>
                    </ReplyForm>
                  )}
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
        </ContentWrapper>
      </Container>
    </Layout>
  );
};

const Container = styled.div`
  display: flex;
  max-width: 100%;
  min-height: calc(100vh - 60px);

  @media (max-width: 768px) {
    flex-direction: column;
  }
`;

const CategorySection = styled.div`
  width: 250px;
  padding: 1rem;
  border-right: 1px solid #e0e0e0;
  background-color: #f8f9fa;
  overflow-y: auto;

  @media (max-width: 768px) {
    display: none;
  }
`;

const ContentWrapper = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
`;

const ContentSection = styled.div`
  flex: 1;
  padding: 1rem;
  overflow-y: auto;
`;

const LoadingMessage = styled.div`
  text-align: center;
  font-size: 1.2rem;
  color: #666;
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const ErrorMessage = styled.div`
  text-align: center;
  font-size: 1.2rem;
  color: #ff6b6b;
`;

const PostContainer = styled.div`
  padding: 1rem;
  border-radius: 4px;
  background-color: #fff;
  max-width: 100%;
  box-sizing: border-box;
  margin-bottom: 2rem;

  @media (max-width: 769px) {
    padding: 0rem;
  }
`;

const PostHeader = styled.div`
  display: flex;
  align-items: center;
  margin-bottom: 1rem;
`;

const ProfileImage = styled(FaUserCircle)`
  width: 40px;
  height: 40px;
  margin-right: 1rem;
  color: #ccc;
`;

const PostInfo = styled.div`
  display: flex;
  flex-direction: column;
`;

const PostAuthor = styled.div`
  font-size: 1rem;
  font-weight: bold;
  color: #495057;
`;

const UploadTime = styled.div`
  font-size: 0.9rem;
  color: #6c757d;
`;

const PostTitle = styled.h2`
  margin: 0 0 1rem 0;
`;

const PostContent = styled.div`
  margin-bottom: 5rem;
`;

const PostActions = styled.div`
  display: flex;
  gap: 1rem;
  font-size: 1rem;
`;

const ButtonContainer = styled.div`
  display: flex;
  gap: 0.5rem;
`;

const ActionItem = styled.span`
  cursor: pointer;
  &:disabled {
    cursor: not-allowed;
    color: #ccc;
  }
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
  padding: 1rem;
  background-color: #f8f9fa;
  border-radius: 4px;
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

const CommentActions = styled.div`
  display: flex;
  gap: 0.5rem;
  font-size: 0.8rem;
  color: #6c757d;
`;

const CommentActionItem = styled.span`
  cursor: pointer;
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

const ReplyForm = styled.form`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  margin-top: 1rem;
`;

const ReplyTextarea = styled.textarea`
  padding: 0.75rem;
  border: 1px solid #ccc;
  border-radius: 4px;
  font-size: 1rem;
  resize: vertical;
`;

const ReplyButton = styled.button`
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

const EditForm = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

const EditInput = styled.input`
  padding: 0.5rem;
  font-size: 1.2rem;
`;

const EditTextarea = styled.textarea`
  padding: 0.5rem;
  font-size: 1rem;
  min-height: 200px;
`;

const Button = styled.button`
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 1rem;
  font-weight: bold;
`;

const SaveButton = styled(Button)`
  background-color: #28a745;

  &:hover {
    background-color: #218838;
  }
`;

const CancelButton = styled(Button)`
  background-color: #dc3545;

  &:hover {
    background-color: #c82333;
  }
`;

const ActionsAndButtonsContainer = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 1rem;

  @media (max-width: 768px) {
    flex-direction: column;
    align-items: flex-start;
    gap: 1rem;
  }
`;

export default PostDetail;
