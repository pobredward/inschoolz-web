import { useMutation, UseMutationResult } from "react-query";
import { signOut } from "firebase/auth";
import { auth } from "../lib/firebase";
import { useRecoilState } from "recoil";
import { userState } from "../store/atoms";

export const useLogout = (): UseMutationResult<void, Error> => {
  const [, setUser] = useRecoilState(userState);

  return useMutation<void, Error>(
    async () => {
      await signOut(auth);
    },
    {
      onSuccess: () => {
        setUser(null);
      },
      onError: (error) => {
        console.error("Logout error:", error);
      }
    }
  );
};
