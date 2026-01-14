import type { Meta, StoryObj } from "@storybook/react-vite";
import { MarkdownRenderer } from "./MarkdownRenderer";

const meta = {
  title: "Common/MarkdownRenderer",
  component: MarkdownRenderer,
  parameters: {
    layout: "padded",
  },
  tags: ["autodocs"],
} satisfies Meta<typeof MarkdownRenderer>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    content: `# 見出し1

## 見出し2

### 見出し3

これは**太字**と*イタリック*のテキストです。

- リスト項目1
- リスト項目2
- リスト項目3

1. 番号付きリスト1
2. 番号付きリスト2
3. 番号付きリスト3

[リンクのサンプル](https://example.com)

---

> 引用テキストです。
`,
  },
};

export const SearchResult: Story = {
  args: {
    content: `## おすすめスポット

### 1. J.S. PANCAKE CAFE マークイズみなとみらい店

- ふわふわのパンケーキが楽しめるカフェ。ソファー席やベビーチェアも完備されており、ベビーカーでの入店も歓迎されています。
- **営業時間**: 10:00〜21:00 (L.O. 20:00)
- **定休日**: 不定休
- **指定日の営業**: ○営業
- [公式サイト](https://example.com) / [食べログ](https://tabelog.com)

### 2. RHC CAFE MARK IS みなとみらい

- ロンハーマン併設のおしゃれなカフェ。ソファ席が多く、ベビーカーでの入店も歓迎されており、ゆったりと過ごせます。
- **営業時間**: 10:00〜20:00
- **定休日**: 不定休
- **指定日の営業**: ○営業
- [公式サイト](https://example.com) / [ベビーカログ](https://example.com)
`,
  },
};

export const WithConditions: Story = {
  args: {
    content: `## 候補（最大5件・必須条件クリアのみ）

### KICHIRI MOLLIS 新宿通り

一言: 新宿駅直結でベビーカーでもアクセスしやすく、子連れに配慮された空間が魅力です。

**指定日の営業**: ○（2026年1月10日は土曜日のため営業）

**営業時間/定休日**: 月〜日 11:00〜16:00, 17:00〜23:00 / 定休日: 元旦

**条件判定**:
- 必須条件: ✅ 子連れOK [macaro-ni.jp](https://macaro-ni.jp), [comolib.com](https://comolib.com)
- 優先条件: ✅ ベビーカーOK（ベビーカーでも快適に来店できるとの記載あり）[macaro-ni.jp](https://macaro-ni.jp)

**重視ポイント**: ✅ 店内が綺麗（「新しくてとてもおしゃれなレストラン」との口コミあり）[comolib.com](https://comolib.com)

**リンク**: ぐるなび, macaro-ni.jp, comolib.com
`,
  },
};

export const SimpleText: Story = {
  args: {
    content:
      "土曜日は営業している店舗が多いですが、年末年始の特別営業期間にあたる可能性もあるため、各店舗の公式サイト等で最終確認をお願いいたします。",
  },
};

export const WithCodeBlock: Story = {
  args: {
    content: `## コードサンプル

インラインコードは \`code\` のように表示されます。

\`\`\`javascript
function greet(name) {
  console.log(\`Hello, \${name}!\`);
}

greet('World');
\`\`\`
`,
  },
};

export const InCard: Story = {
  render: () => (
    <div className="bg-purple-50 rounded-lg p-4 max-w-lg">
      <h4 className="text-sm font-medium text-purple-900 mb-2">AI検索結果</h4>
      <MarkdownRenderer
        content={`2026年1月10日(土)に横浜・みなとみらいで子連れ・ベビーカーOKで、店内が綺麗なカフェをお探しですね。

## おすすめスポット

### 1. Bills 横浜赤レンガ倉庫

- 世界一の朝食で有名なカフェ。開放的な店内でベビーカーでも入店しやすい。
- **営業時間**: 9:00〜21:00
- [公式サイト](https://example.com)
`}
        className="text-sm"
      />
    </div>
  ),
};
