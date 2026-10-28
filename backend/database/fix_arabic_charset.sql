-- ============================================================================
-- Razik Telecom - Repair Arabic Characters & Force UTF-8 (utf8mb4)
-- Run this in phpMyAdmin or MySQL terminal to fix all corrupted '????' text.
-- ============================================================================

SET NAMES utf8mb4;
SET CHARACTER SET utf8mb4;
SET collation_connection = 'utf8mb4_unicode_ci';

-- 1. Convert all tables to utf8mb4 with utf8mb4_unicode_ci collation
ALTER TABLE `settings` CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
ALTER TABLE `operators` CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
ALTER TABLE `users` CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
ALTER TABLE `dealer_commissions` CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
ALTER TABLE `wallet_transactions` CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
ALTER TABLE `topup_requests` CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
ALTER TABLE `recharges` CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
ALTER TABLE `complaints` CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
ALTER TABLE `audit_logs` CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- 2. Restore Arabic Operator Names
UPDATE `operators` SET `name_ar` = 'موبيليس' WHERE `code` = 'mobilis';
UPDATE `operators` SET `name_ar` = 'جازي' WHERE `code` = 'djezzy';
UPDATE `operators` SET `name_ar` = 'أوريدو' WHERE `code` = 'ooredoo';

-- 3. Restore Arabic Settings
UPDATE `settings` SET `value` = 'Razik Telecom | رازيق تليكوم' WHERE `key_name` = 'app_name';
UPDATE `settings` SET `value` = 'د.ج' WHERE `key_name` = 'currency_symbol_ar';
UPDATE `settings` SET `value` = '14 شارع ديدوش مراد، الجزائر الوسطى، الجزائر' WHERE `key_name` = 'company_address';

-- 4. Restore Algerian Dealer Details
UPDATE `users` SET `wilaya` = 'الجزائر', `commune` = 'سيدي امحمد', `address` = '14 شارع ديدوش مراد، الجزائر' WHERE `id` = 1;
UPDATE `users` SET `full_name` = 'كريم بن علي', `business_name` = 'كشك باب الوادي', `wilaya` = 'الجزائر', `commune` = 'باب الوادي', `address` = '22 شارع العقيد لطفي' WHERE `id` = 2;
UPDATE `users` SET `full_name` = 'سفيان العربي', `business_name` = 'سيبر وخدمات وهران', `wilaya` = 'وهران', `commune` = 'السانية', `address` = '105 شارع جيش التحرير الوطني' WHERE `id` = 3;
UPDATE `users` SET `full_name` = 'أمين منصوري', `business_name` = 'خدمات القنطرة البيضاء', `wilaya` = 'قسنطينة', `commune` = 'سيدي مبروك', `address` = 'حي الشهداء رقم 14' WHERE `id` = 4;
UPDATE `users` SET `full_name` = 'ياسين بلقاسم', `business_name` = 'مؤسسة عين الفوارة تليكوم', `wilaya` = 'سطيف', `commune` = 'سطيف المركز', `address` = 'شارع 8 ماي 1945' WHERE `id` = 5;
UPDATE `users` SET `full_name` = 'وليد خدار', `business_name` = 'تبغ وخدمات سيبوس', `wilaya` = 'عنابة', `commune` = 'البوني', `address` = 'شارع الثورة رقم 48' WHERE `id` = 6;
UPDATE `users` SET `full_name` = 'هشام زروقي', `business_name` = 'كشك الوردة', `wilaya` = 'البليدة', `commune` = 'أولاد يعيش', `address` = 'شارع الإخوة جيلالي' WHERE `id` = 7;
UPDATE `users` SET `full_name` = 'بلال منصور', `business_name` = 'خدمات المنصورة', `wilaya` = 'تلمسان', `commune` = 'المنصورة', `address` = 'الطريق الوطني رقم 22' WHERE `id` = 8;
UPDATE `users` SET `full_name` = 'مراد شاوي', `business_name` = 'أوراس فون للاتصالات', `wilaya` = 'باتنة', `commune` = 'باتنة المدينة', `address` = 'ممر مصطفى بن بولعيد' WHERE `id` = 9;

-- 5. Restore Arabic Support & Dispute Tickets
UPDATE `complaints` SET `subject` = 'فشل شحن موبيليس 500 د.ج', `description` = 'الزبون كان في المحل، العملية أرجعت فشل. يرجى التحقق واسترجاع الرصيد.' WHERE `id` = 1;
UPDATE `complaints` SET `subject` = 'عملية أوريدو معلقة 2000 د.ج', `description` = 'الرصيد لم يصل الزبون بعد 15 دقيقة داخل المحل.' WHERE `id` = 2;
UPDATE `complaints` SET `subject` = 'تأخر وصول رصيد أوريدو 1500 د.ج', `description` = 'الزبون غادر المحل دون تأكيد. نرجو التحقق الفوري.' WHERE `id` = 3;
UPDATE `complaints` SET `subject` = 'استفسار حول عملية شحن مسترجعة', `description` = 'طلب توضيح بشأن عمولة العملية المسترجعة.' WHERE `id` = 4;
