// utils/experience.ts
import { doc, getDoc, setDoc, updateDoc, increment } from "firebase/firestore";
import { db, experienceSettingsRef } from "../lib/firebase";

interface ExperienceSettings {
  postCreation: number;
  commentCreation: number;
  reactionGameThreshold: number;
  reactionGameExperience: number;
  flappyBirdThreshold: number;
  flappyBirdExperience: number;
  friendInvitation: number;
  maxDailyGames: number;
}

interface UserGameInfo {
  reactionGamePlays: number;
  flappyBirdPlays: number;
  lastResetDate: string;
}

let cachedSettings: ExperienceSettings | null = null;

export async function getUserGameInfo(userId: string): Promise<UserGameInfo> {
  const userRef = doc(db, "users", userId);
  const userDoc = await getDoc(userRef);
  const userData = userDoc.data();

  if (!userData || !userData.gameInfo) {
    const newGameInfo: UserGameInfo = {
      reactionGamePlays: 0,
      flappyBirdPlays: 0,
      lastResetDate: new Date().toISOString().split("T")[0],
    };
    await updateDoc(userRef, { gameInfo: newGameInfo });
    return newGameInfo;
  }

  return userData.gameInfo as UserGameInfo;
}

export async function updateUserGameInfo(
  userId: string,
  game: "reactionGame" | "flappyBird",
): Promise<boolean> {
  const userRef = doc(db, "users", userId);
  const settings = await getExperienceSettings();
  const gameInfo = await getUserGameInfo(userId);

  const today = new Date().toISOString().split("T")[0];
  if (gameInfo.lastResetDate !== today) {
    gameInfo.reactionGamePlays = 0;
    gameInfo.flappyBirdPlays = 0;
    gameInfo.lastResetDate = today;
  }

  const playField =
    game === "reactionGame" ? "reactionGamePlays" : "flappyBirdPlays";
  if (gameInfo[playField] >= settings.maxDailyGames) {
    return false; // 플레이 횟수 초과
  }

  gameInfo[playField]++;
  await updateDoc(userRef, { gameInfo });
  return true;
}

export async function getExperienceSettings(): Promise<ExperienceSettings> {
  if (cachedSettings) return cachedSettings;

  const settingsDocRef = doc(experienceSettingsRef, "default");
  const settingsDoc = await getDoc(settingsDocRef);

  if (settingsDoc.exists()) {
    cachedSettings = settingsDoc.data() as ExperienceSettings;
    return cachedSettings;
  }

  // 기본 설정
  const defaultSettings: ExperienceSettings = {
    postCreation: 10,
    commentCreation: 5,
    reactionGameThreshold: 500,
    reactionGameExperience: 20,
    flappyBirdThreshold: 50,
    flappyBirdExperience: 20,
    friendInvitation: 15,
    maxDailyGames: 10,
  };

  // 문서가 존재하지 않으면 새로 생성
  await setDoc(settingsDocRef, defaultSettings);
  cachedSettings = defaultSettings;
  return defaultSettings;
}

export async function updateExperienceSettings(
  newSettings: Partial<ExperienceSettings>,
) {
  const settingsDocRef = doc(experienceSettingsRef, "default");
  await updateDoc(settingsDocRef, newSettings);
  cachedSettings = null; // 캐시 무효화
}

export async function updateUserExperience(userId: string, amount: number) {
  const userRef = doc(db, "users", userId);
  const userDoc = await getDoc(userRef);
  const userData = userDoc.data();

  if (!userData) return;

  let { experience, level, totalExperience } = userData;

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
}

export async function handlePostCreation(userId: string) {
  const settings = await getExperienceSettings();
  await updateUserExperience(userId, settings.postCreation);
}

export async function handleCommentCreation(userId: string) {
  const settings = await getExperienceSettings();
  await updateUserExperience(userId, settings.commentCreation);
}

export async function handleGameScore(
  userId: string,
  game: "reactionGame" | "flappyBird",
  score: number,
) {
  const canPlay = await updateUserGameInfo(userId, game);
  if (!canPlay) {
    throw new Error("일일 게임 플레이 횟수를 초과했습니다.");
  }

  const settings = await getExperienceSettings();
  if (game === "reactionGame" && score <= settings.reactionGameThreshold) {
    await updateUserExperience(userId, settings.reactionGameExperience);
  } else if (game === "flappyBird" && score >= settings.flappyBirdThreshold) {
    await updateUserExperience(userId, settings.flappyBirdExperience);
  }
}

export async function handleFriendInvitation(
  inviterId: string,
  inviteeId: string,
) {
  const settings = await getExperienceSettings();
  await updateUserExperience(inviterId, settings.friendInvitation);
  await updateUserExperience(inviteeId, settings.friendInvitation);
}
