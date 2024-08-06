import { useEffect } from "react";
import { useRecoilState } from "recoil";
import { selectedCategoryState } from "../../store/atoms";
import { useRouter } from "next/router";
import CommunityPage from "../../components/CommunityPage";

const Community: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useRecoilState(
    selectedCategoryState,
  );
  const router = useRouter();

  useEffect(() => {
    const defaultCategory = "school-free";
    setSelectedCategory(defaultCategory);
    router.push(`/community/${defaultCategory}`);
  }, [setSelectedCategory, router]);

  return <CommunityPage />;
};

export default Community;
