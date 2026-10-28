<?php
// ============================================================================
// Razik Telecom - Instant Arabic UTF-8 Repair Script
// Run via CLI: php backend/fix_charset.php
// Or via Browser: http://recharge.teamtoob.in/backend/fix_charset.php
// ============================================================================

header('Content-Type: text/plain; charset=utf-8');

require_once __DIR__ . '/db.php';

echo "=== Razik Telecom: Arabic UTF-8 Database Repair ===\n\n";

try {
    $pdo = Database::getConnection();
    
    // Force UTF-8 session
    $pdo->exec("SET NAMES utf8mb4;");
    $pdo->exec("SET CHARACTER SET utf8mb4;");
    $pdo->exec("SET collation_connection = 'utf8mb4_unicode_ci';");
    echo "[✓] Forced connection charset to utf8mb4\n";

    // Convert tables to utf8mb4
    $tables = ['settings', 'operators', 'users', 'dealer_commissions', 'wallet_transactions', 'topup_requests', 'recharges', 'complaints', 'audit_logs'];
    foreach ($tables as $tbl) {
        $pdo->exec("ALTER TABLE `{$tbl}` CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;");
        echo "[✓] Converted table `{$tbl}` to utf8mb4_unicode_ci\n";
    }

    // Restore Operators Arabic Names
    $opStmt = $pdo->prepare("UPDATE `operators` SET `name_ar` = ? WHERE `code` = ?");
    $opStmt->execute(['موبيليس', 'mobilis']);
    $opStmt->execute(['جازي', 'djezzy']);
    $opStmt->execute(['أوريدو', 'ooredoo']);
    echo "[✓] Restored Arabic operator names (موبيليس, جازي, أوريدو)\n";

    // Restore Settings
    $sStmt = $pdo->prepare("UPDATE `settings` SET `value` = ? WHERE `key_name` = ?");
    $sStmt->execute(['Razik Telecom | رازيق تليكوم', 'app_name']);
    $sStmt->execute(['د.ج', 'currency_symbol_ar']);
    $sStmt->execute(['14 شارع ديدوش مراد، الجزائر الوسطى، الجزائر', 'company_address']);
    echo "[✓] Restored Arabic settings (رازيق تليكوم, د.ج)\n";

    // Restore Users Wilayas and Names
    $dealers = [
        1 => ['Razik Hadj (General Manager)', 'Razik Telecom HQ', 'الجزائر', 'سيدي امحمد', '14 شارع ديدوش مراد، الجزائر'],
        2 => ['Karim Benali', 'Kiosque Bab El Oued', 'الجزائر', 'باب الوادي', '22 شارع العقيد لطفي'],
        3 => ['Sofiane Larbi', 'Cyber Service Oran', 'وهران', 'السانية', '105 شارع جيش التحرير الوطني'],
        4 => ['Amine Mansouri', 'Pont Blanc Multiservices', 'قسنطينة', 'سيدي مبروك', 'حي الشهداء رقم 14'],
        5 => ['Yacine Belkacem', 'Eurl Ain Fouara Telecom', 'سطيف', 'سطيف المركز', 'شارع 8 ماي 1945'],
        6 => ['Walid Kheddar', 'Tabac & Services Seybouse', 'عنابة', 'البوني', 'شارع الثورة رقم 48'],
        7 => ['Hicham Zerrouki', 'Kiosque La Rose', 'البليدة', 'أولاد يعيش', 'شارع الإخوة جيلالي'],
        8 => ['Bilal Mansour', 'Mansourah Services', 'تلمسان', 'المنصورة', 'الطريق الوطني رقم 22'],
        9 => ['Mourad Chaoui', 'Aures Phone & Tech', 'باتنة', 'باتنة المدينة', 'ممر مصطفى بن بولعيد'],
    ];

    $uStmt = $pdo->prepare("UPDATE `users` SET `full_name` = ?, `business_name` = ?, `wilaya` = ?, `commune` = ?, `address` = ? WHERE `id` = ?");
    foreach ($dealers as $id => $d) {
        $uStmt->execute([$d[0], $d[1], $d[2], $d[3], $d[4], $id]);
    }
    echo "[✓] Restored Algerian Wilayas and addresses in Arabic\n";

    // Verify current data
    $check = $pdo->query("SELECT id, code, name, name_ar FROM operators ORDER BY id ASC")->fetchAll();
    echo "\n=== Verification Results ===\n";
    foreach ($check as $r) {
        echo "ID {$r['id']} | {$r['name']} -> {$r['name_ar']}\n";
    }

    echo "\n[SUCCESS] Arabic characters and utf8mb4 encoding successfully restored!\n";

} catch (Throwable $e) {
    echo "\n[ERROR] Failed: " . $e->getMessage() . "\n";
}
