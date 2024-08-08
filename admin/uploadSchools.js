const axios = require("axios");
const admin = require("firebase-admin");
const serviceAccount = require("../firebaseServiceAccountKey.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

const API_KEY = "722e216b911a442c99db6e6e0731b0a4";
const API_URL = "https://open.neis.go.kr/hub/schoolInfo";

async function fetchSchoolsData(page, pageSize) {
  try {
    const response = await axios.get(API_URL, {
      params: {
        KEY: API_KEY,
        Type: "json",
        pIndex: page,
        pSize: pageSize,
      },
    });
    const schoolList = response.data.schoolInfo[1].row;
    return schoolList.map((school, index) => ({
      SCHOOL_CODE: padNumber((page - 1) * pageSize + index + 1, 5),
      KOR_NAME: school.SCHUL_NM,
      ENG_NAME: school.ENG_SCHUL_NM,
      REGION: school.LCTN_SC_NM,
      ADDRESS: school.ORG_RDNMA,
      HOMEPAGE: school.HMPG_ADRES,
      ORIGINAL_CODE: school.SD_SCHUL_CODE,
    }));
  } catch (error) {
    console.error(`Error fetching schools data (page ${page}):`, error);
    return [];
  }
}

function padNumber(number, length) {
  return String(number).padStart(length, "0");
}

async function uploadSchoolsToFirebase(schools) {
  const batch = db.batch();
  schools.forEach((school) => {
    const schoolRef = db.collection("schools").doc(school.SCHOOL_CODE);
    batch.set(schoolRef, school);
  });
  try {
    await batch.commit();
    console.log(`${schools.length} schools uploaded to Firebase successfully`);
  } catch (error) {
    console.error("Error uploading schools to Firebase:", error);
  }
}

async function createIndex() {
  try {
    const indexFields = [
      { fieldPath: "REGION", mode: "ASCENDING" },
      { fieldPath: "KOR_NAME", mode: "ASCENDING" },
    ];

    await db.collection("schools").createIndex(indexFields);
    console.log("Index creation initiated successfully");
  } catch (error) {
    console.error("Error creating index:", error);
  }
}


function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function main() {
  const batchSize = 200;
  let page = 1;
  let totalSchools = 0;

  while (true) {
    const schools = await fetchSchoolsData(page, batchSize);
    if (schools.length === 0) break;

    await uploadSchoolsToFirebase(schools);
    totalSchools += schools.length;

    console.log(`Processed ${totalSchools} schools so far`);

    await delay(3000); // 3초 대기
    page++;
  }

  console.log(`Total schools processed: ${totalSchools}`);
  await createIndex();
}

main();
