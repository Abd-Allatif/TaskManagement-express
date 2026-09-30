-- AlterTable
ALTER TABLE `admins` ADD COLUMN `is_verified` BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE `users` ADD COLUMN `is_verified` BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE `verification_tokens` (
    `id` VARCHAR(191) NOT NULL,
    `token` VARCHAR(191) NOT NULL,
    `expires_at` DATETIME(3) NOT NULL,
    `user_id` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `verification_tokens_token_key`(`token`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `admin_verification_tokens` (
    `id` VARCHAR(191) NOT NULL,
    `token` VARCHAR(191) NOT NULL,
    `expires_at` DATETIME(3) NOT NULL,
    `admin_id` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `admin_verification_tokens_token_key`(`token`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `verification_tokens` ADD CONSTRAINT `verification_tokens_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `admin_verification_tokens` ADD CONSTRAINT `admin_verification_tokens_admin_id_fkey` FOREIGN KEY (`admin_id`) REFERENCES `admins`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
