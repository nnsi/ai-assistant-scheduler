import { useState } from "react";
import { Calendar } from "@/components/Calendar/Calendar";
import { CalendarHeader } from "@/components/Calendar/CalendarHeader";
import { ScheduleFormModal } from "@/components/Schedule/ScheduleFormModal";
import { SchedulePopup } from "@/components/Schedule/SchedulePopup";
import { useSchedules } from "@/hooks/useSchedules";
import { addMonths, subMonths } from "@/lib/date";
import type { Schedule } from "@ai-scheduler/shared";

function App() {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedSchedule, setSelectedSchedule] = useState<Schedule | null>(
    null
  );
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isPopupOpen, setIsPopupOpen] = useState(false);

  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth() + 1;

  const { schedules, remove, refetch } = useSchedules(year, month);

  const handlePreviousMonth = () => {
    setCurrentMonth(subMonths(currentMonth, 1));
  };

  const handleNextMonth = () => {
    setCurrentMonth(addMonths(currentMonth, 1));
  };

  const handleToday = () => {
    setCurrentMonth(new Date());
  };

  const handleDateClick = (date: Date) => {
    setSelectedDate(date);
    setIsFormModalOpen(true);
  };

  const handleScheduleClick = (schedule: Schedule) => {
    setSelectedSchedule(schedule);
    setIsPopupOpen(true);
  };

  const handleScheduleCreated = () => {
    refetch();
    setIsFormModalOpen(false);
  };

  const handleScheduleEdit = (_schedule: Schedule) => {
    // TODO: 編集モーダルを実装
    setIsPopupOpen(false);
  };

  const handleScheduleDelete = (id: string) => {
    remove(id);
    setIsPopupOpen(false);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <h1 className="text-xl font-semibold text-gray-900">
            AI Assistant Scheduler
          </h1>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        <CalendarHeader
          currentMonth={currentMonth}
          onPreviousMonth={handlePreviousMonth}
          onNextMonth={handleNextMonth}
          onToday={handleToday}
        />
        <Calendar
          currentMonth={currentMonth}
          schedules={schedules}
          onDateClick={handleDateClick}
          onScheduleClick={handleScheduleClick}
        />
      </main>

      <ScheduleFormModal
        isOpen={isFormModalOpen}
        onClose={() => setIsFormModalOpen(false)}
        defaultDate={selectedDate || undefined}
        onScheduleCreated={handleScheduleCreated}
      />

      <SchedulePopup
        schedule={selectedSchedule}
        isOpen={isPopupOpen}
        onClose={() => setIsPopupOpen(false)}
        onEdit={handleScheduleEdit}
        onDelete={handleScheduleDelete}
      />
    </div>
  );
}

export default App;
