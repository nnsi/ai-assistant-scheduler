/**
 * ルートレイアウト
 * アプリ全体のプロバイダーと認証分岐を設定
 */
import "../global.css";

import { useEffect } from "react";
import { Stack, useRouter, useSegments } from "expo-router";
import { StatusBar } from "expo-status-bar";
import * as SplashScreen from "expo-splash-screen";
import { useFonts } from "expo-font";
import { useAuth } from "@ai-scheduler/core";
import { AppProviders } from "../src/lib/providers";
import { View, Text, ActivityIndicator } from "react-native";

// スプラッシュスクリーンを自動非表示にしない
SplashScreen.preventAutoHideAsync();

/**
 * 認証状態に応じたナビゲーション
 */
function RootLayoutNav() {
  const { isAuthenticated, isLoading, user } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  // 認証状態に応じてリダイレクト
  useEffect(() => {
    if (isLoading) return;

    const inAuthGroup = segments[0] === "(app)";
    const inInviteGroup = segments[0] === "invite";

    if (!isAuthenticated && inAuthGroup) {
      // 未認証でアプリグループにいる場合はログイン画面へ
      router.replace("/sign-in");
    } else if (isAuthenticated && !inAuthGroup && !inInviteGroup) {
      // 認証済みでアプリグループ外にいる場合はホームへ
      router.replace("/(app)");
    }
  }, [isAuthenticated, isLoading, segments, router]);

  // ローディング中
  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <ActivityIndicator size="large" color="#3b82f6" />
        <Text className="mt-4 text-gray-600">読み込み中...</Text>
      </View>
    );
  }

  return (
    <>
      <StatusBar style="dark" />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="sign-in" options={{ headerShown: false }} />
        <Stack.Screen name="(app)" options={{ headerShown: false }} />
        <Stack.Screen
          name="invite/[token]"
          options={{
            headerShown: true,
            title: "招待",
            presentation: "modal",
          }}
        />
      </Stack>
    </>
  );
}

/**
 * ルートレイアウト
 */
export default function RootLayout() {
  const [fontsLoaded] = useFonts({});

  useEffect(() => {
    if (fontsLoaded) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  if (!fontsLoaded) {
    return null;
  }

  return (
    <AppProviders>
      <RootLayoutNav />
    </AppProviders>
  );
}
