<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('user_activities', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('user_id')->nullable();
            $table->string('activity_type', 50);
            $table->text('description')->nullable();
            $table->string('ip_address', 45)->nullable();
            $table->text('user_agent')->nullable();
            $table->json('metadata')->nullable();
            $table->timestamp('created_at')->useCurrent();

            $table->index('user_id');
            $table->index('activity_type');
            $table->index('created_at');
        });

        // Add old_data, new_data, user_agent to audit_log if not exists
        if (!Schema::hasColumn('audit_log', 'old_data')) {
            Schema::table('audit_log', function (Blueprint $table) {
                $table->json('old_data')->nullable()->after('details');
                $table->json('new_data')->nullable()->after('old_data');
                $table->text('user_agent')->nullable()->after('ip_address');
                $table->index('user_id');
                $table->index('module');
                $table->index('created_at');
            });
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('user_activities');
        if (Schema::hasColumn('audit_log', 'old_data')) {
            Schema::table('audit_log', function (Blueprint $table) {
                $table->dropColumn(['old_data', 'new_data', 'user_agent']);
            });
        }
    }
};
