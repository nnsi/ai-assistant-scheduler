/**
 * カレンダーメンバー管理画面
 */
import { useState, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  Alert,
  Share,
  Image,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { MaterialIcons } from "@expo/vector-icons";
import {
  useCalendarContext,
  useCalendarMembers,
  useCalendarInvitations,
  useCreateCalendarInvitation,
  useRevokeCalendarInvitation,
  useUpdateCalendarMemberRole,
  useRemoveCalendarMember,
} from "@ai-scheduler/core";
import { LoadingSpinner, ErrorMessage, Button } from "../../../../src/components/ui";

const ROLE_LABELS: Record<string, string> = {
  owner: "オーナー",
  editor: "編集者",
  viewer: "閲覧者",
};

const ROLE_COLORS: Record<string, string> = {
  owner: "#eab308",
  editor: "#3b82f6",
  viewer: "#6b7280",
};

export default function CalendarMembersScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { getCalendarById } = useCalendarContext();
  const calendar = getCalendarById(id!);

  const { data: members = [], isLoading: membersLoading } = useCalendarMembers(id!);
  const { data: invitations = [], isLoading: invitationsLoading } = useCalendarInvitations(id!);

  const createInvitationMutation = useCreateCalendarInvitation();
  const revokeInvitationMutation = useRevokeCalendarInvitation();
  const updateRoleMutation = useUpdateCalendarMemberRole();
  const removeMemberMutation = useRemoveCalendarMember();

  const [selectedRole, setSelectedRole] = useState<"editor" | "viewer">("editor");

  const isOwner = calendar?.role === "owner";

  const handleCreateInvitation = useCallback(async () => {
    try {
      const invitation = await createInvitationMutation.mutateAsync({
        calendarId: id!,
        input: { role: selectedRole, expiresInDays: 7 },
      });
      if (invitation?.url) {
        await Share.share({
          message: `カレンダー「${calendar?.name}」への招待です:\n${invitation.url}`,
          title: "カレンダー招待",
        });
      }
    } catch (error) {
      console.error("Create invitation failed:", error);
      Alert.alert("エラー", "招待リンクの作成に失敗しました");
    }
  }, [createInvitationMutation, id, selectedRole, calendar?.name]);

  const handleShareInvitation = useCallback(
    async (inviteUrl: string) => {
      try {
        await Share.share({
          message: `カレンダー「${calendar?.name}」への招待です:\n${inviteUrl}`,
          title: "カレンダー招待",
        });
      } catch (error) {
        console.error("Share failed:", error);
      }
    },
    [calendar?.name]
  );

  const handleRevokeInvitation = useCallback(
    (invitationId: string) => {
      Alert.alert(
        "招待リンクを無効化",
        "この招待リンクを無効化しますか？",
        [
          { text: "キャンセル", style: "cancel" },
          {
            text: "無効化",
            style: "destructive",
            onPress: async () => {
              try {
                await revokeInvitationMutation.mutateAsync({
                  calendarId: id!,
                  invitationId,
                });
              } catch (error) {
                console.error("Revoke failed:", error);
                Alert.alert("エラー", "招待リンクの無効化に失敗しました");
              }
            },
          },
        ]
      );
    },
    [revokeInvitationMutation, id]
  );

  const handleRemoveMember = useCallback(
    (userId: string, userName: string) => {
      Alert.alert(
        "メンバーを削除",
        `${userName}をこのカレンダーから削除しますか？`,
        [
          { text: "キャンセル", style: "cancel" },
          {
            text: "削除",
            style: "destructive",
            onPress: async () => {
              try {
                await removeMemberMutation.mutateAsync({
                  calendarId: id!,
                  targetUserId: userId,
                });
              } catch (error) {
                console.error("Remove member failed:", error);
                Alert.alert("エラー", "メンバーの削除に失敗しました");
              }
            },
          },
        ]
      );
    },
    [removeMemberMutation, id]
  );

  const handleChangeRole = useCallback(
    (userId: string, currentRole: string) => {
      const newRole = currentRole === "editor" ? "viewer" : "editor";
      Alert.alert(
        "権限を変更",
        `権限を「${ROLE_LABELS[newRole]}」に変更しますか？`,
        [
          { text: "キャンセル", style: "cancel" },
          {
            text: "変更",
            onPress: async () => {
              try {
                await updateRoleMutation.mutateAsync({
                  calendarId: id!,
                  targetUserId: userId,
                  input: { role: newRole as "editor" | "viewer" },
                });
              } catch (error) {
                console.error("Update role failed:", error);
                Alert.alert("エラー", "権限の変更に失敗しました");
              }
            },
          },
        ]
      );
    },
    [updateRoleMutation, id]
  );

  const isLoading = membersLoading || invitationsLoading;
  const isUpdating = updateRoleMutation.isPending || removeMemberMutation.isPending;

  if (isLoading) {
    return <LoadingSpinner fullScreen message="読み込み中..." />;
  }

  if (!calendar) {
    return (
      <ErrorMessage
        fullScreen
        message="カレンダーが見つかりません"
        onRetry={() => router.back()}
      />
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-50" edges={["bottom"]}>
      <ScrollView className="flex-1">
        {/* カレンダー情報 */}
        <View className="mx-4 mt-4 rounded-xl bg-white p-4">
          <View className="flex-row items-center">
            <View
              className="h-10 w-10 items-center justify-center rounded-lg"
              style={{ backgroundColor: calendar.color || "#3b82f6" }}
            >
              <MaterialIcons name="event" size={24} color="#ffffff" />
            </View>
            <View className="ml-3 flex-1">
              <Text className="text-lg font-semibold text-gray-900">
                {calendar.name}
              </Text>
              <Text className="text-sm text-gray-500">
                {members.length}人のメンバー
              </Text>
            </View>
          </View>
        </View>

        {/* 招待リンク作成（オーナーのみ） */}
        {isOwner && (
          <View className="mx-4 mt-4">
            <Text className="mb-2 text-sm font-medium text-gray-500">
              新しいメンバーを招待
            </Text>
            <View className="rounded-xl bg-white p-4">
              {/* 権限選択 */}
              <View className="mb-4 flex-row">
                <Pressable
                  onPress={() => setSelectedRole("editor")}
                  className={`mr-2 flex-1 rounded-lg border-2 py-3 ${
                    selectedRole === "editor"
                      ? "border-primary-500 bg-primary-50"
                      : "border-gray-200"
                  }`}
                >
                  <Text
                    className={`text-center font-medium ${
                      selectedRole === "editor"
                        ? "text-primary-600"
                        : "text-gray-600"
                    }`}
                  >
                    編集者
                  </Text>
                  <Text className="mt-1 text-center text-xs text-gray-500">
                    スケジュールの追加・編集可能
                  </Text>
                </Pressable>
                <Pressable
                  onPress={() => setSelectedRole("viewer")}
                  className={`ml-2 flex-1 rounded-lg border-2 py-3 ${
                    selectedRole === "viewer"
                      ? "border-primary-500 bg-primary-50"
                      : "border-gray-200"
                  }`}
                >
                  <Text
                    className={`text-center font-medium ${
                      selectedRole === "viewer"
                        ? "text-primary-600"
                        : "text-gray-600"
                    }`}
                  >
                    閲覧者
                  </Text>
                  <Text className="mt-1 text-center text-xs text-gray-500">
                    スケジュールの閲覧のみ
                  </Text>
                </Pressable>
              </View>

              <Button
                onPress={handleCreateInvitation}
                loading={createInvitationMutation.isPending}
                className="w-full"
              >
                <View className="flex-row items-center">
                  <MaterialIcons name="link" size={20} color="#ffffff" />
                  <Text className="ml-2 font-medium text-white">
                    招待リンクを作成
                  </Text>
                </View>
              </Button>
            </View>
          </View>
        )}

        {/* 有効な招待リンク */}
        {isOwner && invitations.length > 0 && (
          <View className="mx-4 mt-4">
            <Text className="mb-2 text-sm font-medium text-gray-500">
              有効な招待リンク
            </Text>
            <View className="rounded-xl bg-white">
              {invitations.map((invitation, index) => (
                <View
                  key={invitation.id}
                  className={`flex-row items-center justify-between p-4 ${
                    index < invitations.length - 1 ? "border-b border-gray-100" : ""
                  }`}
                >
                  <View className="flex-1">
                    <View className="flex-row items-center">
                      <View
                        className="rounded px-2 py-0.5"
                        style={{ backgroundColor: ROLE_COLORS[invitation.role] }}
                      >
                        <Text className="text-xs font-medium text-white">
                          {ROLE_LABELS[invitation.role]}
                        </Text>
                      </View>
                    </View>
                    <Text className="mt-1 text-xs text-gray-500">
                      有効期限: {new Date(invitation.expiresAt).toLocaleDateString("ja-JP")}
                    </Text>
                  </View>
                  <View className="flex-row">
                    <Pressable
                      onPress={() => handleRevokeInvitation(invitation.id)}
                      className="rounded-full bg-red-100 p-2 active:bg-red-200"
                    >
                      <MaterialIcons name="close" size={20} color="#ef4444" />
                    </Pressable>
                  </View>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* メンバーリスト */}
        <View className="mx-4 mb-8 mt-4">
          <Text className="mb-2 text-sm font-medium text-gray-500">メンバー</Text>
          <View className="rounded-xl bg-white">
            {members.map((member, index) => (
              <View
                key={member.userId}
                className={`flex-row items-center p-4 ${
                  index < members.length - 1 ? "border-b border-gray-100" : ""
                }`}
              >
                {member.user?.picture ? (
                  <Image
                    source={{ uri: member.user.picture }}
                    className="h-10 w-10 rounded-full"
                  />
                ) : (
                  <View className="h-10 w-10 items-center justify-center rounded-full bg-gray-200">
                    <MaterialIcons name="person" size={24} color="#6b7280" />
                  </View>
                )}
                <View className="ml-3 flex-1">
                  <Text className="font-medium text-gray-900">
                    {member.user?.name || "ユーザー"}
                  </Text>
                  <View className="flex-row items-center">
                    <View
                      className="rounded px-2 py-0.5"
                      style={{ backgroundColor: ROLE_COLORS[member.role] }}
                    >
                      <Text className="text-xs font-medium text-white">
                        {ROLE_LABELS[member.role]}
                      </Text>
                    </View>
                  </View>
                </View>

                {/* オーナーの場合のみ操作可能（オーナー自身以外） */}
                {isOwner && member.role !== "owner" && (
                  <View className="flex-row">
                    <Pressable
                      onPress={() => handleChangeRole(member.userId, member.role)}
                      className="mr-2 rounded-full bg-gray-100 p-2 active:bg-gray-200"
                      disabled={isUpdating}
                    >
                      <MaterialIcons name="swap-horiz" size={20} color="#374151" />
                    </Pressable>
                    <Pressable
                      onPress={() =>
                        handleRemoveMember(member.userId, member.user?.name || "ユーザー")
                      }
                      className="rounded-full bg-red-100 p-2 active:bg-red-200"
                      disabled={isUpdating}
                    >
                      <MaterialIcons name="person-remove" size={20} color="#ef4444" />
                    </Pressable>
                  </View>
                )}
              </View>
            ))}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
