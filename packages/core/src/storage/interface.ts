/**
 * Storage インターフェース
 *
 * Web (localStorage) と React Native (AsyncStorage) の両方に対応するための
 * ストレージ抽象化レイヤー。
 */
export interface Storage {
  /**
   * 指定されたキーの値を取得する
   */
  get(key: string): Promise<string | null>;

  /**
   * 指定されたキーに値を設定する
   */
  set(key: string, value: string): Promise<void>;

  /**
   * 指定されたキーを削除する
   */
  remove(key: string): Promise<void>;

  /**
   * 複数のキーの値を一括取得する
   */
  multiGet(keys: string[]): Promise<Record<string, string | null>>;

  /**
   * 複数のキー/値ペアを一括設定する
   */
  multiSet(entries: Record<string, string>): Promise<void>;

  /**
   * すべてのデータをクリアする
   */
  clear(): Promise<void>;
}

/**
 * 同期的な Storage インターフェース
 *
 * Web環境でlocalStorageを同期的に使用する場合のインターフェース。
 * 初期化時のちらつき防止などに使用。
 */
export interface SyncStorage {
  /**
   * 指定されたキーの値を同期的に取得する
   */
  getSync(key: string): string | null;

  /**
   * 指定されたキーに値を同期的に設定する
   */
  setSync(key: string, value: string): void;

  /**
   * 指定されたキーを同期的に削除する
   */
  removeSync(key: string): void;
}
