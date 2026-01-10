/**
 * スキーマとテストDDLの同期チェックスクリプト
 *
 * 使い方:
 *   cd packages/backend
 *   npx tsx src/test/generateDDL.ts
 *
 * このスクリプトは schema.ts のテーブル定義と helpers.ts の DDL が
 * 同期しているかを検証します。
 */

import { getTableConfig } from "drizzle-orm/sqlite-core";
import * as schema from "../infra/drizzle/schema";
import Database from "better-sqlite3";

// スキーマからテーブル名とカラム名を抽出
function extractSchemaInfo() {
  const tables: Record<string, { columns: string[]; tableName: string }> = {};

  // Drizzleのテーブル定義を直接参照
  const tableDefinitions = [
    { key: "users", table: schema.users },
    { key: "calendars", table: schema.calendars },
    { key: "calendarMembers", table: schema.calendarMembers },
    { key: "calendarInvitations", table: schema.calendarInvitations },
    { key: "categories", table: schema.categories },
    { key: "schedules", table: schema.schedules },
    { key: "scheduleSupplements", table: schema.scheduleSupplements },
    { key: "refreshTokens", table: schema.refreshTokens },
    { key: "userProfiles", table: schema.userProfiles },
    { key: "recurrenceRules", table: schema.recurrenceRules },
  ];

  for (const { key, table } of tableDefinitions) {
    const config = getTableConfig(table);
    tables[key] = {
      tableName: config.name,
      columns: config.columns.map((col) => col.name),
    };
  }

  return tables;
}

// helpers.ts の DDL からテーブルとカラムを抽出
function extractDDLInfo(ddl: string) {
  const tables: Record<string, { columns: string[] }> = {};

  // CREATE TABLE文を抽出
  const tableRegex = /CREATE TABLE IF NOT EXISTS (\w+)\s*\(([\s\S]*?)\);/gi;
  let match;

  while ((match = tableRegex.exec(ddl)) !== null) {
    const tableName = match[1];
    const columnDefs = match[2];

    // カラム名を抽出（FOREIGN KEY行を除外）
    const columns: string[] = [];
    const lines = columnDefs.split(",").map((l) => l.trim());

    for (const line of lines) {
      if (line.startsWith("FOREIGN KEY")) continue;
      const colMatch = line.match(/^(\w+)\s+/);
      if (colMatch) {
        columns.push(colMatch[1]);
      }
    }

    tables[tableName] = { columns };
  }

  return tables;
}

// 同期チェック実行
async function checkSync() {
  console.log("🔍 スキーマとDDLの同期チェックを開始...\n");

  const schemaInfo = extractSchemaInfo();

  // helpers.tsのDDLを読み込む（createTestDbを実行してテーブル情報を取得）
  const { createTestDb } = await import("./helpers");
  const db = createTestDb();

  // SQLiteからテーブル情報を取得
  const sqlite = db as unknown as { session: { client: Database.Database } };
  const tablesResult = sqlite.session.client
    .prepare(
      `
    SELECT name FROM sqlite_master
    WHERE type='table' AND name NOT LIKE 'sqlite_%'
    ORDER BY name
  `
    )
    .all() as Array<{ name: string }>;

  const ddlTables: Record<string, { columns: string[] }> = {};

  for (const { name: tableName } of tablesResult) {
    const columnsResult = sqlite.session.client
      .prepare(`PRAGMA table_info(${tableName})`)
      .all() as Array<{ name: string }>;

    ddlTables[tableName] = {
      columns: columnsResult.map((c) => c.name),
    };
  }

  let hasError = false;

  // スキーマのテーブルがDDLに存在するか確認
  for (const [schemaKey, schemaTable] of Object.entries(schemaInfo)) {
    const ddlTable = ddlTables[schemaTable.tableName];

    if (!ddlTable) {
      console.error(`❌ テーブル '${schemaTable.tableName}' (${schemaKey}) がDDLに存在しません`);
      hasError = true;
      continue;
    }

    // カラムの比較
    const schemaColumns = new Set(schemaTable.columns);
    const ddlColumns = new Set(ddlTable.columns);

    for (const col of schemaColumns) {
      if (!ddlColumns.has(col)) {
        console.error(
          `❌ カラム '${col}' がテーブル '${schemaTable.tableName}' のDDLに存在しません`
        );
        hasError = true;
      }
    }

    for (const col of ddlColumns) {
      if (!schemaColumns.has(col)) {
        console.warn(
          `⚠️  カラム '${col}' がテーブル '${schemaTable.tableName}' のスキーマに存在しません`
        );
      }
    }
  }

  // DDLのテーブルがスキーマに存在するか確認
  const schemaTableNames = new Set(Object.values(schemaInfo).map((t) => t.tableName));

  for (const tableName of Object.keys(ddlTables)) {
    if (!schemaTableNames.has(tableName)) {
      console.error(`❌ テーブル '${tableName}' がスキーマに存在しません（削除済み？）`);
      hasError = true;
    }
  }

  // 同期成功時はテーブル一覧を表示
  if (!hasError) {
    console.log("検証されたテーブル:");
    for (const [key, table] of Object.entries(schemaInfo)) {
      console.log(`  - ${table.tableName} (${table.columns.length} columns)`);
    }
  }

  if (hasError) {
    console.error("\n❌ 同期エラーが検出されました。helpers.ts のDDLを更新してください。");
    process.exit(1);
  } else {
    console.log("✅ スキーマとDDLは同期しています。");
  }
}

// メイン実行
checkSync().catch((err) => {
  console.error("エラー:", err);
  process.exit(1);
});
