-- ============================================================================
-- Razik Telecom - Algeria Mobile Recharge Complete Production Sample Data
-- For Server & Testing Environments
--
-- Default Credentials:
--   Admin:   username: admin           password: admin123
--   Dealers: username: dealer_algiers  password: dealer123
--            username: dealer_oran     password: dealer123
--            username: dealer_constantine password: dealer123
--            (All demo dealers use password: dealer123)
-- ============================================================================

-- Note: Select your database in phpMyAdmin/cPanel before executing
-- USE `algeria_recharge`;

-- 1. System Platform Settings
INSERT INTO `settings` (`key_name`, `value`) VALUES
('app_name', 'Razik Telecom | رازيق تليكوم'),
('timezone', 'Africa/Algiers'),
('currency', 'DZD'),
('currency_symbol_ar', 'د.ج'),
('date_format', 'd/m/Y H:i'),
('default_language', 'ar'),
('default_theme', 'light'),
('company_phone', '+213 21 73 45 67'),
('company_email', 'support@raziktelecom.dz'),
('company_address', '14 Boulevard Didouche Mourad, Alger Centre, Alger')
ON DUPLICATE KEY UPDATE `value`=VALUES(`value`);

-- 2. Algerian Mobile Operators & Wholesale Reserves
INSERT INTO `operators` (`id`, `code`, `name`, `name_ar`, `prefixes`, `default_commission_pct`, `balance`, `low_balance_threshold`, `status`, `color_hex`) VALUES
(1, 'mobilis', 'Mobilis', 'موبيليس', '065,066,067,069', 5.00, 850000.00, 80000.00, 'active', '#008a3e'),
(2, 'djezzy', 'Djezzy', 'جازي', '077,078,079', 4.50, 720000.00, 70000.00, 'active', '#e4002b'),
(3, 'ooredoo', 'Ooredoo', 'أوريدو', '054,055,056', 5.20, 640000.00, 60000.00, 'active', '#ed1c24')
ON DUPLICATE KEY UPDATE `balance`=VALUES(`balance`), `default_commission_pct`=VALUES(`default_commission_pct`);

-- 3. Users: Admin and Network of Algerian Retail Dealers
INSERT INTO `users` (`id`, `username`, `phone`, `email`, `password_hash`, `role`, `full_name`, `business_name`, `wilaya`, `commune`, `address`, `status`, `wallet_balance`, `credit_limit`, `outstanding_debt`, `language_preference`, `theme_preference`) VALUES
(1, 'admin', '0550123456', 'admin@raziktelecom.dz', '$2y$10$fWv0gEw4W6B8a1s.nS8G/OI5m8Uu1iU2X9fO0K6r2L3v.4k9M8hWe', 'admin', 'Razik Hadj (General Manager)', 'Razik Telecom HQ', 'Alger', 'Sidi M\'Hamed', '14 Blvd Didouche Mourad, Alger', 'active', 0.00, 0.00, 0.00, 'ar', 'light'),
(2, 'dealer_algiers', '0661234567', 'karim@babelemouad.dz', '$2y$10$fWv0gEw4W6B8a1s.nS8G/OI5m8Uu1iU2X9fO0K6r2L3v.4k9M8hWe', 'dealer', 'Karim Benali', 'Kiosque Bab El Oued', 'Alger', 'Bab El Oued', 'Rue Colonel Lotfi #22', 'active', 45000.00, 20000.00, 5000.00, 'ar', 'light'),
(3, 'dealer_oran', '0770987654', 'sofiane@orantelecom.dz', '$2y$10$fWv0gEw4W6B8a1s.nS8G/OI5m8Uu1iU2X9fO0K6r2L3v.4k9M8hWe', 'dealer', 'Sofiane Larbi', 'Cyber Service Oran', 'Oran', 'Es Senia', 'Avenue de l\'ALN #105', 'active', 18500.00, 10000.00, 0.00, 'ar', 'light'),
(4, 'dealer_constantine', '0555432109', 'amine@pontblanc.dz', '$2y$10$fWv0gEw4W6B8a1s.nS8G/OI5m8Uu1iU2X9fO0K6r2L3v.4k9M8hWe', 'dealer', 'Amine Mansouri', 'Pont Blanc Multiservices', 'Constantine', 'Sidi Mabrouk', 'Cité des Martyrs #14', 'active', 32000.00, 15000.00, 2500.00, 'ar', 'light'),
(5, 'dealer_setif', '0662334455', 'yacine@ainfouara.dz', '$2y$10$fWv0gEw4W6B8a1s.nS8G/OI5m8Uu1iU2X9fO0K6r2L3v.4k9M8hWe', 'dealer', 'Yacine Belkacem', 'Eurl Ain Fouara Telecom', 'Sétif', 'Sétif Centre', 'Boulevard 8 Mai 1945', 'active', 15200.00, 10000.00, 0.00, 'ar', 'light'),
(6, 'dealer_annaba', '0771889900', 'walid@seybouse.dz', '$2y$10$fWv0gEw4W6B8a1s.nS8G/OI5m8Uu1iU2X9fO0K6r2L3v.4k9M8hWe', 'dealer', 'Walid Kheddar', 'Tabac & Services Seybouse', 'Annaba', 'El Bouni', 'Avenue de l\'ALN #48', 'active', 28400.00, 25000.00, 4200.00, 'ar', 'light'),
(7, 'dealer_blida', '0550998811', 'hicham@roseblida.dz', '$2y$10$fWv0gEw4W6B8a1s.nS8G/OI5m8Uu1iU2X9fO0K6r2L3v.4k9M8hWe', 'dealer', 'Hicham Zerrouki', 'Kiosque La Rose', 'Blida', 'Ouled Yaich', 'Rue des Frères Djillali', 'active', 8900.00, 5000.00, 0.00, 'ar', 'light'),
(8, 'dealer_tlemcen', '0775443322', 'bilal@mansourah.dz', '$2y$10$fWv0gEw4W6B8a1s.nS8G/OI5m8Uu1iU2X9fO0K6r2L3v.4k9M8hWe', 'dealer', 'Bilal Mansour', 'Mansourah Services', 'Tlemcen', 'Mansourah', 'Route Nationale #22', 'active', 21000.00, 12000.00, 1500.00, 'ar', 'light'),
(9, 'dealer_batna', '0669112233', 'mourad@auresphone.dz', '$2y$10$fWv0gEw4W6B8a1s.nS8G/OI5m8Uu1iU2X9fO0K6r2L3v.4k9M8hWe', 'dealer', 'Mourad Chaoui', 'Aures Phone & Tech', 'Batna', 'Batna Ville', 'Allée Ben Boulaid', 'pending', 0.00, 0.00, 0.00, 'ar', 'light')
ON DUPLICATE KEY UPDATE `full_name`=VALUES(`full_name`), `wallet_balance`=VALUES(`wallet_balance`);

-- 4. Sample Dealer Top-up Requests
INSERT INTO `topup_requests` (`id`, `request_ref`, `user_id`, `amount`, `payment_method`, `proof_reference`, `status`, `notes`, `admin_notes`, `reviewed_by`, `created_at`) VALUES
(1, 'REQ-20261026-101', 2, 50000.00, 'cash_collection', 'CASH-REC-0891', 'approved', 'Cash collected by agent at store', 'Approved and credited by owner', 1, DATE_SUB(NOW(), INTERVAL 2 DAY)),
(2, 'REQ-20261026-102', 3, 20000.00, 'baridimob', 'BM-TX-8839210', 'approved', 'BaridiMob receipt 00799999000123456789', 'Verified on BaridiMob dashboard', 1, DATE_SUB(NOW(), INTERVAL 2 DAY)),
(3, 'REQ-20261027-201', 4, 35000.00, 'ccp_rip', 'CCP-DEP-5519', 'approved', 'Poste Algérie receipt attached', 'Confirmed in account', 1, DATE_SUB(NOW(), INTERVAL 1 DAY)),
(4, 'REQ-20261027-202', 6, 30000.00, 'baridimob', 'BM-TX-9902341', 'approved', 'BaridiMob quick reload', 'Credited immediately', 1, DATE_SUB(NOW(), INTERVAL 1 DAY)),
(5, 'REQ-20261028-301', 2, 25000.00, 'cash_collection', 'CASH-COL-1102', 'pending', 'Dealer requested balance for afternoon peak', NULL, NULL, NOW()),
(6, 'REQ-20261028-302', 5, 20000.00, 'baridimob', 'BM-TX-1004822', 'pending', 'BaridiMob transfer sent at 11:30', NULL, NULL, NOW()),
(7, 'REQ-20261028-303', 7, 10000.00, 'ccp_rip', 'CCP-DEP-9912', 'pending', 'Awaiting verification of postal receipt', NULL, NULL, NOW())
ON DUPLICATE KEY UPDATE `status`=VALUES(`status`);

-- 5. Complete Sample Mobile Recharge Ledger (Covering Mobilis, Djezzy, Ooredoo)
INSERT INTO `recharges` (`id`, `recharge_ref`, `idempotency_key`, `user_id`, `operator_id`, `phone_number`, `face_value`, `commission_pct`, `commission_amount`, `net_debited`, `dealer_profit`, `service_type`, `operator_ref`, `status`, `status_message`, `created_at`, `completed_at`) VALUES
-- Today's Recharges
(1, 'RCH-20261028-001', 'IDP-28-01', 2, 1, '0661998877', 100.00, 5.00, 5.00, 95.00, 5.00, 'mobile_flexy', 'MOB-TX-88001', 'success', 'Top-up successful via Mobilis API Gateway', NOW(), NOW()),
(2, 'RCH-20261028-002', 'IDP-28-02', 2, 1, '0663112233', 1000.00, 5.00, 50.00, 950.00, 50.00, 'mobile_flexy', 'MOB-TX-88002', 'success', 'Top-up successful via Mobilis API Gateway', NOW(), NOW()),
(3, 'RCH-20261028-003', 'IDP-28-03', 3, 2, '0770554433', 1000.00, 4.50, 45.00, 955.00, 45.00, 'mobile_flexy', 'DJZ-TX-44512', 'success', 'Top-up successful via Djezzy B2B Route', NOW(), NOW()),
(4, 'RCH-20261028-004', 'IDP-28-04', 2, 3, '0555887766', 2000.00, 5.20, 104.00, 1896.00, 104.00, 'mobile_flexy', 'OOR-PEND-1201', 'pending', 'Operator route processing, awaiting acknowledgement', NOW(), NULL),
(5, 'RCH-20261028-005', 'IDP-28-05', 3, 1, '0668001122', 500.00, 5.00, 25.00, 475.00, 25.00, 'mobile_flexy', 'MOB-ERR-503', 'failed', 'Network timeout from operator modem pool', NOW(), NOW()),
(6, 'RCH-20261028-006', 'IDP-28-06', 4, 2, '0770987654', 2000.00, 4.50, 90.00, 1910.00, 90.00, 'mobile_flexy', 'DJZ-TX-44513', 'success', 'Top-up successful via Djezzy B2B Route', NOW(), NOW()),
(7, 'RCH-20261028-007', 'IDP-28-07', 5, 3, '0540123456', 500.00, 5.20, 26.00, 474.00, 26.00, 'mobile_flexy', 'OOR-TX-99014', 'success', 'Top-up successful via Ooredoo Direct', NOW(), NOW()),
(8, 'RCH-20261028-008', 'IDP-28-08', 6, 1, '0659666332', 100.00, 5.00, 5.00, 95.00, 5.00, 'mobile_flexy', 'MOB-TX-88003', 'success', 'Top-up successful via Mobilis API Gateway', NOW(), NOW()),
(9, 'RCH-20261028-009', 'IDP-28-09', 2, 2, '0781223344', 3000.00, 4.50, 135.00, 2865.00, 135.00, 'mobile_flexy', 'DJZ-TX-44514', 'success', 'Top-up successful via Djezzy B2B Route', NOW(), NOW()),
(10, 'RCH-20261028-010', 'IDP-28-10', 8, 3, '0561556677', 1500.00, 5.20, 78.00, 1422.00, 78.00, 'mobile_flexy', 'OOR-PEND-1202', 'pending', 'Awaiting operator confirmation', NOW(), NULL),

-- Yesterday's Recharges
(11, 'RCH-20261027-001', 'IDP-27-01', 4, 1, '0665443322', 200.00, 5.00, 10.00, 190.00, 10.00, 'mobile_flexy', 'MOB-TX-87910', 'success', 'Top-up successful', DATE_SUB(NOW(), INTERVAL 1 DAY), DATE_SUB(NOW(), INTERVAL 1 DAY)),
(12, 'RCH-20261027-002', 'IDP-27-02', 3, 2, '0772110099', 500.00, 4.50, 22.50, 477.50, 22.50, 'mobile_flexy', 'DJZ-TX-44301', 'success', 'Top-up successful', DATE_SUB(NOW(), INTERVAL 1 DAY), DATE_SUB(NOW(), INTERVAL 1 DAY)),
(13, 'RCH-20261027-003', 'IDP-27-03', 6, 3, '0551009988', 1000.00, 5.20, 52.00, 948.00, 52.00, 'mobile_flexy', 'OOR-TX-98711', 'success', 'Top-up successful', DATE_SUB(NOW(), INTERVAL 1 DAY), DATE_SUB(NOW(), INTERVAL 1 DAY)),
(14, 'RCH-20261027-004', 'IDP-27-04', 5, 1, '0670887766', 2000.00, 5.00, 100.00, 1900.00, 100.00, 'mobile_flexy', 'MOB-ERR-504', 'reversed', 'Auto-reversed: Operator line unreachable', DATE_SUB(NOW(), INTERVAL 1 DAY), DATE_SUB(NOW(), INTERVAL 1 DAY)),
(15, 'RCH-20261027-005', 'IDP-27-05', 2, 2, '0799445566', 100.00, 4.50, 4.50, 95.50, 4.50, 'mobile_flexy', 'DJZ-TX-44302', 'success', 'Top-up successful', DATE_SUB(NOW(), INTERVAL 1 DAY), DATE_SUB(NOW(), INTERVAL 1 DAY)),
(16, 'RCH-20261027-006', 'IDP-27-06', 7, 3, '0549221100', 500.00, 5.20, 26.00, 474.00, 26.00, 'mobile_flexy', 'OOR-TX-98712', 'success', 'Top-up successful', DATE_SUB(NOW(), INTERVAL 1 DAY), DATE_SUB(NOW(), INTERVAL 1 DAY)),

-- Past Days Recharges
(17, 'RCH-20261026-001', 'IDP-26-01', 2, 1, '0661239988', 1000.00, 5.00, 50.00, 950.00, 50.00, 'mobile_flexy', 'MOB-TX-87001', 'success', 'Top-up successful', DATE_SUB(NOW(), INTERVAL 2 DAY), DATE_SUB(NOW(), INTERVAL 2 DAY)),
(18, 'RCH-20261026-002', 'IDP-26-02', 3, 2, '0770112233', 2000.00, 4.50, 90.00, 1910.00, 90.00, 'mobile_flexy', 'DJZ-TX-44111', 'success', 'Top-up successful', DATE_SUB(NOW(), INTERVAL 2 DAY), DATE_SUB(NOW(), INTERVAL 2 DAY)),
(19, 'RCH-20261026-003', 'IDP-26-03', 4, 3, '0555776655', 500.00, 5.20, 26.00, 474.00, 26.00, 'mobile_flexy', 'OOR-TX-98501', 'success', 'Top-up successful', DATE_SUB(NOW(), INTERVAL 2 DAY), DATE_SUB(NOW(), INTERVAL 2 DAY)),
(20, 'RCH-20261026-004', 'IDP-26-04', 8, 1, '0666334411', 3000.00, 5.00, 150.00, 2850.00, 150.00, 'mobile_flexy', 'MOB-TX-87002', 'success', 'Top-up successful', DATE_SUB(NOW(), INTERVAL 2 DAY), DATE_SUB(NOW(), INTERVAL 2 DAY))
ON DUPLICATE KEY UPDATE `status`=VALUES(`status`);

-- 6. Sample Complaints & Investigating Dispute Tickets
INSERT INTO `complaints` (`id`, `ticket_ref`, `user_id`, `recharge_id`, `phone_number`, `subject`, `description`, `status`, `admin_response`, `resolved_by`, `created_at`) VALUES
(1, 'TCK-20261026-01', 3, 5, '0668001122', 'Failed recharge on Mobilis 500 DZD', 'The customer was in store, recharge returned failed. Please verify if credited or refund balance.', 'resolved_refunded', 'Verified with Mobilis NOC, balance refunded back to dealer wallet.', 1, DATE_SUB(NOW(), INTERVAL 2 DAY)),
(2, 'TCK-20261027-02', 2, 4, '0555887766', 'Pending Ooredoo 2000 DZD', 'Recharge still showing pending after 15 minutes in store.', 'investigating', 'Checking with Ooredoo Algiers NOC for transaction acknowledgement.', 1, DATE_SUB(NOW(), INTERVAL 1 DAY)),
(3, 'TCK-20261028-03', 8, 10, '0561556677', 'Delayed credit Ooredoo 1500 DZD', 'Customer left store without confirmation. Need rapid verification.', 'investigating', 'Under review with operator.', 1, NOW()),
(4, 'TCK-20261028-04', 4, 14, '0670887766', 'Auto-reversed transaction query', 'Inquiry regarding reversal fee.', 'resolved_confirmed', 'Reversed transaction credited back in full. Zero penalty fee.', 1, NOW())
ON DUPLICATE KEY UPDATE `status`=VALUES(`status`);

-- 7. Wallet Transaction Ledger Entries
INSERT INTO `wallet_transactions` (`transaction_ref`, `user_id`, `type`, `amount`, `balance_before`, `balance_after`, `notes`, `created_by`, `created_at`) VALUES
('WTX-20261026-001', 2, 'credit_topup', 50000.00, 0.00, 50000.00, 'Initial cash collection deposit in Algiers Office', 1, DATE_SUB(NOW(), INTERVAL 2 DAY)),
('WTX-20261026-002', 2, 'recharge_debit', 95.00, 50000.00, 49905.00, 'Recharge Mobilis 0661998877 (100 DZD net debited 95 DZD)', 2, DATE_SUB(NOW(), INTERVAL 2 DAY)),
('WTX-20261026-003', 2, 'recharge_debit', 950.00, 49905.00, 48955.00, 'Recharge Mobilis 0663112233 (1000 DZD net debited 950 DZD)', 2, DATE_SUB(NOW(), INTERVAL 2 DAY)),
('WTX-20261026-004', 3, 'credit_topup', 20000.00, 0.00, 20000.00, 'BaridiMob transfer confirmed', 1, DATE_SUB(NOW(), INTERVAL 2 DAY)),
('WTX-20261026-005', 3, 'recharge_debit', 955.00, 20000.00, 19045.00, 'Recharge Djezzy 0770554433 (1000 DZD net debited 955 DZD)', 3, DATE_SUB(NOW(), INTERVAL 2 DAY)),
('WTX-20261027-006', 4, 'credit_topup', 35000.00, 0.00, 35000.00, 'CCP post office deposit', 1, DATE_SUB(NOW(), INTERVAL 1 DAY)),
('WTX-20261027-007', 6, 'credit_topup', 30000.00, 0.00, 30000.00, 'BaridiMob deposit verified', 1, DATE_SUB(NOW(), INTERVAL 1 DAY)),
('WTX-20261028-008', 3, 'refund_credit', 475.00, 18025.00, 18500.00, 'Dispute refund approved for failed Mobilis recharge RCH-20261028-005', 1, NOW())
ON DUPLICATE KEY UPDATE `notes`=VALUES(`notes`);
