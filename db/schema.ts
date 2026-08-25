import { index, integer, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";

export const platformUsers = sqliteTable("platform_users", {
  id: text("id").primaryKey(),
  username: text("username").notNull(),
  displayName: text("display_name").notNull(),
  roleId: text("role_id").notNull(),
  passwordHash: text("password_hash").notNull(),
  passwordSalt: text("password_salt").notNull(),
  active: integer("active", { mode: "boolean" }).notNull().default(true),
  createdAt: integer("created_at").notNull(),
  lastLoginAt: integer("last_login_at"),
}, (table) => [
  uniqueIndex("idx_platform_users_username").on(table.username),
  index("idx_platform_users_role_id").on(table.roleId),
]);

export const platformSessions = sqliteTable("platform_sessions", {
  tokenHash: text("token_hash").primaryKey(),
  userId: text("user_id").notNull(),
  createdAt: integer("created_at").notNull(),
  expiresAt: integer("expires_at").notNull(),
}, (table) => [
  index("idx_platform_sessions_user_id").on(table.userId),
  index("idx_platform_sessions_expires_at").on(table.expiresAt),
]);

export const platformSnapshots = sqliteTable("platform_snapshots", {
  id: text("id").primaryKey(),
  version: integer("version").notNull(),
  payload: text("payload").notNull(),
  updatedBy: text("updated_by").notNull(),
  updatedAt: integer("updated_at").notNull(),
});
