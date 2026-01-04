import type { Meta, StoryObj } from "@storybook/react-vite";
import { SearchResults } from "./SearchResults";
import { fn } from "@storybook/test";

const meta = {
  title: "AI/SearchResults",
  component: SearchResults,
  parameters: {
    layout: "padded",
  },
  tags: ["autodocs"],
  args: {
    onSave: fn(),
    onBack: fn(),
  },
} satisfies Meta<typeof SearchResults>;

export default meta;
type Story = StoryObj<typeof meta>;

const sampleResult = `## おすすめスポット

2026年1月10日(土)に横浜・みなとみらいで子連れ・ベビーカーOKで、店内が綺麗なカフェをお探しですね。

土曜日は営業している店舗が多いですが、年末年始の特別営業期間にあたる可能性もあるため、各店舗の公式サイト等で最終確認をお願いいたします。

### 1. J.S. PANCAKE CAFE マークイズみなとみらい店

- ふわふわのパンケーキが楽しめるカフェ。ソファー席やベビーチェアも完備されており、ベビーカーでの入店も歓迎されています。キッズパンケーキセットもあり、お子様連れに優しいお店です。
- **営業時間**: 10:00〜21:00 (L.O. 20:00)
- **定休日**: 不定休（マークイズみなとみらいに準ずる）
- **指定日の営業**: ○営業
- [公式サイト](https://example.com) / [食べログ](https://tabelog.com)

### 2. RHC CAFE MARK IS みなとみらい

- ロンハーマン併設のおしゃれなカフェ。ソファ席が多く、ベビーカーでの入店も歓迎されており、ゆったりと過ごせます。店内は開放的で綺麗です。
- **営業時間**: 10:00〜20:00
- **定休日**: 不定休（マークイズみなとみらいに準ずる）
- **指定日の営業**: ○営業
- [公式サイト](https://example.com) / [ベビーカログ](https://example.com)

### 3. bills 横浜赤レンガ倉庫

- 「世界一の朝食」で有名なカフェ。広々とした店内でベビーカーのまま入店可能。テラス席もあり開放的な雰囲気です。
- **営業時間**: 9:00〜21:00 (L.O. 20:00)
- **定休日**: 不定休
- **指定日の営業**: ○営業
- [公式サイト](https://example.com)
`;

export const Default: Story = {
  args: {
    result: sampleResult,
    isLoading: false,
  },
  decorators: [
    (Story) => (
      <div className="max-w-lg mx-auto bg-white p-4 rounded-lg shadow">
        <Story />
      </div>
    ),
  ],
};

export const Loading: Story = {
  args: {
    result: "",
    isLoading: true,
  },
  decorators: [
    (Story) => (
      <div className="max-w-lg mx-auto bg-white p-4 rounded-lg shadow">
        <Story />
      </div>
    ),
  ],
};

export const ShortResult: Story = {
  args: {
    result: `## 検索結果

指定された条件に合う店舗は見つかりませんでした。

検索条件を変更してお試しください。`,
    isLoading: false,
  },
  decorators: [
    (Story) => (
      <div className="max-w-lg mx-auto bg-white p-4 rounded-lg shadow">
        <Story />
      </div>
    ),
  ],
};

// 検索結果が0件の場合（shopCandidatesが空配列）
export const NoShopCandidates: Story = {
  args: {
    result: `## 検索結果

「スケジュールの確認」という予定内容から、具体的な店舗やスポットの候補を見つけることができませんでした。

この予定は店舗検索に適していない可能性があります。`,
    shopCandidates: [],
    isLoading: false,
  },
  decorators: [
    (Story) => (
      <div className="max-w-lg mx-auto bg-white p-4 rounded-lg shadow">
        <Story />
      </div>
    ),
  ],
};

export const WithLinks: Story = {
  args: {
    result: `## 候補

### CAFE HUDSON 新宿ミロード店

一言: 広々とした店内でベビーカーでも快適に過ごせる、子連れに優しいカフェです。

**指定日の営業**: ○（2026年1月8日は木曜日で、通常営業日です。）

**営業時間/定休日**: 月曜日〜日曜日 11:00〜22:00

**条件判定**:
- 必須条件: ✅（親子ウケ抜群のメニューあり、ベビーカーでの利用もしやすいとの記載あり）[macaro-ni.jp](https://macaro-ni.jp)
- 優先条件: ✅（座席間隔が広めなので、ベビーカーでの利用もしやすい）[macaro-ni.jp](https://macaro-ni.jp)

**重視ポイント**: ✅（広々とした店内が特徴で、綺麗に保たれていることが伺えます）[macaro-ni.jp](https://macaro-ni.jp)

**リンク**: [外部サイトで詳細を見る](https://example.com)
`,
    isLoading: false,
  },
  decorators: [
    (Story) => (
      <div className="max-w-lg mx-auto bg-white p-4 rounded-lg shadow">
        <Story />
      </div>
    ),
  ],
};
