/** @type {import('jest').Config} */
module.exports = {
  preset: "jest-expo",
  transformIgnorePatterns: [
    // pnpm uses .pnpm directory structure
    "node_modules/(?!(.pnpm|" +
      "@react-native|react-native|@react-native-community|" +
      "expo|@expo|expo-modules-core|expo-constants|expo-secure-store|" +
      "expo-auth-session|expo-web-browser|expo-linking|expo-router|" +
      "react-native-safe-area-context|react-native-reanimated|" +
      "react-native-css-interop|nativewind|" +
      "@ai-scheduler" +
      ")/)",
  ],
  setupFilesAfterEnv: ["<rootDir>/jest.setup.js"],
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/src/$1",
  },
  testMatch: ["**/__tests__/**/*.[jt]s?(x)", "**/*.test.[jt]s?(x)"],
  collectCoverageFrom: [
    "src/**/*.{ts,tsx}",
    "!src/**/*.d.ts",
    "!src/**/index.ts",
  ],
  // Use the jest-expo preset's environment settings
  testEnvironment: "node",
  // Clear mocks between tests
  clearMocks: true,
  // Resolve modules from project root
  moduleDirectories: ["node_modules", "<rootDir>"],
};
