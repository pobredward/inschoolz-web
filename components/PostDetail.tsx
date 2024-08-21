import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/router";
import { useRecoilValue, useRecoilState } from "recoil";
import {
  postsState,
  userState,
  commentsState,
  selectedCategoryState,
  categoriesState,
} from "../store/atoms";
import { Category, Report } from "../types";
import styled from "@emotion/styled";
import Layout from "./Layout";
import CategoryList from "./CategoryList";
import CommentSection from "./CommentSection";
import {
  collection,
  doc,
  getDoc,
  deleteDoc,
  query,
  where,
  getDocs,
  updateDoc,
  increment,
  arrayUnion,
  arrayRemove,
} from "firebase/firestore";
import { storage, db } from "../lib/firebase";
import { FaUserCircle } from "react-icons/fa";
import { updatePost } from "../services/postService";
import { Post } from "../types";
import { FaBookmark, FaTrash, FaUpload, FaFlag, FaStar } from "react-icons/fa";
import { uploadImage, deleteImage } from "../services/imageService";
import { getCommentsForPost } from "../services/commentService";
import {
  scrapPost,
  unscrapPost,
  isPostScrapped,
  deletePost,
} from "../services/postService";
import { ImageGallery, Modal } from "./ImageGallery";
import DefaultModal from "./modal/DefaultModal";
import ReportModal from "./modal/ReportModal";
import { compressImage } from "../utils/imageUtils";

const PostDetail: React.FC = () => {
  const router = useRouter();
  const { id } = router.query;
  const [post, setPost] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [comments, setComments] = useRecoilState(commentsState);
  const user = useRecoilValue(userState);
  const selectedCategory = useRecoilValue(selectedCategoryState);
  const [liked, setLiked] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editedTitle, setEditedTitle] = useState("");
  const [editedContent, setEditedContent] = useState("");
  const [commentCount, setCommentCount] = useState(0);
  const [selectedVoteOption, setSelectedVoteOption] = useState<number | null>(
    null,
  );
  const [editedImages, setEditedImages] = useState<File[]>([]);
  const [existingImages, setExistingImages] = useState<string[]>([]);
  const [isScrapped, setIsScrapped] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [currentVoteImage, setCurrentVoteImage] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showModal, setShowModal] = useState(false);
  const [modalContent, setModalContent] = useState({ title: "", message: "" });
  const [previewImages, setPreviewImages] = useState<string[]>([]);
  const categories = useRecoilValue(categoriesState);

  const [showReportModal, setShowReportModal] = useState(false);
  const [reportType, setReportType] = useState<"post" | "comment" | null>(null);
  const [reportedItemId, setReportedItemId] = useState<string | null>(null);
  const [selectedReasons, setSelectedReasons] = useState<string[]>([]);
  const [customReason, setCustomReason] = useState("");

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
          } as Post;
          setPost(formattedPost);
          setEditedTitle(formattedPost.title);
          setEditedContent(formattedPost.content);
          setCommentCount(formattedPost.comments || 0);
          setEditedImages([]);
          setPreviewImages(formattedPost.imageUrls || []);
          setExistingImages(formattedPost.imageUrls || []);
        } else {
          setPost(null);
        }
        setLoading(false);
      }
    };

    const fetchComments = async () => {
      if (id) {
        const commentsData = await getCommentsForPost(id as string);
        setComments(commentsData);
        setCommentCount(commentsData.length);
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
    checkIfScrapped();
  }, [id, setComments, user]);

  useEffect(() => {
    const incrementViewCount = async () => {
      if (!id) return;

      const viewKey = `post_${id}_viewedAt`;
      const lastViewedAt = localStorage.getItem(viewKey);
      const now = new Date().getTime();

      if (lastViewedAt && now - parseInt(lastViewedAt) < 60000) {
        // 1분 이내에 동일한 사용자가 조회한 경우, 조회수를 증가시키지 않음
        return;
      }

      localStorage.setItem(viewKey, now.toString());

      const docRef = doc(db, "posts", id as string);
      await updateDoc(docRef, {
        views: increment(1),
      });
    };

    if (id) {
      incrementViewCount();
    }
  }, [id]);

  const reportReasons = [
    "부적절한 내용",
    "스팸",
    "혐오 발언",
    "폭력적인 내용",
    "개인정보 노출",
    "저작권 침해",
  ];

  const handleReportClick = (type: "post" | "comment", id: string) => {
    setReportType(type);
    setReportedItemId(id);
    setShowReportModal(true);
  };

  const handleReasonChange = (reason: string) => {
    setSelectedReasons((prev) =>
      prev.includes(reason)
        ? prev.filter((r) => r !== reason)
        : [...prev, reason],
    );
  };

  const handleReportSubmit = async () => {
    if (!user || !reportType || !reportedItemId) return;

    const report: Report = {
      userId: user.uid,
      reason: selectedReasons,
      customReason: customReason.trim() || undefined,
      createdAt: new Date(),
    };

    try {
      if (reportType === "post") {
        await updateDoc(doc(db, "posts", reportedItemId), {
          reportCount: increment(1),
          reports: arrayUnion(report),
        });
      } else {
        await updateDoc(doc(db, "comments", reportedItemId), {
          reportCount: increment(1),
          reports: arrayUnion(report),
        });
      }

      alert("신고가 접수되었습니다.");
      setShowReportModal(false);
      setSelectedReasons([]);
      setCustomReason("");
    } catch (error) {
      console.error("Error submitting report:", error);
      alert("신고 접수 중 오류가 발생했습니다.");
    }
  };

  const handleCommentUpdate = (newCommentCount: number) => {
    setCommentCount(newCommentCount);
    setPost((prevPost: Post) => ({
      ...prevPost,
      comments: newCommentCount,
    }));
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newImages = Array.from(e.target.files);
      if (editedImages.length + newImages.length > 10) {
        alert("최대 10개의 이미지만 첨부할 수 있습니다.");
        return;
      }
      const compressedImages = await Promise.all(newImages.map(compressImage));
      setEditedImages([...editedImages, ...compressedImages]);
      setPreviewImages([
        ...previewImages,
        ...compressedImages.map(URL.createObjectURL),
      ]);
    }
  };

  const handleImageRemove = async (index: number) => {
    if (index < existingImages.length) {
      // 기존 이미지 삭제
      const imageUrl = existingImages[index];
      try {
        await deleteImage(imageUrl);
        setExistingImages(existingImages.filter((_, i) => i !== index));
        setPreviewImages(previewImages.filter((_, i) => i !== index));
      } catch (error) {
        console.error("Error deleting image:", error);
        alert("이미지 삭제 중 오류가 발생했습니다.");
      }
    } else {
      // 새로 추가된 이미지 삭제
      const adjustedIndex = index - existingImages.length;
      setEditedImages(editedImages.filter((_, i) => i !== adjustedIndex));
      setPreviewImages(previewImages.filter((_, i) => i !== index));
    }
  };

  const handleSaveEdit = async () => {
    if (!post || !user) return;

    try {
      // Step 1: 새로 추가된 이미지를 먼저 업로드
      const uploadedImageUrls = await Promise.all(
        editedImages.map((image) =>
          uploadImage(image, user.uid, "post", post.id),
        ),
      );

      // Step 2: 기존 이미지와 새로 업로드된 이미지 URL을 통합
      const updatedImageUrls = [...existingImages, ...uploadedImageUrls];

      // Step 3: 게시글 업데이트 - 이미지 URL이 준비된 후에만 업데이트 수행
      const updatedPost = {
        title: editedTitle,
        content: editedContent,
        categoryId: post.categoryId,
        imageUrls: updatedImageUrls, // 통합된 이미지 URL 배열
        updatedAt: new Date(),
      };

      // Update the post in the database
      await updatePost(post.id, updatedPost);

      // Step 4: 상태 업데이트 및 수정 모드 종료
      setPost({
        ...post,
        ...updatedPost,
      });
      setIsEditing(false);
      setModalContent({
        title: "수정 완료",
        message: "게시글 수정이 완료되었습니다.",
      });
      setShowModal(true);
    } catch (error) {
      console.error("Error updating post:", error);
      alert("게시글 수정 중 오류가 발생했습니다.");
    }
  };

  const checkIfScrapped = async () => {
    if (user && post) {
      const scrapped = await isPostScrapped(user.uid, post.id);
      setIsScrapped(scrapped);
    }
  };

  const handleScrap = async () => {
    if (!user || !post) return;

    try {
      if (isScrapped) {
        await unscrapPost(user.uid, post.id);
        setIsScrapped(false);
      } else {
        await scrapPost(user.uid, post.id);
        setIsScrapped(true);
      }
      // Update post state with new scrap count
      setPost((prevPost) => ({
        ...prevPost,
        scraps: isScrapped
          ? (prevPost.scraps || 1) - 1
          : (prevPost.scraps || 0) + 1,
      }));
    } catch (error) {
      console.error("Error updating scrap:", error);
    }
  };

  const openVoteImageModal = (imageUrl: string) => {
    setCurrentVoteImage(imageUrl);
    setModalOpen(true);
  };

  const handleVote = async (optionIndex: number) => {
    if (!user || selectedVoteOption !== null) return;

    try {
      const postRef = doc(db, "posts", id as string);
      await updateDoc(postRef, {
        [`voteResults.${optionIndex}`]: increment(1),
        voterIds: arrayUnion(user.uid),
      });

      setSelectedVoteOption(optionIndex);
      // Update local post state
      setPost((prevPost: any) => ({
        ...prevPost,
        voteResults: {
          ...prevPost.voteResults,
          [optionIndex]: (prevPost.voteResults?.[optionIndex] || 0) + 1,
        },
        voterIds: [...(prevPost.voterIds || []), user.uid],
      }));
    } catch (error) {
      console.error("Error voting:", error);
    }
  };

  if (loading) {
    return (
      <Layout>
        <Container>
          <CategorySection>
            <CategoryList />
          </CategorySection>

          <LoadingMessage>로딩 중...</LoadingMessage>
        </Container>
      </Layout>
    );
  }

  if (!post) {
    return (
      <Layout>
        <ErrorMessage>게시글을 찾을 수 없습니다.</ErrorMessage>
      </Layout>
    );
  }

  const handleDelete = async () => {
    if (!window.confirm("정말 삭제하시겠습니까?")) return;

    try {
      if (!user || !post) return;
      await deletePost(post.id, user.uid);
      router.push(`/community/${selectedCategory}`);
    } catch (e) {
      console.error("Error deleting post: ", e);
      alert("게시글 삭제 중 오류가 발생했습니다.");
    }
  };

  const handleEdit = () => {
    setIsEditing(true);
    setEditedTitle(post?.title || "");
    setEditedContent(post?.content || "");
    setEditedImages([]);
    setPreviewImages(post?.imageUrls || []);
    setExistingImages(post?.imageUrls || []);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
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
                  <Label htmlFor="title">제목</Label>
                  <Input
                    type="text"
                    id="title"
                    value={editedTitle}
                    onChange={(e) => setEditedTitle(e.target.value)}
                    required
                  />
                  <Label htmlFor="category">카테고리</Label>
                  <Select
                    id="category"
                    value={post.categoryId}
                    onChange={(e) =>
                      setPost({ ...post, categoryId: e.target.value })
                    }
                    required
                  >
                    {categories.map((cat: Category) => (
                      <optgroup key={cat.id} label={cat.name}>
                        {cat.subcategories?.map((subcat: Category) => (
                          <option key={subcat.id} value={subcat.id}>
                            {subcat.name}
                          </option>
                        ))}
                      </optgroup>
                    ))}
                  </Select>
                  <Label htmlFor="content">내용</Label>
                  <Textarea
                    id="content"
                    value={editedContent}
                    onChange={(e) => setEditedContent(e.target.value)}
                    required
                  />
                  <Label htmlFor="image">이미지 업로드 (최대 10개)</Label>
                  <ImageUploadButton
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <FaUpload /> 이미지 선택
                  </ImageUploadButton>
                  <HiddenInput
                    ref={fileInputRef}
                    type="file"
                    id="image"
                    accept="image/*"
                    multiple
                    onChange={handleImageUpload}
                  />
                  <ImagePreviewContainer>
                    {previewImages.map((image, index) => (
                      <ImagePreviewWrapper key={index}>
                        <ImagePreview
                          src={image}
                          alt={`Image preview ${index + 1}`}
                        />
                        <RemoveButton
                          type="button"
                          onClick={() => handleImageRemove(index)}
                        >
                          <FaTrash />
                        </RemoveButton>
                      </ImagePreviewWrapper>
                    ))}
                  </ImagePreviewContainer>
                  <ButtonContainer>
                    <SaveButton onClick={handleSaveEdit}>저장</SaveButton>
                    <CancelButton onClick={() => setIsEditing(false)}>
                      취소
                    </CancelButton>
                  </ButtonContainer>
                </EditForm>
              ) : (
                <>
                  <PostTitle>{post.title}</PostTitle>
                  <PostContent>{post.content}</PostContent>
                  {post.imageUrls && post.imageUrls.length > 0 && (
                    <ImageGallery images={post.imageUrls} />
                  )}
                  {post.isVotePost && post.voteOptions && (
                    <VoteSection>
                      <h3>투표</h3>
                      {post.voteOptions.map((option, index) => (
                        <VoteOption
                          key={index}
                          onClick={() => handleVote(index)}
                          disabled={
                            selectedVoteOption !== null ||
                            post.voterIds?.includes(user?.uid)
                          }
                        >
                          {option.imageUrl && (
                            <VoteOptionImage
                              src={option.imageUrl}
                              alt={`Vote option ${index + 1}`}
                              onClick={(e) => {
                                e.stopPropagation();
                                openVoteImageModal(option.imageUrl);
                              }}
                            />
                          )}
                          <VoteOptionText>{option.text}</VoteOptionText>
                          {post.voteResults && (
                            <VoteResult>
                              {post.voteResults[index] || 0} 표 (
                              {(
                                ((post.voteResults[index] || 0) /
                                  (post.voterIds?.length || 1)) *
                                100
                              ).toFixed(1)}
                              %)
                            </VoteResult>
                          )}
                        </VoteOption>
                      ))}
                    </VoteSection>
                  )}
                  <ActionsAndButtonsContainer>
                    <PostActions>
                      <ActionItem onClick={handleLike}>
                        {liked ? "❤️ " : "🤍 "} {post.likes}
                      </ActionItem>
                      <ActionItem>💬 {post.comments}</ActionItem>
                      <ActionItem>👁️ {post.views}</ActionItem>
                      <ActionItem
                        onClick={handleScrap}
                        style={{ color: isScrapped ? "green" : "inherit" }}
                      >
                        {isScrapped ? "★ " : "☆ "} {post.scraps || 0}
                      </ActionItem>
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
                      <ReportButton
                        onClick={() => handleReportClick("post", post.id)}
                      >
                        신고
                      </ReportButton>
                    </ButtonContainer>
                  </ActionsAndButtonsContainer>
                </>
              )}
            </PostContainer>
            <CommentSection
              postId={id as string}
              comments={comments}
              setComments={setComments}
              onCommentUpdate={handleCommentUpdate}
            />
          </ContentSection>
        </ContentWrapper>
      </Container>
      <DefaultModal
        title={modalContent.title}
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        message={modalContent.message}
      />
      <ReportModal
        isOpen={showReportModal}
        onClose={() => setShowReportModal(false)}
        title="신고하기"
        reportReasons={reportReasons}
        selectedReasons={selectedReasons}
        onReasonChange={handleReasonChange}
        customReason={customReason}
        onCustomReasonChange={(value) => setCustomReason(value)}
        onSubmit={handleReportSubmit}
      />
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

  @media (max-width: 768px) {
    padding: 0rem;
  }
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
  margin-bottom: 0.5rem;

  @media (max-width: 768px) {
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
  white-space: pre-line; // 줄바꿈을 적용하는 속성 추가
`;

const PostActions = styled.div`
  display: flex;
  gap: 1rem;
  font-size: 1rem;

  @media (max-width: 768px) {
    display: flex;
    gap: 0.8rem;
    font-size: 0.8rem;
  }
`;

///////////////

const EditForm = styled.form`
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

const Label = styled.label`
  font-size: 1rem;
  margin-bottom: 0.5rem;
`;

const Input = styled.input`
  padding: 0.75rem;
  border: 1px solid #ccc;
  border-radius: 4px;
  font-size: 1rem;
`;

const Select = styled.select`
  padding: 0.75rem;
  border: 1px solid #ccc;
  border-radius: 4px;
  font-size: 1rem;
`;

const Textarea = styled.textarea`
  padding: 0.75rem;
  border: 1px solid #ccc;
  border-radius: 4px;
  font-size: 1rem;
  min-height: 200px;
`;

const ImageUploadButton = styled.button`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background-color: #f0f0f0;
  color: #333;
  padding: 0.5rem;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 1rem;
  font-weight: bold;

  &:hover {
    background-color: #e0e0e0;
  }

  svg {
    margin-right: 0.5rem;
  }
`;

const HiddenInput = styled.input`
  display: none;
`;

const ImagePreviewContainer = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-bottom: 1rem;
`;

const ImagePreviewWrapper = styled.div`
  position: relative;
`;

const ImagePreview = styled.img`
  width: 80px;
  height: 80px;
  object-fit: cover;
  border-radius: 4px;
`;

const RemoveButton = styled.button`
  position: absolute;
  top: 5px;
  right: 5px;
  padding: 5px;
  background-color: rgba(255, 255, 255, 0.7);
  color: #ff4d4d;
  border: none;
  border-radius: 50%;
  cursor: pointer;

  &:hover {
    background-color: rgba(255, 255, 255, 0.9);
  }

  svg {
    font-size: 0.8rem;
  }
`;

const EditButtonContainer = styled.div`
  display: flex;
  margin-left: auto;
  gap: 0.5rem;
`;

const ButtonContainer = styled.div`
  display: flex;
  gap: 0.5rem;

  @media (max-width: 768px) {
    gap: 0.3rem;
  }
`;

const ActionItem = styled.span`
  cursor: pointer;
  &:disabled {
    cursor: not-allowed;
    color: #ccc;
  }
`;

const TextButton = styled.button`
  padding: 0.2rem;
  background: none;
  color: #000;
  border: none;
  cursor: pointer;
  font-size: 1rem;
  font-weight: bold;

  &:hover {
    text-decoration: underline;
  }

  @media (max-width: 768px) {
    font-size: 0.8rem;
  }
`;

const EditButton = styled.button`
  padding: 0.2rem;
  background: none;
  color: var(--edit-text);
  border: none;
  cursor: pointer;
  font-size: 1rem;
  font-weight: bold;

  &:hover {
    text-decoration: underline;
  }

  @media (max-width: 768px) {
    font-size: 0.8rem;
  }
`;

const DeleteButton = styled.button`
  padding: 0.2rem;
  background: none;
  color: var(--delete-text);
  border: none;
  cursor: pointer;
  font-size: 1rem;
  font-weight: bold;

  &:hover {
    text-decoration: underline;
  }

  @media (max-width: 768px) {
    font-size: 0.8rem;
  }
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
  background-color: var(--primary-button);
  color: white;

  &:hover {
    background-color: var(--primary-hover);
  }
`;

const CancelButton = styled(Button)`
  background-color: var(--delete-button);
  color: white;

  &:hover {
    background-color: var(--delete-hover);
  }
`;

const ActionsAndButtonsContainer = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 1rem;

  /* @media (max-width: 768px) {
    flex-direction: column;
    align-items: flex-start;
    gap: 1rem; */
  }
`;

const PostImage = styled.img`
  max-width: 100%;
  height: auto;
  margin: 1rem 0;
  border-radius: 4px;
`;

const VoteSection = styled.div`
  margin: 1rem 0;
  padding: 1rem;
  background-color: #f8f9fa;
  border-radius: 4px;
`;

const VoteOptionImage = styled.img`
  width: 50px;
  height: 50px;
  object-fit: cover;
  margin-right: 10px;
`;

const VoteOptionText = styled.span`
  flex-grow: 1;
`;

const VoteOption = styled.button<{ disabled: boolean }>`
  display: flex;
  align-items: center;
  width: 100%;
  padding: 0.5rem;
  margin: 0.5rem 0;
  background-color: ${(props) => (props.disabled ? "#e9ecef" : "white")};
  border: 1px solid #ced4da;
  border-radius: 4px;
  cursor: ${(props) => (props.disabled ? "default" : "pointer")};
  transition: background-color 0.2s;

  &:hover {
    background-color: ${(props) => (props.disabled ? "#e9ecef" : "#f1f3f5")};
  }
`;

const VoteResult = styled.span`
  font-size: 0.9rem;
  color: #6c757d;
  margin-left: 10px;
`;

const ReportButton = styled(TextButton)`
  color: #ff4d4d;
  &:hover {
    color: #ff0000;
  }
`;

const ReportForm = styled.div`
  display: flex;
  flex-direction: column;
  gap: 10px;

  label {
    display: flex;
    align-items: center;
    gap: 5px;
  }

  textarea {
    width: 100%;
    height: 100px;
    padding: 5px;
    margin-top: 10px;
  }

  button {
    align-self: flex-end;
    padding: 5px 10px;
    background-color: #ff4d4d;
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;

    &:hover {
      background-color: #ff0000;
    }
  }
`;

export default PostDetail;
