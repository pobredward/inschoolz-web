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
        const userDoc = await getDoc(doc(db, "users", firebaseUser.uid));
        const userData = userDoc.data() as Omit<User, "uid" | "email">;
        setUser({
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          name: userData?.name || firebaseUser.displayName,
          address1: userData?.address1,
          address2: userData?.address2,
          schoolId: userData?.schoolId,
        });
      } else {
        setUser(null);
      }
    });
    return () => unsubscribe();
  }, [setUser]);

  return { user, signup, login, logout };
};
