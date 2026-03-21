<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('isp_payments', function (Blueprint $table) {
            $table->string('transaction_id')->nullable()->after('method');
            $table->string('gateway')->nullable()->after('transaction_id');
            $table->string('gateway_status')->nullable()->after('gateway');
            $table->json('gateway_response')->nullable()->after('gateway_status');
        });
    }

    public function down(): void
    {
        Schema::table('isp_payments', function (Blueprint $table) {
            $table->dropColumn(['transaction_id', 'gateway', 'gateway_status', 'gateway_response']);
        });
    }
};
