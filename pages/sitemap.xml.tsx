import { GetServerSideProps } from "next";
import { db } from "../lib/firebase";
import { collection, getDocs } from "firebase/firestore";

const Sitemap = () => {
  return null;
};

export const getServerSideProps: GetServerSideProps = async ({ res }) => {
  const baseUrl = "https://www.inschoolz.com";

  const postsSnapshot = await getDocs(collection(db, "posts"));
  const posts = postsSnapshot.docs.map((doc) => doc.id);

  const staticPages = ["", "about", "contact", "community"].map(
    (staticPagePath) => `${baseUrl}/${staticPagePath}`,
  );

  const dynamicPages = posts.map((postId) => `${baseUrl}/posts/${postId}`);

  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
    <urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
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
        .map((url) => {
          return `
            <url>
              <loc>${url}</loc>
              <changefreq>weekly</changefreq>
              <priority>0.9</priority>
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
