CREATE TABLE `data_assets` (
	`id` text PRIMARY KEY NOT NULL,
	`owner_id` text NOT NULL,
	`name` text NOT NULL,
	`filename` text NOT NULL,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_data_assets_owner` ON `data_assets` (`owner_id`,`created_at`);--> statement-breakpoint
CREATE TABLE `data_versions` (
	`id` text PRIMARY KEY NOT NULL,
	`asset_id` text NOT NULL,
	`parent_id` text,
	`version` integer NOT NULL,
	`content` text NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`asset_id`) REFERENCES `data_assets`(`id`) ON UPDATE no action ON DELETE no action,
	CONSTRAINT "data_versions_json" CHECK(json_valid("data_versions"."content"))
);
--> statement-breakpoint
CREATE UNIQUE INDEX `idx_data_versions_number` ON `data_versions` (`asset_id`,`version`);--> statement-breakpoint
CREATE TABLE `quality_runs` (
	`id` text PRIMARY KEY NOT NULL,
	`asset_id` text NOT NULL,
	`input_id` text NOT NULL,
	`output_id` text,
	`kind` text NOT NULL,
	`rules` text NOT NULL,
	`result` text NOT NULL,
	`created_by` text NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`asset_id`) REFERENCES `data_assets`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`input_id`) REFERENCES `data_versions`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`output_id`) REFERENCES `data_versions`(`id`) ON UPDATE no action ON DELETE no action,
	CONSTRAINT "quality_runs_json" CHECK(json_valid("quality_runs"."result"))
);
--> statement-breakpoint
CREATE INDEX `idx_quality_runs_asset` ON `quality_runs` (`asset_id`,`created_at`);