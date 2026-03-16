<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('chart_of_accounts', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('account_code', 20)->unique();
            $table->string('account_name', 150);
            $table->string('account_type', 30); // asset, liability, income, expense, equity
            $table->uuid('parent_id')->nullable();
            $table->decimal('opening_balance', 15, 2)->default(0);
            $table->string('opening_balance_type', 10)->default('debit');
            $table->tinyInteger('is_active')->default(1);
            $table->timestamps();

            $table->foreign('parent_id')->references('id')->on('chart_of_accounts')->nullOnDelete();
        });

        Schema::create('acc_vouchers', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('voucher_number', 30)->unique();
            $table->string('voucher_type', 20); // journal, payment, receipt, contra
            $table->date('voucher_date');
            $table->text('description')->nullable();
            $table->decimal('total_amount', 15, 2)->default(0);
            $table->string('status', 20)->default('draft');
            $table->uuid('branch_id')->nullable();
            $table->uuid('financial_year_id')->nullable();
            $table->uuid('created_by')->nullable();
            $table->uuid('approved_by')->nullable();
            $table->datetime('approved_at')->nullable();
            $table->timestamps();

            $table->foreign('branch_id')->references('id')->on('branches')->nullOnDelete();
            $table->foreign('financial_year_id')->references('id')->on('financial_years')->nullOnDelete();
            $table->foreign('created_by')->references('id')->on('users')->nullOnDelete();
            $table->foreign('approved_by')->references('id')->on('users')->nullOnDelete();
            $table->index(['voucher_date', 'branch_id']);
            $table->index('voucher_type');
        });

        Schema::create('voucher_entries', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('voucher_id');
            $table->uuid('account_id');
            $table->decimal('debit', 15, 2)->default(0);
            $table->decimal('credit', 15, 2)->default(0);
            $table->string('narration', 500)->nullable();
            $table->integer('sort_order')->default(0);

            $table->foreign('voucher_id')->references('id')->on('acc_vouchers')->cascadeOnDelete();
            $table->foreign('account_id')->references('id')->on('chart_of_accounts')->restrictOnDelete();
            $table->index('account_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('voucher_entries');
        Schema::dropIfExists('acc_vouchers');
        Schema::dropIfExists('chart_of_accounts');
    }
};
