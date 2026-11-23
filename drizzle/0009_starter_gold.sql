PRAGMA foreign_keys=OFF;--> statement-breakpoint
-- Some migration runners start a transaction before this script, making
-- the PRAGMA a no-op. Save inventory in case dropping users cascades.
CREATE TEMP TABLE `__starter_gold_inventory` AS SELECT * FROM `inventory`;--> statement-breakpoint
CREATE TABLE `__new_users` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`avatar_model` text DEFAULT 'male' NOT NULL,
	`email` text NOT NULL,
	`password_hash` text NOT NULL,
	`gold` integer DEFAULT 125 NOT NULL,
	`strength` integer DEFAULT 5 NOT NULL,
	`speed` integer DEFAULT 5 NOT NULL,
	`hp` integer DEFAULT 25 NOT NULL,
	`max_hp` integer DEFAULT 25 NOT NULL,
	`exp` integer DEFAULT 0 NOT NULL,
	`strength_points` integer DEFAULT 0 NOT NULL,
	`speed_points` integer DEFAULT 0 NOT NULL,
	`max_hp_points` integer DEFAULT 0 NOT NULL,
	`equipped_weapon_id` integer,
	`equipped_armor_id` integer,
	`defense` integer DEFAULT 0 NOT NULL,
	`fishing_casts_used` integer DEFAULT 0 NOT NULL,
	`fishing_cast_date` text
);
--> statement-breakpoint
INSERT INTO `__new_users`("id", "name", "avatar_model", "email", "password_hash", "gold", "strength", "speed", "hp", "max_hp", "exp", "strength_points", "speed_points", "max_hp_points", "equipped_weapon_id", "equipped_armor_id", "defense", "fishing_casts_used", "fishing_cast_date") SELECT "id", "name", "avatar_model", "email", "password_hash", "gold", "strength", "speed", "hp", "max_hp", "exp", "strength_points", "speed_points", "max_hp_points", "equipped_weapon_id", "equipped_armor_id", "defense", "fishing_casts_used", "fishing_cast_date" FROM `users`;--> statement-breakpoint
DROP TABLE `users`;--> statement-breakpoint
ALTER TABLE `__new_users` RENAME TO `users`;--> statement-breakpoint
INSERT INTO `inventory` ("id", "user_id", "item_id", "quantity")
SELECT "id", "user_id", "item_id", "quantity" FROM `__starter_gold_inventory` AS saved
WHERE NOT EXISTS (SELECT 1 FROM `inventory` WHERE "id" = saved."id");--> statement-breakpoint
DROP TABLE `__starter_gold_inventory`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE UNIQUE INDEX `users_email_unique` ON `users` (`email`);--> statement-breakpoint
CREATE UNIQUE INDEX `users_name_lower_unique` ON `users` (lower("name"));
