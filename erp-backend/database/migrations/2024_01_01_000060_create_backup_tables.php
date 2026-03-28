<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('backup_settings', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->tinyInteger('auto_backup_enabled')->default(0);
            $table->string('schedule_interval', 20)->default('daily');
            $table->integer('retention_days')->default(30);
            $table->datetime('last_auto_backup_at')->nullable();
            $table->uuid('updated_by')->nullable();
            $table->timestamps();
        });

        Schema::create('backup_history', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('file_name', 200);
            $table->string('backup_type', 20)->default('manual');
            $table->string('format', 10)->default('sql');
            $table->string('status', 20)->default('completed');
            $table->bigInteger('file_size')->default(0);
            $table->integer('tables_count')->default(0);
            $table->integer('records_count')->default(0);
            $table->string('storage_path', 500)->nullable();
            $table->text('error_message')->nullable();
            $table->uuid('created_by')->nullable();
            $table->timestamp('created_at')->useCurrent();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('backup_history');
        Schema::dropIfExists('backup_settings');
    }
};
