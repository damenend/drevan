ALTER TABLE `users` RENAME COLUMN `speed` TO `agility`;--> statement-breakpoint
ALTER TABLE `users` RENAME COLUMN `speed_points` TO `agility_points`;--> statement-breakpoint
ALTER TABLE `users` ADD COLUMN `speed` integer DEFAULT 5 NOT NULL;--> statement-breakpoint
-- Preserve the effective Speed each existing player had before the split.
UPDATE `users` SET `speed` = `agility` + `agility_points`;--> statement-breakpoint
ALTER TABLE `users` ADD COLUMN `character_class` text DEFAULT 'unaligned' NOT NULL
  CONSTRAINT "users_character_class_check" CHECK (`character_class` in ('unaligned', 'melee', 'ranged', 'caster'));--> statement-breakpoint
-- Convert equipped offensive bonuses in place so owned item IDs stay valid.
UPDATE `items` SET `effect` = 'attack_power'
WHERE `effect` = 'strength' AND `type` IN ('weapon', 'armor');
