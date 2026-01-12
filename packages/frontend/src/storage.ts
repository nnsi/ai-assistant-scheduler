/**
 * Web用 localStorage 実装
 *
 * @ai-scheduler/core の Storage インターフェースを実装する Web 専用のストレージ。
 */
import type { Storage, SyncStorage } from "@ai-scheduler/core/storage";

/**
 * localStorage ベースの Storage 実装
 */
export const storage: Storage & SyncStorage = {
  // 非同期API（Storage インターフェース）
  get: async (key) => localStorage.getItem(key),

  set: async (key, value) => {
    localStorage.setItem(key, value);
  },

  remove: async (key) => {
    localStorage.removeItem(key);
  },

  multiGet: async (keys) => {
    const result: Record<string, string | null> = {};
    for (const key of keys) {
      result[key] = localStorage.getItem(key);
    }
    return result;
  },

  multiSet: async (entries) => {
    for (const [key, value] of Object.entries(entries)) {
      localStorage.setItem(key, value);
    }
  },

  clear: async () => {
    localStorage.clear();
  },

  // 同期API（SyncStorage インターフェース）
  getSync: (key) => localStorage.getItem(key),

  setSync: (key, value) => {
    localStorage.setItem(key, value);
  },

  removeSync: (key) => {
    localStorage.removeItem(key);
  },
};
