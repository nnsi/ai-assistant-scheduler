/**
 * better-sqlite3をD1 API互換にするアダプター
 * E2Eテスト用にNode.jsでD1のような動作を実現する
 */
import type Database from "better-sqlite3";

interface D1Result<T = unknown> {
  results: T[];
  success: boolean;
  meta: {
    changes: number;
    last_row_id: number;
  };
}

interface D1PreparedStatement {
  bind(...values: unknown[]): D1PreparedStatement;
  first<T = unknown>(colName?: string): Promise<T | null>;
  run(): Promise<D1Result>;
  all<T = unknown>(): Promise<D1Result<T>>;
  raw<T = unknown[]>(): Promise<T[]>;
}

interface D1Database {
  prepare(query: string): D1PreparedStatement;
  dump(): Promise<ArrayBuffer>;
  batch<T = unknown>(statements: D1PreparedStatement[]): Promise<D1Result<T>[]>;
  exec(query: string): Promise<D1Result>;
}

/**
 * better-sqlite3のDatabaseをD1互換のインターフェースでラップ
 */
export function createD1Adapter(sqlite: Database.Database): D1Database {
  return {
    prepare(query: string): D1PreparedStatement {
      const stmt = sqlite.prepare(query);
      let boundValues: unknown[] = [];

      return {
        bind(...values: unknown[]): D1PreparedStatement {
          boundValues = values;
          return this;
        },

        async first<T = unknown>(colName?: string): Promise<T | null> {
          const row = stmt.get(...boundValues) as Record<string, unknown> | undefined;
          if (!row) return null;
          if (colName) return row[colName] as T;
          return row as T;
        },

        async run(): Promise<D1Result> {
          const result = stmt.run(...boundValues);
          return {
            results: [],
            success: true,
            meta: {
              changes: result.changes,
              last_row_id: Number(result.lastInsertRowid),
            },
          };
        },

        async all<T = unknown>(): Promise<D1Result<T>> {
          const rows = stmt.all(...boundValues) as T[];
          return {
            results: rows,
            success: true,
            meta: {
              changes: 0,
              last_row_id: 0,
            },
          };
        },

        async raw<T = unknown[]>(): Promise<T[]> {
          stmt.raw(true);
          const rows = stmt.all(...boundValues) as T[];
          stmt.raw(false);
          return rows;
        },
      };
    },

    async dump(): Promise<ArrayBuffer> {
      // better-sqlite3のserialize()を使用
      const buffer = sqlite.serialize();
      return (buffer.buffer as ArrayBuffer).slice(
        buffer.byteOffset,
        buffer.byteOffset + buffer.byteLength
      );
    },

    async batch<T = unknown>(statements: D1PreparedStatement[]): Promise<D1Result<T>[]> {
      const results: D1Result<T>[] = [];
      sqlite.transaction(() => {
        for (const stmt of statements) {
          results.push(stmt.run() as unknown as D1Result<T>);
        }
      })();
      return results;
    },

    async exec(query: string): Promise<D1Result> {
      sqlite.exec(query);
      return {
        results: [],
        success: true,
        meta: {
          changes: 0,
          last_row_id: 0,
        },
      };
    },
  };
}
