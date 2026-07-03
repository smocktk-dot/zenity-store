CREATE TABLE `admins` (
	`id` int AUTO_INCREMENT NOT NULL,
	`username` varchar(64) NOT NULL,
	`passwordHash` varchar(255) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `admins_id` PRIMARY KEY(`id`),
	CONSTRAINT `admins_username_unique` UNIQUE(`username`)
);
--> statement-breakpoint
CREATE TABLE `apps` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(128) NOT NULL,
	`description` text,
	`version` varchar(32) DEFAULT 'v1.0',
	`categoryId` int,
	`status` enum('active','inactive') NOT NULL DEFAULT 'active',
	`maxUsers` int DEFAULT 5000,
	`features` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `apps_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `categories` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(128) NOT NULL,
	`description` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `categories_id` PRIMARY KEY(`id`),
	CONSTRAINT `categories_name_unique` UNIQUE(`name`)
);
--> statement-breakpoint
CREATE TABLE `credit_transactions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`resellerId` int NOT NULL,
	`type` enum('add','deduct','purchase') NOT NULL,
	`amount` decimal(10,2) NOT NULL,
	`balanceBefore` decimal(12,2) NOT NULL,
	`balanceAfter` decimal(12,2) NOT NULL,
	`description` varchar(255),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `credit_transactions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `license_keys` (
	`id` int AUTO_INCREMENT NOT NULL,
	`keyValue` varchar(128) NOT NULL,
	`resellerId` int NOT NULL,
	`appId` int NOT NULL,
	`planId` int,
	`planName` varchar(64),
	`durationDays` int NOT NULL,
	`creditsSpent` decimal(10,2) NOT NULL,
	`status` enum('active','used','revoked','expired') NOT NULL DEFAULT 'active',
	`usedBy` varchar(128),
	`hwid` varchar(255),
	`activatedAt` timestamp,
	`expiresAt` timestamp,
	`note` text,
	`customMask` varchar(128),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `license_keys_id` PRIMARY KEY(`id`),
	CONSTRAINT `license_keys_keyValue_unique` UNIQUE(`keyValue`)
);
--> statement-breakpoint
CREATE TABLE `reseller_apps` (
	`id` int AUTO_INCREMENT NOT NULL,
	`resellerId` int NOT NULL,
	`appId` int NOT NULL,
	`assignedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `reseller_apps_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `resellers` (
	`id` int AUTO_INCREMENT NOT NULL,
	`username` varchar(64) NOT NULL,
	`passwordHash` varchar(255) NOT NULL,
	`email` varchar(320),
	`credits` decimal(12,2) NOT NULL DEFAULT '0.00',
	`totalPurchases` int NOT NULL DEFAULT 0,
	`discountPercent` decimal(5,2) NOT NULL DEFAULT '35.00',
	`status` enum('active','inactive','banned') NOT NULL DEFAULT 'active',
	`location` varchar(255),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`lastLoginAt` timestamp,
	CONSTRAINT `resellers_id` PRIMARY KEY(`id`),
	CONSTRAINT `resellers_username_unique` UNIQUE(`username`)
);
--> statement-breakpoint
CREATE TABLE `subscription_plans` (
	`id` int AUTO_INCREMENT NOT NULL,
	`appId` int NOT NULL,
	`name` varchar(64) NOT NULL,
	`durationDays` int NOT NULL,
	`priceCredits` decimal(10,2) NOT NULL,
	`level` enum('basic','premium','lifetime') NOT NULL DEFAULT 'basic',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `subscription_plans_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `apps` ADD CONSTRAINT `apps_categoryId_categories_id_fk` FOREIGN KEY (`categoryId`) REFERENCES `categories`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `credit_transactions` ADD CONSTRAINT `credit_transactions_resellerId_resellers_id_fk` FOREIGN KEY (`resellerId`) REFERENCES `resellers`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `license_keys` ADD CONSTRAINT `license_keys_resellerId_resellers_id_fk` FOREIGN KEY (`resellerId`) REFERENCES `resellers`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `license_keys` ADD CONSTRAINT `license_keys_appId_apps_id_fk` FOREIGN KEY (`appId`) REFERENCES `apps`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `license_keys` ADD CONSTRAINT `license_keys_planId_subscription_plans_id_fk` FOREIGN KEY (`planId`) REFERENCES `subscription_plans`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `reseller_apps` ADD CONSTRAINT `reseller_apps_resellerId_resellers_id_fk` FOREIGN KEY (`resellerId`) REFERENCES `resellers`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `reseller_apps` ADD CONSTRAINT `reseller_apps_appId_apps_id_fk` FOREIGN KEY (`appId`) REFERENCES `apps`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `subscription_plans` ADD CONSTRAINT `subscription_plans_appId_apps_id_fk` FOREIGN KEY (`appId`) REFERENCES `apps`(`id`) ON DELETE no action ON UPDATE no action;