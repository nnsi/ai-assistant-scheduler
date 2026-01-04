import { useState, useEffect } from "react";
import { Calendar } from "@/components/Calendar/Calendar";
import { CalendarHeader } from "@/components/Calendar/CalendarHeader";
import { ScheduleFormModal } from "@/components/Schedule/ScheduleFormModal";
import { SchedulePopup } from "@/components/Schedule/SchedulePopup";
import { LoginPage, AuthCallback, ReconnectCallback, ProfileSettingsModal } from "@/components/Auth";
import { ConditionsModal } from "@/components/Profile";
import { useSchedules } from "@/hooks/useSchedules";
import { useAuth } from "@/contexts/AuthContext";
import { addMonths, subMonths } from "@/lib/date";
import type { Schedule } from "@ai-scheduler/shared";

function MainApp() {
  const { user, logout } = useAuth();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedSchedule, setSelectedSchedule] = useState<Schedule | null>(
    null
  );
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isPopupOpen, setIsPopupOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isConditionsModalOpen, setIsConditionsModalOpen] = useState(false);
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

  const handleScheduleDelete = async (id: string): Promise<void> => {
    await remove(id);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 通知バー */}
      {notification && (
        <div
          className={`fixed top-0 left-0 right-0 z-50 px-4 py-3 text-center ${
            notification.type === 'success'
              ? 'bg-green-500 text-white'
              : 'bg-red-500 text-white'
          }`}
        >
          {notification.message}
          <button
            onClick={() => setNotification(null)}
            className="ml-4 text-white/80 hover:text-white"
          >
            ×
          </button>
        </div>
      )}

      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-2 sm:px-4 py-3 sm:py-4 flex items-center justify-between">
          <h1 className="text-base sm:text-xl font-semibold text-gray-900">
            AI Scheduler
          </h1>
          <div className="flex items-center gap-2 sm:gap-4">
            {user && (
              <>
                <button
                  onClick={() => setIsProfileModalOpen(true)}
                  className="flex items-center gap-2 hover:bg-gray-100 rounded-lg px-2 py-1 transition-colors"
                >
                  {user.picture && (
                    <img
                      src={user.picture}
                      alt={user.name}
                      className="w-8 h-8 rounded-full"
                    />
                  )}
                  <span className="hidden sm:inline text-sm text-gray-700">{user.name}</span>
                </button>
                <button
                  onClick={logout}
                  className="text-xs sm:text-sm text-gray-500 hover:text-gray-700"
                >
                  ログアウト
                </button>
              </>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-2 sm:px-4 py-4 sm:py-8">
        <CalendarHeader
          currentMonth={currentMonth}
          onPreviousMonth={handlePreviousMonth}
          onNextMonth={handleNextMonth}
          onToday={handleToday}
          onConditionsClick={() => setIsConditionsModalOpen(true)}
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

      <ProfileSettingsModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
      />

      <ConditionsModal
        isOpen={isConditionsModalOpen}
        onClose={() => setIsConditionsModalOpen(false)}
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
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
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
