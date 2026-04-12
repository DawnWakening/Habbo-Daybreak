SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- =====================================================
-- Update 4.0.3-beta to 4.0.4-beta
-- =====================================================

ALTER TABLE `catalog_pages`
    ADD COLUMN IF NOT EXISTS `catalog_type` ENUM('NORMAL', 'BUILDERS_CLUB') NOT NULL DEFAULT 'NORMAL' AFTER `page_layout`;

ALTER TABLE `catalog_items`
    ADD COLUMN IF NOT EXISTS `subscription_type` VARCHAR(64) NULL DEFAULT NULL AFTER `offer_id`,
    ADD COLUMN IF NOT EXISTS `subscription_days` INT NULL DEFAULT NULL AFTER `subscription_type`;

ALTER TABLE `users_settings`
    ADD COLUMN IF NOT EXISTS `builders_club_furni_limit` INT NOT NULL DEFAULT 0 AFTER `max_friends`,
    ADD COLUMN IF NOT EXISTS `builders_club_max_furni_limit` INT NOT NULL DEFAULT 0 AFTER `builders_club_furni_limit`;

CREATE TABLE IF NOT EXISTS `builders_club_item_sequence` (
  `id` TINYINT NOT NULL,
  `next_id` INT NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `items_item_sequence` (
  `id` TINYINT NOT NULL,
  `next_id` INT NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `builders_club_item_sequence` (`id`, `next_id`)
VALUES (1, 2147418113)
ON DUPLICATE KEY UPDATE `next_id` = `next_id`;

INSERT INTO `items_item_sequence` (`id`, `next_id`)
SELECT 1, COALESCE(MAX(`id`), 0) + 1
FROM `items`
WHERE `id` < 2147418112
ON DUPLICATE KEY UPDATE `next_id` = `next_id`;

INSERT INTO `emulator_settings` (`key`, `value`) VALUES
('builders.club.enabled', '0'),
('builders.club.furni.limit', '0'),
('builders.club.max.furni.limit', '0'),
('builders.club.box.furni.limit.increment', '750'),
('builders.club.grace.seconds', '0'),
('builders.club.furniture.placement.group.room.enabled', '0'),
('builders.club.expiry.action', 'none'),
('builders.club.achievement', 'BuildersClub'),
('builders.club.buy_membership_page', ''),
('builders.club.try_page', ''),
('builders.club.furnidata.url', '')
ON DUPLICATE KEY UPDATE `value` = VALUES(`value`);

SET FOREIGN_KEY_CHECKS = 1;
