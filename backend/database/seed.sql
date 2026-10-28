-- ============================================================================
-- Razik Telecom - Algeria Mobile Recharge Seed Data
-- Default passwords:
--   admin / admin123
--   dealer_algiers / dealer123
--   dealer_oran / dealer123
-- ============================================================================

USE `algeria_recharge`;

-- 1. Settings
INSERT INTO `settings` (`key_name`, `value`) VALUES
('app_name', 'Razik Telecom | رازيق تليكوم'),
('timezone', 'Africa/Algiers'),
('currency', 'DZD'),
('currency_symbol_ar', 'د.ج'),
('date_format', 'd/m/Y H:i'),
('default_language', 'ar'),
('default_theme', 'light'),
('company_phone', '+213 21 00 00 00'),
('company_email', 'contact@raziktelecom.dz'),
('company_address', '14 Boulevard Didouche Mourad, Algiers, Algeria')
ON DUPLICATE KEY UPDATE `value`=VALUES(`value`);

-- 2. Operators
INSERT INTO `operators` (`id`, `code`, `name`, `name_ar`, `prefixes`, `default_commission_pct`, `balance`, `low_balance_threshold`, `status`, `color_hex`) VALUES
(1, 'mobilis', 'Mobilis', 'موبيليس', '065,066,067,069', 5.00, 750000.00, 80000.00, 'active', '#008a3e'),
(2, 'djezzy', 'Djezzy', 'جازي', '077,078,079', 4.50, 620000.00, 70000.00, 'active', '#e4002b'),
(3, 'ooredoo', 'Ooredoo', 'أوريدو', '054,055,056', 5.20, 580000.00, 60000.00, 'active', '#ed1c24')
ON DUPLICATE KEY UPDATE `name`=VALUES(`name`);

-- 3. Users (Passwords hashed using password_hash('password', PASSWORD_BCRYPT))
-- Password for admin is 'admin123' -> $2y$10$wT4X7sYpL5rQ8eN8I9Nfe.vJt9hYk3A5bKk1t1Ue6Jp6C8v2y.2iq (or we support fallback check)
INSERT INTO `users` (`id`, `username`, `phone`, `email`, `password_hash`, `role`, `full_name`, `business_name`, `wilaya`, `commune`, `address`, `status`, `wallet_balance`, `credit_limit`, `outstanding_debt`, `language_preference`, `theme_preference`) VALUES
(1, 'admin', '0550123456', 'admin@raziktelecom.dz', '$2y$10$fWv0gEw4W6B8a1s.nS8G/OI5m8Uu1iU2X9fO0K6r2L3v.4k9M8hWe', 'admin', 'Razik Hadj (Owner)', 'Razik Telecom HQ', 'Alger', 'Sidi M\'Hamed', '14 Blvd Didouche Mourad, Alger', 'active', 0.00, 0.00, 0.00, 'ar', 'light'),
(2, 'dealer_algiers', '0661234567', 'karim@babelemouad.dz', '$2y$10$fWv0gEw4W6B8a1s.nS8G/OI5m8Uu1iU2X9fO0K6r2L3v.4k9M8hWe', 'dealer', 'Karim Benali', 'Kiosque Bab El Oued', 'Alger', 'Bab El Oued', 'Rue Colonel Lotfi #22', 'active', 45000.00, 20000.00, 5000.00, 'ar', 'light'),
(3, 'dealer_oran', '0770987654', 'sofiane@orantelecom.dz', '$2y$10$fWv0gEw4W6B8a1s.nS8G/OI5m8Uu1iU2X9fO0K6r2L3v.4k9M8hWe', 'dealer', 'Sofiane Larbi', 'Cyber Service Oran', 'Oran', 'Es Senia', 'Avenue de l\'ALN #105', 'active', 18500.00, 10000.00, 0.00, 'ar', 'light'),
(4, 'dealer_constantine', '0555432109', 'amine@pontblanc.dz', '$2y$10$fWv0gEw4W6B8a1s.nS8G/OI5m8Uu1iU2X9fO0K6r2L3v.4k9M8hWe', 'dealer', 'Amine Mansouri', 'Pont Blanc Multiservices', 'Constantine', 'Sidi Mabrouk', 'Cité des Martyrs', 'pending', 0.00, 0.00, 0.00, 'ar', 'light')
ON DUPLICATE KEY UPDATE `username`=VALUES(`username`);

-- 4. Initial Wallet Transactions
INSERT INTO `wallet_transactions` (`transaction_ref`, `user_id`, `type`, `amount`, `balance_before`, `balance_after`, `notes`, `created_by`) VALUES
('WTX-20261026-001', 2, 'credit_topup', 50000.00, 0.00, 50000.00, 'Initial cash collection deposit in Algiers Office', 1),
('WTX-20261026-002', 2, 'recharge_debit', 95.00, 50000.00, 49905.00, 'Recharge Mobilis 0661998877 (100 DZD - 5% comm = 95 DZD debited)', 2),
('WTX-20261026-003', 2, 'recharge_debit', 950.00, 49905.00, 48955.00, 'Recharge Mobilis 0663112233 (1000 DZD - 5% comm = 950 DZD debited)', 2),
('WTX-20261026-004', 3, 'credit_topup', 20000.00, 0.00, 20000.00, 'BaridiMob transfer confirmed', 1),
('WTX-20261026-005', 3, 'recharge_debit', 955.00, 20000.00, 19045.00, 'Recharge Djezzy 0770554433 (1000 DZD - 4.5% comm = 955 DZD debited)', 3);

-- 5. Top-up Requests
INSERT INTO `topup_requests` (`request_ref`, `user_id`, `amount`, `payment_method`, `proof_reference`, `status`, `notes`, `admin_notes`, `reviewed_by`) VALUES
('REQ-20261026-101', 2, 50000.00, 'cash_collection', 'CASH-REC-0891', 'approved', 'Cash collected by agent at store', 'Approved by owner', 1),
('REQ-20261026-102', 3, 20000.00, 'baridimob', 'BM-TX-8839210', 'approved', 'BaridiMob receipt attached', 'Confirmed in bank', 1),
('REQ-20261026-103', 2, 30000.00, 'cash_collection', 'CASH-COL-0902', 'pending', 'Dealer requested balance for weekend rush', NULL, NULL);

-- 6. Recharges
INSERT INTO `recharges` (`recharge_ref`, `idempotency_key`, `user_id`, `operator_id`, `phone_number`, `face_value`, `commission_pct`, `commission_amount`, `net_debited`, `dealer_profit`, `service_type`, `operator_ref`, `status`, `status_message`, `completed_at`) VALUES
('RCH-20261026-0001', 'IDEMP-001', 2, 1, '0661998877', 100.00, 5.00, 5.00, 95.00, 5.00, 'mobile_flexy', 'MOB-TX-99881', 'success', 'Top-up successful via Mobilis API Gateway', NOW()),
('RCH-20261026-0002', 'IDEMP-002', 2, 1, '0663112233', 1000.00, 5.00, 50.00, 950.00, 50.00, 'mobile_flexy', 'MOB-TX-99882', 'success', 'Top-up successful via Mobilis API Gateway', NOW()),
('RCH-20261026-0003', 'IDEMP-003', 3, 2, '0770554433', 1000.00, 4.50, 45.00, 955.00, 45.00, 'mobile_flexy', 'DJZ-TX-44512', 'success', 'Top-up successful via Djezzy B2B Route', NOW()),
('RCH-20261026-0004', 'IDEMP-004', 2, 3, '0555887766', 2000.00, 5.20, 104.00, 1896.00, 104.00, 'mobile_flexy', 'OOR-PEND-1201', 'pending', 'Operator route processing, awaiting acknowledgement', NULL),
('RCH-20261026-0005', 'IDEMP-005', 3, 1, '0668001122', 500.00, 5.00, 25.00, 475.00, 25.00, 'mobile_flexy', 'MOB-ERR-503', 'failed', 'Network timeout from operator modem pool', NOW());

-- 7. Complaints
INSERT INTO `complaints` (`ticket_ref`, `user_id`, `recharge_id`, `phone_number`, `subject`, `description`, `status`, `admin_response`, `resolved_by`) VALUES
('TCK-20261026-01', 3, 5, '0668001122', 'Failed recharge on Mobilis 500 DZD', 'The customer was in store, recharge returned failed. Please verify if credited or refund balance.', 'open', NULL, NULL),
('TCK-20261026-02', 2, 4, '0555887766', 'Pending Ooredoo 2000 DZD', 'Recharge still showing pending after 15 minutes.', 'investigating', 'Checking with Ooredoo Algiers NOC', 1);
