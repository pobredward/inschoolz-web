import "../styles/globals.css";
import type { AppProps } from "next/app";
import { RecoilRoot } from "recoil";
import { QueryClient, QueryClientProvider } from "react-query";
import { useEffect } from "react";
import { auth } from "../lib/firebase";
import { useSetRecoilState } from "recoil";
import { userState } from "../store/atoms";
import { Hydrate } from "react-query/hydration";

const queryClient = new QueryClient();

function MyApp({ Component, pageProps }: AppProps) {
  return (
    <QueryClientProvider client={queryClient}>
      <RecoilRoot>
        <AuthStateManager>
          <Hydrate state={pageProps.dehydratedState}>
            <Component {...pageProps} />
          </Hydrate>
        </AuthStateManager>
      </RecoilRoot>
    </QueryClientProvider>
  );
}

function AuthStateManager({ children }: { children: React.ReactNode }) {
  const setUser = useSetRecoilState(userState);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        setUser({
          uid: user.uid,
          email: user.email,
          name: user.displayName,
        });
      } else {
        setUser(null);
      }
    });

    return () => unsubscribe();
  }, [setUser]);

  return <>{children}</>;
}

export default MyApp;
