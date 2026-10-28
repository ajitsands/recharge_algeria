<?php
// ============================================================================
// Razik Telecom - Database Connection & Bootstrapper
// ============================================================================

class Database {
    private static ?PDO $instance = null;
    private static string $driver = 'unknown';

    public static function getConnection(): PDO {
        if (self::$instance !== null) {
            return self::$instance;
        }

        $config = require __DIR__ . '/config.php';
        $dbConfig = $config['database'];
        $mode = $dbConfig['default'];

        // Attempt MySQL
        if ($mode === 'mysql' || $mode === 'auto') {
            $my = $dbConfig['mysql'];

            // Build candidate profiles (primary, server profile, local root profile)
            $profiles = [];
            
            // 1. Configured profile
            $profiles[] = [
                'host' => $my['host'],
                'port' => $my['port'] ?? 3306,
                'database' => $my['database'],
                'username' => $my['username'],
                'password' => $my['password'],
                'charset' => $my['charset'] ?? 'utf8mb4'
            ];

            // 2. Server credentials explicit fallback
            $profiles[] = [
                'host' => 'localhost',
                'port' => 3306,
                'database' => 'teamtoob_algeria_recharge_db',
                'username' => 'teamtoob_algeria_recharge_user',
                'password' => 'S@nds1@b',
                'charset' => 'utf8mb4'
            ];

            // 3. Local root fallback
            $profiles[] = [
                'host' => '127.0.0.1',
                'port' => 3306,
                'database' => 'algeria_recharge',
                'username' => 'root',
                'password' => 'S@nds1@b',
                'charset' => 'utf8mb4'
            ];

            $lastErr = null;
            foreach ($profiles as $prof) {
                try {
                    $dsn = "mysql:host={$prof['host']};port={$prof['port']};dbname={$prof['database']};charset={$prof['charset']}";
                    $pdo = new PDO($dsn, $prof['username'], $prof['password'], [
                        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                        PDO::ATTR_TIMEOUT => 3,
                        PDO::MYSQL_ATTR_INIT_COMMAND => "SET NAMES utf8mb4 COLLATE utf8mb4_unicode_ci"
                    ]);

                    // Verify tables exist; if database is newly imported or empty, initialize
                    $checkTable = $pdo->query("SHOW TABLES LIKE 'operators'")->fetch();
                    if (!$checkTable) {
                        self::initializeMySqlDatabase($pdo);
                    }

                    self::$instance = $pdo;
                    self::$driver = 'mysql';
                    return self::$instance;
                } catch (Throwable $e) {
                    $lastErr = $e;
                    // On local root, if database doesn't exist, try creating it
                    if (($prof['username'] === 'root' || $prof['host'] === '127.0.0.1') && 
                        (strpos($e->getMessage(), 'Unknown database') !== false || strpos($e->getMessage(), '1049') !== false)) {
                        try {
                            $initDsn = "mysql:host={$prof['host']};port={$prof['port']};charset={$prof['charset']}";
                            $initPdo = new PDO($initDsn, $prof['username'], $prof['password'], [
                                PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                                PDO::ATTR_TIMEOUT => 3
                            ]);
                            $initPdo->exec("CREATE DATABASE IF NOT EXISTS `{$prof['database']}` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;");

                            $dsn = "mysql:host={$prof['host']};port={$prof['port']};dbname={$prof['database']};charset={$prof['charset']}";
                            $pdo = new PDO($dsn, $prof['username'], $prof['password'], [
                                PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                                PDO::ATTR_TIMEOUT => 3,
                                PDO::MYSQL_ATTR_INIT_COMMAND => "SET NAMES utf8mb4 COLLATE utf8mb4_unicode_ci"
                            ]);
                            $checkTable = $pdo->query("SHOW TABLES LIKE 'operators'")->fetch();
                            if (!$checkTable) {
                                self::initializeMySqlDatabase($pdo);
                            }
                            self::$instance = $pdo;
                            self::$driver = 'mysql';
                            return self::$instance;
                        } catch (Throwable $e2) {
                            $lastErr = $e2;
                        }
                    }
                    continue; // try next candidate profile
                }
            }

            if ($mode === 'mysql') {
                throw new Exception("MySQL Connection Failed: " . ($lastErr ? $lastErr->getMessage() : 'No connection profile succeeded'));
            }
        }

        // SQLite fallback (reliable, zero configuration on local Windows server)
        $sqliteDir = dirname($dbConfig['sqlite']['path']);
        if (!is_dir($sqliteDir)) {
            mkdir($sqliteDir, 0777, true);
        }
        $sqlitePath = $dbConfig['sqlite']['path'];
        $isNew = !file_exists($sqlitePath);

        $pdo = new PDO("sqlite:" . $sqlitePath, null, null, [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC
        ]);
        self::$instance = $pdo;
        self::$driver = 'sqlite';

        if ($isNew || filesize($sqlitePath) < 100) {
            self::initializeSqliteDatabase($pdo);
        }

        return self::$instance;
    }

    public static function getDriver(): string {
        return self::$driver;
    }

    private static function initializeMySqlDatabase(PDO $pdo): void {
        $schemaFile = __DIR__ . '/database/schema.sql';
        $seedFile = __DIR__ . '/database/seed.sql';

        if (file_exists($schemaFile)) {
            $schemaSql = file_get_contents($schemaFile);
            $pdo->exec($schemaSql);
        }

        if (file_exists($seedFile)) {
            $seedSql = file_get_contents($seedFile);
            $pdo->exec($seedSql);
        }
    }

    private static function initializeSqliteDatabase(PDO $pdo): void {
        $pdo->exec("
            CREATE TABLE IF NOT EXISTS settings (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                key_name TEXT UNIQUE NOT NULL,
                value TEXT NOT NULL,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
            );

            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                username TEXT UNIQUE NOT NULL,
                phone TEXT UNIQUE NOT NULL,
                email TEXT,
                password_hash TEXT NOT NULL,
                role TEXT DEFAULT 'dealer',
                full_name TEXT NOT NULL,
                business_name TEXT,
                wilaya TEXT DEFAULT 'Algiers',
                commune TEXT,
                address TEXT,
                national_id TEXT,
                commercial_register TEXT,
                status TEXT DEFAULT 'pending',
                wallet_balance REAL DEFAULT 0.00,
                credit_limit REAL DEFAULT 0.00,
                outstanding_debt REAL DEFAULT 0.00,
                commission_tier TEXT DEFAULT 'standard',
                language_preference TEXT DEFAULT 'ar',
                theme_preference TEXT DEFAULT 'light',
                last_login DATETIME,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
            );

            CREATE TABLE IF NOT EXISTS operators (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                code TEXT UNIQUE NOT NULL,
                name TEXT NOT NULL,
                name_ar TEXT NOT NULL,
                prefixes TEXT NOT NULL,
                default_commission_pct REAL DEFAULT 5.00,
                balance REAL DEFAULT 500000.00,
                low_balance_threshold REAL DEFAULT 50000.00,
                status TEXT DEFAULT 'active',
                logo_url TEXT,
                color_hex TEXT DEFAULT '#006633',
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
            );

            CREATE TABLE IF NOT EXISTS dealer_commissions (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL,
                operator_id INTEGER NOT NULL,
                commission_pct REAL NOT NULL,
                effective_from DATETIME DEFAULT CURRENT_TIMESTAMP,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            );

            CREATE TABLE IF NOT EXISTS wallet_transactions (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                transaction_ref TEXT UNIQUE NOT NULL,
                user_id INTEGER NOT NULL,
                type TEXT NOT NULL,
                amount REAL NOT NULL,
                balance_before REAL NOT NULL,
                balance_after REAL NOT NULL,
                related_id INTEGER,
                notes TEXT,
                created_by INTEGER,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            );

            CREATE TABLE IF NOT EXISTS topup_requests (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                request_ref TEXT UNIQUE NOT NULL,
                user_id INTEGER NOT NULL,
                amount REAL NOT NULL,
                payment_method TEXT DEFAULT 'cash_collection',
                proof_reference TEXT,
                status TEXT DEFAULT 'pending',
                notes TEXT,
                admin_notes TEXT,
                reviewed_by INTEGER,
                reviewed_at DATETIME,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            );

            CREATE TABLE IF NOT EXISTS recharges (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                recharge_ref TEXT UNIQUE NOT NULL,
                idempotency_key TEXT UNIQUE NOT NULL,
                user_id INTEGER NOT NULL,
                operator_id INTEGER NOT NULL,
                phone_number TEXT NOT NULL,
                face_value REAL NOT NULL,
                commission_pct REAL NOT NULL,
                commission_amount REAL NOT NULL,
                net_debited REAL NOT NULL,
                dealer_profit REAL NOT NULL,
                service_type TEXT DEFAULT 'mobile_flexy',
                operator_ref TEXT,
                status TEXT DEFAULT 'pending',
                status_message TEXT,
                retry_count INTEGER DEFAULT 0,
                completed_at DATETIME,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            );

            CREATE TABLE IF NOT EXISTS complaints (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                ticket_ref TEXT UNIQUE NOT NULL,
                user_id INTEGER NOT NULL,
                recharge_id INTEGER,
                phone_number TEXT NOT NULL,
                subject TEXT NOT NULL,
                description TEXT NOT NULL,
                status TEXT DEFAULT 'open',
                admin_response TEXT,
                resolved_by INTEGER,
                resolved_at DATETIME,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            );

            CREATE TABLE IF NOT EXISTS audit_logs (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER,
                action TEXT NOT NULL,
                entity_type TEXT NOT NULL,
                entity_id INTEGER,
                details TEXT,
                ip_address TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            );
        ");

        // Seed initial data
        $passHash = password_hash('admin123', PASSWORD_BCRYPT);
        $dealerPass = password_hash('dealer123', PASSWORD_BCRYPT);

        // Settings
        $pdo->exec("
            INSERT OR IGNORE INTO settings (key_name, value) VALUES 
            ('app_name', 'Razik Telecom | رازيق تليكوم'),
            ('timezone', 'Africa/Algiers'),
            ('currency', 'DZD'),
            ('currency_symbol_ar', 'د.ج'),
            ('date_format', 'd/m/Y H:i'),
            ('default_language', 'ar'),
            ('default_theme', 'light'),
            ('company_phone', '+213 21 00 00 00'),
            ('company_email', 'contact@raziktelecom.dz');
        ");

        // Operators
        $pdo->exec("
            INSERT OR IGNORE INTO operators (id, code, name, name_ar, prefixes, default_commission_pct, balance, low_balance_threshold, status, color_hex) VALUES 
            (1, 'mobilis', 'Mobilis', 'موبيليس', '065,066,067,069', 5.00, 750000.00, 80000.00, 'active', '#008a3e'),
            (2, 'djezzy', 'Djezzy', 'جازي', '077,078,079', 4.50, 620000.00, 70000.00, 'active', '#e4002b'),
            (3, 'ooredoo', 'Ooredoo', 'أوريدو', '054,055,056', 5.20, 580000.00, 60000.00, 'active', '#ed1c24');
        ");

        // Users seed
        $usersData = [
            [1, 'admin', '0550123456', 'admin@raziktelecom.dz', $passHash, 'admin', 'Razik Hadj (Owner)', 'Razik Telecom HQ', 'Alger', 'Sidi M\'Hamed', '14 Blvd Didouche Mourad', 'active', 0.00, 0.00, 0.00, 'ar', 'light'],
            [2, 'dealer_algiers', '0661234567', 'karim@babelemouad.dz', $dealerPass, 'dealer', 'Karim Benali', 'Kiosque Bab El Oued', 'Alger', 'Bab El Oued', 'Rue Colonel Lotfi #22', 'active', 45000.00, 20000.00, 5000.00, 'ar', 'light'],
            [3, 'dealer_oran', '0770987654', 'sofiane@orantelecom.dz', $dealerPass, 'dealer', 'Sofiane Larbi', 'Cyber Service Oran', 'Oran', 'Es Senia', 'Avenue de l\'ALN #105', 'active', 18500.00, 10000.00, 0.00, 'ar', 'light'],
            [4, 'dealer_constantine', '0555432109', 'amine@pontblanc.dz', $dealerPass, 'dealer', 'Amine Mansouri', 'Pont Blanc Multiservices', 'Constantine', 'Sidi Mabrouk', 'Cité des Martyrs', 'pending', 0.00, 0.00, 0.00, 'ar', 'light'],
        ];

        $uStmt = $pdo->prepare("
            INSERT OR REPLACE INTO users (id, username, phone, email, password_hash, role, full_name, business_name, wilaya, commune, address, status, wallet_balance, credit_limit, outstanding_debt, language_preference, theme_preference)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ");
        foreach ($usersData as $u) {
            $uStmt->execute($u);
        }

        // Sample Recharges
        $pdo->exec("
            INSERT OR IGNORE INTO recharges (id, recharge_ref, idempotency_key, user_id, operator_id, phone_number, face_value, commission_pct, commission_amount, net_debited, dealer_profit, service_type, operator_ref, status, status_message, completed_at) VALUES 
            (1, 'RCH-20261026-0001', 'IDEMP-001', 2, 1, '0661998877', 100.00, 5.00, 5.00, 95.00, 5.00, 'mobile_flexy', 'MOB-TX-99881', 'success', 'Top-up successful via Mobilis API Gateway', datetime('now')),
            (2, 'RCH-20261026-0002', 'IDEMP-002', 2, 1, '0663112233', 1000.00, 5.00, 50.00, 950.00, 50.00, 'mobile_flexy', 'MOB-TX-99882', 'success', 'Top-up successful via Mobilis API Gateway', datetime('now')),
            (3, 'RCH-20261026-0003', 'IDEMP-003', 3, 2, '0770554433', 1000.00, 4.50, 45.00, 955.00, 45.00, 'mobile_flexy', 'DJZ-TX-44512', 'success', 'Top-up successful via Djezzy B2B Route', datetime('now')),
            (4, 'RCH-20261026-0004', 'IDEMP-004', 2, 3, '0555887766', 2000.00, 5.20, 104.00, 1896.00, 104.00, 'mobile_flexy', 'OOR-PEND-1201', 'pending', 'Operator route processing, awaiting acknowledgement', NULL),
            (5, 'RCH-20261026-0005', 'IDEMP-005', 3, 1, '0668001122', 500.00, 5.00, 25.00, 475.00, 25.00, 'mobile_flexy', 'MOB-ERR-503', 'failed', 'Network timeout from operator modem pool', datetime('now'));
        ");

        // Top-up Requests
        $pdo->exec("
            INSERT OR IGNORE INTO topup_requests (id, request_ref, user_id, amount, payment_method, proof_reference, status, notes, admin_notes, reviewed_by) VALUES 
            (1, 'REQ-20261026-101', 2, 50000.00, 'cash_collection', 'CASH-REC-0891', 'approved', 'Cash collected by agent at store', 'Approved by owner', 1),
            (2, 'REQ-20261026-102', 3, 20000.00, 'baridimob', 'BM-TX-8839210', 'approved', 'BaridiMob receipt attached', 'Confirmed in bank', 1),
            (3, 'REQ-20261026-103', 2, 30000.00, 'cash_collection', 'CASH-COL-0902', 'pending', 'Dealer requested balance for weekend rush', NULL, NULL);
        ");

        // Complaints
        $pdo->exec("
            INSERT OR IGNORE INTO complaints (id, ticket_ref, user_id, recharge_id, phone_number, subject, description, status, admin_response, resolved_by) VALUES 
            (1, 'TCK-20261026-01', 3, 5, '0668001122', 'Failed recharge on Mobilis 500 DZD', 'The customer was in store, recharge returned failed. Please verify or refund.', 'open', NULL, NULL),
            (2, 'TCK-20261026-02', 2, 4, '0555887766', 'Pending Ooredoo 2000 DZD', 'Recharge still showing pending after 15 minutes.', 'investigating', 'Checking with Ooredoo Algiers NOC', 1);
        ");
    }
}
