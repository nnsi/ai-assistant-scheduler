/**
 * Web用 localStorage 実装
 *
 * @ai-scheduler/core の Storage インターフェースを実装する Web 専用のストレージ。
 * プライベートブラウジングモードや容量超過時の例外に対応。
 */
import type { Storage, SyncStorage } from "@ai-scheduler/core/storage";

// メモリフォールバック用ストレージ
const memoryStorage = new Map<string, string>();

// localStorageが利用可能かチェック
const isLocalStorageAvailable = (): boolean => {
  try {
    const testKey = "__storage_test__";
    localStorage.setItem(testKey, testKey);
    localStorage.removeItem(testKey);
    return true;
  } catch {
    return false;
  }
};

const useLocalStorage = isLocalStorageAvailable();

/**
 * localStorage ベースの Storage 実装
 */
export const storage: Storage & SyncStorage = {
  // 非同期API（Storage インターフェース）
  get: async (key) => {
    try {
      return useLocalStorage ? localStorage.getItem(key) : (memoryStorage.get(key) ?? null);
    } catch {
      return memoryStorage.get(key) ?? null;
    }
  },

  set: async (key, value) => {
    try {
      if (useLocalStorage) {
        localStorage.setItem(key, value);
      } else {
        memoryStorage.set(key, value);
      }
    } catch {
      memoryStorage.set(key, value);
    }
  },

  remove: async (key) => {
    try {
      if (useLocalStorage) {
        localStorage.removeItem(key);
      } else {
        memoryStorage.delete(key);
      }
    } catch {
      memoryStorage.delete(key);
    }
  },

  multiGet: async (keys) => {
    const result: Record<string, string | null> = {};
    for (const key of keys) {
      try {
        result[key] = useLocalStorage
          ? localStorage.getItem(key)
          : (memoryStorage.get(key) ?? null);
      } catch {
        result[key] = memoryStorage.get(key) ?? null;
      }
    }
    return result;
  },

  multiSet: async (entries) => {
    for (const [key, value] of Object.entries(entries)) {
      try {
        if (useLocalStorage) {
          localStorage.setItem(key, value);
        } else {
          memoryStorage.set(key, value);
        }
      } catch {
        memoryStorage.set(key, value);
      }
    }
  },

  clear: async () => {
    try {
      if (useLocalStorage) {
        localStorage.clear();
      } else {
        memoryStorage.clear();
      }
    } catch {
      memoryStorage.clear();
    }
  },

  // 同期API（SyncStorage インターフェース）
  getSync: (key) => {
    try {
      return useLocalStorage ? localStorage.getItem(key) : (memoryStorage.get(key) ?? null);
    } catch {
      return memoryStorage.get(key) ?? null;
    }
  },

  setSync: (key, value) => {
    try {
      if (useLocalStorage) {
        localStorage.setItem(key, value);
      } else {
        memoryStorage.set(key, value);
      }
    } catch {
      memoryStorage.set(key, value);
    }
  },

  removeSync: (key) => {
    try {
      if (useLocalStorage) {
        localStorage.removeItem(key);
      } else {
        memoryStorage.delete(key);
      }
    } catch {
      memoryStorage.delete(key);
    }
  },
};
