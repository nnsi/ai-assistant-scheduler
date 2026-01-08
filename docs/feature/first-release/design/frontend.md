# フロントエンド設計

## 1. ディレクトリ構成

```
packages/frontend/                 # React SPA
├── src/
│   ├── components/
│   │   ├── Calendar/
│   │   │   ├── Calendar.tsx
│   │   │   ├── CalendarDay.tsx
│   │   │   └── CalendarHeader.tsx
│   │   ├── Schedule/
│   │   │   ├── SchedulePopup.tsx
│   │   │   ├── ScheduleForm.tsx
│   │   │   └── ScheduleDetail.tsx
│   │   ├── AI/
│   │   │   ├── KeywordSuggestions.tsx
│   │   │   └── SearchResults.tsx
│   │   └── common/
│   │       ├── Button.tsx
│   │       ├── Modal.tsx
│   │       └── MarkdownRenderer.tsx
│   ├── hooks/
│   │   ├── useSchedules.ts
│   │   └── useAI.ts
│   ├── lib/
│   │   ├── api.ts
│   │   ├── validation.ts
│   │   └── cn.ts
│   ├── types/
│   │   └── index.ts
│   ├── App.tsx
│   └── main.tsx
├── index.html
├── vite.config.ts
├── tailwind.config.ts
├── tsconfig.json
└── package.json
```

---

## 2. 画面遷移

```
┌────────────────────────────────────────┐
│              カレンダー画面              │
│  ┌────────────────────────────────┐   │
│  │         月表示カレンダー          │   │
│  │  日付クリック → 予定作成モーダル   │   │
│  │  予定クリック → 予定詳細ポップアップ │   │
│  └────────────────────────────────┘   │
└────────────────────────────────────────┘
         │                    │
         ▼                    ▼
┌─────────────────┐  ┌─────────────────────┐
│  予定作成モーダル  │  │  予定詳細ポップアップ  │
│  ・タイトル入力   │  │  ・タイトル/日時表示   │
│  ・日時選択      │  │  ・AI補足情報表示     │
│  ・保存         │  │  ・メモ入力/表示      │
│       │         │  │  ・編集/削除ボタン    │
│       ▼         │  └─────────────────────┘
│  キーワード選択   │
│  ・AI提案表示    │
│  ・選択/スキップ  │
│       │         │
│       ▼         │
│  検索結果表示    │
│  ・結果確認     │
│  ・保存        │
└─────────────────┘
```

---

## 3. コンポーネント構成

```
App
├── CalendarHeader        # 月切り替え
├── Calendar              # 月カレンダー本体
│   └── CalendarDay       # 日付セル
│       └── ScheduleChip  # 予定チップ（簡易表示）
├── SchedulePopup         # 予定詳細ポップアップ
│   ├── ScheduleDetail    # タイトル/日時
│   ├── SearchResults     # AI検索結果（Markdown表示）
│   └── MemoEditor        # メモ入力エリア
├── ScheduleFormModal     # 予定作成モーダル
│   ├── ScheduleForm      # タイトル/日時入力
│   ├── KeywordSuggestions # AI提案キーワード選択
│   └── SearchResults     # 検索結果プレビュー
└── MarkdownRenderer      # Markdown → HTML変換
```

---

## 4. 状態管理

シンプルに`useState` + `useReducer`で管理（ライブラリ不使用）

```typescript
// 主な状態
interface AppState {
  currentMonth: Date;
  schedules: Schedule[];
  selectedSchedule: Schedule | null;
  isFormModalOpen: boolean;
  isLoading: boolean;
}
```

---

## 5. UI/CSS構成

### 5.1 技術選定

| 技術 | 用途 |
|------|------|
| **Tailwind CSS** | ユーティリティファーストCSS |
| **shadcn/ui** | UIコンポーネント（必要に応じて） |
| **Lucide React** | アイコン |

### 5.2 Tailwind設定

```typescript
// packages/frontend/tailwind.config.ts
import type { Config } from "tailwindcss";

export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: {
          50: "#f0f9ff",
          500: "#3b82f6",
          600: "#2563eb",
          700: "#1d4ed8",
        },
        schedule: {
          default: "#3b82f6",
          ai: "#8b5cf6",  // AI補足情報あり
        },
      },
    },
  },
  plugins: [],
} satisfies Config;
```

---

## 6. コンポーネント実装例

### 6.1 CalendarDay

```tsx
// frontend/src/components/Calendar/CalendarDay.tsx
import { cn } from "../../lib/cn";
import type { Schedule } from "../../types";

type Props = {
  date: Date;
  schedules: Schedule[];
  isToday: boolean;
  isCurrentMonth: boolean;
  onClick: () => void;
};

export const CalendarDay = ({
  date,
  schedules,
  isToday,
  isCurrentMonth,
  onClick,
}: Props) => {
  return (
    <div
      onClick={onClick}
      className={cn(
        "min-h-24 p-2 border-b border-r cursor-pointer hover:bg-gray-50",
        !isCurrentMonth && "bg-gray-100 text-gray-400",
        isToday && "bg-blue-50"
      )}
    >
      <span
        className={cn(
          "inline-flex items-center justify-center w-7 h-7 text-sm",
          isToday && "bg-blue-500 text-white rounded-full"
        )}
      >
        {date.getDate()}
      </span>

      <div className="mt-1 space-y-1">
        {schedules.slice(0, 3).map((s) => (
          <div
            key={s.id}
            className={cn(
              "text-xs px-2 py-1 rounded truncate",
              s.hasSupplement
                ? "bg-purple-100 text-purple-700"
                : "bg-blue-100 text-blue-700"
            )}
          >
            {s.title}
          </div>
        ))}
        {schedules.length > 3 && (
          <div className="text-xs text-gray-500">
            +{schedules.length - 3}件
          </div>
        )}
      </div>
    </div>
  );
};
```

### 6.2 className結合ユーティリティ

```typescript
// frontend/src/lib/cn.ts
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export const cn = (...inputs: ClassValue[]) => twMerge(clsx(inputs));
```

---

## 7. バリデーション

### 7.1 フォームバリデーション

```typescript
// frontend/src/lib/validation.ts
import { z } from "zod";
import { createScheduleInputSchema } from "@ai-scheduler/shared";

// フォーム送信前にバリデーション
export const validateScheduleForm = (data: unknown) => {
  return createScheduleInputSchema.safeParse(data);
};
```

### 7.2 フォームコンポーネントでの使用

```tsx
// frontend/src/components/Schedule/ScheduleForm.tsx
import { useState } from "react";
import { validateScheduleForm } from "../../lib/validation";

type Props = {
  onSubmit: (data: CreateScheduleInput) => Promise<void>;
};

export const ScheduleForm = ({ onSubmit }: Props) => {
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    const data = Object.fromEntries(formData);

    // クライアント側バリデーション
    const result = validateScheduleForm(data);
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.errors.forEach((err) => {
        fieldErrors[err.path[0] as string] = err.message;
      });
      setErrors(fieldErrors);
      return;
    }

    setErrors({});
    await onSubmit(result.data);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700">
          タイトル
        </label>
        <input
          name="title"
          className={cn(
            "mt-1 block w-full rounded-md border shadow-sm",
            errors.title ? "border-red-500" : "border-gray-300"
          )}
        />
        {errors.title && (
          <span className="text-sm text-red-500">{errors.title}</span>
        )}
      </div>
      {/* ... */}
    </form>
  );
};
```

---

## 8. APIクライアント

### 8.1 基本設計

```typescript
// frontend/src/lib/api.ts
import { scheduleSchema, type Schedule } from "@ai-scheduler/shared";
import { env } from "../env";

class ApiError extends Error {
  constructor(
    public code: string,
    message: string,
    public details?: unknown
  ) {
    super(message);
  }
}

const api = {
  baseUrl: env.VITE_API_URL,

  async fetch<T>(path: string, options?: RequestInit): Promise<T> {
    const res = await fetch(`${this.baseUrl}${path}`, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...options?.headers,
      },
    });

    const data = await res.json();

    if (!res.ok) {
      throw new ApiError(data.code, data.message, data.details);
    }

    return data;
  },
};
```

### 8.2 API関数

```typescript
// frontend/src/lib/api.ts (続き)

export const fetchSchedules = async (): Promise<Schedule[]> => {
  const data = await api.fetch<unknown[]>("/schedules");
  return data.map((item) => scheduleSchema.parse(item));
};

export const fetchSchedule = async (id: string): Promise<Schedule> => {
  const data = await api.fetch<unknown>(`/schedules/${id}`);
  return scheduleSchema.parse(data);
};

export const createSchedule = async (
  input: CreateScheduleInput
): Promise<Schedule> => {
  const data = await api.fetch<unknown>("/schedules", {
    method: "POST",
    body: JSON.stringify(input),
  });
  return scheduleSchema.parse(data);
};

export const suggestKeywords = async (
  title: string,
  startAt: string
): Promise<string[]> => {
  const data = await api.fetch<{ keywords: string[] }>("/ai/suggest-keywords", {
    method: "POST",
    body: JSON.stringify({ title, startAt }),
  });
  return data.keywords;
};

export const searchWithKeywords = async (
  scheduleId: string,
  title: string,
  startAt: string,
  keywords: string[]
): Promise<string> => {
  const data = await api.fetch<{ result: string }>("/ai/search", {
    method: "POST",
    body: JSON.stringify({ scheduleId, title, startAt, keywords }),
  });
  return data.result;
};
```

---

## 9. カスタムフック

### 9.1 useSchedules

```typescript
// frontend/src/hooks/useSchedules.ts
import { useState, useEffect, useCallback } from "react";
import * as api from "../lib/api";
import type { Schedule, CreateScheduleInput } from "@ai-scheduler/shared";

export const useSchedules = () => {
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchAll = useCallback(async () => {
    try {
      setIsLoading(true);
      const data = await api.fetchSchedules();
      setSchedules(data);
    } catch (e) {
      setError(e as Error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const create = async (input: CreateScheduleInput) => {
    const schedule = await api.createSchedule(input);
    setSchedules((prev) => [...prev, schedule]);
    return schedule;
  };

  const remove = async (id: string) => {
    await api.deleteSchedule(id);
    setSchedules((prev) => prev.filter((s) => s.id !== id));
  };

  return {
    schedules,
    isLoading,
    error,
    create,
    remove,
    refetch: fetchAll,
  };
};
```

### 9.2 useAI

```typescript
// frontend/src/hooks/useAI.ts
import { useState } from "react";
import * as api from "../lib/api";

export const useAI = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [keywords, setKeywords] = useState<string[]>([]);
  const [searchResult, setSearchResult] = useState<string>("");

  const suggestKeywords = async (title: string, startAt: string) => {
    setIsLoading(true);
    try {
      const result = await api.suggestKeywords(title, startAt);
      setKeywords(result);
      return result;
    } finally {
      setIsLoading(false);
    }
  };

  const search = async (
    scheduleId: string,
    title: string,
    startAt: string,
    selectedKeywords: string[]
  ) => {
    setIsLoading(true);
    try {
      const result = await api.searchWithKeywords(
        scheduleId,
        title,
        startAt,
        selectedKeywords
      );
      setSearchResult(result);
      return result;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    isLoading,
    keywords,
    searchResult,
    suggestKeywords,
    search,
    clearKeywords: () => setKeywords([]),
    clearSearchResult: () => setSearchResult(""),
  };
};
```

---

## 10. Markdown表示

```typescript
// packages/frontend/src/components/common/MarkdownRenderer.tsx
import { marked } from "marked";
import { useMemo } from "react";

type Props = {
  content: string;
  className?: string;
};

export function MarkdownRenderer({ content, className }: Props) {
  const html = useMemo(() => marked.parse(content), [content]);

  return (
    <div
      className={cn("prose prose-sm max-w-none", className)}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
```

---

## 11. 日付操作

**date-fns** を使用（軽量、tree-shaking対応）

```typescript
// frontend/src/lib/date.ts
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  startOfWeek,
  endOfWeek,
  isSameMonth,
  isSameDay,
  addMonths,
  subMonths,
} from "date-fns";
import { ja } from "date-fns/locale";

export const formatDate = (date: Date, pattern: string) =>
  format(date, pattern, { locale: ja });

export const getCalendarDays = (month: Date) => {
  const start = startOfWeek(startOfMonth(month));
  const end = endOfWeek(endOfMonth(month));
  return eachDayOfInterval({ start, end });
};

export { isSameMonth, isSameDay, addMonths, subMonths };
```

---

## 12. 環境変数

```typescript
// packages/frontend/src/env.ts
import { z } from "zod";

const envSchema = z.object({
  VITE_API_URL: z.string().url(),
});

export const env = envSchema.parse({
  VITE_API_URL: import.meta.env.VITE_API_URL,
});
```

```bash
# packages/frontend/.env
VITE_API_URL=http://localhost:8787/api

# packages/frontend/.env.production
VITE_API_URL=https://ai-scheduler-api.<account>.workers.dev/api
```
