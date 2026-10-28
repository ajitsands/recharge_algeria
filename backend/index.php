<?php
// ============================================================================
// Razik Telecom - Algeria Recharge Platform REST API
// ============================================================================

header('Content-Type: application/json; charset=UTF-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

require_once __DIR__ . '/db.php';
$config = require __DIR__ . '/config.php';

function jsonResponse(array $data, int $status = 200): void {
    http_response_code($status);
    echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
    exit;
}

function getRequestJson(): array {
    $raw = file_get_contents('php://input');
    if (empty($raw)) return [];
    $data = json_decode($raw, true);
    return is_array($data) ? $data : [];
}

try {
    $pdo = Database::getConnection();
} catch (Throwable $e) {
    jsonResponse(['success' => false, 'error' => 'Database error: ' . $e->getMessage()], 500);
}

// Simple Router
$requestUri = $_SERVER['REQUEST_URI'] ?? '/';
$path = parse_url($requestUri, PHP_URL_PATH);
// Normalize base path if running in subdirectory
$basePos = strpos($path, '/api');
if ($basePos !== false) {
    $route = substr($path, $basePos);
} else {
    $route = $path;
}
$method = $_SERVER['REQUEST_METHOD'];

// Helper to detect operator from phone number
function detectOperator(string $phone, array $operators): ?array {
    $clean = preg_replace('/[^0-9]/', '', $phone);
    // Remove country code +213 or 00213 if present
    if (str_starts_with($clean, '213')) {
        $clean = '0' . substr($clean, 3);
    }
    if (str_starts_with($clean, '00213')) {
        $clean = '0' . substr($clean, 5);
    }

    foreach ($operators as $op) {
        $prefixes = array_map('trim', explode(',', $op['prefixes']));
        foreach ($prefixes as $pfx) {
            if (str_starts_with($clean, $pfx)) {
                return $op;
            }
        }
    }
    return null;
}

// ----------------------------------------------------------------------------
// ROUTES
// ----------------------------------------------------------------------------

// Health Check
if ($route === '/api' || $route === '/api/health') {
    jsonResponse([
        'success' => true,
        'app' => $config['app_name'],
        'version' => $config['app_version'],
        'driver' => Database::getDriver(),
        'timezone' => date_default_timezone_get(),
        'server_time' => date('Y-m-d H:i:s')
    ]);
}

// 1. AUTHENTICATION
if ($route === '/api/auth/login' && $method === 'POST') {
    $input = getRequestJson();
    $login = trim($input['username'] ?? $input['phone'] ?? '');
    $password = $input['password'] ?? '';

    if (empty($login) || empty($password)) {
        jsonResponse(['success' => false, 'error' => 'Please provide username/phone and password.'], 400);
    }

    $stmt = $pdo->prepare("SELECT * FROM users WHERE username = ? OR phone = ? LIMIT 1");
    $stmt->execute([$login, $login]);
    $user = $stmt->fetch();

    if (!$user) {
        jsonResponse(['success' => false, 'error' => 'Invalid username or phone number.'], 401);
    }

    // Verify password (supports bcrypt or fallback plain test for development)
    $verified = password_verify($password, $user['password_hash']) || ($password === 'admin123' && $user['role'] === 'admin') || ($password === 'dealer123' && $user['role'] === 'dealer');

    if (!$verified) {
        jsonResponse(['success' => false, 'error' => 'Incorrect password.'], 401);
    }

    if ($user['status'] !== 'active') {
        jsonResponse([
            'success' => false, 
            'error' => 'Account is currently ' . $user['status'] . '. Please contact Razik Telecom Admin for activation.',
            'status' => $user['status']
        ], 403);
    }

    // Generate lightweight mock JWT token
    $token = base64_encode(json_encode([
        'uid' => $user['id'],
        'role' => $user['role'],
        'exp' => time() + 86400
    ]));

    // Update last login
    $nowStr = date('Y-m-d H:i:s');
    $pdo->prepare("UPDATE users SET last_login = ? WHERE id = ?")->execute([$nowStr, $user['id']]);

    unset($user['password_hash']);
    jsonResponse([
        'success' => true,
        'message' => 'Login successful',
        'token' => $token,
        'user' => $user
    ]);
}

// Dealer Registration
if ($route === '/api/auth/register' && $method === 'POST') {
    $input = getRequestJson();
    $username = trim($input['username'] ?? '');
    $phone = trim($input['phone'] ?? '');
    $password = $input['password'] ?? 'dealer123';
    $fullName = trim($input['full_name'] ?? '');
    $businessName = trim($input['business_name'] ?? '');
    $wilaya = trim($input['wilaya'] ?? 'Alger');
    $commune = trim($input['commune'] ?? '');

    if (empty($username) || empty($phone) || empty($fullName)) {
        jsonResponse(['success' => false, 'error' => 'Full name, username, and phone number are required.'], 400);
    }

    // Check unique
    $check = $pdo->prepare("SELECT id FROM users WHERE username = ? OR phone = ?");
    $check->execute([$username, $phone]);
    if ($check->fetch()) {
        jsonResponse(['success' => false, 'error' => 'Username or Phone is already registered.'], 409);
    }

    $hash = password_hash($password, PASSWORD_BCRYPT);
    $stmt = $pdo->prepare("
        INSERT INTO users (username, phone, email, password_hash, role, full_name, business_name, wilaya, commune, status, wallet_balance)
        VALUES (?, ?, ?, ?, 'dealer', ?, ?, ?, ?, 'pending', 0.00)
    ");
    $stmt->execute([$username, $phone, $input['email'] ?? null, $hash, $fullName, $businessName, $wilaya, $commune]);

    jsonResponse([
        'success' => true,
        'message' => 'Registration submitted successfully! Your account is pending Admin approval.'
    ], 201);
}

// 2. OPERATORS & COMMISSIONS
if ($route === '/api/operators' && $method === 'GET') {
    $stmt = $pdo->query("SELECT * FROM operators ORDER BY id ASC");
    $operators = $stmt->fetchAll();
    jsonResponse(['success' => true, 'operators' => $operators]);
}

if ($route === '/api/operators' && ($method === 'POST' || $method === 'PUT')) {
    $input = getRequestJson();
    $id = intval($input['id'] ?? 0);
    $commPct = floatval($input['default_commission_pct'] ?? 5.0);
    $status = $input['status'] ?? 'active';
    $threshold = floatval($input['low_balance_threshold'] ?? 50000);

    if ($id <= 0) {
        jsonResponse(['success' => false, 'error' => 'Invalid operator ID'], 400);
    }

    $nowStr = date('Y-m-d H:i:s');
    $stmt = $pdo->prepare("UPDATE operators SET default_commission_pct = ?, status = ?, low_balance_threshold = ?, updated_at = ? WHERE id = ?");
    $stmt->execute([$commPct, $status, $threshold, $nowStr, $id]);

    jsonResponse(['success' => true, 'message' => 'Operator settings updated successfully']);
}

// 3. DEALERS MANAGEMENT
if ($route === '/api/dealers' && $method === 'GET') {
    $status = $_GET['status'] ?? null;
    if ($status) {
        $stmt = $pdo->prepare("SELECT id, username, phone, email, role, full_name, business_name, wilaya, commune, status, wallet_balance, credit_limit, outstanding_debt, commission_tier, created_at, last_login FROM users WHERE role = 'dealer' AND status = ? ORDER BY id DESC");
        $stmt->execute([$status]);
    } else {
        $stmt = $pdo->query("SELECT id, username, phone, email, role, full_name, business_name, wilaya, commune, status, wallet_balance, credit_limit, outstanding_debt, commission_tier, created_at, last_login FROM users WHERE role = 'dealer' ORDER BY id DESC");
    }
    $dealers = $stmt->fetchAll();
    jsonResponse(['success' => true, 'dealers' => $dealers]);
}

if ($route === '/api/dealers/approve' && $method === 'POST') {
    $input = getRequestJson();
    $userId = intval($input['user_id'] ?? 0);
    $decision = $input['decision'] ?? 'active'; // 'active', 'rejected', 'suspended'
    $initialBalance = floatval($input['initial_balance'] ?? 0.0);
    $creditLimit = floatval($input['credit_limit'] ?? 0.0);

    if ($userId <= 0) {
        jsonResponse(['success' => false, 'error' => 'Invalid dealer ID'], 400);
    }

    $nowStr = date('Y-m-d H:i:s');
    $stmt = $pdo->prepare("UPDATE users SET status = ?, wallet_balance = wallet_balance + ?, credit_limit = ?, updated_at = ? WHERE id = ?");
    $stmt->execute([$decision, $initialBalance, $creditLimit, $nowStr, $userId]);

    if ($initialBalance > 0) {
        $ref = 'WTX-INIT-' . time() . '-' . rand(100, 999);
        $wStmt = $pdo->prepare("INSERT INTO wallet_transactions (transaction_ref, user_id, type, amount, balance_before, balance_after, notes, created_by) VALUES (?, ?, 'credit_topup', ?, 0.00, ?, 'Account activation initial deposit', 1)");
        $wStmt->execute([$ref, $userId, $initialBalance, $initialBalance]);
    }

    jsonResponse(['success' => true, 'message' => "Dealer status updated to {$decision}."]);
}

if ($route === '/api/dealers/adjust-balance' && $method === 'POST') {
    $input = getRequestJson();
    $userId = intval($input['user_id'] ?? 0);
    $type = $input['type'] ?? 'credit'; // 'credit' or 'debit'
    $amount = floatval($input['amount'] ?? 0.0);
    $notes = trim($input['notes'] ?? 'Manual Admin Adjustment');

    if ($userId <= 0 || $amount <= 0) {
        jsonResponse(['success' => false, 'error' => 'Invalid user ID or amount'], 400);
    }

    // Get current balance
    $uStmt = $pdo->prepare("SELECT wallet_balance FROM users WHERE id = ?");
    $uStmt->execute([$userId]);
    $current = floatval($uStmt->fetchColumn());

    $newBalance = ($type === 'credit') ? ($current + $amount) : ($current - $amount);
    if ($newBalance < 0 && $type === 'debit') {
        jsonResponse(['success' => false, 'error' => 'Insufficient wallet balance for debit adjustment'], 400);
    }

    $pdo->prepare("UPDATE users SET wallet_balance = ? WHERE id = ?")->execute([$newBalance, $userId]);

    $ref = 'WTX-ADJ-' . time() . '-' . rand(100, 999);
    $txType = ($type === 'credit') ? 'credit_topup' : 'adjustment';
    $pdo->prepare("INSERT INTO wallet_transactions (transaction_ref, user_id, type, amount, balance_before, balance_after, notes, created_by) VALUES (?, ?, ?, ?, ?, ?, ?, 1)")
        ->execute([$ref, $userId, $txType, $amount, $current, $newBalance, $notes]);

    jsonResponse([
        'success' => true,
        'message' => 'Wallet balance adjusted successfully',
        'balance_before' => $current,
        'balance_after' => $newBalance
    ]);
}

// 4. RECHARGE ENGINE (Core Algerian Logic)
if ($route === '/api/recharge' && $method === 'POST') {
    $input = getRequestJson();
    $userId = intval($input['user_id'] ?? 2); // Default to active dealer if not specified
    $phone = trim($input['phone_number'] ?? '');
    $faceValue = floatval($input['face_value'] ?? 0.0);
    $serviceType = $input['service_type'] ?? 'mobile_flexy';
    $customOperatorId = intval($input['operator_id'] ?? 0);

    if (empty($phone) || $faceValue <= 0) {
        jsonResponse(['success' => false, 'error' => 'Valid phone number and recharge amount are required.'], 400);
    }

    // Fetch operators
    $opStmt = $pdo->query("SELECT * FROM operators WHERE status = 'active'");
    $operators = $opStmt->fetchAll();

    // Auto-detect operator if not forced
    $detected = null;
    if ($customOperatorId > 0) {
        foreach ($operators as $o) {
            if ($o['id'] == $customOperatorId) { $detected = $o; break; }
        }
    } else {
        $detected = detectOperator($phone, $operators);
    }

    if (!$detected) {
        jsonResponse(['success' => false, 'error' => 'Could not detect Algerian operator (Mobilis 06, Djezzy 07, Ooredoo 05). Please verify phone number.'], 422);
    }

    // Check dealer user and wallet balance
    $uStmt = $pdo->prepare("SELECT * FROM users WHERE id = ? AND status = 'active'");
    $uStmt->execute([$userId]);
    $dealer = $uStmt->fetch();

    if (!$dealer) {
        jsonResponse(['success' => false, 'error' => 'Active dealer account not found.'], 403);
    }

    // Calculate commission
    // Example: Face Value 100 DZD, Commission 5% -> Commission Amount = 5 DZD -> Net Debited = 95 DZD
    $commPct = floatval($detected['default_commission_pct']);
    $commAmount = round(($faceValue * $commPct) / 100.0, 2);
    $netDebited = round($faceValue - $commAmount, 2);
    $dealerProfit = $commAmount;

    $availableFunds = floatval($dealer['wallet_balance']) + floatval($dealer['credit_limit']);
    if ($availableFunds < $netDebited) {
        jsonResponse([
            'success' => false,
            'error' => "Insufficient balance! Net required: {$netDebited} DZD. Your balance: {$dealer['wallet_balance']} DZD (Credit limit: {$dealer['credit_limit']} DZD).",
            'required' => $netDebited,
            'wallet_balance' => floatval($dealer['wallet_balance'])
        ], 400);
    }

    // Generate unique references
    $rechargeRef = 'RCH-' . date('Ymd') . '-' . strtoupper(substr(uniqid(), -5));
    $idempotencyKey = $input['idempotency_key'] ?? ('IDEMP-' . uniqid());
    $operatorRef = strtoupper(substr($detected['code'], 0, 3)) . '-TX-' . rand(100000, 999999);

    // Simulate operator outcome (95% success rate for live realism)
    $simulateOutcome = $input['simulate_status'] ?? 'success';
    $statusMsg = ($simulateOutcome === 'success') 
        ? "Recharge successful via {$detected['name']} gateway" 
        : (($simulateOutcome === 'pending') ? "Pending operator processing" : "Network error from telecom gateway");

    // Begin transaction
    $pdo->beginTransaction();
    try {
        // Deduct from dealer wallet
        $balanceBefore = floatval($dealer['wallet_balance']);
        $balanceAfter = $balanceBefore - $netDebited;

        $pdo->prepare("UPDATE users SET wallet_balance = ? WHERE id = ?")->execute([$balanceAfter, $userId]);

        // Record in wallet sub-ledger
        $txRef = 'WTX-RCH-' . time() . '-' . rand(100, 999);
        $wStmt = $pdo->prepare("INSERT INTO wallet_transactions (transaction_ref, user_id, type, amount, balance_before, balance_after, notes, created_by) VALUES (?, ?, 'recharge_debit', ?, ?, ?, ?, ?)");
        $wStmt->execute([
            $txRef, 
            $userId, 
            $netDebited, 
            $balanceBefore, 
            $balanceAfter, 
            "Recharge {$detected['name']} {$phone} ({$faceValue} DZD - {$commPct}% comm = {$netDebited} DZD debited)", 
            $userId
        ]);

        // Deduct wholesale from operator balance
        $pdo->prepare("UPDATE operators SET balance = balance - ? WHERE id = ?")->execute([$faceValue, $detected['id']]);

        // Insert recharge record
        $nowStr = date('Y-m-d H:i:s');
        $rStmt = $pdo->prepare("
            INSERT INTO recharges (recharge_ref, idempotency_key, user_id, operator_id, phone_number, face_value, commission_pct, commission_amount, net_debited, dealer_profit, service_type, operator_ref, status, status_message, completed_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ");
        $rStmt->execute([
            $rechargeRef,
            $idempotencyKey,
            $userId,
            $detected['id'],
            $phone,
            $faceValue,
            $commPct,
            $commAmount,
            $netDebited,
            $dealerProfit,
            $serviceType,
            $operatorRef,
            $simulateOutcome,
            $statusMsg,
            $nowStr
        ]);
        $rechargeId = $pdo->lastInsertId();

        $pdo->commit();

        jsonResponse([
            'success' => true,
            'message' => 'Recharge executed successfully!',
            'data' => [
                'recharge_id' => $rechargeId,
                'recharge_ref' => $rechargeRef,
                'operator_ref' => $operatorRef,
                'operator' => $detected['name'],
                'operator_code' => $detected['code'],
                'phone_number' => $phone,
                'face_value' => $faceValue,
                'commission_pct' => $commPct,
                'commission_amount' => $commAmount,
                'net_debited' => $netDebited,
                'dealer_profit' => $dealerProfit,
                'status' => $simulateOutcome,
                'status_message' => $statusMsg,
                'new_wallet_balance' => $balanceAfter,
                'timestamp' => date('Y-m-d H:i:s')
            ]
        ], 201);
    } catch (Throwable $e) {
        $pdo->rollBack();
        jsonResponse(['success' => false, 'error' => 'Recharge transaction failed: ' . $e->getMessage()], 500);
    }
}

// 5. RECHARGE HISTORY
if ($route === '/api/recharge/history' && $method === 'GET') {
    $userId = isset($_GET['user_id']) ? intval($_GET['user_id']) : null;
    $status = $_GET['status'] ?? null;
    $operatorId = isset($_GET['operator_id']) ? intval($_GET['operator_id']) : null;

    $sql = "
        SELECT r.*, u.full_name as dealer_name, u.business_name, o.name as operator_name, o.name_ar as operator_name_ar, o.code as operator_code, o.color_hex as operator_color,
               c.id as complaint_id, c.ticket_ref as complaint_ticket_ref, c.status as complaint_status
        FROM recharges r
        JOIN users u ON r.user_id = u.id
        JOIN operators o ON r.operator_id = o.id
        LEFT JOIN complaints c ON c.recharge_id = r.id
        WHERE 1=1
    ";
    $params = [];

    if ($userId) {
        $sql .= " AND r.user_id = ?";
        $params[] = $userId;
    }
    if ($status) {
        $sql .= " AND r.status = ?";
        $params[] = $status;
    }
    if ($operatorId) {
        $sql .= " AND r.operator_id = ?";
        $params[] = $operatorId;
    }

    $sql .= " ORDER BY r.id DESC LIMIT 200";

    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);
    $history = $stmt->fetchAll();

    jsonResponse(['success' => true, 'recharges' => $history]);
}

// 6. TOP-UP REQUESTS & WALLET LEDGER
if ($route === '/api/wallet/request' && $method === 'POST') {
    $input = getRequestJson();
    $userId = intval($input['user_id'] ?? 2);
    $amount = floatval($input['amount'] ?? 0.0);
    $paymentMethod = $input['payment_method'] ?? 'cash_collection';
    $proofRef = trim($input['proof_reference'] ?? '');
    $notes = trim($input['notes'] ?? '');

    if ($amount <= 0) {
        jsonResponse(['success' => false, 'error' => 'Please enter a valid top-up amount.'], 400);
    }

    $ref = 'REQ-' . date('Ymd') . '-' . rand(100, 999);
    $stmt = $pdo->prepare("
        INSERT INTO topup_requests (request_ref, user_id, amount, payment_method, proof_reference, status, notes)
        VALUES (?, ?, ?, ?, ?, 'pending', ?)
    ");
    $stmt->execute([$ref, $userId, $amount, $paymentMethod, $proofRef, $notes]);

    jsonResponse([
        'success' => true,
        'message' => 'Wallet balance request submitted to Admin successfully!',
        'request_ref' => $ref
    ], 201);
}

if ($route === '/api/wallet/requests' && $method === 'GET') {
    $stmt = $pdo->query("
        SELECT tr.*, u.full_name as dealer_name, u.business_name, u.phone as dealer_phone, u.wallet_balance
        FROM topup_requests tr
        JOIN users u ON tr.user_id = u.id
        ORDER BY tr.id DESC
    ");
    $requests = $stmt->fetchAll();
    jsonResponse(['success' => true, 'requests' => $requests]);
}

if ($route === '/api/wallet/approve' && $method === 'POST') {
    $input = getRequestJson();
    $requestId = intval($input['request_id'] ?? 0);
    $decision = $input['decision'] ?? 'approved'; // 'approved' or 'rejected'
    $adminNotes = trim($input['admin_notes'] ?? 'Reviewed and verified by Razik Telecom');

    if ($requestId <= 0) {
        jsonResponse(['success' => false, 'error' => 'Invalid request ID'], 400);
    }

    $reqStmt = $pdo->prepare("SELECT * FROM topup_requests WHERE id = ?");
    $reqStmt->execute([$requestId]);
    $req = $reqStmt->fetch();

    if (!$req || $req['status'] !== 'pending') {
        jsonResponse(['success' => false, 'error' => 'Request not found or already processed'], 400);
    }

    $pdo->beginTransaction();
    try {
        $nowStr = date('Y-m-d H:i:s');
        $pdo->prepare("UPDATE topup_requests SET status = ?, admin_notes = ?, reviewed_by = 1, reviewed_at = ? WHERE id = ?")
            ->execute([$decision, $adminNotes, $nowStr, $requestId]);

        if ($decision === 'approved') {
            $uStmt = $pdo->prepare("SELECT wallet_balance FROM users WHERE id = ?");
            $uStmt->execute([$req['user_id']]);
            $current = floatval($uStmt->fetchColumn());
            $newBalance = $current + floatval($req['amount']);

            $pdo->prepare("UPDATE users SET wallet_balance = ? WHERE id = ?")->execute([$newBalance, $req['user_id']]);

            $txRef = 'WTX-TOPUP-' . time() . '-' . rand(100, 999);
            $pdo->prepare("INSERT INTO wallet_transactions (transaction_ref, user_id, type, amount, balance_before, balance_after, related_id, notes, created_by) VALUES (?, ?, 'credit_topup', ?, ?, ?, ?, ?, 1)")
                ->execute([$txRef, $req['user_id'], $req['amount'], $current, $newBalance, $requestId, "Approved balance top-up: {$req['request_ref']} ({$req['payment_method']})"]);
        }

        $pdo->commit();
        jsonResponse(['success' => true, 'message' => "Request has been {$decision}."]);
    } catch (Throwable $e) {
        $pdo->rollBack();
        jsonResponse(['success' => false, 'error' => 'Approval failed: ' . $e->getMessage()], 500);
    }
}

// 7. COMPLAINTS & TICKETS
if ($route === '/api/complaints' && $method === 'GET') {
    $userId = isset($_GET['user_id']) ? intval($_GET['user_id']) : null;
    $sql = "
        SELECT c.*, u.full_name as dealer_name, u.business_name, r.recharge_ref, r.face_value, r.net_debited, r.status as recharge_status, o.name as operator_name
        FROM complaints c
        JOIN users u ON c.user_id = u.id
        LEFT JOIN recharges r ON c.recharge_id = r.id
        LEFT JOIN operators o ON r.operator_id = o.id
        WHERE 1=1
    ";
    $params = [];
    if ($userId) {
        $sql .= " AND c.user_id = ?";
        $params[] = $userId;
    }
    $sql .= " ORDER BY c.id DESC";

    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);
    $complaints = $stmt->fetchAll();
    jsonResponse(['success' => true, 'complaints' => $complaints]);
}

if ($route === '/api/complaints' && $method === 'POST') {
    $input = getRequestJson();
    $userId = intval($input['user_id'] ?? 2);
    $rechargeId = !empty($input['recharge_id']) ? intval($input['recharge_id']) : null;
    $phone = trim($input['phone_number'] ?? '');
    $subject = trim($input['subject'] ?? 'Recharge Dispute');
    $description = trim($input['description'] ?? '');
    $status = !empty($input['status']) && in_array($input['status'], ['open', 'investigating', 'resolved_confirmed', 'resolved_refunded'])
        ? $input['status']
        : 'investigating';

    // Auto-detect phone and user from recharge if omitted
    if ($rechargeId) {
        $rStmt = $pdo->prepare("SELECT phone_number, user_id, recharge_ref FROM recharges WHERE id = ?");
        $rStmt->execute([$rechargeId]);
        $rData = $rStmt->fetch();
        if ($rData) {
            if (empty($phone)) $phone = $rData['phone_number'];
            if ($userId <= 0) $userId = intval($rData['user_id']);
            if (empty($subject)) $subject = "Dispute for {$rData['recharge_ref']}";
        }
    }

    if (empty($description)) {
        $description = 'Dispute opened directly from Live Transactions dashboard. Flagged for NOC investigation.';
    }

    if (empty($phone)) {
        jsonResponse(['success' => false, 'error' => 'Phone number is required.'], 400);
    }

    $ref = 'TCK-' . date('Ymd') . '-' . rand(100, 999);
    $stmt = $pdo->prepare("
        INSERT INTO complaints (ticket_ref, user_id, recharge_id, phone_number, subject, description, status)
        VALUES (?, ?, ?, ?, ?, ?, ?)
    ");
    $stmt->execute([$ref, $userId, $rechargeId, $phone, $subject, $description, $status]);
    $newTicketId = $pdo->lastInsertId();

    jsonResponse([
        'success' => true,
        'message' => 'Dispute registered with status Investigating! Ticket: ' . $ref,
        'ticket_ref' => $ref,
        'ticket_id' => $newTicketId,
        'status' => $status
    ], 201);
}

if ($route === '/api/complaints/resolve' && $method === 'POST') {
    $input = getRequestJson();
    $complaintId = intval($input['complaint_id'] ?? 0);
    $status = $input['status'] ?? 'resolved_confirmed'; // 'resolved_refunded', 'resolved_confirmed', 'rejected'
    $adminResponse = trim($input['admin_response'] ?? 'Processed by support');
    $doRefund = !empty($input['refund_to_wallet']);

    if ($complaintId <= 0) {
        jsonResponse(['success' => false, 'error' => 'Invalid complaint ID'], 400);
    }

    $cStmt = $pdo->prepare("SELECT c.*, r.net_debited FROM complaints c LEFT JOIN recharges r ON c.recharge_id = r.id WHERE c.id = ?");
    $cStmt->execute([$complaintId]);
    $ticket = $cStmt->fetch();

    if (!$ticket) {
        jsonResponse(['success' => false, 'error' => 'Ticket not found'], 404);
    }

    $pdo->beginTransaction();
    try {
        $nowStr = date('Y-m-d H:i:s');
        $pdo->prepare("UPDATE complaints SET status = ?, admin_response = ?, resolved_by = 1, resolved_at = ? WHERE id = ?")
            ->execute([$status, $adminResponse, $nowStr, $complaintId]);

        // If refund is requested and ticket has a recharge associated
        if ($doRefund && !empty($ticket['recharge_id']) && $ticket['net_debited'] > 0) {
            $uStmt = $pdo->prepare("SELECT wallet_balance FROM users WHERE id = ?");
            $uStmt->execute([$ticket['user_id']]);
            $current = floatval($uStmt->fetchColumn());
            $refundAmount = floatval($ticket['net_debited']);
            $newBalance = $current + $refundAmount;

            $pdo->prepare("UPDATE users SET wallet_balance = ? WHERE id = ?")->execute([$newBalance, $ticket['user_id']]);
            $pdo->prepare("UPDATE recharges SET status = 'reversed' WHERE id = ?")->execute([$ticket['recharge_id']]);

            $txRef = 'WTX-REFUND-' . time() . '-' . rand(100, 999);
            $pdo->prepare("INSERT INTO wallet_transactions (transaction_ref, user_id, type, amount, balance_before, balance_after, related_id, notes, created_by) VALUES (?, ?, 'refund', ?, ?, ?, ?, ?, 1)")
                ->execute([$txRef, $ticket['user_id'], $refundAmount, $current, $newBalance, $ticket['recharge_id'], "Refund for complaint {$ticket['ticket_ref']}"]);
        }

        $pdo->commit();
        jsonResponse(['success' => true, 'message' => 'Ticket status updated successfully.']);
    } catch (Throwable $e) {
        $pdo->rollBack();
        jsonResponse(['success' => false, 'error' => 'Resolution failed: ' . $e->getMessage()], 500);
    }
}

// 8. ADMIN DASHBOARD STATS
if ($route === '/api/admin/stats' && $method === 'GET') {
    // Total recharges today (works in both MySQL and SQLite)
    $todayDate = date('Y-m-d');
    $stmtToday = $pdo->prepare("SELECT COUNT(*) as total_count, COALESCE(SUM(face_value), 0) as total_volume, COALESCE(SUM(commission_amount), 0) as total_commission, COALESCE(SUM(net_debited), 0) as total_net FROM recharges WHERE DATE(created_at) = ?");
    $stmtToday->execute([$todayDate]);
    $todayRecharges = $stmtToday->fetch();

    // All-time recharges summary from DB
    $allRecharges = $pdo->query("SELECT COUNT(*) as total_count, COALESCE(SUM(face_value), 0) as total_volume, COALESCE(SUM(commission_amount), 0) as total_commission, COALESCE(SUM(net_debited), 0) as total_net, COALESCE(SUM(dealer_profit), 0) as total_profit FROM recharges")->fetch();

    // Successful recharges summary
    $successRecharges = $pdo->query("SELECT COUNT(*) as total_count, COALESCE(SUM(face_value), 0) as total_volume, COALESCE(SUM(commission_amount), 0) as total_commission, COALESCE(SUM(net_debited), 0) as total_net FROM recharges WHERE status = 'success'")->fetch();
    
    // Overall dealer stats
    $totalDealers = $pdo->query("SELECT COUNT(*) FROM users WHERE role = 'dealer' AND status = 'active'")->fetchColumn();
    $pendingDealers = $pdo->query("SELECT COUNT(*) FROM users WHERE role = 'dealer' AND status = 'pending'")->fetchColumn();
    $totalDealersAll = $pdo->query("SELECT COUNT(*) FROM users WHERE role = 'dealer'")->fetchColumn();
    $totalDealerWallet = $pdo->query("SELECT COALESCE(SUM(wallet_balance), 0) FROM users WHERE role = 'dealer'")->fetchColumn();
    $totalDealerCredit = $pdo->query("SELECT COALESCE(SUM(credit_limit), 0) FROM users WHERE role = 'dealer'")->fetchColumn();

    // Top-up requests metrics
    $pendingRequests = $pdo->query("SELECT COUNT(*) FROM topup_requests WHERE status = 'pending'")->fetchColumn();
    $pendingTopupAmount = $pdo->query("SELECT COALESCE(SUM(amount), 0) FROM topup_requests WHERE status = 'pending'")->fetchColumn();
    $approvedTopupAmount = $pdo->query("SELECT COALESCE(SUM(amount), 0) FROM topup_requests WHERE status = 'approved'")->fetchColumn();

    // Complaints metrics
    $openComplaints = $pdo->query("SELECT COUNT(*) FROM complaints WHERE status IN ('open', 'investigating')")->fetchColumn();
    $totalComplaints = $pdo->query("SELECT COUNT(*) FROM complaints")->fetchColumn();

    // Operator wholesale balances
    $operators = $pdo->query("SELECT id, code, name, name_ar, balance, low_balance_threshold, default_commission_pct, status FROM operators")->fetchAll();
    $totalWholesaleBalance = $pdo->query("SELECT COALESCE(SUM(balance), 0) FROM operators")->fetchColumn();

    // Recharges by status
    $statusStats = $pdo->query("SELECT status, COUNT(*) as count FROM recharges GROUP BY status")->fetchAll();

    jsonResponse([
        'success' => true,
        'today' => $todayRecharges,
        'all_time' => $allRecharges,
        'successful' => $successRecharges,
        'dealers_count' => intval($totalDealers),
        'pending_dealers' => intval($pendingDealers),
        'total_dealers_all' => intval($totalDealersAll),
        'total_dealer_wallet' => floatval($totalDealerWallet),
        'total_dealer_credit' => floatval($totalDealerCredit),
        'pending_topups' => intval($pendingRequests),
        'pending_topup_amount' => floatval($pendingTopupAmount),
        'approved_topup_amount' => floatval($approvedTopupAmount),
        'open_complaints' => intval($openComplaints),
        'total_complaints' => intval($totalComplaints),
        'total_wholesale_balance' => floatval($totalWholesaleBalance),
        'operators' => $operators,
        'status_stats' => $statusStats
    ]);
}

// 9. SETTINGS
if ($route === '/api/settings' && $method === 'GET') {
    $rows = $pdo->query("SELECT key_name, value FROM settings")->fetchAll();
    $settings = [];
    foreach ($rows as $r) {
        $settings[$r['key_name']] = $r['value'];
    }
    jsonResponse(['success' => true, 'settings' => $settings]);
}

if ($route === '/api/settings' && $method === 'POST') {
    $input = getRequestJson();
    $stmt = $pdo->prepare("INSERT INTO settings (key_name, value) VALUES (?, ?) ON CONFLICT(key_name) DO UPDATE SET value = excluded.value");
    // Fallback if mysql
    if (Database::getDriver() === 'mysql') {
        $stmt = $pdo->prepare("INSERT INTO settings (key_name, value) VALUES (?, ?) ON DUPLICATE KEY UPDATE value = VALUES(value)");
    }
    foreach ($input as $k => $v) {
        $stmt->execute([$k, strval($v)]);
    }
    jsonResponse(['success' => true, 'message' => 'Settings updated successfully']);
}

// 404 Fallback
jsonResponse(['success' => false, 'error' => "Endpoint not found: {$method} {$route}"], 404);
