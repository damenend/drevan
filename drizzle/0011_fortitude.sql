ALTER TABLE `users` RENAME COLUMN "max_hp" TO "base_hp";--> statement-breakpoint
ALTER TABLE `users` RENAME COLUMN "max_hp_points" TO "fortitude_points";--> statement-breakpoint
ALTER TABLE `users` ADD `intellect` integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `fortitude` integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `intellect_points` integer DEFAULT 0 NOT NULL;