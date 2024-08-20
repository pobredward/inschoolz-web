import { useEffect } from "react";
import { useSetRecoilState, useRecoilState } from "recoil";
import { postsState, selectedCategoryState } from "../store/atoms";
import { Post } from "../types";
import { fetchFilteredPosts } from "../services/postService";
import { useAuth } from "./useAuth";

export const useCommunityData = (
  initialPosts: Post[],
  initialCategory: string,
) => {
  const [posts, setPosts] = useRecoilState(postsState);
  const [selectedCategory, setSelectedCategory] = useRecoilState(
    selectedCategoryState,
  );
  const { user } = useAuth();

  useEffect(() => {
    setPosts(initialPosts);
    setSelectedCategory(initialCategory);
  }, [initialPosts, initialCategory]);

  useEffect(() => {
    const fetchPosts = async () => {
      if (user && selectedCategory) {
        try {
          const filteredPosts = await fetchFilteredPosts(
            selectedCategory,
            user,
          );
          setPosts(filteredPosts);
        } catch (error) {
          console.error("Error fetching posts:", error);
        }
      }
    };

    fetchPosts();
  }, [selectedCategory, user, setPosts]);

  return { loading: posts.length === 0 };
};
