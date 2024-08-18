import React, { useState, useEffect, useRef, useContext } from "react";
import styled from "@emotion/styled";
import Layout from "../components/Layout";
import { useRecoilValue } from "recoil";
import { useRouter } from "next/router";
import { createPost, updatePost } from "../services/postService";
import { uploadImage } from "../services/imageService";
import CategoryList from "./CategoryList";
import {
  userState,
  User,
  selectedCategoryState,
  categoriesState,
} from "../store/atoms";
import { setDoc, doc, collection } from "firebase/firestore";
import { compressImage } from "../utils/imageUtils";
import { FaUpload, FaTrash } from "react-icons/fa";
import { db } from "../lib/firebase";
import DefaultModal from "./modal/DefaultModal";
import {
  updateUserExperience,
  getExperienceSettings,
} from "../utils/experience";
import ExperienceModal from "../components/modal/ExperienceModal";
import { FaInfoCircle } from "react-icons/fa";

const CreatePostPage: React.FC = () => {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [category, setCategory] = useState("");
  const user = useRecoilValue<User | null>(userState);
  const categories = useRecoilValue(categoriesState);
  const router = useRouter();
  const { category: categoryParam } = router.query;
  const [images, setImages] = useState<File[]>([]);
  const [isVotePost, setIsVotePost] = useState(false);
  const [voteOptions, setVoteOptions] = useState<
    Array<{ text: string; image: File | null }>
  >([
    { text: "", image: null },
    { text: "", image: null },
  ]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [modalContent, setModalContent] = useState({ title: "", message: "" });
  const [showModal, setShowModal] = useState(false);
  const [newPostId, setNewPostId] = useState<string | null>(null);
  const [showExpModal, setShowExpModal] = useState(false);
  const [expGained, setExpGained] = useState(0);
  const [newLevel, setNewLevel] = useState<number | undefined>(undefined);
  const [isNoticeOpen, setIsNoticeOpen] = useState(false);

  const handleNoticeOpen = () => {
    setIsNoticeOpen(true);
  };

  const handleNoticeClose = () => {
    setIsNoticeOpen(false);
  };

  const noticeContent = `1. 게시글은 주제와 맞는 카테고리에 작성해 주세요.
  2. 다른 사람을 존중하고 배려하는 내용을 작성해 주세요.
  3. 허위 정보, 비방, 욕설 등의 게시물은 작성하지 말아 주세요.
  4. 저작권에 위반되는 자료를 게시하지 말아 주세요.`;

  useEffect(() => {
    if (categoryParam) {
      setCategory(categoryParam as string);
    }
    if (!user) {
      router.push("/login");
    }
  }, [categoryParam, user, router]);

  const filteredCategories = categories.map((cat) => ({
    ...cat,
    subcategories: cat.subcategories.filter(
      (subcat) => subcat.id !== "national-hot",
    ), // "HOT 게시글" 필터링
  }));

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newImages = Array.from(e.target.files);
      if (images.length + newImages.length > 10) {
        alert("최대 10개의 이미지만 첨부할 수 있습니다.");
        return;
      }
      const compressedImages = await Promise.all(newImages.map(compressImage));
      setImages([...images, ...compressedImages]);
    }
  };

  const handleImageRemove = (index: number) => {
    setImages(images.filter((_, i) => i !== index));
  };

  const handleVoteOptionChange = (index: number, value: string) => {
    const newOptions = [...voteOptions];
    newOptions[index].text = value;
    setVoteOptions(newOptions);
  };

  const handleVoteImageChange = async (
    index: number,
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const compressedFile = await compressImage(file);
      const newOptions = [...voteOptions];
      newOptions[index].image = compressedFile;
      setVoteOptions(newOptions);
    }
  };

  const handleVoteImageRemove = (index: number) => {
    const newOptions = [...voteOptions];
    newOptions[index].image = null;
    setVoteOptions(newOptions);
  };

  const handleAddVoteOption = () => {
    if (voteOptions.length < 8) {
      setVoteOptions([...voteOptions, { text: "", image: null }]);
    } else {
      alert("최대 8개의 투표 옵션만 추가할 수 있습니다.");
    }
  };

  const handleRemoveVoteOption = (index: number) => {
    if (voteOptions.length > 2) {
      setVoteOptions(voteOptions.filter((_, i) => i !== index));
    } else {
      alert("최소 2개의 투표 옵션이 필요합니다.");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      alert("로그인이 필요합니다.");
      router.push("/login");
      return;
    }

    try {
      // 게시글 먼저 생성하여 postId를 받음
      const newPost = {
        title,
        content,
        author: user.userId,
        authorId: user.uid,
        categoryId: category,
        address1: user.address1 || "",
        address2: user.address2 || "",
        schoolId: user.schoolId || "",
        schoolName: user.schoolName || "",
        imageUrls: [], // 이미지를 나중에 추가할 것이므로 빈 배열
        isVotePost,
        voteOptions: null, // 이 부분도 나중에 추가
      };

      const createdPostId = await createPost(newPost);

      // 생성된 postId로 이미지 업로드
      const uploadedImageUrls = await Promise.all(
        images.map((image) =>
          uploadImage(image, user.uid, "post", createdPostId),
        ),
      );

      let uploadedVoteOptions;
      if (isVotePost) {
        uploadedVoteOptions = await Promise.all(
          voteOptions.map(async (option) => {
            if (option.image) {
              const imageUrl = await uploadImage(
                option.image,
                user.uid,
                "vote",
                createdPostId,
              );
              return { text: option.text, imageUrl };
            }
            return { text: option.text };
          }),
        );
      }

      // 업로드된 이미지 URL을 게시글에 업데이트
      await updatePost(createdPostId, {
        imageUrls: uploadedImageUrls,
        voteOptions: isVotePost
          ? uploadedVoteOptions.filter(
              (option: { text: string }) => option.text.trim() !== "",
            )
          : null,
      });

      setNewPostId(createdPostId);

      // 경험치 업데이트
      const settings = await getExperienceSettings();
      const result = await updateUserExperience(
        user.uid,
        settings.postCreation,
        "게시글을 작성했습니다",
      );
      setExpGained(result.expGained);
      if (result.levelUp) {
        setNewLevel(result.newLevel);
      }
      setShowExpModal(true);
    } catch (e) {
      console.error("Error adding document: ", e);
      alert(`게시글 작성에 실패했습니다: ${e.message}`);
    }
  };

  const handleModalClose = () => {
    setShowExpModal(false);
    if (newPostId) {
      router.push(`/posts/${newPostId}`);
    }
  };

  return (
    <Layout>
      <Container>
        <CategorySection>
          <CategoryList />
        </CategorySection>
        <ContentSection>
          <Header>
            <h1>게시글 작성</h1>
            <InfoContainer onClick={handleNoticeOpen}>
              <ResponsiveIcon />
              <InfoText>작성 원칙</InfoText>
            </InfoContainer>
          </Header>
          <Form onSubmit={handleSubmit}>
            {/* <Label htmlFor="category">카테고리</Label> */}
            <Select
              id="category"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              required
            >
              <option value="">카테고리 선택</option>
              {filteredCategories.map((cat) => (
                <optgroup key={cat.id} label={cat.name}>
                  {cat.subcategories?.map((subcat) => (
                    <option key={subcat.id} value={subcat.id}>
                      {subcat.name}
                    </option>
                  ))}
                </optgroup>
              ))}
            </Select>
            {/* <Label htmlFor="title">제목</Label> */}
            <Input
              type="text"
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="제목을 입력하세요"
              required
            />
            {/* <Label htmlFor="content">내용</Label> */}
            <Textarea
              id="content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="내용을 입력하세요"
              required
            />
            <Label htmlFor="image">이미지 업로드 (최대 10개)</Label>
            <ImageUploadButton
              type="button"
              onClick={(e) => {
                e.preventDefault();
                fileInputRef.current?.click();
              }}
            >
              <FaUpload /> 이미지 선택
            </ImageUploadButton>
            <HiddenInput
              ref={fileInputRef}
              type="file"
              id="image"
              accept="image/*"
              multiple
              onChange={handleImageChange}
            />
            <ImagePreviewContainer>
              {images.map((image, index) => (
                <ImagePreviewWrapper key={index}>
                  <ImagePreview
                    src={URL.createObjectURL(image)}
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
            <Label>
              <input
                type="checkbox"
                checked={isVotePost}
                onChange={(e) => setIsVotePost(e.target.checked)}
              />
              투표 게시글로 작성
            </Label>
            {isVotePost && (
              <VoteOptionsContainer>
                {voteOptions.map((option, index) => (
                  <VoteOptionContainer key={index}>
                    <VoteInput
                      type="text"
                      value={option.text}
                      onChange={(e) =>
                        handleVoteOptionChange(index, e.target.value)
                      }
                      placeholder={`옵션 ${index + 1}`}
                    />
                    <VoteImageUploadButton
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        document.getElementById(`vote-image-${index}`)?.click();
                      }}
                    >
                      <FaUpload />
                    </VoteImageUploadButton>
                    <HiddenInput
                      id={`vote-image-${index}`}
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleVoteImageChange(index, e)}
                    />
                    {option.image && (
                      <ImagePreviewWrapper>
                        <ImagePreview
                          src={URL.createObjectURL(option.image)}
                          alt={`Vote option ${index + 1}`}
                        />
                        <RemoveButton
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            handleVoteImageRemove(index);
                          }}
                        >
                          <FaTrash />
                        </RemoveButton>
                      </ImagePreviewWrapper>
                    )}
                    <RemoveButton
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        handleRemoveVoteOption(index);
                      }}
                    >
                      <FaTrash />
                    </RemoveButton>
                  </VoteOptionContainer>
                ))}
                {voteOptions.length < 8 && (
                  <Button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      handleAddVoteOption();
                    }}
                  >
                    투표 옵션 추가
                  </Button>
                )}
              </VoteOptionsContainer>
            )}
            <ButtonContainer>
              <SubmitButton type="submit">게시</SubmitButton>
              <BackButton type="button" onClick={() => router.back()}>
                목록
              </BackButton>
            </ButtonContainer>
          </Form>
        </ContentSection>
      </Container>
      <DefaultModal
        isOpen={isNoticeOpen}
        onClose={handleNoticeClose}
        title="작성 원칙"
        message={noticeContent}
      />
      <ExperienceModal
        isOpen={showExpModal}
        onClose={handleModalClose}
        expGained={expGained}
        newLevel={newLevel}
      />
    </Layout>
  );
};

const Container = styled.div`
  display: flex;
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

const ContentSection = styled.div`
  flex: 1;
  padding: 1rem;
  overflow-y: auto;
`;

const Header = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1rem;

  h1 {
    @media (max-width: 768px) {
      font-size: 1.6rem;
    }
  }
`;

const InfoContainer = styled.div`
  display: flex;
  align-items: center;
  cursor: pointer;
  color: #999;

  &:hover {
    color: #666;
  }
`;

const ResponsiveIcon = styled(FaInfoCircle)`
  font-size: 18px;

  @media (max-width: 768px) {
    font-size: 14px;
  }

  @media (max-width: 360px) {
    font-size: 12px;
  }
`;

const InfoText = styled.span`
  margin-left: 0.4rem;
  font-size: 1rem;
  font-weight: bold;
  color: #999;

  @media (max-width: 768px) {
    font-size: 0.9rem;
  }
`;

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

const Label = styled.label`
  font-size: 1rem;
  margin-bottom: 0.5rem;
`;

const Select = styled.select`
  padding: 0.75rem;
  text-align: start;
  border-radius: 4px;
  font-size: 1rem;
`;

const Input = styled.input`
  padding: 0.5rem; // 기존 크기보다 작게 조정
  border: 1px solid #ccc;
  border-radius: 4px;
  font-size: 0.8rem; // 폰트 크기 조정
  flex: 1; // flex를 사용하여 공간을 활용
  min-height: 30px;
`;

const Textarea = styled.textarea`
  padding: 0.5rem;
  border: 1px solid #ccc;
  border-radius: 4px;
  font-size: 0.8rem;
  min-height: 200px;
`;

const ButtonContainer = styled.div`
  display: flex;
  gap: 0.5rem;
`;

const Button = styled.button`
  padding: 0.75rem 1rem;
  background-color: var(--primary-button);
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 1rem;
  font-weight: bold;
  max-width: 200px;

  &:hover {
    background-color: var(--primary-hover);
  }
`;

const SubmitButton = styled(Button)``;

const BackButton = styled(Button)`
  background-color: var(--gray-button);

  &:hover {
    background-color: var(--gray-hover);
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

const VoteOptionsContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

const VoteOptionContainer = styled.div`
  display: flex;
  /* align-items: center; */
  gap: 10px;

  /* @media (max-width: 768px) {
    flex-direction: column;
    align-items: flex-start;
  } */
`;

const VoteInput = styled.input`
  width: 300px;
  height: 60px;
  padding: 10px; // 기존 크기보다 작게 조정
  border: 1px solid #ccc;
  border-radius: 4px;
  font-size: 0.875rem; // 폰트 크기 조정

  @media (max-width: 768px) {
    width: 160px;
    height: 40px;
  }
`;

const ImagePreview = styled.img`
  width: 80px;
  height: 80px;
  object-fit: cover;
  border-radius: 4px;

  @media (max-width: 768px) {
    width: 60px;
    height: 60px;
  }
`;

const ImageUploadButton = styled(Button)`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background-color: #f0f0f0;
  color: #333;
  padding: 0.5rem;

  &:hover {
    background-color: #e0e0e0;
  }

  svg {
    margin-right: 0.5rem;
  }

  @media (max-width: 768px) {
    width: auto;
    padding: 0.4rem;
  }
`;

const VoteImageUploadButton = styled(Button)`
  width: 60px;
  background-color: #f0f0f0;
  color: #333;
  padding: 0.5rem;

  &:hover {
    background-color: #e0e0e0;
  }

  svg {
    margin-right: 0.5rem;
  }

  @media (max-width: 768px) {
    width: auto;
    padding: 0.4rem;
  }
`;

const RemoveButton = styled(Button)`
  position: absolute;
  top: 5px;
  right: 5px;
  padding: 5px;
  background-color: rgba(255, 255, 255, 0.7);
  color: #ff4d4d;

  &:hover {
    background-color: rgba(255, 255, 255, 0.9);
  }

  svg {
    font-size: 0.8rem;
  }

  @media (max-width: 768px) {
    padding: 4px;
  }
`;

export default CreatePostPage;
