import type { RefreshTokenEntity } from "../model/refreshToken";

export type RefreshTokenRepo = {
  findById: (id: string) => Promise<RefreshTokenEntity | null>;
  save: (token: RefreshTokenEntity) => Promise<void>;
  revoke: (id: string) => Promise<void>;
  revokeAllByUserId: (userId: string) => Promise<void>;
};
