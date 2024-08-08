import React, { useState } from "react";
import styled from "@emotion/styled";
import { FaUserCircle, FaHeart } from "react-icons/fa";
import { useRecoilValue } from "recoil";
import { userState } from "../store/atoms";
import {
  addDoc,
  collection,
  updateDoc,
  arrayUnion,
  arrayRemove,
  doc,
  Timestamp,
} from "firebase/firestore";
import { db } from "../lib/firebase";
import { formatDate, formatTime } from "../utils/dateUtils";

interface Comment {
  id: string;
  author: string;
  content: string;
  createdAt: Date;
  parentId: string | null;
  likes: number;
  likedBy: string[];
}

interface CommentSectionProps {
  postId: string;
  comments: Comment[];
  setComments: React.Dispatch<React.SetStateAction<Comment[]>>;
  onCommentUpdate: (newCommentCount: number) => void;
}

const CommentSection: React.FC<CommentSectionProps> = ({
  postId,
  comments,
  setComments,
  onCommentUpdate,
}) => {
  const user = useRecoilValue(userState);
  const [newComment, setNewComment] = useState("");
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState("");

  const handleCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !newComment.trim()) return;

    const commentData = {
      postId,
      author: user.name || "익명",
      content: newComment,
      createdAt: new Date(),
      parentId: null,
      likes: 0,
      likedBy: [],
    };

    try {
      const docRef = await addDoc(collection(db, "comments"), commentData);
      const newComments = [...comments, { ...commentData, id: docRef.id }];
      setComments(newComments);
      setNewComment("");
      onCommentUpdate(newComments.length);

      const postRef = doc(db, "posts", postId);
      await updateDoc(postRef, {
        comments: newComments.length,
      });
    } catch (e) {
      console.error("Error adding comment: ", e);
    }
  };

  const handleReplySubmit = async (parentId: string) => {
    if (!user || !replyContent.trim()) return;

    const replyData = {
      postId,
      author: user.name || "익명",
      content: replyContent,
      createdAt: new Date(),
      parentId,
      likes: 0,
      likedBy: [],
    };

    try {
      const docRef = await addDoc(collection(db, "comments"), replyData);
      const newComments = [...comments, { ...replyData, id: docRef.id }];
      setComments(newComments);
      setReplyContent("");
      setReplyingTo(null);
      onCommentUpdate(newComments.length);

      const postRef = doc(db, "posts", postId);
      await updateDoc(postRef, {
        comments: newComments.length,
      });
    } catch (e) {
      console.error("Error adding reply: ", e);
    }
  };

  const handleLike = async (commentId: string) => {
    if (!user) return;

    const commentRef = doc(db, "comments", commentId);
    const comment = comments.find((c) => c.id === commentId);

    if (!comment) return;

    try {
      if (comment.likedBy.includes(user.uid)) {
        await updateDoc(commentRef, {
          likes: comment.likes - 1,
          likedBy: arrayRemove(user.uid),
        });
        setComments((prevComments) =>
          prevComments.map((c) =>
            c.id === commentId
              ? {
                  ...c,
                  likes: c.likes - 1,
                  likedBy: c.likedBy.filter((id) => id !== user.uid),
                }
              : c,
          ),
        );
      } else {
        await updateDoc(commentRef, {
          likes: comment.likes + 1,
          likedBy: arrayUnion(user.uid),
        });
        setComments((prevComments) =>
          prevComments.map((c) =>
            c.id === commentId
              ? { ...c, likes: c.likes + 1, likedBy: [...c.likedBy, user.uid] }
              : c,
          ),
        );
      }
    } catch (e) {
      console.error("Error updating comment likes: ", e);
    }
  };

  const renderComments = (parentId: string | null = null, depth = 0) => {
    return comments
      .filter((comment) => comment.parentId === parentId)
      .map((comment, index) => (
        <CommentItem
          key={comment.id}
          depth={depth}
          isLast={index === comments.length - 1}
        >
          <CommentHeader>
            <ProfileIcon />
            <CommentAuthor>{comment.author}</CommentAuthor>
            <CommentDate>
              {formatDate(
                comment.createdAt instanceof Timestamp
                  ? comment.createdAt
                  : new Date(comment.createdAt),
              )}
            </CommentDate>
          </CommentHeader>
          <CommentContent>{comment.content}</CommentContent>
          <CommentActions>
            <LikeButton onClick={() => handleLike(comment.id)}>
              <FaHeart
                color={
                  user && comment.likedBy.includes(user.uid) ? "red" : "gray"
                }
              />
              <LikeCount>{comment.likes}</LikeCount>
            </LikeButton>
            {depth === 0 && (
              <ReplyButton onClick={() => setReplyingTo(comment.id)}>
                답글
              </ReplyButton>
            )}
          </CommentActions>
          {replyingTo === comment.id && (
            <ReplyForm
              onSubmit={(e) => {
                e.preventDefault();
                handleReplySubmit(comment.id);
              }}
            >
              <ReplyTextarea
                value={replyContent}
                onChange={(e) => setReplyContent(e.target.value)}
                placeholder="답글을 입력하세요..."
              />
              <ReplySubmitButton type="submit">답글 작성</ReplySubmitButton>
            </ReplyForm>
          )}
          {renderComments(comment.id, depth + 1)}
        </CommentItem>
      ));
  };

  return (
    <CommentSectionContainer>
      {renderComments()}
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
    </CommentSectionContainer>
  );
};

const CommentSectionContainer = styled.div`
  margin-top: 1rem;
`;

const CommentItem = styled.div<{ depth: number; isLast: boolean }>`
  border-radius: ${(props) => (props.depth > 0 ? "15px" : "0")};
  margin-left: ${(props) => props.depth * 10}px;
  padding: 0.5rem;
  margin-bottom: ${(props) => (props.depth === 0 ? "0.5rem" : "0.25rem")};
  background-color: ${(props) => (props.depth > 0 ? "#f3f3f3" : "transparent")};
  ${(props) =>
    props.depth === 0 &&
    !props.isLast &&
    `
    border-bottom: 0.5px solid #e0e0e0;
    padding-bottom: 0.5rem;
    margin-bottom: 1rem;
  `}
`;

const CommentContent = styled.p`
  margin: 0.25rem 0;
  white-space: pre-wrap;
  word-break: break-word;
  font-size: 0.9rem;
`;

const CommentActions = styled.div`
  display: flex;
  align-items: center;
  margin-top: 0.25rem;
  margin-bottom: ${(props) => (props.children[1] ? "0.5rem" : "0")};
`;

const CommentHeader = styled.div`
  display: flex;
  align-items: center;
  margin-bottom: 0.25rem;
`;

const ProfileIcon = styled(FaUserCircle)`
  font-size: 1.5rem;
  margin-right: 0.5rem;
  color: #ccc;
`;

const CommentAuthor = styled.span`
  font-weight: bold;
  margin-right: 0.5rem;
  font-size: 0.9rem;
`;

const CommentDate = styled.span`
  color: #888;
  font-size: 0.8rem;
`;

const LikeButton = styled.button`
  background: none;
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  margin-right: 0.5rem;
  padding: 0;
  font-size: 0.8rem;
`;

const LikeCount = styled.span`
  margin-left: 0.25rem;
`;

const ReplyButton = styled.button`
  background: none;
  border: none;
  color: #888;
  cursor: pointer;
  font-size: 0.8rem;
  padding: 0;
`;

const ReplyForm = styled.form`
  margin-top: 0.5rem;
`;

const ReplyTextarea = styled.textarea`
  width: 100%;
  padding: 0.5rem;
  margin-bottom: 0.5rem;
  font-size: 0.9rem;
`;

const ReplySubmitButton = styled.button`
  background-color: #0070f3;
  color: white;
  border: none;
  padding: 0.25rem 0.5rem;
  cursor: pointer;
  font-size: 0.8rem;
`;

const CommentForm = styled.form`
  margin-top: 1rem;
`;

const CommentTextarea = styled.textarea`
  width: 100%;
  padding: 0.5rem;
  margin-bottom: 0.5rem;
  font-size: 0.9rem;
`;

const CommentButton = styled.button`
  background-color: #0070f3;
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  cursor: pointer;
  font-size: 0.9rem;
`;

export default CommentSection;
