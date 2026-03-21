<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('isp_packages', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('name');
            $table->string('speed');
            $table->decimal('price', 10, 2);
            $table->integer('billing_cycle')->default(30);
            $table->string('mikrotik_profile')->nullable();
            $table->string('status')->default('active');
            $table->timestamps();
            $table->softDeletes();
        });

        Schema::create('isp_customers', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('name');
            $table->string('phone')->nullable();
            $table->text('address')->nullable();
            $table->uuid('package_id')->nullable();
            $table->string('pppoe_username')->unique();
            $table->string('pppoe_password');
            $table->string('ip_address')->nullable();
            $table->string('mac_address')->nullable();
            $table->string('status')->default('active');
            $table->timestamps();
            $table->softDeletes();

            $table->foreign('package_id')->references('id')->on('isp_packages')->nullOnDelete();
        });

        Schema::create('isp_invoices', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('customer_id');
            $table->decimal('amount', 10, 2);
            $table->date('billing_date');
            $table->date('due_date');
            $table->string('status')->default('unpaid');
            $table->timestamps();

            $table->foreign('customer_id')->references('id')->on('isp_customers')->cascadeOnDelete();
        });

        Schema::create('isp_payments', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('invoice_id');
            $table->decimal('amount', 10, 2);
            $table->string('method')->default('manual');
            $table->timestamp('paid_at')->nullable();
            $table->timestamps();

            $table->foreign('invoice_id')->references('id')->on('isp_invoices')->cascadeOnDelete();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('isp_payments');
        Schema::dropIfExists('isp_invoices');
        Schema::dropIfExists('isp_customers');
        Schema::dropIfExists('isp_packages');
    }
};
