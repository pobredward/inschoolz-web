import { useState } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import styled from "@emotion/styled";
import { useSetRecoilState } from "recoil";
import { userState } from "../store/atoms";
import {
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
} from "firebase/auth";
import { auth, db } from "../lib/firebase";
import {
  doc,
  getDoc,
  collection,
  query,
  where,
  getDocs,
} from "firebase/firestore";
import { FaGoogle } from "react-icons/fa";
import { useMutation } from "react-query";

const LoginPage: React.FC = () => {
  const [userId, setUserId] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();
  const setUser = useSetRecoilState(userState);

  const loginMutation = useMutation(
    async ({ userId, password }: { userId: string; password: string }) => {
      const usersRef = collection(db, "users");
      const q = query(usersRef, where("userId", "==", userId));
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        throw new Error("사용자를 찾을 수 없습니다.");
      }

      const userDoc = querySnapshot.docs[0];
      const userData = userDoc.data();

      const userCredential = await signInWithEmailAndPassword(
        auth,
        userData.email,
        password,
      );
      const user = userCredential.user;

      if (!user.emailVerified) {
        throw new Error(
          "이메일 인증이 완료되지 않았습니다. 이메일을 확인해주세요.",
        );
      }

      return {
        uid: user.uid,
        userId: userData.userId,
        name: userData.name,
        email: user.email,
        phoneNumber: userData.phoneNumber,
        address1: userData.address1,
        address2: userData.address2,
        schoolId: userData.schoolId,
        schoolName: userData.schoolName,
        experience: userData.experience,
        level: userData.level,
        totalExperience: userData.totalExperience,
        birthYear: userData.birthYear,
        birthMonth: userData.birthMonth,
        birthDay: userData.birthDay,
      };
    },
    {
      onSuccess: (data) => {
        setUser(data);
        router.push("/");
      },
      onError: (error: Error) => {
        setError(error.message);
      },
    },
  );

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    loginMutation.mutate({ userId, password });
  };

  const handleGoogleLogin = async () => {
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      const userDocRef = doc(db, "users", user.uid);
      const userDoc = await getDoc(userDocRef);

      if (!userDoc.exists()) {
        // 사용자 정보가 없으면 추가 정보 입력 페이지로 리다이렉트
        router.push("/complete-signup");
      } else {
        const userData = userDoc.data();
        setUser({
          uid: user.uid,
          userId: userData.userId,
          name: userData.name,
          email: user.email,
          phoneNumber: userData.phoneNumber,
          address1: userData.address1,
          address2: userData.address2,
          schoolId: userData.schoolId,
          schoolName: userData.schoolName,
          experience: userData.experience,
          level: userData.level,
          totalExperience: userData.totalExperience,
          birthYear: userData.birthYear,
          birthMonth: userData.birthMonth,
          birthDay: userData.birthDay,
        });
        router.push("/");
      }
    } catch (error) {
      console.error("Google 로그인 에러:", error);
    }
  };

  return (
    <LoginContainer>
      <h1>로그인</h1>
      <Form onSubmit={handleLogin}>
        <Input
          type="text"
          placeholder="아이디"
          value={userId}
          onChange={(e) => setUserId(e.target.value)}
          required
        />
        <Input
          type="password"
          placeholder="비밀번호"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <Button type="submit" disabled={loginMutation.isLoading}>
          {loginMutation.isLoading ? "로그인 중..." : "로그인"}
        </Button>
      </Form>
      <Divider>또는</Divider>
      <GoogleButton onClick={handleGoogleLogin}>
        <FaGoogle /> Google로 로그인
      </GoogleButton>
      {loginMutation.isError && <ErrorMessage>{error}</ErrorMessage>}
      <SignupLink>
        계정이 없으신가요? <Link href="/signup">회원가입</Link>
      </SignupLink>
    </LoginContainer>
  );
};

const LoginContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  max-width: 400px;
  margin: 2rem auto;
  padding: 2rem 1rem;

  h1 {
    margin-bottom: 2rem;
  }
`;

const Form = styled.form`
  display: flex;
  flex-direction: column;
  width: 100%;
  gap: 1rem;
`;

const Input = styled.input`
  padding: 0.75rem;
  border: 1px solid #ccc;
  border-radius: 4px;
  font-size: 1rem;
`;

const Button = styled.button`
  padding: 0.75rem;
  background-color: #0070f3;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 1rem;
  font-weight: bold;

  &:hover {
    background-color: #0060df;
  }
`;

const GoogleButton = styled(Button)`
  background-color: #4285f4;
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 0.5rem;
  width: 100%;

  &:hover {
    background-color: #3367d6;
  }
`;

const Divider = styled.div`
  display: flex;
  align-items: center;
  text-align: center;
  width: 100%;
  margin: 1rem 0;

  &::before,
  &::after {
    content: "";
    flex: 1;
    border-bottom: 1px solid #ccc;
  }

  &::before {
    margin-right: 0.5em;
  }

  &::after {
    margin-left: 0.5em;
  }
`;

const ErrorMessage = styled.p`
  color: red;
  text-align: center;
  margin-top: 1rem;
`;

const SignupLink = styled.p`
  text-align: center;
  margin-top: 1rem;

  a {
    color: #0070f3;
    text-decoration: none;

    &:hover {
      text-decoration: underline;
    }
  }
`;

export default LoginPage;
