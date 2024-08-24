// components/MinorGallerySearch.tsx

import React, { useState, useEffect } from "react";
import styled from "@emotion/styled";
import { FaStar, FaSearch } from "react-icons/fa";
import { useRecoilValue } from "recoil";
import { userState, categoriesState } from "../store/atoms";
import { toggleFavoriteMinorGallery } from "../services/userService";

interface MinorGallery {
  id: string;
  name: string;
}

interface MinorGallerySearchProps {
  onSelect: (galleryId: string) => void;
}

const MinorGallerySearch: React.FC<MinorGallerySearchProps> = ({
  onSelect,
}) => {
  const user = useRecoilValue(userState);
  const categories = useRecoilValue(categoriesState);
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState<MinorGallery[]>([]);
  const [favoriteGalleries, setFavoriteGalleries] = useState<string[]>([]);

  useEffect(() => {
    if (user) {
      setFavoriteGalleries(user.favoriteGalleries || []);
    }
  }, [user]);

  const allMinorGalleries =
    categories
      .find((cat) => cat.id === "national")
      ?.subcategories?.find((subcat) => subcat.id === "national-minor")
      ?.subcategories || [];

  const handleSearch = () => {
    const results = allMinorGalleries.filter((gallery) =>
      gallery.name.toLowerCase().includes(searchTerm.toLowerCase()),
    );
    setSearchResults(results);
  };

  const handleToggleFavorite = async (galleryId: string) => {
    if (user) {
      await toggleFavoriteMinorGallery(user.uid, galleryId);
      setFavoriteGalleries((prev) =>
        prev.includes(galleryId)
          ? prev.filter((id) => id !== galleryId)
          : [...prev, galleryId],
      );
    }
  };

  return (
    <Container>
      <SearchContainer>
        <SearchInput
          type="text"
          placeholder="마이너 갤러리 검색"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <SearchButton onClick={handleSearch}>
          <FaSearch />
        </SearchButton>
      </SearchContainer>
      <ResultsList>
        {favoriteGalleries.map((galleryId) => {
          const gallery = allMinorGalleries.find((g) => g.id === galleryId);
          if (gallery) {
            return (
              <ResultItem key={gallery.id}>
                <GalleryName onClick={() => onSelect(gallery.id)}>
                  {gallery.name}
                </GalleryName>
                <StarIcon
                  isFavorite={true}
                  onClick={() => handleToggleFavorite(gallery.id)}
                >
                  <FaStar />
                </StarIcon>
              </ResultItem>
            );
          }
          return null;
        })}
        {searchResults.map((gallery) => (
          <ResultItem key={gallery.id}>
            <GalleryName onClick={() => onSelect(gallery.id)}>
              {gallery.name}
            </GalleryName>
            <StarIcon
              isFavorite={favoriteGalleries.includes(gallery.id)}
              onClick={() => handleToggleFavorite(gallery.id)}
            >
              <FaStar />
            </StarIcon>
          </ResultItem>
        ))}
      </ResultsList>
    </Container>
  );
};

const Container = styled.div`
  margin-bottom: 1rem;
`;

const SearchContainer = styled.div`
  display: flex;
  margin-bottom: 0.5rem;
`;

const SearchInput = styled.input`
  flex-grow: 1;
  padding: 0.5rem;
  border: 1px solid #ccc;
  border-radius: 4px 0 0 4px;
  font-size: 0.9rem;
`;

const SearchButton = styled.button`
  padding: 0.5rem;
  background-color: var(--primary-button);
  color: white;
  border: none;
  border-radius: 0 4px 4px 0;
  cursor: pointer;
  font-size: 0.9rem;
`;

const ResultsList = styled.div`
  max-height: 200px;
  overflow-y: auto;
`;

const ResultItem = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.5rem;
  border-bottom: 1px solid #eee;
  font-size: 0.9rem;
`;

const GalleryName = styled.span`
  cursor: pointer;
  flex-grow: 1;
  margin-right: 0.5rem;
  &:hover {
    text-decoration: underline;
  }
`;

const StarIcon = styled.span<{ isFavorite: boolean }>`
  color: ${({ isFavorite }) => (isFavorite ? "gold" : "#ccc")};
  cursor: pointer;
`;

export default MinorGallerySearch;
