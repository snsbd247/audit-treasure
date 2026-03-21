<?php

namespace App\Modules\ISP\Services;

use App\Modules\ISP\Models\IspRouter;
use Illuminate\Support\Facades\Log;

/**
 * MikroTik RouterOS API Service
 *
 * Pure PHP implementation — no external packages required.
 * Communicates with MikroTik via the RouterOS API protocol (port 8728).
 */
class MikrotikService
{
    private $socket = null;
    private bool $connected = false;
    private int $timeout = 5;

    // ──────────────────────────────────────────────
    //  CONNECTION
    // ──────────────────────────────────────────────

    /**
     * Connect and authenticate to a MikroTik router.
     */
    public function connect(IspRouter $router): bool
    {
        return $this->connectRaw(
            $router->ip_address,
            $router->username,
            $router->password ?? '',
            $router->port
        );
    }

    public function connectRaw(string $ip, string $username, string $password, int $port = 8728): bool
    {
        try {
            $this->socket = @fsockopen($ip, $port, $errno, $errstr, $this->timeout);

            if (!$this->socket) {
                Log::error("MikroTik: Cannot connect to {$ip}:{$port} — {$errstr}");
                return false;
            }

            // Login (post-v6.43 uses plain text login)
            $response = $this->sendCommand('/login', [
                '=name=' . $username,
                '=password=' . $password,
            ]);

            if ($this->isError($response)) {
                Log::error("MikroTik: Auth failed for {$ip} — " . json_encode($response));
                $this->disconnect();
                return false;
            }

            $this->connected = true;
            Log::info("MikroTik: Connected to {$ip}:{$port}");
            return true;
        } catch (\Exception $e) {
            Log::error("MikroTik: Connection error — {$e->getMessage()}");
            return false;
        }
    }

    public function disconnect(): void
    {
        if ($this->socket) {
            @fclose($this->socket);
            $this->socket = null;
        }
        $this->connected = false;
    }

    public function isConnected(): bool
    {
        return $this->connected && $this->socket !== null;
    }

    // ──────────────────────────────────────────────
    //  PPPoE USER MANAGEMENT
    // ──────────────────────────────────────────────

    /**
     * Add a PPPoE secret (user).
     */
    public function addPPPoEUser(string $username, string $password, string $profile = 'default', ?string $remoteAddress = null): array
    {
        $params = [
            '=name=' . $username,
            '=password=' . $password,
            '=service=pppoe',
            '=profile=' . $profile,
        ];

        if ($remoteAddress) {
            $params[] = '=remote-address=' . $remoteAddress;
        }

        $response = $this->sendCommand('/ppp/secret/add', $params);

        if ($this->isError($response)) {
            Log::error("MikroTik: Failed to add PPPoE user {$username} — " . json_encode($response));
        } else {
            Log::info("MikroTik: PPPoE user {$username} created");
        }

        return $response;
    }

    /**
     * Remove a PPPoE secret.
     */
    public function removePPPoEUser(string $username): array
    {
        $id = $this->findPPPoEUserId($username);
        if (!$id) {
            return ['!trap' => 'User not found'];
        }

        return $this->sendCommand('/ppp/secret/remove', ['=.id=' . $id]);
    }

    /**
     * Enable a PPPoE user (set disabled=no).
     */
    public function enableUser(string $username): array
    {
        $id = $this->findPPPoEUserId($username);
        if (!$id) {
            return ['!trap' => 'User not found'];
        }

        $response = $this->sendCommand('/ppp/secret/set', [
            '=.id=' . $id,
            '=disabled=no',
        ]);

        Log::info("MikroTik: User {$username} enabled");
        return $response;
    }

    /**
     * Disable a PPPoE user (set disabled=yes).
     */
    public function disableUser(string $username): array
    {
        $id = $this->findPPPoEUserId($username);
        if (!$id) {
            return ['!trap' => 'User not found'];
        }

        $response = $this->sendCommand('/ppp/secret/set', [
            '=.id=' . $id,
            '=disabled=yes',
        ]);

        Log::info("MikroTik: User {$username} disabled");
        return $response;
    }

    /**
     * Disconnect an active PPPoE session.
     */
    public function disconnectUser(string $username): array
    {
        // Find active connection
        $active = $this->sendCommand('/ppp/active/print', [
            '?name=' . $username,
        ]);

        if (empty($active) || $this->isError($active)) {
            return ['message' => 'No active session found'];
        }

        foreach ($active as $session) {
            if (isset($session['.id'])) {
                $this->sendCommand('/ppp/active/remove', ['=.id=' . $session['.id']]);
            }
        }

        Log::info("MikroTik: User {$username} disconnected");
        return ['message' => 'Session disconnected'];
    }

    /**
     * Update PPPoE user profile (e.g. after package change).
     */
    public function updateUserProfile(string $username, string $profile): array
    {
        $id = $this->findPPPoEUserId($username);
        if (!$id) {
            return ['!trap' => 'User not found'];
        }

        return $this->sendCommand('/ppp/secret/set', [
            '=.id=' . $id,
            '=profile=' . $profile,
        ]);
    }

    /**
     * Get all PPPoE active sessions.
     */
    public function getActiveSessions(): array
    {
        return $this->sendCommand('/ppp/active/print');
    }

    // ──────────────────────────────────────────────
    //  HELPERS
    // ──────────────────────────────────────────────

    private function findPPPoEUserId(string $username): ?string
    {
        $result = $this->sendCommand('/ppp/secret/print', [
            '?name=' . $username,
        ]);

        if (!empty($result) && !$this->isError($result) && isset($result[0]['.id'])) {
            return $result[0]['.id'];
        }

        return null;
    }

    private function isError(array $response): bool
    {
        return isset($response['!trap']) || (isset($response[0]['!trap']));
    }

    // ──────────────────────────────────────────────
    //  RouterOS API PROTOCOL (low-level)
    // ──────────────────────────────────────────────

    private function sendCommand(string $command, array $params = []): array
    {
        if (!$this->socket) {
            return ['!trap' => 'Not connected'];
        }

        // Write command word
        $this->writeWord($command);

        // Write parameters
        foreach ($params as $param) {
            $this->writeWord($param);
        }

        // End of sentence
        $this->writeWord('');

        // Read response
        return $this->readResponse();
    }

    private function writeWord(string $word): void
    {
        $len = strlen($word);

        if ($len < 0x80) {
            fwrite($this->socket, chr($len));
        } elseif ($len < 0x4000) {
            $len |= 0x8000;
            fwrite($this->socket, chr(($len >> 8) & 0xFF) . chr($len & 0xFF));
        } elseif ($len < 0x200000) {
            $len |= 0xC00000;
            fwrite($this->socket, chr(($len >> 16) & 0xFF) . chr(($len >> 8) & 0xFF) . chr($len & 0xFF));
        } elseif ($len < 0x10000000) {
            $len |= 0xE0000000;
            fwrite($this->socket, chr(($len >> 24) & 0xFF) . chr(($len >> 16) & 0xFF) . chr(($len >> 8) & 0xFF) . chr($len & 0xFF));
        } else {
            fwrite($this->socket, chr(0xF0) . chr(($len >> 24) & 0xFF) . chr(($len >> 16) & 0xFF) . chr(($len >> 8) & 0xFF) . chr($len & 0xFF));
        }

        if ($len > 0) {
            fwrite($this->socket, $word);
        }
    }

    private function readWord(): string
    {
        $byte = ord(fread($this->socket, 1));

        if ($byte < 0x80) {
            $len = $byte;
        } elseif ($byte < 0xC0) {
            $len = (($byte & 0x3F) << 8) + ord(fread($this->socket, 1));
        } elseif ($byte < 0xE0) {
            $len = (($byte & 0x1F) << 16) + (ord(fread($this->socket, 1)) << 8) + ord(fread($this->socket, 1));
        } elseif ($byte < 0xF0) {
            $len = (($byte & 0x0F) << 24) + (ord(fread($this->socket, 1)) << 16) + (ord(fread($this->socket, 1)) << 8) + ord(fread($this->socket, 1));
        } else {
            $len = (ord(fread($this->socket, 1)) << 24) + (ord(fread($this->socket, 1)) << 16) + (ord(fread($this->socket, 1)) << 8) + ord(fread($this->socket, 1));
        }

        if ($len === 0) {
            return '';
        }

        $word = '';
        $remaining = $len;
        while ($remaining > 0) {
            $chunk = fread($this->socket, $remaining);
            $word .= $chunk;
            $remaining -= strlen($chunk);
        }

        return $word;
    }

    private function readResponse(): array
    {
        $responses = [];
        $current = [];

        while (true) {
            $word = $this->readWord();

            if ($word === '') {
                // End of sentence
                if (!empty($current)) {
                    $responses[] = $current;
                    $current = [];
                }
                continue;
            }

            if ($word === '!done') {
                if (!empty($current)) {
                    $responses[] = $current;
                }
                break;
            }

            if ($word === '!trap') {
                $current['!trap'] = true;
                continue;
            }

            if ($word === '!re') {
                if (!empty($current)) {
                    $responses[] = $current;
                }
                $current = [];
                continue;
            }

            // Parse =key=value
            if (str_starts_with($word, '=')) {
                $parts = explode('=', substr($word, 1), 2);
                if (count($parts) === 2) {
                    $current[$parts[0]] = $parts[1];
                }
            }
        }

        return $responses;
    }

    public function __destruct()
    {
        $this->disconnect();
    }
}
