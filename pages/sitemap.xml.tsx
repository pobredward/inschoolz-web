import { GetServerSideProps } from "next";
import { db } from "../lib/firebase";
import { collection, getDocs, query, where } from "firebase/firestore";

const Sitemap = () => {
  return null;
};

export const getServerSideProps: GetServerSideProps = async ({ res }) => {
  const baseUrl = "https://inschoolz.com";

  // Firebase에서 포스트 데이터를 가져옴
  const postsSnapshot = await getDocs(
    query(
      collection(db, "posts"),
      where("categoryId", "in", [
        "national-free",
        "national-hot",
        "national-minor-develop",
        "national-minor-humor",
        "national-minor-esports",
        "national-minor-webtoon",
        "national-minor-movie",
        "national-minor-kpop",
        "national-minor-love",
        "national-minor-sports",
        "national-minor-trip",
        "national-minor-food",
        "national-minor-animal",
        "national-minor-study",
        "national-minor-career",
        "national-minor-language",
        "national-minor-coding",
      ])
    )
  );

  const posts = postsSnapshot.docs.map((doc) => ({
    id: doc.id,
    categoryId: doc.data().categoryId,
    title: doc.data().title,
    content: doc.data().content,
    createdAt: doc.data().createdAt.toDate().toISOString(),
  }));

  const staticPages = ["", "game", "ranking", "community"].map(
    (staticPagePath) => `${baseUrl}/${staticPagePath}`
  );

  const getCategoryName = (categoryId) => {
    const categoryMap = {
      "national-free": "자유 게시판",
      "national-hot": "HOT 게시글",
      "national-minor-develop": "제안사항",
      "national-minor-humor": "유머/밈",
      "national-minor-esports": "모바일/PC게임",
      "national-minor-webtoon": "웹툰/만화",
      "national-minor-movie": "영화/드라마",
      "national-minor-kpop": "아이돌/KPOP",
      "national-minor-love": "연애",
      "national-minor-sports": "운동",
      "national-minor-trip": "여행",
      "national-minor-food": "맛집/요리",
      "national-minor-animal": "반려동물/동물",
      "national-minor-study": "공부/입시",
      "national-minor-career": "진로/취업",
      "national-minor-language": "영어/외국어",
      "national-minor-coding": "코딩/IT",
    };
    return categoryMap[categoryId] || "기타 게시판";
  };

  const dynamicPages = posts.map((post) => ({
    url: `${baseUrl}/community/${post.categoryId}/${post.id}`,
    lastmod: post.createdAt,
    title: `${post.title} - ${getCategoryName(post.categoryId)}`,
    content: post.content.replace(/<[^>]+>/g, "").substring(0, 200), // 태그 제거
  }));

  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
    <urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
            xmlns:news="http://www.google.com/schemas/sitemap-news/0.9"
            xmlns:xhtml="http://www.w3.org/1999/xhtml"
            xmlns:image="http://www.google.com/schemas/sitemap-image/1.1"
            xmlns:video="http://www.google.com/schemas/sitemap-video/1.1">
      ${staticPages
        .map((url) => {
          return `
            <url>
              <loc>${url}</loc>
              <changefreq>daily</changefreq>
              <priority>0.7</priority>
            </url>
          `;
        })
        .join("")}
      ${dynamicPages
        .map(({ url, lastmod, title, content }) => {
          return `
            <url>
              <loc>${url}</loc>
              <lastmod>${lastmod}</lastmod>
              <changefreq>weekly</changefreq>
              <priority>0.9</priority>
              <news:news>
                <news:publication>
                  <news:name>인스쿨즈</news:name>
                  <news:language>ko</news:language>
                </news:publication>
                <news:publication_date>${lastmod}</news:publication_date>
                <news:title>${title}</news:title>
                <news:keywords>${title}</news:keywords>
                <news:description>${content}</news:description>
              </news:news>
              <xhtml:link rel="alternate" hreflang="ko" href="${url}"/>
              <xhtml:link rel="alternate" hreflang="x-default" href="${url}"/>
            </url>
          `;
        })
        .join("")}
    </urlset>`;

  res.setHeader("Content-Type", "text/xml");
  res.write(sitemap);
  res.end();

  return {
    props: {},
  };
};

export default Sitemap;
