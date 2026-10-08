CREATE TABLE `database_connections` (
	`id` text PRIMARY KEY NOT NULL,
	`owner_id` text NOT NULL,
	`name` text NOT NULL,
	`settings` text NOT NULL,
	`secret` text NOT NULL,
	`status` text NOT NULL,
	`error` text DEFAULT '' NOT NULL,
	`tested_at` integer,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	CONSTRAINT "database_connections_settings_json" CHECK(json_valid("database_connections"."settings"))
);
--> statement-breakpoint
CREATE INDEX `idx_database_connections_owner` ON `database_connections` (`owner_id`,`created_at`);--> statement-breakpoint
CREATE TABLE `database_imports` (
	`asset_id` text PRIMARY KEY NOT NULL,
	`connection_id` text NOT NULL,
	`database_name` text NOT NULL,
	`schema_name` text NOT NULL,
	`table_name` text NOT NULL,
	`is_sample` integer NOT NULL,
	`row_count` integer NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`asset_id`) REFERENCES `data_assets`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`connection_id`) REFERENCES `database_connections`(`id`) ON UPDATE no action ON DELETE no action
);
