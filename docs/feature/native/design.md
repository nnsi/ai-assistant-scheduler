# React Native モバイルアプリ化 設計書

## 概要

既存のWebアプリケーション（React + Vite）をReact Nativeでモバイルアプリ化する。
ビジネスロジックを共通化し、Web/モバイル両方で同一コードを再利用できるアーキテクチャを採用。

---

## 1. 技術選定

### 採用技術

| カテゴリ | 技術 | 理由 |
|---------|------|------|
| フレームワーク | React Native + Expo | OTAアップデート、プッシュ通知の容易さ |
| スタイリング | NativeWind | 既存Tailwindクラスの再利用 |
| ナビゲーション | React Navigation | RN標準、Deep Linking対応 |
| 状態管理 | TanStack Query | 既存実装をそのまま流用 |
| ストレージ | AsyncStorage | localStorage代替 |
| プッシュ通知 | Expo Notifications | 無料、実装容易 |
| OTA | EAS Update | ストア審査なしで更新可能 |

### 比較検討

| 選択肢 | 工数 | コード再利用 | パフォーマンス | OTA対応 |
|--------|------|-------------|---------------|---------|
| **React Native（採用）** | 1.5-2ヶ月 | 80-90% | ネイティブ級 | EAS Update |
| Tauri | 1-2週間 | 95%以上 | WebView | 非対応 |
| Flutter | 2-3ヶ月 | 0%（Dart） | ネイティブ級 | Shorebird |

**決定理由**: OTAアップデートによる迅速なリリースサイクルを重視。

---

## 2. アーキテクチャ

### パッケージ構成

```
packages/
├── shared/          # 既存（Zod スキーマ、型定義）
├── core/            # 新規：ビジネスロジック層（Web/RN共通）
│   ├── api/         # API クライアント
│   ├── hooks/       # カスタムフック
│   ├── contexts/    # コンテキスト（Storage抽象化済み）
│   └── utils/       # ユーティリティ
├── web/             # 既存frontend → リネーム
│   ├── components/  # Web専用UIコンポーネント
│   └── storage.ts   # localStorage実装
├── mobile/          # 新規：React Native アプリ
│   ├── components/  # RN専用UIコンポーネント
│   ├── navigation/  # React Navigation設定
│   └── storage.ts   # AsyncStorage実装
└── backend/         # 既存（変更なし）
```

### 共通化レイヤー図

```
┌─────────────────────────────────────────────────────────┐
│                      shared/                            │
│            （Zodスキーマ、型定義）                        │
└─────────────────────────────────────────────────────────┘
                          ↑
┌─────────────────────────────────────────────────────────┐
│                       core/                             │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐     │
│  │   api/      │  │   hooks/    │  │  contexts/  │     │
│  │ fetchWith   │  │ useSchedules│  │ AuthContext │     │
│  │ Auth        │  │ useCalendars│  │ CalendarCtx │     │
│  └─────────────┘  └─────────────┘  └─────────────┘     │
│                          ↑                              │
│              ┌───────────┴───────────┐                  │
│              │   Storage Interface   │                  │
│              └───────────────────────┘                  │
└─────────────────────────────────────────────────────────┘
        ↑                                    ↑
┌───────┴───────┐                  ┌─────────┴─────────┐
│     web/      │                  │      mobile/      │
│ ┌───────────┐ │                  │ ┌───────────────┐ │
│ │localStorage│ │                  │ │ AsyncStorage  │ │
│ └───────────┘ │                  │ └───────────────┘ │
│ ┌───────────┐ │                  │ ┌───────────────┐ │
│ │ Tailwind  │ │                  │ │  NativeWind   │ │
│ └───────────┘ │                  │ └───────────────┘ │
│ ┌───────────┐ │                  │ ┌───────────────┐ │
│ │TanStack   │ │                  │ │React          │ │
│ │Router     │ │                  │ │Navigation     │ │
│ └───────────┘ │                  │ └───────────────┘ │
└───────────────┘                  └───────────────────┘
```

---

## 3. Storage抽象化

### インターフェース定義

```typescript
// packages/core/storage/interface.ts
export interface Storage {
  get(key: string): Promise<string | null>;
  set(key: string, value: string): Promise<void>;
  remove(key: string): Promise<void>;
  multiGet(keys: string[]): Promise<Record<string, string | null>>;
  multiSet(entries: Record<string, string>): Promise<void>;
  clear(): Promise<void>;
}
```

### Web実装

```typescript
// packages/web/storage.ts
import type { Storage } from "@ai-scheduler/core";

export const storage: Storage = {
  get: async (key) => localStorage.getItem(key),
  set: async (key, value) => localStorage.setItem(key, value),
  remove: async (key) => localStorage.removeItem(key),
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
  clear: async () => localStorage.clear(),
};
```

### React Native実装

```typescript
// packages/mobile/storage.ts
import AsyncStorage from "@react-native-async-storage/async-storage";
import type { Storage } from "@ai-scheduler/core";

export const storage: Storage = {
  get: (key) => AsyncStorage.getItem(key),
  set: (key, value) => AsyncStorage.setItem(key, value),
  remove: (key) => AsyncStorage.removeItem(key),
  multiGet: async (keys) => {
    const pairs = await AsyncStorage.multiGet(keys);
    const result: Record<string, string | null> = {};
    for (const [key, value] of pairs) {
      result[key] = value;
    }
    return result;
  },
  multiSet: async (entries) => {
    const pairs = Object.entries(entries);
    await AsyncStorage.multiSet(pairs);
  },
  clear: () => AsyncStorage.clear(),
};
```

### Context での使用

```typescript
// packages/core/contexts/AuthContext.tsx
import { createContext, useContext } from "react";
import type { Storage } from "../storage/interface";

interface AuthProviderProps {
  children: React.ReactNode;
  storage: Storage;  // 依存性注入
}

export const AuthProvider = ({ children, storage }: AuthProviderProps) => {
  // storage.get(), storage.set() を使用
  // Web/RNで同じコードが動作
};
```

---

## 4. API クライアント

### 共通化可能な部分

```typescript
// packages/core/api/client.ts
import { hc } from "hono/client";
import type { ApiRoutes } from "@ai-scheduler/backend/client";

export const createApiClient = (
  baseUrl: string,
  getAccessToken: () => string | null,
  onUnauthorized: () => Promise<string | null>
) => {
  const fetchWithAuth: typeof fetch = async (input, init) => {
    const token = getAccessToken();
    const headers = new Headers(init?.headers);

    if (token) {
      headers.set("Authorization", `Bearer ${token}`);
    }

    const res = await fetch(input, { ...init, headers });

    if (res.status === 401) {
      const newToken = await onUnauthorized();
      if (newToken) {
        headers.set("Authorization", `Bearer ${newToken}`);
        return fetch(input, { ...init, headers });
      }
    }

    return res;
  };

  return hc<ApiRoutes>(baseUrl, { fetch: fetchWithAuth });
};
```

### RNでの注意点

| 項目 | Web | React Native |
|------|-----|--------------|
| Cookie | `credentials: "include"` | 手動でヘッダー管理 |
| SSE | ReadableStream | ReadableStream（RN 0.72+） |
| TextDecoder | 標準対応 | polyfill必要な場合あり |

---

## 5. 認証フロー

### OAuth (Google) 対応

```
Web:
  ブラウザ → Google OAuth → /auth/callback → トークン取得

React Native:
  expo-auth-session → Google OAuth → Deep Link → トークン取得
```

### Expo AuthSession 実装

```typescript
// packages/mobile/auth/google.ts
import * as AuthSession from "expo-auth-session";
import * as Google from "expo-auth-session/providers/google";

export const useGoogleAuth = () => {
  const [request, response, promptAsync] = Google.useAuthRequest({
    expoClientId: "xxx.apps.googleusercontent.com",
    iosClientId: "xxx.apps.googleusercontent.com",
    androidClientId: "xxx.apps.googleusercontent.com",
  });

  useEffect(() => {
    if (response?.type === "success") {
      const { code } = response.params;
      // バックエンドに code を送信してトークン取得
      login(code, AuthSession.makeRedirectUri());
    }
  }, [response]);

  return { request, promptAsync };
};
```

### Deep Linking 設定

```json
// app.json
{
  "expo": {
    "scheme": "ai-scheduler",
    "ios": {
      "bundleIdentifier": "com.yourapp.aischeduler",
      "associatedDomains": ["applinks:your-domain.com"]
    },
    "android": {
      "package": "com.yourapp.aischeduler",
      "intentFilters": [
        {
          "action": "VIEW",
          "data": [
            { "scheme": "ai-scheduler" },
            { "scheme": "https", "host": "your-domain.com", "pathPrefix": "/invite" }
          ],
          "category": ["BROWSABLE", "DEFAULT"]
        }
      ]
    }
  }
}
```

---

## 6. ナビゲーション設計

### 画面構成

```
RootNavigator
├── AuthStack (未認証)
│   ├── LoginScreen
│   └── OAuthCallbackScreen
├── MainStack (認証済み)
│   ├── MainTabs
│   │   ├── CalendarTab
│   │   │   ├── MonthView
│   │   │   ├── WeekView
│   │   │   └── DayView
│   │   ├── SearchTab (AI検索)
│   │   └── SettingsTab
│   ├── ScheduleDetailScreen
│   ├── ScheduleEditScreen
│   ├── CalendarSettingsScreen
│   └── MemberManagementScreen
└── InviteAcceptScreen (Deep Link)
```

### ルート定義

```typescript
// packages/mobile/navigation/types.ts
export type RootStackParamList = {
  Auth: undefined;
  Main: undefined;
  InviteAccept: { token: string };
};

export type MainTabParamList = {
  Calendar: undefined;
  Search: undefined;
  Settings: undefined;
};

export type CalendarStackParamList = {
  CalendarView: { view?: "month" | "week" | "day" };
  ScheduleDetail: { id: string };
  ScheduleEdit: { id?: string; date?: string };
  CalendarSettings: { id: string };
  MemberManagement: { calendarId: string };
};
```

---

## 7. NativeWind スタイリング

### 設定

```javascript
// tailwind.config.js (mobile)
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        // Web版と同じカラー定義
        surface: {
          DEFAULT: "#ffffff",
          secondary: "#f8fafc",
        },
        accent: {
          DEFAULT: "#3b82f6",
          light: "#60a5fa",
          dark: "#2563eb",
        },
        schedule: {
          default: "#3b82f6",
          ai: "#8b5cf6",
        },
      },
    },
  },
};
```

### 対応表

| Tailwind (Web) | NativeWind (RN) | 対応状況 |
|----------------|-----------------|----------|
| `bg-blue-500` | `bg-blue-500` | そのまま |
| `p-4` | `p-4` | そのまま |
| `flex items-center` | `flex items-center` | そのまま |
| `hover:bg-blue-600` | - | 対応不要（タッチUI） |
| `grid grid-cols-7` | `flex flex-wrap` | 手動変換 |
| `shadow-md` | `shadow-md` | iOS対応、Android要調整 |
| CSS Variables | 固定値に変換 | 要変換 |

### コンポーネント例

```tsx
// packages/mobile/components/Button.tsx
import { Pressable, Text } from "react-native";
import { cn } from "@ai-scheduler/core/utils";

interface ButtonProps {
  onPress: () => void;
  variant?: "primary" | "secondary" | "danger";
  children: React.ReactNode;
  className?: string;
}

export const Button = ({
  onPress,
  variant = "primary",
  children,
  className,
}: ButtonProps) => {
  const variants = {
    primary: "bg-accent active:bg-accent-dark",
    secondary: "bg-gray-200 active:bg-gray-300",
    danger: "bg-red-500 active:bg-red-600",
  };

  return (
    <Pressable
      onPress={onPress}
      className={cn(
        "px-4 py-2 rounded-lg",
        variants[variant],
        className
      )}
    >
      <Text className="text-white font-medium text-center">
        {children}
      </Text>
    </Pressable>
  );
};
```

---

## 8. プッシュ通知

### Expo Push Notifications

```typescript
// packages/mobile/notifications/setup.ts
import * as Notifications from "expo-notifications";
import * as Device from "expo-device";
import { Platform } from "react-native";

export const registerForPushNotifications = async () => {
  if (!Device.isDevice) {
    console.log("プッシュ通知は実機のみ対応");
    return null;
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== "granted") {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== "granted") {
    console.log("プッシュ通知の権限が拒否されました");
    return null;
  }

  const token = (await Notifications.getExpoPushTokenAsync()).data;

  // バックエンドにトークンを登録
  await registerDeviceToken(token);

  if (Platform.OS === "android") {
    Notifications.setNotificationChannelAsync("default", {
      name: "default",
      importance: Notifications.AndroidImportance.MAX,
    });
  }

  return token;
};
```

### バックエンド連携

```typescript
// packages/backend（追加API）
// POST /users/device-token
// デバイストークンを保存し、スケジュールリマインダー等で使用
```

---

## 9. OTA アップデート

### EAS Update 設定

```json
// eas.json
{
  "cli": { "version": ">= 5.0.0" },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal"
    },
    "preview": {
      "distribution": "internal",
      "channel": "preview"
    },
    "production": {
      "channel": "production"
    }
  },
  "submit": {
    "production": {}
  }
}
```

### 更新チェック

```typescript
// packages/mobile/updates/index.ts
import * as Updates from "expo-updates";

export const checkForUpdates = async () => {
  if (__DEV__) return;

  try {
    const update = await Updates.checkForUpdateAsync();
    if (update.isAvailable) {
      await Updates.fetchUpdateAsync();
      await Updates.reloadAsync();
    }
  } catch (error) {
    console.error("更新チェックエラー:", error);
  }
};
```

---

## 10. 開発環境

### 必要なツール

- Node.js 18+
- pnpm 8+
- Expo CLI (`npx expo`)
- EAS CLI (`npm install -g eas-cli`)
- Xcode（iOS開発）
- Android Studio（Android開発）

### 開発コマンド

```bash
# 開発サーバー起動
pnpm --filter mobile start

# iOS シミュレータ
pnpm --filter mobile ios

# Android エミュレータ
pnpm --filter mobile android

# ビルド（EAS）
eas build --platform ios --profile preview
eas build --platform android --profile preview

# OTA更新
eas update --branch production --message "バグ修正"
```

---

## 11. リスク・課題

| リスク | 影響度 | 対策 |
|--------|--------|------|
| SSE（AI検索）の不安定さ | 中 | WebSocket代替を検討、polyfill導入 |
| NativeWindの未対応クラス | 低 | カスタムスタイルで対応 |
| Deep Linkingの設定複雑さ | 中 | 段階的に実装、テスト自動化 |
| iOS/Android差異 | 低 | Platform.select()で分岐 |

---

## 12. 代替案

### A. WebViewラッパー（Tauri/Capacitor）

工数1-2週間だが、OTA非対応のため見送り。

### B. Flutter

Dart言語への移行コストが高く、既存コード再利用不可のため見送り。

### C. Web PWA

プッシュ通知の制限（iOS）、App Store配信不可のため見送り。

---

## 更新履歴

- 2026-01-11: 初版作成
