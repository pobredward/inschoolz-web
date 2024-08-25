import type { AppProps } from "next/app";
import { RecoilRoot } from "recoil";
import { QueryClient, QueryClientProvider } from "react-query";
import { Hydrate } from "react-query/hydration";
import { Global, ThemeProvider } from "@emotion/react";
import { globalStyles, theme } from "../styles/globalStyles";
import { useAuthStateManager } from "../hooks/useAuthStateManager";
import Head from "next/head";

const queryClient = new QueryClient();

function MyApp({ Component, pageProps }: AppProps) {
  useAuthStateManager();

  return (
    <QueryClientProvider client={queryClient}>
      <RecoilRoot>
        <ThemeProvider theme={theme}>
          <Global styles={globalStyles} />
          <Head>
            <meta
              name="google-site-verification"
              content="JHJ-RXl4MxuuU2-5nQiRFv-V72VbSiR3ppghw9V9b50"
            />
            <meta
              name="naver-site-verification"
              content="b6dff09f5573caf99de69d373afb755f571e43ed"
            />
            <meta
              name="viewport"
              content="width=device-width, initial-scale=1"
            />
            <link
              rel="apple-touch-icon"
              sizes="180x180"
              href="/apple-touch-icon.png"
            />
            <link
              rel="icon"
              type="image/png"
              sizes="32x32"
              href="/favicon-32x32.png"
            />
            <link
              rel="icon"
              type="image/png"
              sizes="16x16"
              href="/favicon-16x16.png"
            />
            <link rel="manifest" href="/site.webmanifest" />
            <link
              rel="mask-icon"
              href="/safari-pinned-tab.svg"
              color="#5bbad5"
            />
            <meta name="apple-mobile-web-app-title" content="inschoolz" />
            <meta name="application-name" content="inschoolz" />
            <meta name="msapplication-TileColor" content="#da532c" />
            <meta name="theme-color" content="#ffffff" />

            <meta
              name="keywords"
              content="인스쿨즈, inschoolz, 학생 커뮤니티, 학교 커뮤니티"
            />

            <meta property="og:type" content="website" />
            <meta property="og:site_name" content="인스쿨즈" />
            <meta
              property="og:title"
              content="인스쿨즈 - 초중고 재학생 및 졸업생을 위한 올인원 커뮤니티"
            />
            <meta
              property="og:description"
              content="인스쿨즈에서 모든 정보를 공유하고 소통하세요."
            />
            <meta
              property="og:image"
              content="https://www.inschoolz.com/logo_240x240.png"
            />
            <meta property="og:url" content="https://www.inschoolz.com" />

            <meta name="twitter:card" content="summary_large_image" />
          </Head>
          <Hydrate state={pageProps.dehydratedState}>
            <Component {...pageProps} />
          </Hydrate>
        </ThemeProvider>
      </RecoilRoot>
    </QueryClientProvider>
  );
}

export default MyApp;
