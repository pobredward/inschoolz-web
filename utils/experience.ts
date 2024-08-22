import { doc, getDoc, updateDoc } from "firebase/firestore";
import { db } from "../lib/firebase";
import { userExperienceState, userLevelState } from "../store/atoms";
import { useSetRecoilState } from "recoil";

export interface ExperienceSettings {
  attendanceCheck: number;
  postCreation: number;
  commentCreation: number;
  reactionGameThreshold: number;
  reactionGameExperience: number;
  flappyBirdThreshold: number;
  flappyBirdExperience: number;
  tileGameThreshold: number;
  tileGameExperience: number;
  friendInvitation: number;
  maxDailyGames: number;
  maxDailyPosts: number;
  maxDailyComments: number;
}

export interface ExperienceUpdateResult {
  newExperience: number;
  newLevel: number;
  expGained: number;
  levelUp: boolean;
  reachedDailyLimit: boolean;
}

export interface CommunityInfo {
  lastResetDate: string;
  postUploads: number;
  commentUploads: number;
}

export async function getExperienceSettings(): Promise<ExperienceSettings> {
  const settingsDoc = await getDoc(doc(db, "settings", "experience"));
  if (settingsDoc.exists()) {
    return settingsDoc.data() as ExperienceSettings;
  }
  // 기본값 설정
  return {
    attendanceCheck: 10,
    postCreation: 5,
    commentCreation: 3,
    reactionGameThreshold: 300,
    reactionGameExperience: 5,
    flappyBirdThreshold: 5,
    flappyBirdExperience: 5,
    tileGameThreshold: 10,
    tileGameExperience: 5,
    friendInvitation: 30,
    maxDailyGames: 5,
    maxDailyPosts: 3,
    maxDailyComments: 5,
  };
}

export async function updateUserExperience(
  userId: string,
  amount: number,
  reason: string,
): Promise<ExperienceUpdateResult> {
  const userRef = doc(db, "users", userId);
  const userDoc = await getDoc(userRef);
  const userData = userDoc.data();

  if (!userData) throw new Error("User data not found");

  const settings = await getExperienceSettings();
  const today = new Date().toISOString().split("T")[0];

  let { experience, level, totalExperience, communityInfo = {} } = userData;

  if (!communityInfo.lastResetDate || communityInfo.lastResetDate !== today) {
    communityInfo = {
      lastResetDate: today,
      postUploads: 0,
      commentUploads: 0,
    };
  }

  let reachedDailyLimit = false;
  let expGained = 0;

  if (reason === "출석체크") {
    expGained = amount;
  } else if (
    reason === "게시글을 작성했습니다" &&
    communityInfo.postUploads < settings.maxDailyPosts
  ) {
    communityInfo.postUploads++;
    expGained = amount;
  } else if (
    (reason === "댓글을 작성했습니다" || reason === "대댓글을 작성했습니다") &&
    communityInfo.commentUploads < settings.maxDailyComments
  ) {
    communityInfo.commentUploads++;
    expGained = amount;
  } else if (reason.includes("게임 성공")) {
    // 미니게임에 대한 처리 추가
    expGained = amount;
  } else {
    reachedDailyLimit = true;
  }

  const oldLevel = level;
  experience += expGained;
  totalExperience += expGained;

  while (experience >= level * 10) {
    experience -= level * 10;
    level += 1;
  }

  await updateDoc(userRef, {
    experience,
    level,
    totalExperience,
    communityInfo,
  });

  console.log("User experience updated:", {
    experience,
    level,
    totalExperience,
    expGained,
    reason,
  });

  return {
    newExperience: experience,
    newLevel: level,
    expGained,
    levelUp: level > oldLevel,
    reachedDailyLimit,
  };
}
