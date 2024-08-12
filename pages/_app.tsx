import type { AppProps } from "next/app";
import { RecoilRoot } from "recoil";
import { QueryClient, QueryClientProvider } from "react-query";
import { Hydrate } from "react-query/hydration";
import { Global, ThemeProvider } from "@emotion/react";
import { globalStyles, theme } from "../styles/globalStyles";
import { useAuthStateManager } from "../hooks/useAuthStateManager";

const queryClient = new QueryClient();

function MyApp({ Component, pageProps }: AppProps) {
  useAuthStateManager();

  return (
    <QueryClientProvider client={queryClient}>
      <RecoilRoot>
        <ThemeProvider theme={theme}>
          <Global styles={globalStyles} />
          <Hydrate state={pageProps.dehydratedState}>
            <Component {...pageProps} />
          </Hydrate>
        </ThemeProvider>
      </RecoilRoot>
    </QueryClientProvider>
  );
}

export default MyApp;
