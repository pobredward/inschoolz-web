// pages/login.tsx
import { useState } from "react";
import { NextPage } from "next";
import { useRouter } from "next/router";
import Link from "next/link";
import styled from "@emotion/styled";
import Layout from "../components/Layout";
import { useSetRecoilState } from "recoil";
import { userState } from "../store/atoms";
import { useMutation } from "react-query";
import {
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
} from "firebase/auth";
import { auth } from "../lib/firebase";
import { FaGoogle } from "react-icons/fa";

const LoginPage: NextPage = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();
  const setUser = useSetRecoilState(userState);

  const loginMutation = useMutation(
    async ({ email, password }: { email: string; password: string }) => {
      const userCredential = await signInWithEmailAndPassword(
        auth,
        email,
        password,
      );
      return userCredential.user;
    },
    {
      onSuccess: (user) => {
        setUser({
          uid: user.uid,
          email: user.email,
          name: user.displayName,
        });
        router.push("/");
      },
      onError: (error: Error) => {
        setError(error.message);
      },
    },
  );

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    loginMutation.mutate({ email, password });
  };

  const handleGoogleLogin = async () => {
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      setUser({
        uid: result.user.uid,
        email: result.user.email,
        name: result.user.displayName,
      });
      router.push("/");
    } catch (error) {
      console.error("Google 로그인 에러:", error);
    }
  };

  return (
    <Layout>
      <LoginContainer>
        <h1>로그인</h1>
        <Form onSubmit={handleEmailLogin}>
          <Input
            type="email"
            placeholder="이메일"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
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
        {error && <ErrorMessage>{error}</ErrorMessage>}
        <SignupLink>
          계정이 없으신가요? <Link href="/signup">회원가입</Link>
        </SignupLink>
      </LoginContainer>
    </Layout>
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
