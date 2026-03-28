<?php

namespace App\Console\Commands;

use App\Models\User;
use Illuminate\Console\Command;

class MarkOfflineUsers extends Command
{
    protected $signature = 'users:mark-offline';
    protected $description = 'Mark users as offline if last_seen_at > 2 minutes ago';

    public function handle()
    {
        $count = User::where('is_online', true)
            ->where('last_seen_at', '<', now()->subMinutes(2))
            ->update(['is_online' => false]);

        $this->info("Marked {$count} users as offline.");
    }
}
