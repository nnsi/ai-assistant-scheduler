import { useState, useEffect } from "react";
import { Calendar } from "@/components/Calendar/Calendar";
import { CalendarHeader, type CalendarViewMode } from "@/components/Calendar/CalendarHeader";
import { CalendarWeekView } from "@/components/Calendar/CalendarWeekView";
import { CalendarDayView } from "@/components/Calendar/CalendarDayView";
import { ScheduleFormModal } from "@/components/Schedule/ScheduleFormModal";
import { SchedulePopup } from "@/components/Schedule/SchedulePopup";
import { ScheduleEditModal } from "@/components/Schedule/ScheduleEditModal";
import { CategoryModal } from "@/components/Category/CategoryModal";
import { SearchModal } from "@/components/Schedule/SearchModal";
import { LoginPage, AuthCallback, ReconnectCallback, ProfileSettingsModal } from "@/components/Auth";
import { ConditionsModal } from "@/components/Profile";
import { useSchedules } from "@/hooks/useSchedules";
import { useAuth } from "@/contexts/AuthContext";
import { addMonths, subMonths, addWeeks, subWeeks, addDays, subDays } from "@/lib/date";
import { CalendarDays, X } from "lucide-react";
import type { Schedule, UpdateScheduleInput } from "@ai-scheduler/shared";

function MainApp() {
  const { user } = useAuth();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<CalendarViewMode>("month");
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [selectedSchedule, setSelectedSchedule] = useState<Schedule | null>(
    null
  );
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isPopupOpen, setIsPopupOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState<Schedule | null>(null);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isConditionsModalOpen, setIsConditionsModalOpen] = useState(false);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // URLパラメータから通知を取得
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const success = params.get("success");
    const error = params.get("error");
    if (success) {
      setNotification({ type: 'success', message: decodeURIComponent(success) });
      window.history.replaceState({}, "", window.location.pathname);
    } else if (error) {
      setNotification({ type: 'error', message: decodeURIComponent(error) });
      window.history.replaceState({}, "", window.location.pathname);
    }
  }, []);

  // 通知を3秒後に自動で消す
  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => setNotification(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth() + 1;

  const { schedules, update, remove, refetch } = useSchedules(year, month);

  const handlePrevious = () => {
    switch (viewMode) {
      case "month":
        setCurrentDate(subMonths(currentDate, 1));
        break;
      case "week":
        setCurrentDate(subWeeks(currentDate, 1));
        break;
      case "day":
        setCurrentDate(subDays(currentDate, 1));
        break;
    }
  };

  const handleNext = () => {
    switch (viewMode) {
      case "month":
        setCurrentDate(addMonths(currentDate, 1));
        break;
      case "week":
        setCurrentDate(addWeeks(currentDate, 1));
        break;
      case "day":
        setCurrentDate(addDays(currentDate, 1));
        break;
    }
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  const handleViewModeChange = (mode: CalendarViewMode) => {
    setViewMode(mode);
  };

  const handleDateClick = (date: Date) => {
    setSelectedDate(date);
    setSelectedTime(null);
    setIsFormModalOpen(true);
  };

  const handleTimeSlotClick = (date: Date, hour: number) => {
    setSelectedDate(date);
    setSelectedTime(`${hour.toString().padStart(2, "0")}:00`);
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

  const handleScheduleEdit = (schedule: Schedule) => {
    setEditingSchedule(schedule);
    setIsPopupOpen(false);
    setIsEditModalOpen(true);
  };

  const handleScheduleSave = async (id: string, input: UpdateScheduleInput): Promise<void> => {
    await update(id, input);
    refetch();
  };

  const handleScheduleDelete = async (id: string): Promise<void> => {
    await remove(id);
  };

  return (
    <div className="h-screen bg-surface flex flex-col overflow-hidden">
      {/* 通知バー */}
      {notification && (
        <div
          className={`fixed top-0 left-0 right-0 z-50 px-4 py-3 text-center animate-slide-up ${
            notification.type === 'success'
              ? 'bg-emerald-500 text-white'
              : 'bg-red-500 text-white'
          }`}
        >
          <span className="font-medium">{notification.message}</span>
          <button
            onClick={() => setNotification(null)}
            className="ml-4 p-1 hover:bg-white/20 rounded-lg transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* ヘッダー */}
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-xl border-b border-stone-200/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 sm:py-4">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-accent to-accent-dark flex items-center justify-center shadow-sm">
                <CalendarDays className="w-5 h-5 text-white" />
              </div>
              <h1 className="text-lg sm:text-xl font-display text-stone-900">
                AI Scheduler
              </h1>
            </div>

            {/* User Menu */}
            {user && (
              <button
                onClick={() => setIsProfileModalOpen(true)}
                className="flex items-center gap-2 hover:bg-stone-100 rounded-xl px-2 py-1.5 transition-colors"
              >
                {user.picture ? (
                  <img
                    src={user.picture}
                    alt={user.name}
                    className="w-8 h-8 rounded-full ring-2 ring-white shadow-sm"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-accent/10 flex items-center justify-center">
                    <span className="text-sm font-medium text-accent">
                      {user.name.charAt(0)}
                    </span>
                  </div>
                )}
                <span className="hidden sm:block text-sm font-medium text-stone-700">
                  {user.name}
                </span>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* メインコンテンツ */}
      <main className="flex-1 flex flex-col max-w-7xl mx-auto w-full px-2 sm:px-6 py-2 sm:py-4 overflow-hidden">
        <CalendarHeader
          currentDate={currentDate}
          viewMode={viewMode}
          onPrevious={handlePrevious}
          onNext={handleNext}
          onToday={handleToday}
          onViewModeChange={handleViewModeChange}
          onSearchClick={() => setIsSearchModalOpen(true)}
          onCategoryClick={() => setIsCategoryModalOpen(true)}
          onConditionsClick={() => setIsConditionsModalOpen(true)}
        />
        {viewMode === "month" && (
          <Calendar
            currentMonth={currentDate}
            schedules={schedules}
            onDateClick={handleDateClick}
            onScheduleClick={handleScheduleClick}
          />
        )}
        {viewMode === "week" && (
          <CalendarWeekView
            currentDate={currentDate}
            schedules={schedules}
            onTimeSlotClick={handleTimeSlotClick}
            onScheduleClick={handleScheduleClick}
          />
        )}
        {viewMode === "day" && (
          <CalendarDayView
            currentDate={currentDate}
            schedules={schedules}
            onTimeSlotClick={handleTimeSlotClick}
            onScheduleClick={handleScheduleClick}
          />
        )}
      </main>

      <ScheduleFormModal
        isOpen={isFormModalOpen}
        onClose={() => setIsFormModalOpen(false)}
        defaultDate={selectedDate || undefined}
        defaultTime={selectedTime || undefined}
        onScheduleCreated={handleScheduleCreated}
      />

      <SchedulePopup
        schedule={selectedSchedule}
        isOpen={isPopupOpen}
        onClose={() => setIsPopupOpen(false)}
        onEdit={handleScheduleEdit}
        onDelete={handleScheduleDelete}
      />

      <ScheduleEditModal
        schedule={editingSchedule}
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onSave={handleScheduleSave}
      />

      <ProfileSettingsModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
      />

      <ConditionsModal
        isOpen={isConditionsModalOpen}
        onClose={() => setIsConditionsModalOpen(false)}
      />

      <CategoryModal
        isOpen={isCategoryModalOpen}
        onClose={() => setIsCategoryModalOpen(false)}
      />

      <SearchModal
        isOpen={isSearchModalOpen}
        onClose={() => setIsSearchModalOpen(false)}
        onScheduleClick={handleScheduleClick}
      />
    </div>
  );
}

function App() {
  const { isAuthenticated, isLoading } = useAuth();

  // OAuth コールバックのルーティング
  if (window.location.pathname === "/auth/callback") {
    return <AuthCallback />;
  }

  // Google再認証コールバックのルーティング
  if (window.location.pathname === "/auth/reconnect-callback") {
    return <ReconnectCallback />;
  }

  // 読み込み中
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-accent to-accent-dark flex items-center justify-center animate-pulse">
            <CalendarDays className="w-6 h-6 text-white" />
          </div>
          <div className="text-stone-500 text-sm">読み込み中...</div>
        </div>
      </div>
    );
  }

  // 未認証の場合はログインページを表示
  if (!isAuthenticated) {
    return <LoginPage />;
  }

  // 認証済みの場合はメインアプリを表示
  return <MainApp />;
}

export default App;
