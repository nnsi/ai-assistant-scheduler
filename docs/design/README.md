# AI Assistant Scheduler - 設計書

## 概要

スケジュール登録時にAIが補足情報を自動リサーチして付加するカレンダーアプリ

## 設計書構成

| ファイル | 内容 |
|---------|------|
| [backend.md](./backend.md) | バックエンド設計、API、DB、バリデーション |
| [frontend.md](./frontend.md) | フロントエンド設計、UI/CSS、コンポーネント |
| [infra.md](./infra.md) | インフラ、環境変数、テスト戦略 |

---

## システムアーキテクチャ

```
┌─────────────────────────────────────────────────────────────┐
│                        Cloudflare                           │
├─────────────────────────┬───────────────────────────────────┤
│   Workers (Frontend)    │       Workers (Backend)           │
│   ┌─────────────────┐   │   ┌─────────────────────────────┐ │
│   │  React + Vite   │   │   │  Hono                       │ │
│   │  SPA            │◄──┼──►│  ├─ REST API                │ │
│   └─────────────────┘   │   │  └─ Mastra Agent            │ │
│                         │   └──────────┬──────────────────┘ │
│                         │              │                    │
│                         │              ▼                    │
│                         │   ┌─────────────────────────────┐ │
│                         │   │  Cloudflare D1 (SQLite)     │ │
│                         │   └─────────────────────────────┘ │
└─────────────────────────┴───────────────────────────────────┘
                                    │
                                    ▼
                          ┌─────────────────┐
                          │   OpenRouter    │
                          │   (LLM + :online)│
                          └─────────────────┘
```

---

## ディレクトリ構成

```
ai-assistant-scheduler/
├── docs/
│   ├── requirements.md          # 要件定義書
│   └── design/
│       ├── README.md            # 設計概要（このファイル）
│       ├── backend.md
│       ├── frontend.md
│       └── infra.md
│
├── packages/
│   ├── frontend/                # React SPA
│   │   ├── src/
│   │   │   ├── components/
│   │   │   ├── hooks/
│   │   │   ├── lib/
│   │   │   └── ...
│   │   ├── vite.config.ts
│   │   └── package.json
│   │
│   ├── backend/                 # Hono API
│   │   ├── src/
│   │   │   ├── domain/
│   │   │   ├── feature/
│   │   │   ├── infra/
│   │   │   └── ...
│   │   ├── wrangler.toml
│   │   └── package.json
│   │
│   └── shared/                  # 共有スキーマ・型定義
│       ├── src/
│       │   └── schemas/
│       └── package.json
│
├── package.json                 # Monorepo root
├── pnpm-workspace.yaml
└── README.md
```

---

## データフロー

### 予定作成 + AI補足情報フロー

```
[ユーザー]
    │
    │ 1. タイトル・日時入力
    ▼
[Frontend]
    │
    │ 2. POST /api/ai/suggest-keywords
    ▼
[Backend: keywordAgent]
    │
    │ 3. OpenRouter (Gemini) → キーワード提案
    ▼
[Frontend]
    │
    │ 4. ユーザーがキーワード選択
    │
    │ 5. POST /api/schedules (予定保存)
    │    POST /api/ai/search (検索実行)
    ▼
[Backend: searchAgent]
    │
    │ 6. OpenRouter (Gemini:online) → Web検索
    ▼
[Backend]
    │
    │ 7. D1に保存 (schedule + supplement)
    ▼
[Frontend]
    │
    │ 8. 結果表示
    ▼
[ユーザー]
```

---

## 技術スタック

### フロントエンド
| 技術 | 用途 |
|------|------|
| React | UIフレームワーク |
| Vite | ビルドツール |
| Tailwind CSS | スタイリング |
| Zod | バリデーション |
| date-fns | 日付操作 |
| marked | Markdown表示 |

### バックエンド
| 技術 | 用途 |
|------|------|
| Hono | Webフレームワーク |
| Mastra | AIエージェントフレームワーク |
| Drizzle | ORM |
| Zod | バリデーション |

### インフラ
| サービス | 用途 |
|------|------|
| Cloudflare Workers (Frontend) | React SPA 配信 |
| Cloudflare Workers (Backend) | Hono API |
| Cloudflare D1 | SQLiteデータベース |
| OpenRouter | LLM API Gateway |

---

## 今後の拡張ポイント

| 機能 | 拡張方法 |
|------|----------|
| 週表示・日表示 | Calendarコンポーネントにview prop追加 |
| 繰り返し予定 | schedulesテーブルにrecurrence_rule追加 |
| 認証 | Cloudflare Access or 自前JWT |
| リッチテキスト編集 | Tiptapを後から導入 |
| 自由キーワード入力 | KeywordSuggestionsに入力フィールド追加 |
