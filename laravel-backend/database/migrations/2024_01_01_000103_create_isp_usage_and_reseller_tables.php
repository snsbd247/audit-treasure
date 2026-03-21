<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // ─── Usage Logs ───────────────────────────────
        Schema::create('isp_usage_logs', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('customer_id');
            $table->bigInteger('upload_bytes')->default(0);
            $table->bigInteger('download_bytes')->default(0);
            $table->timestamp('recorded_at');

            $table->foreign('customer_id')->references('id')->on('isp_customers')->cascadeOnDelete();
            $table->index(['customer_id', 'recorded_at']);
        });

        // ─── Resellers ───────────────────────────────
        Schema::create('isp_resellers', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('name');
            $table->string('phone')->nullable();
            $table->string('email')->nullable();
            $table->text('address')->nullable();
            $table->decimal('commission_rate', 5, 2)->default(0);
            $table->decimal('balance', 12, 2)->default(0);
            $table->string('status')->default('active');
            $table->timestamps();
            $table->softDeletes();
        });

        // ─── Add reseller_id to isp_customers ────────
        Schema::table('isp_customers', function (Blueprint $table) {
            $table->uuid('reseller_id')->nullable()->after('status');
            $table->foreign('reseller_id')->references('id')->on('isp_resellers')->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('isp_customers', function (Blueprint $table) {
            $table->dropForeign(['reseller_id']);
            $table->dropColumn('reseller_id');
        });
        Schema::dropIfExists('isp_resellers');
        Schema::dropIfExists('isp_usage_logs');
    }
};
