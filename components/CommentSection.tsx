import React, { useState } from "react";
import styled from "@emotion/styled";
import { FaUserCircle, FaHeart, FaEdit, FaTrash } from "react-icons/fa";
import { useRecoilValue } from "recoil";
import { userState } from "../store/atoms";
import {
  addDoc,
  collection,
  updateDoc,
  deleteDoc,
  arrayUnion,
  arrayRemove,
  doc,
} from "firebase/firestore";
import { db } from "../lib/firebase";
import { formatDate, formatTime } from "../utils/dateUtils";
import { createComment } from "../services/commentService";

interface Comment {
  id: string;
  author: string;
  authorId: string;
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
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState("");

  const handleCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !newComment.trim()) return;

    const commentData = {
      postId,
      author: user.name || "익명",
      authorId: user.uid,
      content: newComment,
      createdAt: new Date(),
      parentId: null,
      likes: 0,
      likedBy: [],
    };

    try {
      const newCommentWithId = await createComment(commentData);
      setComments((prevComments) =>
        sortComments([...prevComments, newCommentWithId]),
      );
      setNewComment("");
      onCommentUpdate(comments.length + 1);
    } catch (e) {
      console.error("Error adding comment: ", e);
    }
  };

  const handleReplySubmit = async (parentId: string) => {
    if (!user || !replyContent.trim()) return;

    const replyData = {
      postId,
      author: user.name || "익명",
      authorId: user.uid,
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

  const handleEdit = (commentId: string, content: string) => {
    setEditingCommentId(commentId);
    setEditContent(content);
  };

  const handleSaveEdit = async (commentId: string) => {
    if (!editContent.trim()) return;

    const commentRef = doc(db, "comments", commentId);
    try {
      await updateDoc(commentRef, {
        content: editContent,
      });
      setComments((prevComments) =>
        prevComments.map((c) =>
          c.id === commentId ? { ...c, content: editContent } : c,
        ),
      );
      setEditingCommentId(null);
      setEditContent("");
    } catch (e) {
      console.error("Error updating comment: ", e);
    }
  };

  const handleDelete = async (commentId: string) => {
    if (!window.confirm("정말로 이 댓글을 삭제하시겠습니까?")) return;

    const commentRef = doc(db, "comments", commentId);
    try {
      await deleteDoc(commentRef);
      const newComments = comments.filter((c) => c.id !== commentId);
      setComments(newComments);
      onCommentUpdate(newComments.length);

      const postRef = doc(db, "posts", postId);
      await updateDoc(postRef, {
        comments: newComments.length,
      });
    } catch (e) {
      console.error("Error deleting comment: ", e);
    }
  };

  const sortComments = (comments: Comment[]) => {
    return comments.sort((a, b) => {
      const dateA =
        a.createdAt instanceof Date
          ? a.createdAt
          : new Date(a.createdAt.seconds * 1000);
      const dateB =
        b.createdAt instanceof Date
          ? b.createdAt
          : new Date(b.createdAt.seconds * 1000);
      return dateA.getTime() - dateB.getTime();
    });
  };

  const renderComments = (parentId: string | null = null, depth = 0) => {
    return sortComments(
      comments.filter((comment) => comment.parentId === parentId),
    ).map((comment, index) => (
      <CommentItem
        key={comment.id}
        depth={depth}
        isLast={index === comments.length - 1}
      >
        <CommentHeader>
          <ProfileIcon />
          <CommentAuthor>{comment.author}</CommentAuthor>
          <CommentDate>
            {formatDate(comment.createdAt)} {formatTime(comment.createdAt)}
          </CommentDate>
        </CommentHeader>
        {editingCommentId === comment.id ? (
          <EditForm
            onSubmit={(e) => {
              e.preventDefault();
              handleSaveEdit(comment.id);
            }}
          >
            <EditTextarea
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
            />
            <EditButton type="submit">저장</EditButton>
            <CancelButton onClick={() => setEditingCommentId(null)}>
              취소
            </CancelButton>
          </EditForm>
        ) : (
          <CommentContent>{comment.content}</CommentContent>
        )}
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
          {user && user.uid === comment.authorId && (
            <>
              <EditButton
                onClick={() => handleEdit(comment.id, comment.content)}
              >
                수정
              </EditButton>
              <DeleteButton onClick={() => handleDelete(comment.id)}>
                <FaTrash />
              </DeleteButton>
            </>
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
      {renderComments()}
    </CommentSectionContainer>
  );
};

const CommentSectionContainer = styled.div`
  margin-top: 1rem;
`;

const CommentForm = styled.form`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  margin-bottom: 1rem;
`;

const CommentTextarea = styled.textarea`
  width: 100%;
  padding: 0.5rem;
  border: 1px solid #ccc;
  border-radius: 4px;
  resize: vertical;
  min-height: 80px;
`;

const CommentButton = styled.button`
  align-self: flex-end;
  padding: 0.5rem 1rem;
  background-color: #0070f3;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
`;

const CommentItem = styled.div<{ depth: number; isLast: boolean }>`
  border-radius: ${(props) => (props.depth > 0 ? "15px" : "0")};
  margin-left: ${(props) => props.depth * 20}px;
  padding: 1rem;
  margin-bottom: 1rem;
  background-color: ${(props) => (props.depth > 0 ? "#f8f9fa" : "transparent")};
  ${(props) =>
    props.depth === 0 &&
    !props.isLast &&
    `
    border-bottom: 1px solid #e0e0e0;
  `}
`;

const CommentHeader = styled.div`
  display: flex;
  align-items: center;
  margin-bottom: 0.5rem;
`;

const ProfileIcon = styled(FaUserCircle)`
  font-size: 1.5rem;
  margin-right: 0.5rem;
  color: #ccc;
`;

const CommentAuthor = styled.span`
  font-weight: bold;
  margin-right: 0.5rem;
`;

const CommentDate = styled.span`
  color: #6c757d;
  font-size: 0.8rem;
`;

const CommentContent = styled.p`
  margin: 0.5rem 0;
  white-space: pre-wrap;
  word-break: break-word;
`;

const CommentActions = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-top: 0.5rem;
`;

const ActionButton = styled.button`
  background: none;
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  color: #6c757d;
  font-size: 0.9rem;

  &:hover {
    color: #0056b3;
  }
`;

const LikeButton = styled(ActionButton)``;

const LikeCount = styled.span`
  margin-left: 0.25rem;
`;

const DeleteButton = styled(ActionButton)`
  &:hover {
    color: #dc3545;
  }
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
  margin-top: 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`;

const ReplyTextarea = styled.textarea`
  width: 100%;
  padding: 0.5rem;
  border: 1px solid #ccc;
  border-radius: 4px;
  resize: vertical;
  min-height: 60px;
`;

const ReplySubmitButton = styled.button`
  align-self: flex-end;
  padding: 0.5rem 1rem;
  background-color: #0070f3;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
`;

const EditForm = styled.form`
  margin-top: 0.5rem;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`;

const EditTextarea = styled.textarea`
  width: 100%;
  padding: 0.5rem;
  border: 1px solid #ccc;
  border-radius: 4px;
  resize: vertical;
  min-height: 60px;
`;

const EditButton = styled.button`
  background: none;
  border: none;
  color: #888;
  cursor: pointer;
  font-size: 0.8rem;
  padding: 0;
`;

const CancelButton = styled.button`
  padding: 0.5rem 1rem;
  background-color: #6c757d;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
`;

export default CommentSection;
