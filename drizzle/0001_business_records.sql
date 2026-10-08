CREATE TABLE `platform_records` (
	`collection` text NOT NULL,
	`record_id` text NOT NULL,
	`module_id` text NOT NULL,
	`payload` text NOT NULL,
	`updated_by` text NOT NULL,
	`updated_at` integer NOT NULL,
	PRIMARY KEY(`collection`, `record_id`)
);
--> statement-breakpoint
CREATE INDEX `idx_platform_records_module` ON `platform_records` (`module_id`,`collection`);--> statement-breakpoint
CREATE TABLE `platform_write_audit` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`action` text NOT NULL,
	`collections` text NOT NULL,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_platform_write_audit_created` ON `platform_write_audit` (`created_at`);--> statement-breakpoint
CREATE TABLE `platform_write_guard` (
	`id` text PRIMARY KEY NOT NULL,
	`valid` integer NOT NULL,
	CONSTRAINT "platform_write_guard_valid" CHECK("platform_write_guard"."valid" = 1)
);
