import { MetadataRoute } from 'next';
import { collection, query, where, orderBy, limit, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';

const SITE_URL = 'https://inschoolz.com';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const sitemap: MetadataRoute.Sitemap = [];

  // 기본 정적 페이지들
  const staticPages = [
    {
      url: SITE_URL,
      lastModified: new Date(),
      changeFrequency: 'daily' as const,
      priority: 1,
    },
    {
      url: `${SITE_URL}/community`,
      lastModified: new Date(),
      changeFrequency: 'daily' as const,
      priority: 0.9,
    },
    {
      url: `${SITE_URL}/community?tab=national`,
      lastModified: new Date(),
      changeFrequency: 'daily' as const,
      priority: 0.8,
    },
    {
      url: `${SITE_URL}/community?tab=school`,
      lastModified: new Date(),
      changeFrequency: 'daily' as const,
      priority: 0.8,
    },
    {
      url: `${SITE_URL}/community?tab=regional`,
      lastModified: new Date(),
      changeFrequency: 'daily' as const,
      priority: 0.8,
    },
    {
      url: `${SITE_URL}/about`,
      lastModified: new Date(),
      changeFrequency: 'monthly' as const,
      priority: 0.5,
    },
    {
      url: `${SITE_URL}/terms`,
      lastModified: new Date(),
      changeFrequency: 'monthly' as const,
      priority: 0.3,
    },
    {
      url: `${SITE_URL}/privacy`,
      lastModified: new Date(),
      changeFrequency: 'monthly' as const,
      priority: 0.3,
    },
    {
      url: `${SITE_URL}/youth-protection`,
      lastModified: new Date(),
      changeFrequency: 'monthly' as const,
      priority: 0.3,
    },
    {
      url: `${SITE_URL}/help`,
      lastModified: new Date(),
      changeFrequency: 'monthly' as const,
      priority: 0.4,
    },
    {
      url: `${SITE_URL}/support`,
      lastModified: new Date(),
      changeFrequency: 'monthly' as const,
      priority: 0.4,
    },
  ];

  sitemap.push(...staticPages);

  try {
    // 공개 게시글들 가져오기 (최근 1000개)
    const postsQuery = query(
      collection(db, 'posts'),
      where('status.isDeleted', '==', false),
      where('status.isHidden', '==', false),
      orderBy('createdAt', 'desc'),
      limit(1000)
    );

    const postsSnapshot = await getDocs(postsQuery);
    
    postsSnapshot.forEach((doc) => {
      const post = doc.data();
      const postId = doc.id;
      
      // 게시글 타입에 따른 URL 생성
      let postUrl = '';
      
      if (post.type === 'national') {
        postUrl = `${SITE_URL}/community/national/${post.boardCode}/${postId}`;
      } else if (post.type === 'regional' && post.regions) {
        const { sido, sigungu } = post.regions;
        postUrl = `${SITE_URL}/community/region/${encodeURIComponent(sido)}/${encodeURIComponent(sigungu)}/${post.boardCode}/${postId}`;
      } else if (post.type === 'school' && post.schoolId) {
        postUrl = `${SITE_URL}/community/school/${post.schoolId}/${post.boardCode}/${postId}`;
      }

      if (postUrl) {
        // 익명 게시글이나 비공개 게시판은 제외
        const isPublic = !post.authorInfo?.isAnonymous;
        
        if (isPublic) {
          sitemap.push({
            url: postUrl,
            lastModified: new Date(post.updatedAt || post.createdAt),
            changeFrequency: 'weekly' as const,
            priority: 0.6,
          });
        }
      }
    });

    console.log(`Generated sitemap with ${sitemap.length} entries`);
    
  } catch (error) {
    console.error('Sitemap generation error:', error);
    // 오류 발생 시 기본 페이지들만 반환
  }

  return sitemap;
} 