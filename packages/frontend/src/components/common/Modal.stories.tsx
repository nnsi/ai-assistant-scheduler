import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import { Button } from "./Button";
import { Modal } from "./Modal";

const meta = {
  title: "Common/Modal",
  component: Modal,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  argTypes: {
    size: {
      control: "select",
      options: ["sm", "md", "lg"],
    },
  },
} satisfies Meta<typeof Modal>;

export default meta;
type Story = StoryObj<typeof meta>;

const ModalDemo = ({
  title,
  size,
  children,
}: {
  title?: string;
  size?: "sm" | "md" | "lg";
  children?: React.ReactNode;
}) => {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <>
      <Button onClick={() => setIsOpen(true)}>モーダルを開く</Button>
      <Modal isOpen={isOpen} onClose={() => setIsOpen(false)} title={title} size={size}>
        {children || <p className="text-gray-600">モーダルの内容がここに表示されます。</p>}
      </Modal>
    </>
  );
};

export const Default: Story = {
  render: () => <ModalDemo title="モーダルタイトル" />,
};

export const Small: Story = {
  render: () => (
    <ModalDemo title="小さいモーダル" size="sm">
      <p className="text-gray-600">小さいサイズのモーダルです。</p>
    </ModalDemo>
  ),
};

export const Large: Story = {
  render: () => (
    <ModalDemo title="大きいモーダル" size="lg">
      <p className="text-gray-600">
        大きいサイズのモーダルです。より多くのコンテンツを表示できます。
      </p>
    </ModalDemo>
  ),
};

export const WithoutTitle: Story = {
  render: () => (
    <ModalDemo>
      <div className="text-center py-4">
        <p className="text-gray-600 mb-4">タイトルなしのモーダルです。</p>
        <Button variant="secondary">閉じる</Button>
      </div>
    </ModalDemo>
  ),
};

export const WithForm: Story = {
  render: () => (
    <ModalDemo title="予定を追加">
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">タイトル</label>
          <input
            type="text"
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
            placeholder="予定のタイトル"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">日時</label>
          <input
            type="datetime-local"
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
          />
        </div>
        <div className="flex justify-end gap-2 pt-4">
          <Button variant="secondary">キャンセル</Button>
          <Button>保存</Button>
        </div>
      </div>
    </ModalDemo>
  ),
};

export const Confirmation: Story = {
  render: () => (
    <ModalDemo title="削除の確認" size="sm">
      <div className="space-y-4">
        <p className="text-gray-600">
          この予定を削除してもよろしいですか？この操作は取り消せません。
        </p>
        <div className="flex justify-end gap-2">
          <Button variant="secondary">キャンセル</Button>
          <Button variant="danger">削除する</Button>
        </div>
      </div>
    </ModalDemo>
  ),
};
