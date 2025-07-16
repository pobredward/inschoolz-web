import { MetadataRoute } from 'next';
import { collection, query, where, orderBy, limit, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';

const SITE_URL = 'https://inschoolz.com';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const sitemap: MetadataRoute.Sitemap = [];

  // 기본 정적 페이지들
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: SITE_URL,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1,
    },
    {
      url: `${SITE_URL}/community`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${SITE_URL}/ranking`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.8,
    },
    {
      url: `${SITE_URL}/games`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.7,
    },
    {
      url: `${SITE_URL}/about`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.5,
    },
    {
      url: `${SITE_URL}/terms`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.3,
    },
    {
      url: `${SITE_URL}/privacy`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.3,
    },
    {
      url: `${SITE_URL}/youth-protection`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.3,
    },
    {
      url: `${SITE_URL}/help`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.4,
    },
    {
      url: `${SITE_URL}/support`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.4,
    },
  ];

  sitemap.push(...staticPages);

  // 게시판 페이지들 먼저 추가 (Firebase 연결 없이도 가능)
  const boardCodes = ['free', 'notice', 'qna', 'info'];

  // 전국 게시판
  boardCodes.forEach((code) => {
    sitemap.push({
      url: `${SITE_URL}/community/national/${code}`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.7,
    });
  });

  // Firebase 데이터 가져오기 시도 (타임아웃 설정)
  try {
    // Firebase 초기화 확인
    if (!db) {
      console.warn('Firebase database not initialized, returning static sitemap');
      return sitemap;
    }

    // Promise timeout 설정 (10초)
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error('Firebase query timeout')), 10000);
    });

    // 공개 게시글들 가져오기 (최근 300개로 제한)
    const postsQueryPromise = getDocs(
      query(
        collection(db, 'posts'),
        where('status.isDeleted', '==', false),
        where('status.isHidden', '==', false),
        orderBy('createdAt', 'desc'),
        limit(300)
      )
    );

    // 타임아웃과 쿼리 중 먼저 완료되는 것을 기다림
    const postsSnapshot = await Promise.race([
      postsQueryPromise,
      timeoutPromise
    ]);
    
    let addedPosts = 0;
    
    postsSnapshot.forEach((doc) => {
      try {
        const post = doc.data();
        const postId = doc.id;
        
        // 필수 필드 확인
        if (!post.type || !post.boardCode || !post.createdAt) {
          return;
        }
        
        // 게시글 타입에 따른 URL 생성
        let postUrl = '';
        
        if (post.type === 'national') {
          postUrl = `${SITE_URL}/community/national/${post.boardCode}/${postId}`;
        } else if (post.type === 'regional' && post.regions?.sido && post.regions?.sigungu) {
          const { sido, sigungu } = post.regions;
          const encodedSido = encodeURIComponent(sido);
          const encodedSigungu = encodeURIComponent(sigungu);
          postUrl = `${SITE_URL}/community/region/${encodedSido}/${encodedSigungu}/${post.boardCode}/${postId}`;
        } else if (post.type === 'school' && post.schoolId) {
          postUrl = `${SITE_URL}/community/school/${post.schoolId}/${post.boardCode}/${postId}`;
        }

        if (postUrl) {
          // 익명 게시글은 제외 (SEO에 부적합)
          const isPublic = !post.authorInfo?.isAnonymous;
          
          if (isPublic && addedPosts < 1000) { // 최대 1000개 제한
            const lastModified = post.updatedAt || post.createdAt;
            sitemap.push({
              url: postUrl,
              lastModified: new Date(lastModified),
              changeFrequency: 'weekly',
              priority: 0.6,
            });
            addedPosts++;
          }
        }
      } catch (postError) {
        console.warn('Error processing post for sitemap:', postError);
      }
    });

    console.log(`✅ Generated sitemap with ${sitemap.length} total entries (${addedPosts} posts)`);
    
  } catch (error) {
    console.error('❌ Sitemap generation error:', error);
    // Firebase 오류 발생 시에도 기본 페이지들은 반환
    console.log(`⚠️ Returning ${sitemap.length} static entries due to Firebase error`);
  }

  // sitemap 크기 제한 (Google 권장사항: 최대 50,000개)
  if (sitemap.length > 50000) {
    console.warn(`⚠️ Sitemap size (${sitemap.length}) exceeds 50,000 entries. Truncating...`);
    return sitemap.slice(0, 50000);
  }

  // 최소한의 sitemap 항목 보장
  if (sitemap.length === 0) {
    console.error('❌ Empty sitemap generated, returning default homepage');
    return [
      {
        url: SITE_URL,
        lastModified: new Date(),
        changeFrequency: 'daily',
        priority: 1,
      }
    ];
  }

  console.log(`✅ Final sitemap generated with ${sitemap.length} entries`);
  return sitemap;
} 