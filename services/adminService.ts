import { db } from "../lib/firebase";
import {
  collection,
  query,
  where,
  getDocs,
  updateDoc,
  doc,
  arrayUnion,
  limit,
  Timestamp,
  getDoc,
} from "firebase/firestore";
import { ReportedContent, Warning, CompletedReport } from "../types";

export async function warnUser(
  userId: string,
  contentId: string,
  contentType: "post" | "comment",
  reasons: string[],
  customReason: string,
) {
  const userRef = doc(db, "users", userId);
  let postId = contentId;
  let contentTitle = "";
  let contentCreatedAt: Timestamp;

  if (contentType === "comment") {
    const commentRef = doc(db, "comments", contentId);
    const commentDoc = await getDoc(commentRef);
    if (commentDoc.exists()) {
      const commentData = commentDoc.data();
      postId = commentData.postId;
      contentTitle =
        commentData.content.substring(0, 50) +
        (commentData.content.length > 50 ? "..." : "");
      contentCreatedAt = commentData.createdAt;
      // Update comment's isWarned field
      await updateDoc(commentRef, { isWarned: true });
    } else {
      console.error("Comment not found:", contentId);
      throw new Error("Comment not found");
    }
  } else {
    const postRef = doc(db, "posts", contentId);
    const postDoc = await getDoc(postRef);
    if (postDoc.exists()) {
      const postData = postDoc.data();
      contentTitle = postData.title;
      contentCreatedAt = postData.createdAt;
      // Update post's isWarned field
      await updateDoc(postRef, { isWarned: true });
    } else {
      console.error("Post not found:", contentId);
      throw new Error("Post not found");
    }
  }

  const warning: Warning = {
    id: Date.now().toString(),
    reason: reasons,
    customReason: customReason,
    date: Timestamp.now(),
    contentId: contentId,
    contentType,
    postId,
    contentTitle,
    contentCreatedAt,
  };

  // 기존 warnings 배열 가져오기
  const userDoc = await getDoc(userRef);
  const userData = userDoc.data();
  const existingWarnings = userData?.warnings || [];

  // 중복 경고 확인
  const isDuplicate = existingWarnings.some(
    (w: Warning) => w.contentId === contentId && w.contentType === contentType,
  );

  if (!isDuplicate) {
    // 중복이 아닌 경우에만 경고 추가
    await updateDoc(userRef, {
      warnings: arrayUnion(warning),
    });

    // 게시글에 대해서만 isWarned 필드를 업데이트합니다.
    const postRef = doc(db, "posts", postId);
    await updateDoc(postRef, {
      isWarned: true,
    });

    console.log("Warning added successfully");
  } else {
    console.log("Duplicate warning, not added");
  }
}

export async function deleteContent(
  contentId: string,
  contentType: "post" | "comment",
) {
  const contentRef = doc(
    db,
    contentType === "post" ? "posts" : "comments",
    contentId,
  );

  try {
    // 먼저 문서가 존재하는지 확인
    const docSnap = await getDoc(contentRef);

    if (docSnap.exists()) {
      // 문서가 존재하면 업데이트
      await updateDoc(contentRef, {
        isFired: true,
        deletedAt: new Date(),
      });
    } else {
      // 문서가 존재하지 않으면 오류 메시지를 콘솔에 기록
      console.error(
        `Document ${contentId} does not exist in ${contentType}s collection.`,
      );
      throw new Error(
        `${contentType === "post" ? "게시글" : "댓글"}을 찾을 수 없습니다.`,
      );
    }
  } catch (error) {
    console.error("Error deleting content:", error);
    throw error;
  }
}

export async function completeReportHandling(content: ReportedContent) {
  const contentRef = doc(
    db,
    content.type === "post" ? "posts" : "comments",
    content.id,
  );
  await updateDoc(contentRef, {
    isReportPending: false,
    completedAt: Timestamp.now(),
  });
}

export async function getReportedContents(): Promise<ReportedContent[]> {
  const postsQuery = query(
    collection(db, "posts"),
    where("reportCount", ">", 0),
    where("isReportPending", "==", true),
    limit(20),
  );
  const commentsQuery = query(
    collection(db, "comments"),
    where("reportCount", ">", 0),
    where("isReportPending", "==", true),
    limit(20),
  );

  const [postsSnapshot, commentsSnapshot] = await Promise.all([
    getDocs(postsQuery),
    getDocs(commentsQuery),
  ]);

  const reportedPosts = postsSnapshot.docs.map((doc) => ({
    id: doc.id,
    type: "post" as const,
    ...doc.data(),
  })) as ReportedContent[];

  const reportedComments = commentsSnapshot.docs.map((doc) => ({
    id: doc.id,
    type: "comment" as const,
    ...doc.data(),
  })) as ReportedContent[];

  return [...reportedPosts, ...reportedComments].sort((a, b) => {
    const aTime =
      a.lastReportedAt instanceof Timestamp ? a.lastReportedAt.toMillis() : 0;
    const bTime =
      b.lastReportedAt instanceof Timestamp ? b.lastReportedAt.toMillis() : 0;
    return bTime - aTime;
  });
}

export async function getCompletedReports(): Promise<CompletedReport[]> {
  const postsQuery = query(
    collection(db, "posts"),
    where("reportCount", ">", 0),
    where("isReportPending", "==", false),
    limit(20),
  );
  const commentsQuery = query(
    collection(db, "comments"),
    where("reportCount", ">", 0),
    where("isReportPending", "==", false),
    limit(20),
  );

  const [postsSnapshot, commentsSnapshot] = await Promise.all([
    getDocs(postsQuery),
    getDocs(commentsQuery),
  ]);

  const completedPosts = postsSnapshot.docs.map(
    (doc) =>
      ({
        id: doc.id,
        type: "post",
        ...doc.data(),
      }) as CompletedReport,
  );

  const completedComments = commentsSnapshot.docs.map(
    (doc) =>
      ({
        id: doc.id,
        type: "comment",
        ...doc.data(),
      }) as CompletedReport,
  );

  return [...completedPosts, ...completedComments].sort((a, b) => {
    const aTime =
      a.lastReportedAt instanceof Timestamp ? a.lastReportedAt.toMillis() : 0;
    const bTime =
      b.lastReportedAt instanceof Timestamp ? b.lastReportedAt.toMillis() : 0;
    return bTime - aTime;
  });
}

export async function reactivateReport(
  contentId: string,
  contentType: "post" | "comment",
) {
  const contentRef = doc(
    db,
    contentType === "post" ? "posts" : "comments",
    contentId,
  );

  try {
    await updateDoc(contentRef, {
      isReportPending: true,
      lastReportedAt: Timestamp.now(),
    });
    console.log(`${contentType} report reactivated successfully`);
  } catch (error) {
    console.error(`Error reactivating ${contentType} report:`, error);
    throw error;
  }
}
