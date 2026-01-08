import { nanoid } from "nanoid";

export const generateId = (): string => nanoid();

// セキュアトークン（32文字、約192ビット）- 招待用
export const generateSecureToken = (): string => nanoid(32);
