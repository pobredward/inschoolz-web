import { useEffect } from "react";
import { useRecoilState } from "recoil";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "../lib/firebase";
import { userState, User } from "../store/atoms";
import { useSignup } from "./useSignup";
import { useLogin } from "./useLogin";
import { useLogout } from "./useLogout";

export const useAuth = () => {
  const [user, setUser] = useRecoilState(userState);
  const signup = useSignup();
  const login = useLogin();
  const logout = useLogout();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          const userDoc = await getDoc(doc(db, "users", firebaseUser.uid));
          const userData = userDoc.data();
          if (userData) {
            const user: User = {
              uid: firebaseUser.uid,
              userId: userData.userId || "",
              email: firebaseUser.email,
              name: userData.name || firebaseUser.displayName,
              address1: userData.address1 || "",
              address2: userData.address2 || "",
              schoolId: userData.schoolId || "",
              schoolName: userData.schoolName || "",
              experience: userData.experience || 0,
              totalExperience: userData.totalExperience || 0,
              level: userData.level || 1,
              birthYear: userData.birthYear || "",
              birthMonth: userData.birthMonth || "",
              birthDay: userData.birthDay || "",
              phoneNumber: userData.phoneNumber || "",
            };
            setUser(user);
          } else {
            console.error("User data not found in Firestore");
            setUser(null);
          }
        } catch (error) {
          console.error("Error fetching user data:", error);
          setUser(null);
        }
      } else {
        setUser(null);
      }
    });

    return () => unsubscribe();
  }, [setUser]);

  return { user, signup, login, logout };
};
