import type { Meta, StoryObj } from "@storybook/react-vite";
import { CalendarDay } from "./CalendarDay";
import { fn } from "@storybook/test";
import type { Schedule } from "@ai-scheduler/shared";

const meta = {
  title: "Calendar/CalendarDay",
  component: CalendarDay,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  args: {
    onClick: fn(),
    onScheduleClick: fn(),
  },
} satisfies Meta<typeof CalendarDay>;

export default meta;
type Story = StoryObj<typeof meta>;

const createSchedule = (id: string, title: string): Schedule => ({
  id,
  title,
  startAt: "2026-01-10T10:00:00+09:00",
  endAt: null,
  createdAt: "2026-01-01T00:00:00+09:00",
  updatedAt: "2026-01-01T00:00:00+09:00",
});

export const Default: Story = {
  args: {
    date: new Date(2026, 0, 15),
    schedules: [],
    isToday: false,
    isCurrentMonth: true,
  },
  decorators: [
    (Story) => (
      <div className="w-32 border-l border-t">
        <Story />
      </div>
    ),
  ],
};

export const Today: Story = {
  args: {
    date: new Date(2026, 0, 15),
    schedules: [],
    isToday: true,
    isCurrentMonth: true,
  },
  decorators: [
    (Story) => (
      <div className="w-32 border-l border-t">
        <Story />
      </div>
    ),
  ],
};

export const OtherMonth: Story = {
  args: {
    date: new Date(2025, 11, 31),
    schedules: [],
    isToday: false,
    isCurrentMonth: false,
  },
  decorators: [
    (Story) => (
      <div className="w-32 border-l border-t">
        <Story />
      </div>
    ),
  ],
};

export const WithOneSchedule: Story = {
  args: {
    date: new Date(2026, 0, 10),
    schedules: [createSchedule("1", "ランチ")],
    isToday: false,
    isCurrentMonth: true,
  },
  decorators: [
    (Story) => (
      <div className="w-32 border-l border-t">
        <Story />
      </div>
    ),
  ],
};

export const WithMultipleSchedules: Story = {
  args: {
    date: new Date(2026, 0, 10),
    schedules: [
      createSchedule("1", "朝のミーティング"),
      createSchedule("2", "ランチ"),
      createSchedule("3", "カフェ"),
    ],
    isToday: false,
    isCurrentMonth: true,
  },
  decorators: [
    (Story) => (
      <div className="w-32 border-l border-t">
        <Story />
      </div>
    ),
  ],
};

export const WithManySchedules: Story = {
  args: {
    date: new Date(2026, 0, 10),
    schedules: [
      createSchedule("1", "朝のミーティング"),
      createSchedule("2", "ランチ"),
      createSchedule("3", "午後の会議"),
      createSchedule("4", "夕方の打ち合わせ"),
      createSchedule("5", "夜のイベント"),
    ],
    isToday: false,
    isCurrentMonth: true,
  },
  decorators: [
    (Story) => (
      <div className="w-32 border-l border-t">
        <Story />
      </div>
    ),
  ],
};

export const TodayWithSchedules: Story = {
  args: {
    date: new Date(2026, 0, 15),
    schedules: [
      createSchedule("1", "今日の予定"),
      createSchedule("2", "ミーティング"),
    ],
    isToday: true,
    isCurrentMonth: true,
  },
  decorators: [
    (Story) => (
      <div className="w-32 border-l border-t">
        <Story />
      </div>
    ),
  ],
};

export const WeekView: Story = {
  render: () => (
    <div className="flex border-l border-t">
      {[12, 13, 14, 15, 16, 17, 18].map((day, i) => (
        <div key={day} className="w-32">
          <CalendarDay
            date={new Date(2026, 0, day)}
            schedules={
              day === 15
                ? [createSchedule("1", "今日の予定")]
                : day === 17
                  ? [
                      createSchedule("2", "ランチ"),
                      createSchedule("3", "カフェ"),
                    ]
                  : []
            }
            isToday={day === 15}
            isCurrentMonth={true}
            onClick={fn()}
            onScheduleClick={fn()}
          />
        </div>
      ))}
    </div>
  ),
};
