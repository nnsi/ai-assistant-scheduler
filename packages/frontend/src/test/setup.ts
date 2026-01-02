import "@testing-library/jest-dom";
import { vi } from "vitest";

// グローバルなモック設定

// fetch モック
global.fetch = vi.fn();

// localStorage モック
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};
Object.defineProperty(window, "localStorage", { value: localStorageMock });

// import.meta.env モック
vi.stubEnv("VITE_API_URL", "http://localhost:8787/api");

// テスト後にモックをリセット
afterEach(() => {
  vi.clearAllMocks();
  localStorageMock.getItem.mockReset();
  localStorageMock.setItem.mockReset();
  localStorageMock.removeItem.mockReset();
});
