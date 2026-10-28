-- ============================================================================
-- Razik Telecom - Algeria Mobile Recharge & Distribution Platform
-- Database Schema for MySQL 8.0 / InnoDB
-- Charset: utf8mb4 (supports Arabic and multilingual UTF-8)
-- ============================================================================

-- Note for shared cPanel hosting: Create the database in cPanel first, then select it.
-- CREATE DATABASE IF NOT EXISTS `algeria_recharge` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
-- USE `algeria_recharge`;

-- 1. System Settings & Configuration
CREATE TABLE IF NOT EXISTS `settings` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `key_name` VARCHAR(100) UNIQUE NOT NULL,
    `value` TEXT NOT NULL,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- 2. Users (Admin, Agents/Dealers, Finance/Support)
CREATE TABLE IF NOT EXISTS `users` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `username` VARCHAR(50) UNIQUE NOT NULL,
    `phone` VARCHAR(20) UNIQUE NOT NULL,
    `email` VARCHAR(100) NULL,
    `password_hash` VARCHAR(255) NOT NULL,
    `role` ENUM('admin', 'dealer', 'finance', 'support') DEFAULT 'dealer',
    `full_name` VARCHAR(100) NOT NULL,
    `business_name` VARCHAR(100) NULL,
    `wilaya` VARCHAR(50) DEFAULT 'Algiers',
    `commune` VARCHAR(50) NULL,
    `address` TEXT NULL,
    `national_id` VARCHAR(50) NULL,
    `commercial_register` VARCHAR(50) NULL,
    `status` ENUM('pending', 'active', 'suspended', 'rejected') DEFAULT 'pending',
    `wallet_balance` DECIMAL(12, 2) DEFAULT 0.00,
    `credit_limit` DECIMAL(12, 2) DEFAULT 0.00,
    `outstanding_debt` DECIMAL(12, 2) DEFAULT 0.00,
    `commission_tier` VARCHAR(20) DEFAULT 'standard',
    `language_preference` VARCHAR(10) DEFAULT 'ar',
    `theme_preference` VARCHAR(10) DEFAULT 'light',
    `last_login` TIMESTAMP NULL,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- 3. Telecom Operators & Services
CREATE TABLE IF NOT EXISTS `operators` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `code` VARCHAR(20) UNIQUE NOT NULL, -- 'mobilis', 'djezzy', 'ooredoo'
    `name` VARCHAR(50) NOT NULL,
    `name_ar` VARCHAR(50) NOT NULL,
    `prefixes` VARCHAR(100) NOT NULL, -- e.g. '065,066,067,069'
    `default_commission_pct` DECIMAL(5, 2) DEFAULT 5.00,
    `balance` DECIMAL(12, 2) DEFAULT 500000.00, -- Available wholesale balance held by Razik Telecom
    `low_balance_threshold` DECIMAL(12, 2) DEFAULT 50000.00,
    `status` ENUM('active', 'maintenance', 'disabled') DEFAULT 'active',
    `logo_url` VARCHAR(255) NULL,
    `color_hex` VARCHAR(20) DEFAULT '#006633',
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- 4. Custom Commission Rates per Dealer / Tier (Optional Override)
CREATE TABLE IF NOT EXISTS `dealer_commissions` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `user_id` INT NOT NULL,
    `operator_id` INT NOT NULL,
    `commission_pct` DECIMAL(5, 2) NOT NULL,
    `effective_from` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
    FOREIGN KEY (`operator_id`) REFERENCES `operators`(`id`) ON DELETE CASCADE,
    UNIQUE KEY `user_operator` (`user_id`, `operator_id`)
) ENGINE=InnoDB;

-- 5. Wallet Transactions & Immutable Sub-ledger
CREATE TABLE IF NOT EXISTS `wallet_transactions` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `transaction_ref` VARCHAR(50) UNIQUE NOT NULL,
    `user_id` INT NOT NULL,
    `type` ENUM('credit_topup', 'recharge_debit', 'commission_credit', 'refund', 'adjustment') NOT NULL,
    `amount` DECIMAL(12, 2) NOT NULL, -- Absolute amount
    `balance_before` DECIMAL(12, 2) NOT NULL,
    `balance_after` DECIMAL(12, 2) NOT NULL,
    `related_id` INT NULL, -- recharge_id or topup_request_id
    `notes` TEXT NULL,
    `created_by` INT NULL, -- admin or dealer
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB;

-- 6. Wallet Top-Up Requests (Dealer to Admin)
CREATE TABLE IF NOT EXISTS `topup_requests` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `request_ref` VARCHAR(50) UNIQUE NOT NULL,
    `user_id` INT NOT NULL,
    `amount` DECIMAL(12, 2) NOT NULL,
    `payment_method` ENUM('cash_collection', 'baridimob', 'bank_ccp', 'ccp_rip', 'bank_transfer', 'credit_extension') DEFAULT 'cash_collection',
    `proof_reference` VARCHAR(100) NULL,
    `status` ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
    `notes` TEXT NULL,
    `admin_notes` TEXT NULL,
    `reviewed_by` INT NULL,
    `reviewed_at` TIMESTAMP NULL,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB;

-- 7. Recharge Transactions
CREATE TABLE IF NOT EXISTS `recharges` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `recharge_ref` VARCHAR(50) UNIQUE NOT NULL,
    `idempotency_key` VARCHAR(100) UNIQUE NOT NULL,
    `user_id` INT NOT NULL,
    `operator_id` INT NOT NULL,
    `phone_number` VARCHAR(20) NOT NULL,
    `face_value` DECIMAL(10, 2) NOT NULL, -- End customer recharge value (e.g., 100 DZD)
    `commission_pct` DECIMAL(5, 2) NOT NULL, -- e.g., 5.00%
    `commission_amount` DECIMAL(10, 2) NOT NULL, -- e.g., 5.00 DZD
    `net_debited` DECIMAL(10, 2) NOT NULL, -- e.g., 95.00 DZD debited from dealer wallet
    `dealer_profit` DECIMAL(10, 2) NOT NULL, -- e.g., 5.00 DZD retained by dealer
    `service_type` ENUM('mobile_flexy', 'sonelgaz_elec', 'ade_water', 'bus_ticket', 'adsl_4g') DEFAULT 'mobile_flexy',
    `operator_ref` VARCHAR(100) NULL, -- Reference ID from telecom operator API/SIM
    `status` ENUM('success', 'pending', 'failed', 'reversed') DEFAULT 'pending',
    `status_message` VARCHAR(255) NULL,
    `retry_count` INT DEFAULT 0,
    `completed_at` TIMESTAMP NULL,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
    FOREIGN KEY (`operator_id`) REFERENCES `operators`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB;

-- 8. Customer Support & Recharge Complaints
CREATE TABLE IF NOT EXISTS `complaints` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `ticket_ref` VARCHAR(50) UNIQUE NOT NULL,
    `user_id` INT NOT NULL,
    `recharge_id` INT NULL,
    `phone_number` VARCHAR(20) NOT NULL,
    `subject` VARCHAR(150) NOT NULL,
    `description` TEXT NOT NULL,
    `status` ENUM('open', 'investigating', 'resolved_refunded', 'resolved_confirmed', 'rejected') DEFAULT 'open',
    `admin_response` TEXT NULL,
    `resolved_by` INT NULL,
    `resolved_at` TIMESTAMP NULL,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
    FOREIGN KEY (`recharge_id`) REFERENCES `recharges`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB;

-- 9. Audit Log
CREATE TABLE IF NOT EXISTS `audit_logs` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `user_id` INT NULL,
    `action` VARCHAR(50) NOT NULL,
    `entity_type` VARCHAR(50) NOT NULL,
    `entity_id` INT NULL,
    `details` TEXT NULL,
    `ip_address` VARCHAR(45) NULL,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;
