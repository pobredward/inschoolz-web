import { useMutation, UseMutationResult } from "react-query";
import { createUserWithEmailAndPassword, updateProfile, UserCredential } from "firebase/auth";
import { doc, setDoc, getDoc } from "firebase/firestore";
import { auth, db } from "../lib/firebase";
import { SignupData } from "../types";

export const useSignup = (): UseMutationResult<UserCredential, Error, SignupData> => {
  return useMutation<UserCredential, Error, SignupData>(
    async (data) => {
      const userCredential = await createUserWithEmailAndPassword(auth, data.email, data.password);
      const user = userCredential.user;

      await updateProfile(user, { displayName: data.name });

      const schoolDoc = await getDoc(doc(db, "schools", data.schoolId));
      const schoolName = schoolDoc.exists() ? schoolDoc.data().KOR_NAME : "";

      await setDoc(doc(db, 'users', user.uid), {
        name: data.name,
        email: data.email,
        address1: data.address1,
        address2: data.address2,
        schoolId: data.schoolId,
        schoolName: schoolName,
        birthYear: data.birthYear,
        birthMonth: data.birthMonth,
        birthDay: data.birthDay,
        experience: 0,
        totalExperience: 0,
        level: 1,
      });

      return userCredential;
    },
    {
      onError: (error) => {
        console.error("Signup error:", error);
      }
    }
  );
};
