<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('biometric_devices', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('device_name', 100);
            $table->string('ip_address', 45);
            $table->integer('port')->default(4370);
            $table->string('location', 200)->nullable();
            $table->string('status', 20)->default('active');
            $table->timestamp('last_sync_at')->nullable();
            $table->timestamps();
        });

        Schema::create('sms_logs', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('phone', 30);
            $table->text('message');
            $table->string('status', 20)->default('pending');
            $table->text('response')->nullable();
            $table->string('event_type', 50)->nullable();
            $table->string('reference_id', 100)->nullable();
            $table->uuid('sent_by')->nullable();
            $table->timestamp('created_at')->useCurrent();
        });

        // Add device_name column to biometric_logs if not exists
        if (!Schema::hasColumn('biometric_logs', 'device_name')) {
            Schema::table('biometric_logs', function (Blueprint $table) {
                $table->string('device_name', 100)->default('')->after('device_id');
            });
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('sms_logs');
        Schema::dropIfExists('biometric_devices');
    }
};
