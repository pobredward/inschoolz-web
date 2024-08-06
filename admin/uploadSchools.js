const axios = require("axios");
const admin = require("firebase-admin");
const serviceAccount = require("../firebaseServiceAccountKey.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();
const FieldValue = admin.firestore.FieldValue;
const API_KEY = "722e216b911a442c99db6e6e0731b0a4";
const API_URL = "https://open.neis.go.kr/hub/schoolInfo";

async function fetchSchoolsData() {
  try {
    const response = await axios.get(API_URL, {
      params: {
        KEY: API_KEY,
        Type: "json",
        pIndex: 1,
        pSize: 10, // 한 번에 가져올 학교 수, 필요에 따라 조정
      },
    });
    const schoolList = response.data.schoolInfo[1].row;
    return schoolList.map((school, index) => ({
      SCHOOL_CODE: padNumber(index + 1, 5), // 5자리 숫자로 패딩
      KOR_NAME: school.SCHUL_NM,
      ENG_NAME: school.ENG_SCHUL_NM,
      REGION: school.LCTN_SC_NM,
      ADDRESS: school.ORG_RDNMA,
      HOMEPAGE: school.HMPG_ADRES,
      ORIGINAL_CODE: school.SD_SCHUL_CODE, // 원래의 학교 코드도 보존
    }));
  } catch (error) {
    console.error("Error fetching schools data:", error);
    return [];
  }
}

function padNumber(number, length) {
  return String(number).padStart(length, "0");
}

async function uploadSchoolsToFirebase(schools) {
  const batch = db.batch();

  // 인덱스 문서 생성 또는 업데이트
  const indexRef = db.collection("schoolIndexes").doc("REGION_KOR_NAME");
  batch.set(indexRef, {}, { merge: true });

  schools.forEach((school) => {
    const schoolRef = db.collection("schools").doc(school.SCHOOL_CODE);
    batch.set(schoolRef, school);

    // 인덱스 업데이트
    batch.update(indexRef, {
      [`${school.REGION}_${school.KOR_NAME}`]: FieldValue.arrayUnion(
        school.SCHOOL_CODE,
      ),
    });
  });

  try {
    await batch.commit();
    console.log(`${schools.length} schools uploaded to Firebase successfully`);
  } catch (error) {
    console.error("Error uploading schools to Firebase:", error);
  }
}

async function main() {
  const schools = await fetchSchoolsData();
  if (schools.length > 0) {
    await uploadSchoolsToFirebase(schools);
  } else {
    console.log("No schools data to upload");
  }
}

main();

// async function fetchSchoolsData() {
//   try {
//     const response = await axios.get(API_URL, {
//       params: {
//         KEY: API_KEY,
//         Type: "json",
//         pIndex: 1,
//         pSize: 10, // 한 번에 가져올 학교 수, 필요에 따라 조정
//       },
//     });
//     const schoolList = response.data.schoolInfo[1].row;
//     return schoolList.map((school, index) => ({
//       SCHOOL_CODE: padNumber(index + 1, 5), // 5자리 숫자로 패딩
//       KOR_NAME: school.SCHUL_NM,
//       ENG_NAME: school.ENG_SCHUL_NM,
//       REGION: school.LCTN_SC_NM,
//       ADDRESS: school.ORG_RDNMA,
//       HOMEPAGE: school.HMPG_ADRES,
//       ORIGINAL_CODE: school.SD_SCHUL_CODE, // 원래의 학교 코드도 보존
//     }));
//   } catch (error) {
//     console.error("Error fetching schools data:", error);
//     return [];
//   }
// }

// function padNumber(number, length) {
//   return String(number).padStart(length, "0");
// }

// async function uploadSchoolsToFirebase(schools) {
//   const batch = db.batch();
//   schools.forEach((school) => {
//     const schoolRef = db.collection("schools").doc(school.SCHOOL_CODE);
//     batch.set(schoolRef, school);
//   });
//   try {
//     await batch.commit();
//     console.log(`${schools.length} schools uploaded to Firebase successfully`);
//   } catch (error) {
//     console.error("Error uploading schools to Firebase:", error);
//   }
// }

// async function createIndex() {
//   try {
//     const indexFields = [
//       { fieldPath: "REGION", mode: "ASCENDING" },
//       { fieldPath: "KOR_NAME", mode: "ASCENDING" },
//     ];

//     await db.collection("schools").createIndex(indexFields);
//     console.log("Index creation initiated successfully");
//   } catch (error) {
//     console.error("Error creating index:", error);
//   }
// }

// async function main() {
//   const schools = await fetchSchoolsData();
//   if (schools.length > 0) {
//     await uploadSchoolsToFirebase(schools);
//     await createIndex();
//   } else {
//     console.log("No schools data to upload");
//   }
// }

// main();
