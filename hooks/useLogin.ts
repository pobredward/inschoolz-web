import { useMutation, UseMutationResult } from "react-query";
import { signInWithEmailAndPassword, UserCredential } from "firebase/auth";
import { auth } from "../lib/firebase";

interface LoginData {
  email: string;
  password: string;
}

export const useLogin = (): UseMutationResult<UserCredential, Error, LoginData> => {
  return useMutation<UserCredential, Error, LoginData>(
    async (data) => {
      return await signInWithEmailAndPassword(auth, data.email, data.password);
    },
    {
      onError: (error) => {
        console.error("Login error:", error);
      }
    }
  );
};
