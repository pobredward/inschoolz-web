import { NextPage } from "next";
import Head from "next/head";
import styled from "@emotion/styled";
import Layout from "../components/Layout";

const HomePage: NextPage = () => {
  return (
    <Layout>
      <Head>
        <title>인스쿨즈</title>
        <meta name="description" content="인스쿨즈입니다" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <Main>
        <h1>인스쿨즈에 오신 것을 환영합니다</h1>
        <p>대한민국 학생들을 위한 올인원 페이지입니다.</p>
      </Main>
    </Layout>
  );
};

const Main = styled.main`
  padding: 4rem;
  text-align: center;
`;

export default HomePage;
