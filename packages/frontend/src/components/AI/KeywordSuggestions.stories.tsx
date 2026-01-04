import type { Meta, StoryObj } from "@storybook/react-vite";
import { KeywordSuggestions } from "./KeywordSuggestions";
import { fn } from "@storybook/test";

const meta = {
  title: "AI/KeywordSuggestions",
  component: KeywordSuggestions,
  parameters: {
    layout: "padded",
  },
  tags: ["autodocs"],
  args: {
    onSelect: fn(),
    onSkip: fn(),
  },
} satisfies Meta<typeof KeywordSuggestions>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    keywords: [
      "子連れOK",
      "ベビーカーOK",
      "個室あり",
      "駐車場あり",
      "キッズメニュー",
      "離乳食持ち込みOK",
    ],
    isLoading: false,
    hasConditions: false,
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
    keywords: [],
    isLoading: true,
    hasConditions: false,
  },
  decorators: [
    (Story) => (
      <div className="max-w-lg mx-auto bg-white p-4 rounded-lg shadow">
        <Story />
      </div>
    ),
  ],
};

export const WithConditions: Story = {
  args: {
    keywords: [
      "営業時間",
      "予約可能",
      "クレジットカード",
      "Wi-Fi完備",
    ],
    isLoading: false,
    hasConditions: true,
  },
  decorators: [
    (Story) => (
      <div className="max-w-lg mx-auto bg-white p-4 rounded-lg shadow">
        <Story />
      </div>
    ),
  ],
};

export const ManyKeywords: Story = {
  args: {
    keywords: [
      "子連れOK",
      "ベビーカーOK",
      "個室あり",
      "駐車場あり",
      "キッズメニュー",
      "離乳食持ち込みOK",
      "授乳室",
      "おむつ交換台",
      "禁煙",
      "テラス席",
      "ソファ席",
      "予約可能",
    ],
    isLoading: false,
    hasConditions: false,
  },
  decorators: [
    (Story) => (
      <div className="max-w-lg mx-auto bg-white p-4 rounded-lg shadow">
        <Story />
      </div>
    ),
  ],
};

export const FewKeywords: Story = {
  args: {
    keywords: ["営業時間", "アクセス"],
    isLoading: false,
    hasConditions: false,
  },
  decorators: [
    (Story) => (
      <div className="max-w-lg mx-auto bg-white p-4 rounded-lg shadow">
        <Story />
      </div>
    ),
  ],
};

export const Searching: Story = {
  args: {
    keywords: [
      "子連れOK",
      "ベビーカーOK",
      "個室あり",
      "駐車場あり",
    ],
    isLoading: false,
    isSearching: true,
    hasConditions: false,
  },
  decorators: [
    (Story) => (
      <div className="max-w-lg mx-auto bg-white p-4 rounded-lg shadow">
        <Story />
      </div>
    ),
  ],
};

export const Regenerating: Story = {
  args: {
    keywords: [
      "子連れOK",
      "ベビーカーOK",
      "個室あり",
      "駐車場あり",
    ],
    isLoading: false,
    isRegenerating: true,
    hasConditions: false,
    onRegenerate: fn(),
  },
  decorators: [
    (Story) => (
      <div className="max-w-lg mx-auto bg-white p-4 rounded-lg shadow">
        <Story />
      </div>
    ),
  ],
};
