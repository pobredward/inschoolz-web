import React from "react";
import Head from "next/head";
import styled from "@emotion/styled";
import Navbar from "./Navbar";
import Footer from "./Footer";

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  return (
    <LayoutWrapper>
      <Head>
        <title>인스쿨즈</title>
        <meta
          name="description"
          content="대한민국 학생들을 위한 올인원 페이지"
        />
        <link rel="icon" href="/favicon.ico" />
        {/* Open Graph Tags */}
        <meta property="og:title" content="인스쿨즈" />
        <meta
          property="og:description"
          content="대한민국 학생들을 위한 올인원 페이지"
        />
        <meta property="og:image" content="/path-to-your-image.jpg" />
        <meta property="og:url" content="https://www.inschoolz.com" />
        <meta property="og:type" content="website" />
        {/* Twitter Card Tags */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="인스쿨즈" />
        <meta
          name="twitter:description"
          content="대한민국 학생들을 위한 올인원 페이지"
        />
        <meta name="twitter:image" content="/path-to-your-image.jpg" />
      </Head>
      <Navbar />
      <Main>{children}</Main>
      <Footer />
    </LayoutWrapper>
  );
};

const LayoutWrapper = styled.div`
  min-height: 100vh;
  display: flex;
  flex-direction: column;
`;

const Main = styled.main`
  flex: 1;
  max-width: 1200px;
  width: 100%;
  margin: 0 auto;
  padding: 2rem;
  box-sizing: border-box;
`;

export default Layout;
