CREATE TABLE `platform_sessions` (
	`token_hash` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`created_at` integer NOT NULL,
	`expires_at` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_platform_sessions_user_id` ON `platform_sessions` (`user_id`);--> statement-breakpoint
CREATE INDEX `idx_platform_sessions_expires_at` ON `platform_sessions` (`expires_at`);--> statement-breakpoint
CREATE TABLE `platform_snapshots` (
	`id` text PRIMARY KEY NOT NULL,
	`version` integer NOT NULL,
	`payload` text NOT NULL,
	`updated_by` text NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `platform_users` (
	`id` text PRIMARY KEY NOT NULL,
	`username` text NOT NULL,
	`display_name` text NOT NULL,
	`role_id` text NOT NULL,
	`password_hash` text NOT NULL,
	`password_salt` text NOT NULL,
	`active` integer DEFAULT true NOT NULL,
	`created_at` integer NOT NULL,
	`last_login_at` integer
);
--> statement-breakpoint
CREATE UNIQUE INDEX `idx_platform_users_username` ON `platform_users` (`username`);--> statement-breakpoint
CREATE INDEX `idx_platform_users_role_id` ON `platform_users` (`role_id`);