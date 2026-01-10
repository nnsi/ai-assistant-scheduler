import { useReducer, useCallback } from "react";
import type { Schedule } from "@ai-scheduler/shared";

// モーダルの種類を定義
type ModalType =
  | "scheduleForm"
  | "schedulePopup"
  | "scheduleEdit"
  | "profile"
  | "conditions"
  | "category"
  | "search"
  | "calendarManagement"
  | "calendarCreate"
  | "calendarSettings"
  | "memberList"
  | "inviteMember"
  | "inviteLink";

// モーダルの状態
interface ModalState {
  // 基本的なモーダルの開閉状態
  openModals: Set<ModalType>;
  // スケジュール関連のデータ
  selectedSchedule: Schedule | null;
  editingSchedule: Schedule | null;
  // カレンダー設定関連のデータ（calendarIdを保持）
  settingsCalendarId: string | null;
  membersCalendarId: string | null;
  inviteMemberCalendarId: string | null;
  inviteLinkCalendarId: string | null;
  // フォーム用のデフォルト値
  defaultDate: Date | null;
  defaultTime: string | null;
}

// アクションの定義
type ModalAction =
  | { type: "OPEN_MODAL"; modal: ModalType }
  | { type: "CLOSE_MODAL"; modal: ModalType }
  | { type: "CLOSE_ALL" }
  | { type: "SET_SELECTED_SCHEDULE"; schedule: Schedule | null }
  | { type: "SET_EDITING_SCHEDULE"; schedule: Schedule | null }
  | { type: "SET_SETTINGS_CALENDAR_ID"; calendarId: string | null }
  | { type: "SET_MEMBERS_CALENDAR_ID"; calendarId: string | null }
  | { type: "SET_INVITE_MEMBER_CALENDAR_ID"; calendarId: string | null }
  | { type: "SET_INVITE_LINK_CALENDAR_ID"; calendarId: string | null }
  | { type: "SET_DEFAULT_DATE"; date: Date | null }
  | { type: "SET_DEFAULT_TIME"; time: string | null }
  | { type: "OPEN_SCHEDULE_FORM"; date: Date | null; time: string | null }
  | { type: "OPEN_SCHEDULE_POPUP"; schedule: Schedule }
  | { type: "OPEN_SCHEDULE_EDIT"; schedule: Schedule }
  | { type: "OPEN_CALENDAR_SETTINGS"; calendarId: string }
  | { type: "OPEN_MEMBER_LIST"; calendarId: string }
  | { type: "OPEN_INVITE_LINK"; calendarId: string };

const initialState: ModalState = {
  openModals: new Set(),
  selectedSchedule: null,
  editingSchedule: null,
  settingsCalendarId: null,
  membersCalendarId: null,
  inviteMemberCalendarId: null,
  inviteLinkCalendarId: null,
  defaultDate: null,
  defaultTime: null,
};

function modalReducer(state: ModalState, action: ModalAction): ModalState {
  switch (action.type) {
    case "OPEN_MODAL": {
      const newOpenModals = new Set(state.openModals);
      newOpenModals.add(action.modal);
      return { ...state, openModals: newOpenModals };
    }
    case "CLOSE_MODAL": {
      const newOpenModals = new Set(state.openModals);
      newOpenModals.delete(action.modal);
      return { ...state, openModals: newOpenModals };
    }
    case "CLOSE_ALL":
      return { ...state, openModals: new Set() };
    case "SET_SELECTED_SCHEDULE":
      return { ...state, selectedSchedule: action.schedule };
    case "SET_EDITING_SCHEDULE":
      return { ...state, editingSchedule: action.schedule };
    case "SET_SETTINGS_CALENDAR_ID":
      return { ...state, settingsCalendarId: action.calendarId };
    case "SET_MEMBERS_CALENDAR_ID":
      return { ...state, membersCalendarId: action.calendarId };
    case "SET_INVITE_MEMBER_CALENDAR_ID":
      return { ...state, inviteMemberCalendarId: action.calendarId };
    case "SET_INVITE_LINK_CALENDAR_ID":
      return { ...state, inviteLinkCalendarId: action.calendarId };
    case "SET_DEFAULT_DATE":
      return { ...state, defaultDate: action.date };
    case "SET_DEFAULT_TIME":
      return { ...state, defaultTime: action.time };
    case "OPEN_SCHEDULE_FORM": {
      const newOpenModals = new Set(state.openModals);
      newOpenModals.add("scheduleForm");
      return {
        ...state,
        openModals: newOpenModals,
        defaultDate: action.date,
        defaultTime: action.time,
      };
    }
    case "OPEN_SCHEDULE_POPUP": {
      const newOpenModals = new Set(state.openModals);
      newOpenModals.add("schedulePopup");
      return {
        ...state,
        openModals: newOpenModals,
        selectedSchedule: action.schedule,
      };
    }
    case "OPEN_SCHEDULE_EDIT": {
      const newOpenModals = new Set(state.openModals);
      newOpenModals.delete("schedulePopup");
      newOpenModals.add("scheduleEdit");
      return {
        ...state,
        openModals: newOpenModals,
        editingSchedule: action.schedule,
      };
    }
    case "OPEN_CALENDAR_SETTINGS": {
      const newOpenModals = new Set(state.openModals);
      newOpenModals.add("calendarSettings");
      return {
        ...state,
        openModals: newOpenModals,
        settingsCalendarId: action.calendarId,
      };
    }
    case "OPEN_MEMBER_LIST": {
      const newOpenModals = new Set(state.openModals);
      newOpenModals.delete("calendarSettings");
      newOpenModals.add("memberList");
      return {
        ...state,
        openModals: newOpenModals,
        settingsCalendarId: null,
        membersCalendarId: action.calendarId,
      };
    }
    case "OPEN_INVITE_LINK": {
      const newOpenModals = new Set(state.openModals);
      newOpenModals.delete("calendarSettings");
      newOpenModals.add("inviteLink");
      return {
        ...state,
        openModals: newOpenModals,
        settingsCalendarId: null,
        inviteLinkCalendarId: action.calendarId,
      };
    }
    default:
      return state;
  }
}

export function useModalManager() {
  const [state, dispatch] = useReducer(modalReducer, initialState);

  // モーダルの開閉状態を取得
  const isOpen = useCallback(
    (modal: ModalType) => state.openModals.has(modal),
    [state.openModals]
  );

  // 基本的なモーダル操作
  const openModal = useCallback(
    (modal: ModalType) => dispatch({ type: "OPEN_MODAL", modal }),
    []
  );
  const closeModal = useCallback(
    (modal: ModalType) => dispatch({ type: "CLOSE_MODAL", modal }),
    []
  );

  // スケジュールフォームを開く
  const openScheduleForm = useCallback(
    (date: Date | null = null, time: string | null = null) =>
      dispatch({ type: "OPEN_SCHEDULE_FORM", date, time }),
    []
  );

  // スケジュールポップアップを開く
  const openSchedulePopup = useCallback(
    (schedule: Schedule) => dispatch({ type: "OPEN_SCHEDULE_POPUP", schedule }),
    []
  );

  // スケジュール編集モーダルを開く
  const openScheduleEdit = useCallback(
    (schedule: Schedule) => dispatch({ type: "OPEN_SCHEDULE_EDIT", schedule }),
    []
  );

  // カレンダー設定モーダルを開く
  const openCalendarSettings = useCallback(
    (calendarId: string) =>
      dispatch({ type: "OPEN_CALENDAR_SETTINGS", calendarId }),
    []
  );

  // メンバーリストモーダルを開く（カレンダー設定から遷移）
  const openMemberList = useCallback(
    (calendarId: string) => dispatch({ type: "OPEN_MEMBER_LIST", calendarId }),
    []
  );

  // 招待リンクモーダルを開く（カレンダー設定から遷移）
  const openInviteLink = useCallback(
    (calendarId: string) => dispatch({ type: "OPEN_INVITE_LINK", calendarId }),
    []
  );

  return {
    // 状態
    state,
    isOpen,
    // 基本操作
    openModal,
    closeModal,
    // 複合操作
    openScheduleForm,
    openSchedulePopup,
    openScheduleEdit,
    openCalendarSettings,
    openMemberList,
    openInviteLink,
  };
}
