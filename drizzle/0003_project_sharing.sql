CREATE TABLE `data_audit` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`action` text NOT NULL,
	`target_id` text NOT NULL,
	`detail` text NOT NULL,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_data_audit_created` ON `data_audit` (`created_at`);--> statement-breakpoint
CREATE TABLE `data_projects` (
	`id` text PRIMARY KEY NOT NULL,
	`owner_id` text NOT NULL,
	`name` text NOT NULL,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `project_assets` (
	`asset_id` text PRIMARY KEY NOT NULL,
	`project_id` text NOT NULL,
	FOREIGN KEY (`asset_id`) REFERENCES `data_assets`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`project_id`) REFERENCES `data_projects`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_project_assets_project` ON `project_assets` (`project_id`);--> statement-breakpoint
CREATE TABLE `project_members` (
	`project_id` text NOT NULL,
	`user_id` text NOT NULL,
	`permission` text NOT NULL,
	PRIMARY KEY(`project_id`, `user_id`),
	FOREIGN KEY (`project_id`) REFERENCES `data_projects`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`user_id`) REFERENCES `platform_users`(`id`) ON UPDATE no action ON DELETE no action,
	CONSTRAINT "project_member_permission" CHECK("project_members"."permission" IN ('viewer', 'editor'))
);
