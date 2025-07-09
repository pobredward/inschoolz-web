#!/usr/bin/env node
/**
 * Firestore 스키마 마이그레이션 실행 스크립트
 * 
 * 사용법:
 * npm run migrate:schema
 * 
 * 또는 직접 실행:
 * npx tsx src/lib/run-migration.ts
 */

import * as dotenv from 'dotenv';
import path from 'path';

// 환경 변수 로드
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

import { runSchemaMigration, createSampleData } from './schema-migration';

async function main() {
  const args = process.argv.slice(2);
  const command = args[0];

  try {
    switch (command) {
      case 'sample':
        console.log('🎯 Creating sample data...');
        await createSampleData();
        break;
      
      case 'check':
        // 마이그레이션 상태만 확인
        console.log('🔍 Checking migration status...');
        // TODO: SchemaMigration의 checkMigrationStatus 호출
        break;
        
      default:
        console.log('🚀 Running full schema migration...');
        await runSchemaMigration();
    }
    
    console.log('✅ Migration completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

// 스크립트가 직접 실행될 때만 main 함수 호출
if (require.main === module) {
  main();
}

export { main }; 