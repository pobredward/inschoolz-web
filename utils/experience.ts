import { doc, getDoc, updateDoc } from "firebase/firestore";
import { db } from "../lib/firebase";

export interface ExperienceSettings {
  postCreation: number;
  commentCreation: number;
  reactionGameThreshold: number;
  reactionGameExperience: number;
  flappyBirdThreshold: number;
  flappyBirdExperience: number;
  friendInvitation: number;
  maxDailyGames: number;
}

export interface ExperienceUpdateResult {
  newExperience: number;
  newLevel: number;
  expGained: number;
  levelUp: boolean;
}

export async function getExperienceSettings(): Promise<ExperienceSettings> {
  const settingsDoc = await getDoc(doc(db, "settings", "experience"));
  if (settingsDoc.exists()) {
    return settingsDoc.data() as ExperienceSettings;
  }
  // 기본값 설정
  return {
    postCreation: 10,
    commentCreation: 5,
    reactionGameThreshold: 500,
    reactionGameExperience: 20,
    flappyBirdThreshold: 50,
    flappyBirdExperience: 20,
    friendInvitation: 15,
    maxDailyGames: 10,
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

  let { experience, level, totalExperience } = userData;

  const oldLevel = level;
  experience += amount;
  totalExperience += amount;

  while (experience >= level * 10) {
    experience -= level * 10;
    level += 1;
  }

  await updateDoc(userRef, {
    experience,
    level,
    totalExperience,
  });

  return {
    newExperience: experience,
    newLevel: level,
    expGained: amount,
    levelUp: level > oldLevel,
  };
}
