import { useQuery } from "react-query";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../lib/firebase";
import { User } from "../store/atoms";
import { useRecoilValue, useSetRecoilState } from "recoil";
import { userState } from "../store/atoms";

export const useUser = () => {
  const user = useRecoilValue(userState);
  const setUser = useSetRecoilState(userState);

  return useQuery<User | null>(
    ["user", user?.uid],
    async () => {
      if (!user?.uid) return null;
      const docRef = doc(db, "users", user.uid);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const userData = docSnap.data() as User;
        setUser(userData);
        return userData;
      }
      return null;
    },
    {
      enabled: !!user?.uid,
      onError: (error) => {
        console.error("Error fetching user data:", error);
      },
    },
  );
};
