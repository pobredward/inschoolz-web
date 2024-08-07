import { useMutation, UseMutationResult } from "react-query";
import { createUserWithEmailAndPassword, updateProfile, User as FirebaseUser } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { auth, db } from "../lib/firebase";
import { SignupData } from "../types";

export const useSignup = (): UseMutationResult<FirebaseUser, Error, SignupData> => {
  return useMutation<FirebaseUser, Error, SignupData>(
    async (data) => {
      const userCredential = await createUserWithEmailAndPassword(auth, data.email, data.password);
      const user = userCredential.user;

      await updateProfile(user, { displayName: data.name });

      await setDoc(doc(db, 'users', user.uid), {
        uid: user.uid,
        userId: data.userId,
        name: data.name,
        email: data.email,
        phoneNumber: data.phoneNumber,
        address1: data.address1,
        address2: data.address2,
        schoolId: data.schoolId,
        schoolName: data.schoolName,
        birthYear: data.birthYear,
        birthMonth: data.birthMonth,
        birthDay: data.birthDay,
        experience: 0,
        totalExperience: 0,
        level: 1,
      });

      return user;
    },
    {
      onError: (error) => {
        console.error("Signup error:", error);
      }
    }
  );
};