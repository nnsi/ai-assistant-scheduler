import AsyncStorage from "@react-native-async-storage/async-storage";
import { storage, secureStorage, initializeStorage } from "./index";
import * as SecureStore from "expo-secure-store";

// Jestがモックを適用する
jest.mock("@react-native-async-storage/async-storage", () =>
  require("@react-native-async-storage/async-storage/jest/async-storage-mock")
);

describe("storage", () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
    jest.clearAllMocks();
  });

  describe("async methods", () => {
    test("set and get value", async () => {
      await storage.set("test_key", "test_value");
      const value = await storage.get("test_key");
      expect(value).toBe("test_value");
    });

    test("get returns null for non-existent key", async () => {
      const value = await storage.get("non_existent");
      expect(value).toBeNull();
    });

    test("remove deletes value", async () => {
      await storage.set("to_delete", "value");
      await storage.remove("to_delete");
      const value = await storage.get("to_delete");
      expect(value).toBeNull();
    });

    test("multiGet retrieves multiple values", async () => {
      await storage.set("key1", "value1");
      await storage.set("key2", "value2");
      const result = await storage.multiGet(["key1", "key2", "key3"]);
      expect(result).toEqual({
        key1: "value1",
        key2: "value2",
        key3: null,
      });
    });

    test("multiSet stores multiple values", async () => {
      await storage.multiSet({
        multi1: "val1",
        multi2: "val2",
      });
      const val1 = await storage.get("multi1");
      const val2 = await storage.get("multi2");
      expect(val1).toBe("val1");
      expect(val2).toBe("val2");
    });

    test("clear removes all values", async () => {
      await storage.set("clear_test", "value");
      await storage.clear();
      const value = await storage.get("clear_test");
      expect(value).toBeNull();
    });
  });

  describe("sync methods (memory cache)", () => {
    test("setSync stores in memory and getSync retrieves", () => {
      storage.setSync("sync_key", "sync_value");
      const value = storage.getSync("sync_key");
      expect(value).toBe("sync_value");
    });

    test("getSync returns null for non-existent key", () => {
      const value = storage.getSync("non_existent_sync");
      expect(value).toBeNull();
    });

    test("removeSync removes from memory cache", () => {
      storage.setSync("to_remove_sync", "value");
      storage.removeSync("to_remove_sync");
      const value = storage.getSync("to_remove_sync");
      expect(value).toBeNull();
    });

    test("async set updates memory cache for sync get", async () => {
      await storage.set("async_to_sync", "async_value");
      const syncValue = storage.getSync("async_to_sync");
      expect(syncValue).toBe("async_value");
    });
  });

  describe("initializeStorage", () => {
    test("preloads specified keys to memory", async () => {
      // Set up some data
      await AsyncStorage.setItem("auth_user", JSON.stringify({ id: "1" }));
      await AsyncStorage.setItem("calendar_selected_ids", "[1,2,3]");

      // Clear memory cache by getting fresh module
      // Initialize
      await initializeStorage();

      // Should be accessible via sync methods after init
      const user = storage.getSync("auth_user");
      expect(user).toBe(JSON.stringify({ id: "1" }));
    });
  });
});

describe("secureStorage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("set calls SecureStore.setItemAsync", async () => {
    await secureStorage.set("token", "secret_token");
    expect(SecureStore.setItemAsync).toHaveBeenCalledWith("token", "secret_token");
  });

  test("get calls SecureStore.getItemAsync", async () => {
    (SecureStore.getItemAsync as jest.Mock).mockResolvedValueOnce("stored_token");
    const value = await secureStorage.get("token");
    expect(SecureStore.getItemAsync).toHaveBeenCalledWith("token");
    expect(value).toBe("stored_token");
  });

  test("remove calls SecureStore.deleteItemAsync", async () => {
    await secureStorage.remove("token");
    expect(SecureStore.deleteItemAsync).toHaveBeenCalledWith("token");
  });

  test("get returns null on error", async () => {
    (SecureStore.getItemAsync as jest.Mock).mockRejectedValueOnce(new Error("Access denied"));
    const value = await secureStorage.get("token");
    expect(value).toBeNull();
  });
});
