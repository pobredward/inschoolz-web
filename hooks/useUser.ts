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
      const userDocRef = doc(db, "users", user.uid);
      const userDocSnap = await getDoc(userDocRef);
      if (userDocSnap.exists()) {
        const userData = userDocSnap.data() as User;
        if (userData.schoolId) {
          const schoolDocRef = doc(db, "schools", userData.schoolId);
          const schoolDocSnap = await getDoc(schoolDocRef);
          if (schoolDocSnap.exists()) {
            userData.schoolName = schoolDocSnap.data().KOR_NAME;
          }
        }
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
