// functions/src/index.ts
import * as functions from "firebase-functions";
import * as admin from "firebase-admin";

admin.initializeApp();

export const resetDailyGamePlays = functions.pubsub
  .schedule("0 0 * * *")
  .timeZone("Asia/Seoul")
  .onRun(async (context) => {
    const usersRef = admin.firestore().collection("users");
    const snapshot = await usersRef.get();

    const batch = admin.firestore().batch();
    snapshot.docs.forEach((doc) => {
      batch.update(doc.ref, {
        "gameInfo.reactionGamePlays": 0,
        "gameInfo.flappyBirdPlays": 0,
        "gameInfo.lastResetDate": new Date().toISOString().split("T")[0],
      });
    });

    await batch.commit();
    console.log("Daily game plays reset completed");
    return null;
  });
