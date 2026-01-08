import {
  createContext,
  useContext,
  useState,
  useEffect,
  type ReactNode,
} from "react";
import type { CalendarResponse } from "@ai-scheduler/shared";
import { useCalendars } from "../hooks/useCalendars";

interface CalendarContextValue {
  calendars: CalendarResponse[];
  isLoading: boolean;
  selectedCalendarIds: string[];
  defaultCalendarId: string | null;
  toggleCalendar: (id: string) => void;
  selectAllCalendars: () => void;
  selectOnlyCalendar: (id: string) => void;
  setDefaultCalendar: (id: string) => void;
  getCalendarById: (id: string) => CalendarResponse | undefined;
}

const CalendarContext = createContext<CalendarContextValue | null>(null);

const STORAGE_KEY_SELECTED = "calendar_selected_ids";
const STORAGE_KEY_DEFAULT = "calendar_default_id";

export const CalendarProvider = ({ children }: { children: ReactNode }) => {
  const { data: calendars = [], isLoading } = useCalendars();
  const [selectedCalendarIds, setSelectedCalendarIds] = useState<string[]>([]);
  const [defaultCalendarId, setDefaultCalendarIdState] = useState<string | null>(
    null
  );

  // ローカルストレージから初期値を読み込み
  useEffect(() => {
    const storedSelected = localStorage.getItem(STORAGE_KEY_SELECTED);
    const storedDefault = localStorage.getItem(STORAGE_KEY_DEFAULT);

    if (storedSelected) {
      try {
        setSelectedCalendarIds(JSON.parse(storedSelected));
      } catch {
        // パースエラーは無視
      }
    }

    if (storedDefault) {
      setDefaultCalendarIdState(storedDefault);
    }
  }, []);

  // カレンダー一覧が読み込まれたら、選択状態を検証・初期化
  useEffect(() => {
    if (calendars.length === 0) return;

    // 有効なカレンダーIDのみ保持
    const validIds = calendars.map((c) => c.id);
    const validSelectedIds = selectedCalendarIds.filter((id) =>
      validIds.includes(id)
    );

    // 選択がない場合は全て選択
    if (validSelectedIds.length === 0) {
      setSelectedCalendarIds(validIds);
      localStorage.setItem(STORAGE_KEY_SELECTED, JSON.stringify(validIds));
    } else if (validSelectedIds.length !== selectedCalendarIds.length) {
      setSelectedCalendarIds(validSelectedIds);
      localStorage.setItem(STORAGE_KEY_SELECTED, JSON.stringify(validSelectedIds));
    }

    // デフォルトカレンダーが未設定または無効の場合、最初のオーナーカレンダーをデフォルトに
    if (!defaultCalendarId || !validIds.includes(defaultCalendarId)) {
      const ownedCalendar = calendars.find((c) => c.role === "owner");
      const newDefault = ownedCalendar?.id ?? calendars[0]?.id ?? null;
      if (newDefault) {
        setDefaultCalendarIdState(newDefault);
        localStorage.setItem(STORAGE_KEY_DEFAULT, newDefault);
      }
    }
  }, [calendars, selectedCalendarIds, defaultCalendarId]);

  const toggleCalendar = (id: string) => {
    setSelectedCalendarIds((prev) => {
      const newIds = prev.includes(id)
        ? prev.filter((cid) => cid !== id)
        : [...prev, id];
      localStorage.setItem(STORAGE_KEY_SELECTED, JSON.stringify(newIds));
      return newIds;
    });
  };

  const selectAllCalendars = () => {
    const allIds = calendars.map((c) => c.id);
    setSelectedCalendarIds(allIds);
    localStorage.setItem(STORAGE_KEY_SELECTED, JSON.stringify(allIds));
  };

  const selectOnlyCalendar = (id: string) => {
    setSelectedCalendarIds([id]);
    localStorage.setItem(STORAGE_KEY_SELECTED, JSON.stringify([id]));
  };

  const setDefaultCalendar = (id: string) => {
    setDefaultCalendarIdState(id);
    localStorage.setItem(STORAGE_KEY_DEFAULT, id);
  };

  const getCalendarById = (id: string) => {
    return calendars.find((c) => c.id === id);
  };

  return (
    <CalendarContext.Provider
      value={{
        calendars,
        isLoading,
        selectedCalendarIds,
        defaultCalendarId,
        toggleCalendar,
        selectAllCalendars,
        selectOnlyCalendar,
        setDefaultCalendar,
        getCalendarById,
      }}
    >
      {children}
    </CalendarContext.Provider>
  );
};

export const useCalendarContext = () => {
  const context = useContext(CalendarContext);
  if (!context) {
    throw new Error("useCalendarContext must be used within CalendarProvider");
  }
  return context;
};
