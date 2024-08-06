import React, { useState } from "react";
import { useRouter } from "next/router";
import styled from "@emotion/styled";
import { useAuth } from "../hooks/useAuth";
import AddressSelector from "../components/AddressSelector";
import SchoolSearch from "../components/SchoolSearch";
import Link from "next/link";
import { sendEmailVerification } from "firebase/auth";

const SignupPage: React.FC = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [name, setName] = useState("");
  const [address1, setAddress1] = useState("");
  const [address2, setAddress2] = useState("");
  const [school, setSchool] = useState<any>(null);
  const [birthYear, setBirthYear] = useState<number>(0);
  const [birthMonth, setBirthMonth] = useState<number>(0);
  const [birthDay, setBirthDay] = useState<number>(0);
  const [error, setError] = useState("");
  const [verificationSent, setVerificationSent] = useState(false);

  const router = useRouter();
  const { signup } = useAuth();

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (
      !email ||
      !password ||
      !confirmPassword ||
      !name ||
      !address1 ||
      !address2 ||
      !school ||
      !birthYear ||
      !birthMonth ||
      !birthDay
    ) {
      setError("모든 필드를 입력해주세요.");
      return;
    }

    if (password !== confirmPassword) {
      setError("비밀번호가 일치하지 않습니다.");
      return;
    }

    try {
      const result = await signup.mutateAsync({
        email,
        password,
        name,
        address1,
        address2,
        schoolId: school.SCHOOL_CODE,
        schoolName: school.KOR_NAME,
        birthYear,
        birthMonth,
        birthDay,
      });

      if (result.user) {
        // 이메일 인증 메일 보내기
        await sendEmailVerification(result.user);
        setVerificationSent(true);
      } else {
        throw new Error("User object is undefined");
      }
    } catch (error) {
      if (error instanceof Error) {
        setError(`회원가입에 실패했습니다: ${error.message}`);
      } else {
        setError("회원가입에 실패했습니다. 다시 시도해주세요.");
      }
    }
  };

  if (verificationSent) {
    return (
      <VerificationMessage>
        <h2>이메일 인증을 완료해주세요</h2>
        <p>
          {email}로 인증 메일을 보냈습니다. 메일함을 확인하고 인증 링크를
          클릭해주세요.
        </p>
        <p>
          인증이 완료되면 <Link href="/login">로그인</Link> 페이지로 이동하여
          로그인해주세요.
        </p>
      </VerificationMessage>
    );
  }

  return (
    <SignupContainer>
      <h1>회원가입</h1>
      <Form onSubmit={handleSignup}>
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
        <Input
          type="password"
          placeholder="비밀번호 확인"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          required
        />
        <Input
          type="text"
          placeholder="이름"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
        <AddressSelector
          address1={address1}
          address2={address2}
          setAddress1={setAddress1}
          setAddress2={setAddress2}
        />
        <SchoolSearch
          address1={address1}
          address2={address2}
          setSchool={setSchool}
        />
        <DateOfBirthContainer>
          <Select
            value={birthYear}
            onChange={(e) => setBirthYear(parseInt(e.target.value))}
            required
          >
            <option value="">년도</option>
            {Array.from({ length: 100 }, (_, i) => (
              <option key={i} value={2023 - i}>
                {2023 - i}
              </option>
            ))}
          </Select>
          <Select
            value={birthMonth}
            onChange={(e) => setBirthMonth(parseInt(e.target.value))}
            required
          >
            <option value="">월</option>
            {Array.from({ length: 12 }, (_, i) => (
              <option key={i + 1} value={i + 1}>
                {i + 1}
              </option>
            ))}
          </Select>
          <Select
            value={birthDay}
            onChange={(e) => setBirthDay(parseInt(e.target.value))}
            required
          >
            <option value="">일</option>
            {Array.from({ length: 31 }, (_, i) => (
              <option key={i + 1} value={i + 1}>
                {i + 1}
              </option>
            ))}
          </Select>
        </DateOfBirthContainer>
        <SignupButton type="submit" disabled={signup.isLoading}>
          {signup.isLoading ? "처리 중..." : "회원가입"}
        </SignupButton>
      </Form>
      {error && <ErrorMessage>{error}</ErrorMessage>}
      <LoginLink>
        이미 계정이 있으신가요? <Link href="/login">로그인</Link>
      </LoginLink>
    </SignupContainer>
  );
};

const SignupContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  max-width: 400px;
  margin: 2rem auto;
  padding: 2rem 1rem;

  h1 {
    font-size: 2rem;
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
  width: 100%;
`;

const SignupButton = styled.button`
  padding: 0.75rem;
  background-color: #0070f3;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 1rem;
  font-weight: bold;
  width: 100%;

  &:hover {
    background-color: #0060df;
  }

  &:disabled {
    background-color: #cccccc;
    cursor: not-allowed;
  }
`;

const DateOfBirthContainer = styled.div`
  display: flex;
  gap: 0.5rem;
`;

const Select = styled.select`
  padding: 0.75rem;
  border: 1px solid #ccc;
  border-radius: 4px;
  font-size: 1rem;
  flex: 1;
`;

const ErrorMessage = styled.p`
  color: red;
  text-align: center;
  margin-top: 1rem;
  font-size: 0.9rem;
`;

const LoginLink = styled.p`
  text-align: center;
  margin-top: 1rem;
  font-size: 0.9rem;

  a {
    color: #0070f3;
    text-decoration: none;

    &:hover {
      text-decoration: underline;
    }
  }
`;

const VerificationMessage = styled.div`
  max-width: 400px;
  margin: 2rem auto;
  padding: 2rem 1rem;
  text-align: center;

  h2 {
    margin-bottom: 1rem;
  }

  p {
    margin-bottom: 0.5rem;
  }

  a {
    color: #0070f3;
    text-decoration: none;

    &:hover {
      text-decoration: underline;
    }
  }
`;

export default SignupPage;
