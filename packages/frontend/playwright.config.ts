import { defineConfig, devices } from "@playwright/test";
import * as fs from "fs";
import * as path from "path";

// 既存のPlaywright Chromiumを探す
const findChromiumPath = (): string | undefined => {
  const homeDir = process.env.HOME || "/root";
  const cacheDir = path.join(homeDir, ".cache/ms-playwright");

  if (fs.existsSync(cacheDir)) {
    const dirs = fs.readdirSync(cacheDir).filter((d: string) => d.startsWith("chromium-"));
    if (dirs.length > 0) {
      // 最新のバージョンを使用
      dirs.sort().reverse();
      const chromePath = path.join(cacheDir, dirs[0], "chrome-linux", "chrome");
      if (fs.existsSync(chromePath)) {
        return chromePath;
      }
    }
  }
  return undefined;
};

const chromiumPath = findChromiumPath();

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: "html",
  use: {
    baseURL: "http://localhost:5173",
    trace: "on-first-retry",
  },
  projects: [
    {
      name: "chromium",
      use: {
        ...devices["Desktop Chrome"],
        ...(chromiumPath ? { launchOptions: { executablePath: chromiumPath } } : {}),
      },
    },
  ],
  webServer: {
    command: "pnpm dev",
    url: "http://localhost:5173",
    reuseExistingServer: !process.env.CI,
  },
});
