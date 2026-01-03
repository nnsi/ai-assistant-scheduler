import type { Meta, StoryObj } from "@storybook/react-vite";
import { ScheduleDetail } from "./ScheduleDetail";
import { fn } from "@storybook/test";
import type { ScheduleWithSupplement } from "@ai-scheduler/shared";

const meta = {
  title: "Schedule/ScheduleDetail",
  component: ScheduleDetail,
  parameters: {
    layout: "padded",
  },
  tags: ["autodocs"],
  args: {
    onEdit: fn(),
    onDelete: fn(),
    onMemoSave: fn(),
  },
} satisfies Meta<typeof ScheduleDetail>;

export default meta;
type Story = StoryObj<typeof meta>;

const baseSchedule: ScheduleWithSupplement = {
  id: "1",
  title: "横浜　散策　みなとみらい",
  startAt: "2026-01-10T12:00:00+09:00",
  endAt: null,
  createdAt: "2026-01-01T00:00:00+09:00",
  updatedAt: "2026-01-01T00:00:00+09:00",
  supplement: null,
};

const scheduleWithAiResult: ScheduleWithSupplement = {
  ...baseSchedule,
  supplement: {
    id: "s1",
    keywords: ["子連れOK", "ベビーカーOK", "店内が綺麗"],
    aiResult: `## おすすめスポット

2026年1月10日(土)に横浜・みなとみらいで子連れ・ベビーカーOKで、店内が綺麗なカフェをお探しですね。

### 1. J.S. PANCAKE CAFE マークイズみなとみらい店

- ふわふわのパンケーキが楽しめるカフェ。ソファー席やベビーチェアも完備。
- **営業時間**: 10:00〜21:00 (L.O. 20:00)
- **定休日**: 不定休
- **指定日の営業**: ○営業
- [公式サイト](https://example.com) / [食べログ](https://tabelog.com)

### 2. RHC CAFE MARK IS みなとみらい

- ロンハーマン併設のおしゃれなカフェ。ベビーカー入店OK。
- **営業時間**: 10:00〜20:00
- [公式サイト](https://example.com)
`,
    userMemo: null,
  },
};

const scheduleWithMemo: ScheduleWithSupplement = {
  ...baseSchedule,
  supplement: {
    id: "s2",
    keywords: [],
    aiResult: null,
    userMemo: `## 持ち物
- ベビーカー
- 替えのおむつ
- 離乳食

## メモ
- 駐車場はマークイズを利用予定
- 12時に現地集合`,
  },
};

const scheduleWithBoth: ScheduleWithSupplement = {
  ...baseSchedule,
  supplement: {
    id: "s3",
    keywords: ["子連れOK", "ベビーカーOK"],
    aiResult: `### 候補店舗

1. **J.S. PANCAKE CAFE** - 子連れに優しいカフェ
2. **RHC CAFE** - おしゃれな雰囲気

[詳細を見る](https://example.com)`,
    userMemo: `友達と行く予定。要予約確認。`,
  },
};

export const Default: Story = {
  args: {
    schedule: baseSchedule,
  },
  decorators: [
    (Story) => (
      <div className="max-w-lg mx-auto bg-white p-4 rounded-lg shadow">
        <Story />
      </div>
    ),
  ],
};

export const WithAiResult: Story = {
  args: {
    schedule: scheduleWithAiResult,
  },
  decorators: [
    (Story) => (
      <div className="max-w-lg mx-auto bg-white p-4 rounded-lg shadow">
        <Story />
      </div>
    ),
  ],
};

export const WithMemo: Story = {
  args: {
    schedule: scheduleWithMemo,
  },
  decorators: [
    (Story) => (
      <div className="max-w-lg mx-auto bg-white p-4 rounded-lg shadow">
        <Story />
      </div>
    ),
  ],
};

export const WithAiResultAndMemo: Story = {
  args: {
    schedule: scheduleWithBoth,
  },
  decorators: [
    (Story) => (
      <div className="max-w-lg mx-auto bg-white p-4 rounded-lg shadow">
        <Story />
      </div>
    ),
  ],
};

export const Deleting: Story = {
  args: {
    schedule: baseSchedule,
    isDeleting: true,
  },
  decorators: [
    (Story) => (
      <div className="max-w-lg mx-auto bg-white p-4 rounded-lg shadow">
        <Story />
      </div>
    ),
  ],
};

export const SavingMemo: Story = {
  args: {
    schedule: scheduleWithMemo,
    isSavingMemo: true,
  },
  decorators: [
    (Story) => (
      <div className="max-w-lg mx-auto bg-white p-4 rounded-lg shadow">
        <Story />
      </div>
    ),
  ],
};
