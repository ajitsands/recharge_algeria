<?php
// ============================================================================
// Razik Telecom - Backend API Configuration
// ============================================================================

error_reporting(E_ALL);
ini_set('display_errors', '0');

// Default Timezone (Algeria is UTC+1)
date_default_timezone_set('Africa/Algiers');

// Determine if running on live server (teamtoob.in) or local environment
$isServer = (
    (isset($_SERVER['HTTP_HOST']) && strpos($_SERVER['HTTP_HOST'], 'teamtoob') !== false) ||
    (isset($_SERVER['SERVER_NAME']) && strpos($_SERVER['SERVER_NAME'], 'teamtoob') !== false) ||
    (isset($_SERVER['DOCUMENT_ROOT']) && strpos($_SERVER['DOCUMENT_ROOT'], 'teamtoob') !== false) ||
    (getenv('SERVER_ENV') === 'production')
);

// Server credentials specified by user:
// User:     teamtoob_algeria_recharge_user
// Database: teamtoob_algeria_recharge_db
// Password: same password (S@nds1@b)
$dbHost = $isServer ? 'localhost' : '127.0.0.1';
$dbName = $isServer ? 'teamtoob_algeria_recharge_db' : 'algeria_recharge';
$dbUser = $isServer ? 'teamtoob_algeria_recharge_user' : 'root';
$dbPass = 'S@nds1@b';

return [
    'app_name' => 'Razik Telecom Recharge Platform',
    'app_version' => '1.0.0',
    'jwt_secret' => 'razik_algeria_telecom_secret_key_2026_x89a',
    'token_expiry_hours' => 24,

    // Database Configuration
    'database' => [
        // Primary Driver: 'mysql' or 'sqlite'
        'default' => 'mysql',
        'mysql' => [
            'host' => $dbHost,
            'port' => 3306,
            'database' => $dbName,
            'username' => $dbUser,
            'password' => $dbPass,
            'charset' => 'utf8mb4',
            'server_profile' => [
                'host' => 'localhost',
                'database' => 'teamtoob_algeria_recharge_db',
                'username' => 'teamtoob_algeria_recharge_user',
                'password' => 'S@nds1@b',
            ]
        ],
        'sqlite' => [
            'path' => __DIR__ . '/database/algeria_recharge.sqlite',
        ]
    ],

    // Algerian Locale Defaults
    'locale' => [
        'timezone' => 'Africa/Algiers',
        'currency' => 'DZD',
        'currency_symbol_ar' => 'د.ج',
        'date_format' => 'd/m/Y H:i',
        'languages' => ['ar', 'en', 'fr'],
        'default_language' => 'ar',
        'default_theme' => 'light'
    ],

    // Operator Prefixes
    'prefixes' => [
        'mobilis' => ['065', '066', '067', '069', '65', '66', '67', '69'],
        'djezzy'  => ['077', '078', '079', '77', '78', '79'],
        'ooredoo' => ['054', '055', '056', '54', '55', '56'],
    ]
];
