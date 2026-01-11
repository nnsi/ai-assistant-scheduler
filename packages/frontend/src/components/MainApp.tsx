import { useState, useEffect, useMemo } from "react";
import { Calendar } from "@/components/Calendar/Calendar";
import { CalendarHeader, type CalendarViewMode } from "@/components/Calendar/CalendarHeader";
import { CalendarWeekView } from "@/components/Calendar/CalendarWeekView";
import { CalendarDayView } from "@/components/Calendar/CalendarDayView";
import { ScheduleFormModal } from "@/components/Schedule/ScheduleFormModal";
import { SchedulePopup } from "@/components/Schedule/SchedulePopup";
import { ScheduleEditModal } from "@/components/Schedule/ScheduleEditModal";
import { CategoryModal } from "@/components/Category/CategoryModal";
import { SearchModal } from "@/components/Schedule/SearchModal";
import { ProfileSettingsModal } from "@/components/Auth";
import { ConditionsModal } from "@/components/Profile";
import {
  CalendarCreateModal,
  CalendarSettingsModal,
  CalendarManagementModal,
} from "@/components/CalendarManagement";
import {
  MemberListModal,
  InviteMemberModal,
  InviteLinkModal,
} from "@/components/CalendarSharing";
import { useSchedules } from "@/hooks/useSchedules";
import { useModalManager } from "@/hooks/useModalManager";
import { useAuth } from "@/contexts/AuthContext";
import { useCalendarContext } from "@/contexts/CalendarContext";
import { addMonths, subMonths, addWeeks, subWeeks, addDays, subDays } from "@/lib/date";
import { CalendarDays, X } from "lucide-react";
import type { Schedule, UpdateScheduleInput } from "@ai-scheduler/shared";

export function MainApp() {
  const { user } = useAuth();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<CalendarViewMode>("month");
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const modal = useModalManager();

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

  // 通知を5秒後に自動で消す
  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => setNotification(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth() + 1;

  const { schedules, update, remove, refetch } = useSchedules(year, month);
  const { selectedCalendarIds } = useCalendarContext();

  // 選択されたカレンダーの予定のみ表示
  const filteredSchedules = useMemo(() => {
    if (selectedCalendarIds.length === 0) return schedules;
    return schedules.filter(
      (s) => s.calendarId && selectedCalendarIds.includes(s.calendarId)
    );
  }, [schedules, selectedCalendarIds]);

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
    modal.openScheduleForm(date, null);
  };

  const handleTimeSlotClick = (date: Date, hour: number) => {
    modal.openScheduleForm(date, `${hour.toString().padStart(2, "0")}:00`);
  };

  const handleScheduleClick = (schedule: Schedule) => {
    modal.openSchedulePopup(schedule);
  };

  const handleScheduleCreated = () => {
    refetch();
    modal.closeModal("scheduleForm");
  };

  const handleScheduleEdit = (schedule: Schedule) => {
    modal.openScheduleEdit(schedule);
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
                onClick={() => modal.openModal("profile")}
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
          onSearchClick={() => modal.openModal("search")}
          onCategoryClick={() => modal.openModal("category")}
          onConditionsClick={() => modal.openModal("conditions")}
          onCalendarManageClick={() => modal.openModal("calendarManagement")}
        />
        {viewMode === "month" && (
          <Calendar
            currentMonth={currentDate}
            schedules={filteredSchedules}
            onDateClick={handleDateClick}
            onScheduleClick={handleScheduleClick}
          />
        )}
        {viewMode === "week" && (
          <CalendarWeekView
            currentDate={currentDate}
            schedules={filteredSchedules}
            onTimeSlotClick={handleTimeSlotClick}
            onScheduleClick={handleScheduleClick}
          />
        )}
        {viewMode === "day" && (
          <CalendarDayView
            currentDate={currentDate}
            schedules={filteredSchedules}
            onTimeSlotClick={handleTimeSlotClick}
            onScheduleClick={handleScheduleClick}
          />
        )}
      </main>

      <ScheduleFormModal
        isOpen={modal.isOpen("scheduleForm")}
        onClose={() => modal.closeModal("scheduleForm")}
        defaultDate={modal.state.defaultDate || undefined}
        defaultTime={modal.state.defaultTime || undefined}
        onScheduleCreated={handleScheduleCreated}
      />

      <SchedulePopup
        schedule={modal.state.selectedSchedule}
        isOpen={modal.isOpen("schedulePopup")}
        onClose={() => modal.closeModal("schedulePopup")}
        onEdit={handleScheduleEdit}
        onDelete={handleScheduleDelete}
      />

      <ScheduleEditModal
        schedule={modal.state.editingSchedule}
        isOpen={modal.isOpen("scheduleEdit")}
        onClose={() => modal.closeModal("scheduleEdit")}
        onSave={handleScheduleSave}
      />

      <ProfileSettingsModal
        isOpen={modal.isOpen("profile")}
        onClose={() => modal.closeModal("profile")}
      />

      <ConditionsModal
        isOpen={modal.isOpen("conditions")}
        onClose={() => modal.closeModal("conditions")}
      />

      <CategoryModal
        isOpen={modal.isOpen("category")}
        onClose={() => modal.closeModal("category")}
      />

      <SearchModal
        isOpen={modal.isOpen("search")}
        onClose={() => modal.closeModal("search")}
        onScheduleClick={handleScheduleClick}
      />

      <CalendarManagementModal
        isOpen={modal.isOpen("calendarManagement")}
        onClose={() => modal.closeModal("calendarManagement")}
        onCreateClick={() => modal.openModal("calendarCreate")}
        onSettingsClick={(id) => modal.openCalendarSettings(id)}
      />

      <CalendarCreateModal
        isOpen={modal.isOpen("calendarCreate")}
        onClose={() => modal.closeModal("calendarCreate")}
      />

      <CalendarSettingsModal
        calendarId={modal.state.settingsCalendarId}
        isOpen={modal.isOpen("calendarSettings")}
        onClose={() => modal.closeModal("calendarSettings")}
        onMembersClick={() => {
          if (modal.state.settingsCalendarId) {
            modal.openMemberList(modal.state.settingsCalendarId);
          }
        }}
        onInvitationsClick={() => {
          if (modal.state.settingsCalendarId) {
            modal.openInviteLink(modal.state.settingsCalendarId);
          }
        }}
      />

      <MemberListModal
        calendarId={modal.state.membersCalendarId}
        isOpen={modal.isOpen("memberList")}
        onClose={() => modal.closeModal("memberList")}
      />

      <InviteMemberModal
        calendarId={modal.state.inviteMemberCalendarId}
        isOpen={modal.isOpen("inviteMember")}
        onClose={() => modal.closeModal("inviteMember")}
      />

      <InviteLinkModal
        calendarId={modal.state.inviteLinkCalendarId}
        isOpen={modal.isOpen("inviteLink")}
        onClose={() => modal.closeModal("inviteLink")}
      />
    </div>
  );
}
