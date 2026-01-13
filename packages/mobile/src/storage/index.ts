/**
 * React Native用 Storage実装
 *
 * AsyncStorageを使用し、SyncStorageはメモリキャッシュでシミュレート。
 * アプリ起動時にinitialize()でデータをプリロードする必要がある。
 */
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as SecureStore from "expo-secure-store";
import type { Storage, SyncStorage } from "@ai-scheduler/core";

// メモリキャッシュ（SyncStorage用）
const memoryCache = new Map<string, string | null>();

/**
 * プリロードするキーのリスト
 * AuthContext と CalendarContext で使用するキー
 */
const PRELOAD_KEYS = [
  "auth_user",
  "calendar_selected_ids",
  "calendar_default_id",
  "calendar_known_ids",
];

/**
 * ストレージを初期化（アプリ起動時に呼び出す）
 * 必要なキーをメモリにプリロードする
 */
export async function initializeStorage(): Promise<void> {
  try {
    const pairs = await AsyncStorage.multiGet(PRELOAD_KEYS);
    for (const [key, value] of pairs) {
      memoryCache.set(key, value);
    }
  } catch (error) {
    console.error("[Storage] Initialization failed:", error);
  }
}

/**
 * AsyncStorage + メモリキャッシュ実装
 */
export const storage: Storage & SyncStorage = {
  // 非同期メソッド
  async get(key: string): Promise<string | null> {
    try {
      const value = await AsyncStorage.getItem(key);
      memoryCache.set(key, value);
      return value;
    } catch (error) {
      console.error(`[Storage] Failed to get ${key}:`, error);
      return null;
    }
  },

  async set(key: string, value: string): Promise<void> {
    try {
      memoryCache.set(key, value);
      await AsyncStorage.setItem(key, value);
    } catch (error) {
      console.error(`[Storage] Failed to set ${key}:`, error);
    }
  },

  async remove(key: string): Promise<void> {
    try {
      memoryCache.delete(key);
      await AsyncStorage.removeItem(key);
    } catch (error) {
      console.error(`[Storage] Failed to remove ${key}:`, error);
    }
  },

  async multiGet(keys: string[]): Promise<Record<string, string | null>> {
    try {
      const pairs = await AsyncStorage.multiGet(keys);
      const result: Record<string, string | null> = {};
      for (const [key, value] of pairs) {
        result[key] = value;
        memoryCache.set(key, value);
      }
      return result;
    } catch (error) {
      console.error("[Storage] Failed to multiGet:", error);
      const result: Record<string, string | null> = {};
      for (const key of keys) {
        result[key] = null;
      }
      return result;
    }
  },

  async multiSet(entries: Record<string, string>): Promise<void> {
    try {
      const pairs = Object.entries(entries);
      for (const [key, value] of pairs) {
        memoryCache.set(key, value);
      }
      await AsyncStorage.multiSet(pairs);
    } catch (error) {
      console.error("[Storage] Failed to multiSet:", error);
    }
  },

  async clear(): Promise<void> {
    try {
      memoryCache.clear();
      await AsyncStorage.clear();
    } catch (error) {
      console.error("[Storage] Failed to clear:", error);
    }
  },

  // 同期メソッド（メモリキャッシュから取得）
  getSync(key: string): string | null {
    return memoryCache.get(key) ?? null;
  },

  setSync(key: string, value: string): void {
    memoryCache.set(key, value);
    // バックグラウンドで非同期保存
    AsyncStorage.setItem(key, value).catch((error) => {
      console.error(`[Storage] Background save failed for ${key}:`, error);
    });
  },

  removeSync(key: string): void {
    memoryCache.delete(key);
    // バックグラウンドで非同期削除
    AsyncStorage.removeItem(key).catch((error) => {
      console.error(`[Storage] Background remove failed for ${key}:`, error);
    });
  },
};

/**
 * セキュアストレージ（トークン保存用）
 * expo-secure-storeを使用
 */
export const secureStorage = {
  async get(key: string): Promise<string | null> {
    try {
      return await SecureStore.getItemAsync(key);
    } catch (error) {
      console.error(`[SecureStorage] Failed to get ${key}:`, error);
      return null;
    }
  },

  async set(key: string, value: string): Promise<void> {
    try {
      await SecureStore.setItemAsync(key, value);
    } catch (error) {
      console.error(`[SecureStorage] Failed to set ${key}:`, error);
    }
  },

  async remove(key: string): Promise<void> {
    try {
      await SecureStore.deleteItemAsync(key);
    } catch (error) {
      console.error(`[SecureStorage] Failed to remove ${key}:`, error);
    }
  },
};

export default storage;
