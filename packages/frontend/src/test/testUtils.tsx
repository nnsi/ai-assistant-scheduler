import { AuthProvider } from "@/contexts/AuthContext";
import { RenderOptions, render } from "@testing-library/react";
import { ReactNode } from "react";

/**
 * テスト用のラッパーコンポーネント
 * 必要なプロバイダーをラップする
 */
const AllProviders = ({ children }: { children: ReactNode }) => {
  return <AuthProvider>{children}</AuthProvider>;
};

/**
 * プロバイダー付きでコンポーネントをレンダリング
 */
const customRender = (ui: React.ReactElement, options?: Omit<RenderOptions, "wrapper">) =>
  render(ui, { wrapper: AllProviders, ...options });

export * from "@testing-library/react";
export { customRender as render };
