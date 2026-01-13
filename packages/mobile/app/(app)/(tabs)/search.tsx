/**
 * AI検索画面
 */
import { useState, useCallback, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  ScrollView,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { MaterialIcons } from "@expo/vector-icons";
import Markdown from "@ronradtke/react-native-markdown-display";
import { useAI, useCalendarContext, useSchedules } from "@ai-scheduler/core";
import { format, getYear, getMonth } from "date-fns";

export default function SearchScreen() {
  const router = useRouter();
  const { calendars, selectedCalendarIds } = useCalendarContext();
  const scrollViewRef = useRef<ScrollView>(null);

  const [query, setQuery] = useState("");
  const [selectedKeywords, setSelectedKeywords] = useState<string[]>([]);

  // 現在月のスケジュールを取得
  const now = new Date();
  const { schedules } = useSchedules(getYear(now), getMonth(now) + 1);

  const {
    keywords,
    searchResult,
    isLoadingKeywords,
    isLoadingSearch,
    isStreaming,
    statusMessage,
    error,
    suggestKeywords,
    searchStream,
    reset,
  } = useAI();

  // キーワード提案を取得
  const handleSuggestKeywords = useCallback(async () => {
    if (!query.trim()) return;

    setSelectedKeywords([]);
    await suggestKeywords(
      query.trim(),
      format(now, "yyyy-MM-dd'T'HH:mm:ss"),
      undefined
    );

    // キーワードが出たら下にスクロール
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);
  }, [query, selectedCalendarIds, suggestKeywords, now]);

  // キーワードの選択/解除
  const handleToggleKeyword = useCallback((keyword: string) => {
    setSelectedKeywords((prev) =>
      prev.includes(keyword)
        ? prev.filter((k) => k !== keyword)
        : [...prev, keyword]
    );
  }, []);

  // 検索実行
  const handleSearch = useCallback(async () => {
    if (selectedKeywords.length === 0) return;

    await searchStream(
      query.trim(),
      format(now, "yyyy-MM-dd'T'HH:mm:ss"),
      selectedKeywords
    );

    // 結果が出たら下にスクロール
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);
  }, [query, selectedKeywords, selectedCalendarIds, searchStream, now]);

  const handleClear = useCallback(() => {
    setQuery("");
    setSelectedKeywords([]);
    reset();
  }, [reset]);

  const handleSchedulePress = useCallback(
    (scheduleId: string) => {
      router.push(`/(app)/schedule/${scheduleId}`);
    },
    [router]
  );

  return (
    <SafeAreaView className="flex-1 bg-white" edges={["top"]}>
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        {/* ヘッダー */}
        <View className="border-b border-gray-200 px-4 py-3">
          <Text className="text-xl font-bold text-gray-900">AI検索</Text>
          <Text className="mt-1 text-sm text-gray-500">
            自然言語でスケジュールを検索できます
          </Text>
        </View>

        {/* 検索入力 */}
        <View className="border-b border-gray-200 px-4 py-3">
          <View className="flex-row items-center rounded-xl border border-gray-300 bg-gray-50 px-3">
            <MaterialIcons name="search" size={24} color="#9ca3af" />
            <TextInput
              value={query}
              onChangeText={setQuery}
              onSubmitEditing={handleSuggestKeywords}
              placeholder="例: 来週の会議は？"
              placeholderTextColor="#9ca3af"
              className="ml-2 flex-1 py-3 text-base text-gray-900"
              returnKeyType="search"
              autoCorrect={false}
              editable={!isLoadingKeywords && !isLoadingSearch}
            />
            {query.length > 0 && (
              <Pressable onPress={handleClear} className="p-1">
                <MaterialIcons name="close" size={20} color="#9ca3af" />
              </Pressable>
            )}
          </View>

          <Pressable
            onPress={handleSuggestKeywords}
            disabled={!query.trim() || isLoadingKeywords}
            className={`mt-3 flex-row items-center justify-center rounded-xl py-3 ${
              !query.trim() || isLoadingKeywords
                ? "bg-gray-200"
                : "bg-primary-500 active:bg-primary-600"
            }`}
          >
            {isLoadingKeywords ? (
              <>
                <ActivityIndicator size="small" color="#ffffff" />
                <Text className="ml-2 font-medium text-white">分析中...</Text>
              </>
            ) : (
              <>
                <MaterialIcons name="auto-awesome" size={20} color="#ffffff" />
                <Text className="ml-2 font-medium text-white">
                  キーワードを提案
                </Text>
              </>
            )}
          </Pressable>
        </View>

        {/* 結果 */}
        <ScrollView
          ref={scrollViewRef}
          className="flex-1 px-4 py-4"
          contentContainerStyle={{ paddingBottom: 32 }}
        >
          {/* 検索ヒント */}
          {!searchResult && keywords.length === 0 && !isLoadingKeywords && (
            <View className="items-center py-8">
              <MaterialIcons name="lightbulb-outline" size={48} color="#d1d5db" />
              <Text className="mt-4 text-center text-gray-500">
                検索例:{"\n"}
                「今週の予定を教えて」{"\n"}
                「明日の会議は何時から？」{"\n"}
                「先月行ったレストラン」
              </Text>
            </View>
          )}

          {/* エラー表示 */}
          {error && (
            <View className="mb-4 rounded-xl bg-red-50 p-4">
              <View className="flex-row items-center">
                <MaterialIcons name="error" size={24} color="#ef4444" />
                <Text className="ml-2 font-medium text-red-700">
                  エラーが発生しました
                </Text>
              </View>
              <Text className="mt-2 text-sm text-red-600">{error.message}</Text>
            </View>
          )}

          {/* キーワード選択 */}
          {keywords.length > 0 && !searchResult && (
            <View className="mb-4">
              <Text className="mb-2 font-medium text-gray-700">
                検索キーワードを選択
              </Text>
              <View className="flex-row flex-wrap">
                {keywords.map((keyword) => (
                  <Pressable
                    key={keyword}
                    onPress={() => handleToggleKeyword(keyword)}
                    className={`mb-2 mr-2 rounded-full px-4 py-2 ${
                      selectedKeywords.includes(keyword)
                        ? "bg-primary-500"
                        : "bg-gray-100"
                    }`}
                  >
                    <Text
                      className={`font-medium ${
                        selectedKeywords.includes(keyword)
                          ? "text-white"
                          : "text-gray-700"
                      }`}
                    >
                      {keyword}
                    </Text>
                  </Pressable>
                ))}
              </View>

              <Pressable
                onPress={handleSearch}
                disabled={selectedKeywords.length === 0 || isLoadingSearch}
                className={`mt-4 flex-row items-center justify-center rounded-xl py-3 ${
                  selectedKeywords.length === 0 || isLoadingSearch
                    ? "bg-gray-200"
                    : "bg-primary-500 active:bg-primary-600"
                }`}
              >
                {isLoadingSearch ? (
                  <>
                    <ActivityIndicator size="small" color="#ffffff" />
                    <Text className="ml-2 font-medium text-white">
                      {statusMessage || "検索中..."}
                    </Text>
                  </>
                ) : (
                  <>
                    <MaterialIcons name="search" size={20} color="#ffffff" />
                    <Text className="ml-2 font-medium text-white">
                      検索する
                    </Text>
                  </>
                )}
              </Pressable>
            </View>
          )}

          {/* 検索結果 */}
          {searchResult && (
            <View>
              <View className="mb-4 rounded-xl bg-gray-50 p-4">
                <View className="mb-2 flex-row items-center">
                  <MaterialIcons name="auto-awesome" size={20} color="#3b82f6" />
                  <Text className="ml-1 font-medium text-primary-500">
                    AIの回答
                  </Text>
                  {isStreaming && (
                    <ActivityIndicator
                      size="small"
                      color="#3b82f6"
                      className="ml-2"
                    />
                  )}
                </View>
                <Markdown
                  style={{
                    body: { color: "#374151", fontSize: 15, lineHeight: 22 },
                    heading1: { color: "#111827", fontWeight: "bold" },
                    heading2: { color: "#111827", fontWeight: "bold" },
                    link: { color: "#3b82f6" },
                    bullet_list: { marginLeft: 8 },
                    ordered_list: { marginLeft: 8 },
                  }}
                >
                  {searchResult}
                </Markdown>
              </View>

              {/* 新しい検索ボタン */}
              <Pressable
                onPress={handleClear}
                className="flex-row items-center justify-center rounded-xl bg-gray-100 py-3 active:bg-gray-200"
              >
                <MaterialIcons name="refresh" size={20} color="#374151" />
                <Text className="ml-2 font-medium text-gray-700">
                  新しい検索
                </Text>
              </Pressable>
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
