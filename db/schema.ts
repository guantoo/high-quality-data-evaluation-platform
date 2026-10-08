import { sql } from "drizzle-orm";
import { check, index, integer, primaryKey, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";

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

// Queryable business records, kept transactionally consistent with the legacy snapshot.
export const platformRecords = sqliteTable("platform_records", {
  collection: text("collection").notNull(),
  recordId: text("record_id").notNull(),
  moduleId: text("module_id").notNull(),
  payload: text("payload").notNull(),
  updatedBy: text("updated_by").notNull(),
  updatedAt: integer("updated_at").notNull(),
}, (table) => [
  primaryKey({ columns: [table.collection, table.recordId] }),
  index("idx_platform_records_module").on(table.moduleId, table.collection),
]);

export const platformWriteAudit = sqliteTable("platform_write_audit", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull(),
  action: text("action").notNull(),
  collections: text("collections").notNull(),
  createdAt: integer("created_at").notNull(),
}, (table) => [index("idx_platform_write_audit_created").on(table.createdAt)]);

export const platformWriteGuard = sqliteTable("platform_write_guard", {
  id: text("id").primaryKey(),
  valid: integer("valid").notNull(),
}, (table) => [check("platform_write_guard_valid", sql`${table.valid} = 1`)]);

export const dataAssets = sqliteTable("data_assets", {
  id: text("id").primaryKey(), ownerId: text("owner_id").notNull(),
  name: text("name").notNull(), filename: text("filename").notNull(), createdAt: integer("created_at").notNull(),
}, table => [index("idx_data_assets_owner").on(table.ownerId, table.createdAt)]);
export const dataVersions = sqliteTable("data_versions", {
  id: text("id").primaryKey(), assetId: text("asset_id").notNull().references(() => dataAssets.id),
  parentId: text("parent_id"), version: integer("version").notNull(),
  content: text("content").notNull(), createdAt: integer("created_at").notNull(),
}, table => [uniqueIndex("idx_data_versions_number").on(table.assetId, table.version), check("data_versions_json", sql`json_valid(${table.content})`)]);
export const qualityRuns = sqliteTable("quality_runs", {
  id: text("id").primaryKey(), assetId: text("asset_id").notNull().references(() => dataAssets.id),
  inputId: text("input_id").notNull().references(() => dataVersions.id), outputId: text("output_id").references(() => dataVersions.id),
  kind: text("kind").notNull(), rules: text("rules").notNull(), result: text("result").notNull(),
  createdBy: text("created_by").notNull(), createdAt: integer("created_at").notNull(),
}, table => [index("idx_quality_runs_asset").on(table.assetId, table.createdAt), check("quality_runs_json", sql`json_valid(${table.result})`)]);

export const dataProjects = sqliteTable("data_projects", {
  id: text("id").primaryKey(), ownerId: text("owner_id").notNull(),
  name: text("name").notNull(), createdAt: integer("created_at").notNull(),
});
export const projectWorkflows = sqliteTable("project_workflows", {
  projectId: text("project_id").primaryKey().references(() => dataProjects.id),
  workspace: text("workspace").notNull(), updatedAt: integer("updated_at").notNull(),
}, table => [check("project_workflow_json", sql`json_valid(${table.workspace})`)]);
export const projectMembers = sqliteTable("project_members", {
  projectId: text("project_id").notNull().references(() => dataProjects.id),
  userId: text("user_id").notNull().references(() => platformUsers.id),
  permission: text("permission").notNull(),
}, table => [primaryKey({ columns: [table.projectId, table.userId] }), check("project_member_permission", sql`${table.permission} IN ('viewer', 'editor')`)]);
export const projectAssets = sqliteTable("project_assets", {
  assetId: text("asset_id").primaryKey().references(() => dataAssets.id),
  projectId: text("project_id").notNull().references(() => dataProjects.id),
}, table => [index("idx_project_assets_project").on(table.projectId)]);
export const dataAudit = sqliteTable("data_audit", {
  id: text("id").primaryKey(), userId: text("user_id").notNull(), action: text("action").notNull(),
  targetId: text("target_id").notNull(), detail: text("detail").notNull(), createdAt: integer("created_at").notNull(),
}, table => [index("idx_data_audit_created").on(table.createdAt)]);

export const databaseConnections = sqliteTable('database_connections', {
  id: text('id').primaryKey(), ownerId: text('owner_id').notNull(), name: text('name').notNull(),
  settings: text('settings').notNull(), secret: text('secret').notNull(), status: text('status').notNull(),
  error: text('error').notNull().default(''), testedAt: integer('tested_at'), createdAt: integer('created_at').notNull(), updatedAt: integer('updated_at').notNull(),
}, table => [index('idx_database_connections_owner').on(table.ownerId, table.createdAt), check('database_connections_settings_json', sql`json_valid(${table.settings})`)]);
export const databaseImports = sqliteTable('database_imports', {
  assetId: text('asset_id').primaryKey().references(() => dataAssets.id), connectionId: text('connection_id').notNull().references(() => databaseConnections.id),
  databaseName: text('database_name').notNull(), schemaName: text('schema_name').notNull(), tableName: text('table_name').notNull(), isSample: integer('is_sample').notNull(), rowCount: integer('row_count').notNull(), createdAt: integer('created_at').notNull(),
});
