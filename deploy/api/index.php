<?php
/**
 * SmartERP - REST API Router
 * Main entry point for all API requests.
 * 
 * Routes:
 *   POST   /api/auth/login
 *   POST   /api/auth/register
 *   GET    /api/auth/me
 *   POST   /api/auth/change-password
 *   GET    /api/{table}
 *   GET    /api/{table}/{id}
 *   POST   /api/{table}
 *   PUT    /api/{table}/{id}
 *   DELETE /api/{table}/{id}
 *   POST   /api/upload
 *   POST   /api/rpc/{function}
 */

require_once __DIR__ . '/config.php';
require_once __DIR__ . '/db.php';
require_once __DIR__ . '/auth.php';

// CORS
header('Access-Control-Allow-Origin: ' . CORS_ORIGIN);
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
header('Content-Type: application/json; charset=utf-8');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

// Error handling
if (!DEBUG_MODE) {
    set_exception_handler(function ($e) {
        http_response_code(500);
        echo json_encode(['error' => 'Internal server error']);
    });
}

// Parse route
$uri = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
$uri = preg_replace('#^/api#', '', $uri); // Strip /api prefix
$uri = trim($uri, '/');
$segments = $uri ? explode('/', $uri) : [];
$method = $_SERVER['REQUEST_METHOD'];

// Parse JSON body
$body = json_decode(file_get_contents('php://input'), true) ?? [];

// Parse query params
$query = $_GET;

// ============================================================
// AUTH ROUTES
// ============================================================
if ($segments[0] === 'auth') {
    $action = $segments[1] ?? '';

    if ($action === 'login' && $method === 'POST') {
        $email = $body['email'] ?? '';
        $password = $body['password'] ?? '';

        $db = getDB();
        $stmt = $db->prepare('SELECT id, email, password_hash, is_active FROM users WHERE email = ?');
        $stmt->execute([$email]);
        $user = $stmt->fetch();

        if (!$user || !password_verify($password, $user['password_hash'])) {
            http_response_code(401);
            echo json_encode(['error' => 'Invalid email or password']);
            exit;
        }

        if (!$user['is_active']) {
            http_response_code(403);
            echo json_encode(['error' => 'Account is deactivated']);
            exit;
        }

        // Get profile & roles
        $stmt = $db->prepare('SELECT * FROM profiles WHERE id = ?');
        $stmt->execute([$user['id']]);
        $profile = $stmt->fetch();

        $stmt = $db->prepare('SELECT role FROM user_roles WHERE user_id = ?');
        $stmt->execute([$user['id']]);
        $roles = array_column($stmt->fetchAll(), 'role');

        // Update last sign in
        $db->prepare('UPDATE users SET last_sign_in = NOW() WHERE id = ?')->execute([$user['id']]);

        $token = generateJWT([
            'sub' => $user['id'],
            'email' => $user['email'],
            'roles' => $roles,
        ]);

        echo json_encode([
            'token' => $token,
            'user' => ['id' => $user['id'], 'email' => $user['email']],
            'profile' => $profile,
            'roles' => $roles,
        ]);
        exit;
    }

    if ($action === 'register' && $method === 'POST') {
        $email = $body['email'] ?? '';
        $password = $body['password'] ?? '';
        $name = $body['name'] ?? '';

        if (!$email || !$password) {
            http_response_code(400);
            echo json_encode(['error' => 'Email and password required']);
            exit;
        }

        $db = getDB();
        $id = uuid();
        $hash = password_hash($password, PASSWORD_BCRYPT);

        try {
            $db->beginTransaction();

            $db->prepare('INSERT INTO users (id, email, password_hash) VALUES (?, ?, ?)')
                ->execute([$id, $email, $hash]);

            $db->prepare('INSERT INTO profiles (id, name, email) VALUES (?, ?, ?)')
                ->execute([$id, $name ?: $email, $email]);

            $db->prepare('INSERT INTO user_roles (id, user_id, role) VALUES (?, ?, ?)')
                ->execute([uuid(), $id, 'staff']);

            $db->commit();

            $token = generateJWT(['sub' => $id, 'email' => $email, 'roles' => ['staff']]);
            echo json_encode(['token' => $token, 'user' => ['id' => $id, 'email' => $email]]);
        } catch (PDOException $e) {
            $db->rollBack();
            if (strpos($e->getMessage(), 'Duplicate') !== false) {
                http_response_code(409);
                echo json_encode(['error' => 'Email already registered']);
            } else {
                throw $e;
            }
        }
        exit;
    }

    if ($action === 'me' && $method === 'GET') {
        $auth = requireAuth();
        $db = getDB();

        $stmt = $db->prepare('SELECT * FROM profiles WHERE id = ?');
        $stmt->execute([$auth['sub']]);
        $profile = $stmt->fetch();

        $stmt = $db->prepare('SELECT role FROM user_roles WHERE user_id = ?');
        $stmt->execute([$auth['sub']]);
        $roles = array_column($stmt->fetchAll(), 'role');

        echo json_encode(['user' => ['id' => $auth['sub'], 'email' => $auth['email']], 'profile' => $profile, 'roles' => $roles]);
        exit;
    }

    if ($action === 'change-password' && $method === 'POST') {
        $auth = requireAuth();
        $newPassword = $body['password'] ?? '';

        if (strlen($newPassword) < 6) {
            http_response_code(400);
            echo json_encode(['error' => 'Password must be at least 6 characters']);
            exit;
        }

        $db = getDB();
        $hash = password_hash($newPassword, PASSWORD_BCRYPT);
        $db->prepare('UPDATE users SET password_hash = ? WHERE id = ?')->execute([$hash, $auth['sub']]);

        echo json_encode(['message' => 'Password updated']);
        exit;
    }

    http_response_code(404);
    echo json_encode(['error' => 'Auth route not found']);
    exit;
}

// ============================================================
// FILE UPLOAD
// ============================================================
if ($segments[0] === 'upload' && $method === 'POST') {
    requireAuth();

    if (!isset($_FILES['file'])) {
        http_response_code(400);
        echo json_encode(['error' => 'No file uploaded']);
        exit;
    }

    $file = $_FILES['file'];
    if ($file['size'] > MAX_UPLOAD_SIZE) {
        http_response_code(413);
        echo json_encode(['error' => 'File too large']);
        exit;
    }

    $bucket = $body['bucket'] ?? $query['bucket'] ?? 'general';
    $dir = UPLOAD_DIR . $bucket . '/';
    if (!is_dir($dir)) mkdir($dir, 0755, true);

    $ext = pathinfo($file['name'], PATHINFO_EXTENSION);
    $filename = uniqid() . '_' . time() . '.' . $ext;
    $path = $dir . $filename;

    if (move_uploaded_file($file['tmp_name'], $path)) {
        $url = APP_URL . '/api/uploads/' . $bucket . '/' . $filename;
        echo json_encode(['url' => $url, 'path' => $bucket . '/' . $filename]);
    } else {
        http_response_code(500);
        echo json_encode(['error' => 'Upload failed']);
    }
    exit;
}

// ============================================================
// RPC (Remote Procedure Calls)
// ============================================================
if ($segments[0] === 'rpc' && $method === 'POST') {
    $auth = requireAuth();
    $fn = $segments[1] ?? '';
    $db = getDB();

    switch ($fn) {
        case 'next_number':
            $seqId = $body['seq_id'] ?? '';
            for ($attempt = 0; $attempt < 3; $attempt++) {
                $stmt = $db->prepare('SELECT prefix, current_number, year FROM number_sequences WHERE id = ? FOR UPDATE');
                $stmt->execute([$seqId]);
                $seq = $stmt->fetch();
                if (!$seq) {
                    http_response_code(404);
                    echo json_encode(['error' => "Sequence '$seqId' not found"]);
                    exit;
                }
                $newNum = $seq['current_number'] + 1;
                $stmt = $db->prepare('UPDATE number_sequences SET current_number = ? WHERE id = ? AND current_number = ?');
                $stmt->execute([$newNum, $seqId, $seq['current_number']]);
                if ($stmt->rowCount() > 0) {
                    $formatted = $seq['prefix'] . '-' . $seq['year'] . '-' . str_pad($newNum, 5, '0', STR_PAD_LEFT);
                    echo json_encode(['number' => $formatted]);
                    exit;
                }
            }
            http_response_code(409);
            echo json_encode(['error' => 'Could not acquire sequence lock']);
            exit;

        default:
            http_response_code(404);
            echo json_encode(['error' => "Unknown RPC function: $fn"]);
            exit;
    }
}

// ============================================================
// GENERIC CRUD ROUTES: /api/{table}[/{id}]
// ============================================================
$allowedTables = [
    'branches', 'financial_years', 'company_settings', 'profiles',
    'chart_of_accounts', 'departments', 'designations', 'shifts',
    'leave_types', 'units', 'item_categories', 'warehouses',
    'customers', 'suppliers', 'item_master', 'employees',
    'employee_documents', 'attendance', 'leave_requests',
    'overtime_records', 'salary_structures', 'payroll',
    'acc_vouchers', 'voucher_entries', 'purchases', 'purchase_items',
    'purchase_returns', 'purchase_return_items',
    'sales_invoices', 'sales_invoice_items',
    'sales_returns', 'sales_return_items',
    'bill_of_materials', 'bom_items',
    'production_entries', 'production_materials',
    'stock_transfers', 'warehouse_stock', 'stock_movements', 'stock_ledger',
    'system_settings', 'number_sequences', 'module_settings',
    'page_shortcuts', 'audit_log', 'backup_settings', 'backup_history',
    'custom_roles', 'user_custom_roles', 'role_permissions',
    'user_roles', 'user_favorite_pages', 'raw_materials',
    'products', 'product_categories', 'biometric_logs', 'face_data',
];

$table = $segments[0] ?? '';
$recordId = $segments[1] ?? null;

if (!in_array($table, $allowedTables)) {
    http_response_code(404);
    echo json_encode(['error' => "Unknown endpoint: $table"]);
    exit;
}

// Auth required for all CRUD
$auth = requireAuth();
$db = getDB();

switch ($method) {
    case 'GET':
        if ($recordId) {
            // Single record
            $stmt = $db->prepare("SELECT * FROM `$table` WHERE id = ?");
            $stmt->execute([$recordId]);
            $row = $stmt->fetch();
            if (!$row) {
                http_response_code(404);
                echo json_encode(['error' => 'Not found']);
            } else {
                echo json_encode($row);
            }
        } else {
            // List with filtering
            $where = [];
            $params = [];

            foreach ($query as $key => $value) {
                if (in_array($key, ['limit', 'offset', 'order', 'select'])) continue;
                // Support eq filter: ?status=active
                $where[] = "`$key` = ?";
                $params[] = $value;
            }

            $sql = "SELECT * FROM `$table`";
            if ($where) $sql .= ' WHERE ' . implode(' AND ', $where);

            $order = $query['order'] ?? 'created_at.desc';
            if ($order) {
                $parts = explode('.', $order);
                $col = preg_replace('/[^a-z_]/', '', $parts[0]);
                $dir = (isset($parts[1]) && strtolower($parts[1]) === 'asc') ? 'ASC' : 'DESC';
                $sql .= " ORDER BY `$col` $dir";
            }

            $limit = min((int)($query['limit'] ?? 1000), 1000);
            $offset = (int)($query['offset'] ?? 0);
            $sql .= " LIMIT $limit OFFSET $offset";

            $stmt = $db->prepare($sql);
            $stmt->execute($params);
            echo json_encode($stmt->fetchAll());
        }
        break;

    case 'POST':
        if (empty($body)) {
            http_response_code(400);
            echo json_encode(['error' => 'Request body required']);
            break;
        }

        if (!isset($body['id'])) $body['id'] = uuid();

        $columns = array_keys($body);
        $placeholders = array_fill(0, count($columns), '?');
        $sql = sprintf(
            "INSERT INTO `%s` (`%s`) VALUES (%s)",
            $table,
            implode('`, `', $columns),
            implode(', ', $placeholders)
        );

        $stmt = $db->prepare($sql);
        $stmt->execute(array_values($body));

        http_response_code(201);
        echo json_encode($body);
        break;

    case 'PUT':
        if (!$recordId) {
            http_response_code(400);
            echo json_encode(['error' => 'Record ID required']);
            break;
        }

        $sets = [];
        $params = [];
        foreach ($body as $key => $value) {
            if ($key === 'id') continue;
            $sets[] = "`$key` = ?";
            $params[] = $value;
        }
        $params[] = $recordId;

        $sql = sprintf("UPDATE `%s` SET %s WHERE id = ?", $table, implode(', ', $sets));
        $stmt = $db->prepare($sql);
        $stmt->execute($params);

        echo json_encode(['message' => 'Updated', 'id' => $recordId]);
        break;

    case 'DELETE':
        if (!$recordId) {
            http_response_code(400);
            echo json_encode(['error' => 'Record ID required']);
            break;
        }

        $stmt = $db->prepare("DELETE FROM `$table` WHERE id = ?");
        $stmt->execute([$recordId]);

        echo json_encode(['message' => 'Deleted', 'id' => $recordId]);
        break;

    default:
        http_response_code(405);
        echo json_encode(['error' => 'Method not allowed']);
}
