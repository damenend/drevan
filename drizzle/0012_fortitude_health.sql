ALTER TABLE `users` RENAME COLUMN `fortitude` TO `previous_fortitude`;--> statement-breakpoint
ALTER TABLE `users` ADD `fortitude` integer DEFAULT 5 NOT NULL;--> statement-breakpoint
-- Convert the old cap before spent AP to the nearest nonnegative Fortitude.
UPDATE `users`
SET `fortitude` = max(0, (`base_hp` + 3 * `previous_fortitude` - 9) / 3);--> statement-breakpoint
UPDATE `users`
SET `hp` = min(`hp`, 10 + 3 * (`fortitude` + `fortitude_points`));--> statement-breakpoint
ALTER TABLE `users` DROP COLUMN `previous_fortitude`;--> statement-breakpoint
ALTER TABLE `users` DROP COLUMN `base_hp`;
