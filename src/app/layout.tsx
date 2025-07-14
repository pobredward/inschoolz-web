import type { Metadata, Viewport } from "next";
import { Noto_Sans_KR } from "next/font/google";
import "./globals.css";
import { Providers } from "@/providers/Providers";
import { Header } from "@/components/layout/header";
import Footer from "@/components/layout/footer";
import { Toaster } from "@/components/ui/toaster";

// 한글 폰트 - 잼민이체 스타일에 가까운 귀여운 폰트
const notoSansKR = Noto_Sans_KR({
  subsets: ["latin"],
  weight: ["300", "400", "500", "700"],
  variable: "--font-noto-sans-kr",
});

export const metadata: Metadata = {
  title: {
    template: "%s | 인스쿨즈",
    default: "인스쿨즈 - 학교 커뮤니티 플랫폼",
  },
  description: "학교 생활의 모든 것, 인스쿨즈에서 함께하세요.",
  keywords: ["학교", "커뮤니티", "교육", "학생", "교사", "인스쿨즈"],
  authors: [{ name: "인스쿨즈 팀" }],
  creator: "인스쿨즈",
  publisher: "인스쿨즈",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    type: "website",
    locale: "ko_KR",
    url: "https://inschoolz.com",
    siteName: "Inschoolz",
    title: "Inschoolz - 학생들을 위한 커뮤니티",
    description: "초·중·고 학생과 졸업생을 위한 3계층 커뮤니티 플랫폼",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#ffffff",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" suppressHydrationWarning className={notoSansKR.variable}>
      <body className={`${notoSansKR.className} antialiased min-h-screen bg-background font-sans flex flex-col`}>
        <Providers>
          <Header />
          <main className="flex-1">{children}</main>
          <Footer />
          <Toaster />
        </Providers>
      </body>
    </html>
  );
}
