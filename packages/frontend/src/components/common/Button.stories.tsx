import type { Meta, StoryObj } from "@storybook/react-vite";
import { Button } from "./Button";
import { Trash2, Edit, Plus } from "lucide-react";

const meta = {
  title: "Common/Button",
  component: Button,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  argTypes: {
    variant: {
      control: "select",
      options: ["primary", "secondary", "danger", "ghost"],
    },
    size: {
      control: "select",
      options: ["sm", "md", "lg"],
    },
    isLoading: {
      control: "boolean",
    },
    disabled: {
      control: "boolean",
    },
  },
} satisfies Meta<typeof Button>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Primary: Story = {
  args: {
    children: "ボタン",
    variant: "primary",
  },
};

export const Secondary: Story = {
  args: {
    children: "キャンセル",
    variant: "secondary",
  },
};

export const Danger: Story = {
  args: {
    children: "削除",
    variant: "danger",
  },
};

export const Ghost: Story = {
  args: {
    children: "編集",
    variant: "ghost",
  },
};

export const Small: Story = {
  args: {
    children: "小さいボタン",
    size: "sm",
  },
};

export const Large: Story = {
  args: {
    children: "大きいボタン",
    size: "lg",
  },
};

export const Loading: Story = {
  args: {
    children: "保存中...",
    isLoading: true,
  },
};

export const Disabled: Story = {
  args: {
    children: "無効",
    disabled: true,
  },
};

export const WithIcon: Story = {
  render: () => (
    <div className="flex gap-2">
      <Button variant="primary" size="sm">
        <Plus className="w-4 h-4 mr-1" />
        追加
      </Button>
      <Button variant="secondary" size="sm">
        <Edit className="w-4 h-4 mr-1" />
        編集
      </Button>
      <Button variant="danger" size="sm">
        <Trash2 className="w-4 h-4 mr-1" />
        削除
      </Button>
    </div>
  ),
};

export const AllVariants: Story = {
  render: () => (
    <div className="flex flex-col gap-4">
      <div className="flex gap-2 items-center">
        <span className="w-20 text-sm text-gray-500">Primary</span>
        <Button variant="primary" size="sm">Small</Button>
        <Button variant="primary" size="md">Medium</Button>
        <Button variant="primary" size="lg">Large</Button>
      </div>
      <div className="flex gap-2 items-center">
        <span className="w-20 text-sm text-gray-500">Secondary</span>
        <Button variant="secondary" size="sm">Small</Button>
        <Button variant="secondary" size="md">Medium</Button>
        <Button variant="secondary" size="lg">Large</Button>
      </div>
      <div className="flex gap-2 items-center">
        <span className="w-20 text-sm text-gray-500">Danger</span>
        <Button variant="danger" size="sm">Small</Button>
        <Button variant="danger" size="md">Medium</Button>
        <Button variant="danger" size="lg">Large</Button>
      </div>
      <div className="flex gap-2 items-center">
        <span className="w-20 text-sm text-gray-500">Ghost</span>
        <Button variant="ghost" size="sm">Small</Button>
        <Button variant="ghost" size="md">Medium</Button>
        <Button variant="ghost" size="lg">Large</Button>
      </div>
    </div>
  ),
};
