-- Drizzle runs this migration in a transaction, where changing foreign_keys
-- has no effect. Keep a copy of inventory before DROP TABLE cascades deletes.
CREATE TEMP TABLE `__inventory_before_item_rebuild` AS SELECT * FROM `inventory`;--> statement-breakpoint
CREATE TABLE `__new_items` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`description` text NOT NULL,
	`price` integer,
	`type` text DEFAULT 'consumable' NOT NULL,
	`effect` text,
	`effect_value` integer,
	`image` text
);
--> statement-breakpoint
INSERT INTO `__new_items`("id", "name", "description", "price", "type", "effect", "effect_value", "image") SELECT "id", "name", "description", "price", "type", "effect", "effect_value", "image" FROM `items`;--> statement-breakpoint
DROP TABLE `items`;--> statement-breakpoint
ALTER TABLE `__new_items` RENAME TO `items`;--> statement-breakpoint
CREATE UNIQUE INDEX `items_name_unique` ON `items` (`name`);--> statement-breakpoint
INSERT INTO `inventory` (`id`, `user_id`, `item_id`, `quantity`)
SELECT backup.`id`, backup.`user_id`, backup.`item_id`, backup.`quantity`
FROM `__inventory_before_item_rebuild` AS backup
WHERE NOT EXISTS (SELECT 1 FROM `inventory` WHERE `inventory`.`id` = backup.`id`);--> statement-breakpoint
DROP TABLE `__inventory_before_item_rebuild`;
