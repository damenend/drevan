ALTER TABLE `users` ADD `ruins_tile` integer;--> statement-breakpoint
ALTER TABLE `users` ADD `ruins_revision` integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `ruins_enemy_pending` integer DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `recall_date` text;