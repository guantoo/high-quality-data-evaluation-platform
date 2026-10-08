CREATE TABLE `project_workflows` (
	`project_id` text PRIMARY KEY NOT NULL,
	`workspace` text NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`project_id`) REFERENCES `data_projects`(`id`) ON UPDATE no action ON DELETE no action,
	CONSTRAINT "project_workflow_json" CHECK(json_valid("project_workflows"."workspace"))
);
