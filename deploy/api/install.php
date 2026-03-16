<?php
/**
 * SmartERP - Installation Script
 * Access via: https://yourdomain.com/erp/api/install.php
 * 
 * IMPORTANT: Delete this file after installation!
 */

header('Content-Type: text/html; charset=utf-8');

$step = $_GET['step'] ?? '1';
$error = '';
$success = '';

// Step 2: Process form
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $step = $_POST['step'] ?? '1';

    if ($step === '1') {
        // Test DB connection
        $host = $_POST['db_host'] ?? 'localhost';
        $name = $_POST['db_name'] ?? '';
        $user = $_POST['db_user'] ?? '';
        $pass = $_POST['db_pass'] ?? '';

        try {
            $pdo = new PDO("mysql:host=$host;charset=utf8mb4", $user, $pass, [
                PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            ]);

            // Create database if not exists
            $pdo->exec("CREATE DATABASE IF NOT EXISTS `$name` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci");
            $pdo->exec("USE `$name`");

            // Import schema
            $sql = file_get_contents(__DIR__ . '/../erp_mysql.sql');
            if (!$sql) {
                $error = 'Could not read erp_mysql.sql file. Place it in the erp/ directory.';
            } else {
                // Execute multi-statement SQL
                $pdo->exec($sql);
                $_SESSION['db'] = compact('host', 'name', 'user', 'pass');
                $step = '2';
                $success = 'Database imported successfully!';
            }
        } catch (PDOException $e) {
            $error = 'Database error: ' . $e->getMessage();
        }
    }

    if ($step === '2') {
        // Create Super Admin
        $adminEmail = $_POST['admin_email'] ?? '';
        $adminPass = $_POST['admin_pass'] ?? '';
        $adminName = $_POST['admin_name'] ?? 'Super Admin';

        $db = $_SESSION['db'] ?? $_POST;
        $host = $db['host'] ?? $db['db_host'] ?? 'localhost';
        $name = $db['name'] ?? $db['db_name'] ?? '';
        $user = $db['user'] ?? $db['db_user'] ?? '';
        $pass = $db['pass'] ?? $db['db_pass'] ?? '';

        try {
            $pdo = new PDO("mysql:host=$host;dbname=$name;charset=utf8mb4", $user, $pass, [
                PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            ]);

            $adminId = sprintf('%04x%04x-%04x-%04x-%04x-%04x%04x%04x',
                mt_rand(0, 0xffff), mt_rand(0, 0xffff), mt_rand(0, 0xffff),
                mt_rand(0, 0x0fff) | 0x4000, mt_rand(0, 0x3fff) | 0x8000,
                mt_rand(0, 0xffff), mt_rand(0, 0xffff), mt_rand(0, 0xffff)
            );
            $hash = password_hash($adminPass, PASSWORD_BCRYPT);
            $roleId = sprintf('%04x%04x-%04x-%04x-%04x-%04x%04x%04x',
                mt_rand(0, 0xffff), mt_rand(0, 0xffff), mt_rand(0, 0xffff),
                mt_rand(0, 0x0fff) | 0x4000, mt_rand(0, 0x3fff) | 0x8000,
                mt_rand(0, 0xffff), mt_rand(0, 0xffff), mt_rand(0, 0xffff)
            );

            $pdo->beginTransaction();
            $pdo->prepare('INSERT INTO users (id, email, password_hash) VALUES (?, ?, ?)')->execute([$adminId, $adminEmail, $hash]);
            $pdo->prepare('INSERT INTO profiles (id, name, email, status) VALUES (?, ?, ?, ?)')->execute([$adminId, $adminName, $adminEmail, 'active']);
            $pdo->prepare('INSERT INTO user_roles (id, user_id, role) VALUES (?, ?, ?)')->execute([$roleId, $adminId, 'super_admin']);
            $pdo->commit();

            // Update config.php
            $configFile = __DIR__ . '/config.php';
            $configContent = file_get_contents($configFile);
            $configContent = preg_replace("/define\('DB_HOST',\s*'.*?'\)/", "define('DB_HOST', '$host')", $configContent);
            $configContent = preg_replace("/define\('DB_DATABASE',\s*'.*?'\)/", "define('DB_DATABASE', '$name')", $configContent);
            $configContent = preg_replace("/define\('DB_USERNAME',\s*'.*?'\)/", "define('DB_USERNAME', '$user')", $configContent);
            $configContent = preg_replace("/define\('DB_PASSWORD',\s*'.*?'\)/", "define('DB_PASSWORD', '$pass')", $configContent);
            file_put_contents($configFile, $configContent);

            $step = '3';
            $success = 'Installation complete!';
        } catch (PDOException $e) {
            $error = 'Error creating admin: ' . $e->getMessage();
            $step = '2';
        }
    }
}

session_start();
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>SmartERP - Installation</title>
    <style>
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #f0f2f5; min-height: 100vh; display: flex; align-items: center; justify-content: center; }
        .installer { background: white; border-radius: 12px; box-shadow: 0 4px 24px rgba(0,0,0,0.1); padding: 40px; max-width: 500px; width: 100%; }
        h1 { font-size: 24px; margin-bottom: 8px; color: #1a1a1a; }
        .subtitle { color: #666; margin-bottom: 24px; }
        .steps { display: flex; gap: 8px; margin-bottom: 32px; }
        .step { flex: 1; height: 4px; background: #e0e0e0; border-radius: 2px; }
        .step.active { background: #0d9488; }
        .step.done { background: #10b981; }
        label { display: block; font-weight: 500; margin-bottom: 4px; color: #333; font-size: 14px; }
        input { width: 100%; padding: 10px 12px; border: 1px solid #d0d0d0; border-radius: 8px; font-size: 14px; margin-bottom: 16px; }
        input:focus { outline: none; border-color: #0d9488; box-shadow: 0 0 0 3px rgba(13,148,136,0.1); }
        button { width: 100%; padding: 12px; background: #0d9488; color: white; border: none; border-radius: 8px; font-size: 16px; font-weight: 600; cursor: pointer; }
        button:hover { background: #0f766e; }
        .error { background: #fef2f2; color: #b91c1c; padding: 12px; border-radius: 8px; margin-bottom: 16px; font-size: 14px; }
        .success { background: #f0fdf4; color: #166534; padding: 12px; border-radius: 8px; margin-bottom: 16px; font-size: 14px; }
        .warning { background: #fffbeb; color: #92400e; padding: 12px; border-radius: 8px; margin-bottom: 16px; font-size: 14px; }
    </style>
</head>
<body>
<div class="installer">
    <h1>🚀 SmartERP Installation</h1>
    <p class="subtitle">Step <?= $step ?> of 3</p>

    <div class="steps">
        <div class="step <?= $step >= 1 ? ($step > 1 ? 'done' : 'active') : '' ?>"></div>
        <div class="step <?= $step >= 2 ? ($step > 2 ? 'done' : 'active') : '' ?>"></div>
        <div class="step <?= $step >= 3 ? 'done' : '' ?>"></div>
    </div>

    <?php if ($error): ?>
        <div class="error"><?= htmlspecialchars($error) ?></div>
    <?php endif; ?>

    <?php if ($success): ?>
        <div class="success"><?= htmlspecialchars($success) ?></div>
    <?php endif; ?>

    <?php if ($step === '1'): ?>
        <h2 style="margin-bottom:16px;">Database Connection</h2>
        <form method="POST">
            <input type="hidden" name="step" value="1">
            <label>MySQL Host</label>
            <input name="db_host" value="localhost" required>
            <label>Database Name</label>
            <input name="db_name" placeholder="erp_db" required>
            <label>Database Username</label>
            <input name="db_user" required>
            <label>Database Password</label>
            <input name="db_pass" type="password">
            <button type="submit">Connect & Import Database</button>
        </form>
    <?php elseif ($step === '2'): ?>
        <h2 style="margin-bottom:16px;">Create Super Admin</h2>
        <form method="POST">
            <input type="hidden" name="step" value="2">
            <input type="hidden" name="db_host" value="<?= htmlspecialchars($_SESSION['db']['host'] ?? '') ?>">
            <input type="hidden" name="db_name" value="<?= htmlspecialchars($_SESSION['db']['name'] ?? '') ?>">
            <input type="hidden" name="db_user" value="<?= htmlspecialchars($_SESSION['db']['user'] ?? '') ?>">
            <input type="hidden" name="db_pass" value="<?= htmlspecialchars($_SESSION['db']['pass'] ?? '') ?>">
            <label>Admin Name</label>
            <input name="admin_name" value="Super Admin" required>
            <label>Admin Email</label>
            <input name="admin_email" type="email" placeholder="admin@company.com" required>
            <label>Admin Password</label>
            <input name="admin_pass" type="password" required minlength="6">
            <button type="submit">Create Admin & Finish</button>
        </form>
    <?php elseif ($step === '3'): ?>
        <h2 style="margin-bottom:16px;">✅ Installation Complete!</h2>
        <p style="margin-bottom:16px;color:#666;">SmartERP has been installed successfully.</p>
        <div class="warning">
            <strong>⚠️ Security:</strong> Please delete <code>install.php</code> from your server immediately!
        </div>
        <a href="../" style="display:block;text-align:center;padding:12px;background:#0d9488;color:white;border-radius:8px;text-decoration:none;font-weight:600;">
            Open SmartERP →
        </a>
    <?php endif; ?>
</div>
</body>
</html>
