import { db } from './firebase';
import { collection, getDocs, doc, writeBatch } from 'firebase/firestore';

interface BoardData {
  id: string;
  name: string;
  code: string;
  type: string;
  isActive: boolean;
}

/**
 * 기존 게시판 데이터를 새로운 타입으로 마이그레이션
 * common -> national
 * region -> regional (이미 수정됨)
 */
export const migrateBoardTypes = async () => {
  try {
    console.log('게시판 타입 마이그레이션 시작...');
    
    const boardsRef = collection(db, 'boards');
    const snapshot = await getDocs(boardsRef);
    
    const batch = writeBatch(db);
    let updateCount = 0;
    
    snapshot.docs.forEach((docSnapshot) => {
      const data = docSnapshot.data();
      const docRef = doc(db, 'boards', docSnapshot.id);
      
      // common -> national 변경
      if (data.type === 'common') {
        batch.update(docRef, { type: 'national' });
        updateCount++;
        console.log(`게시판 ${data.name} (${docSnapshot.id}): common -> national`);
      }
      
      // region -> regional 변경 (혹시 남아있다면)
      if (data.type === 'region') {
        batch.update(docRef, { type: 'regional' });
        updateCount++;
        console.log(`게시판 ${data.name} (${docSnapshot.id}): region -> regional`);
      }
    });
    
    if (updateCount > 0) {
      await batch.commit();
      console.log(`✅ ${updateCount}개 게시판 타입 업데이트 완료`);
    } else {
      console.log('✅ 업데이트할 게시판이 없습니다.');
    }
    
    return { success: true, updatedCount: updateCount };
  } catch (error) {
    console.error('❌ 게시판 타입 마이그레이션 실패:', error);
    throw error;
  }
};

/**
 * 게시판 데이터 현황 확인
 */
export const checkBoardTypes = async () => {
  try {
    const boardsRef = collection(db, 'boards');
    const snapshot = await getDocs(boardsRef);
    
    const typeCount: Record<string, number> = {};
    const boards: BoardData[] = [];
    
    snapshot.docs.forEach((docSnapshot) => {
      const data = docSnapshot.data();
      const type = data.type || 'unknown';
      
      typeCount[type] = (typeCount[type] || 0) + 1;
      boards.push({
        id: docSnapshot.id,
        name: data.name,
        code: data.code,
        type: data.type,
        isActive: data.isActive
      });
    });
    
    console.log('📊 게시판 타입 현황:', typeCount);
    console.log('📋 전체 게시판 목록:', boards);
    
    return { typeCount, boards };
  } catch (error) {
    console.error('❌ 게시판 현황 확인 실패:', error);
    throw error;
  }
}; 