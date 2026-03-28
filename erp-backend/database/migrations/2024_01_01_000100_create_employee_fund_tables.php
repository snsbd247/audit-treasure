<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('employee_fund_settings', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('employee_id');
            $table->string('fund_type'); // provident_fund, savings_fund
            $table->boolean('is_active')->default(true);
            $table->string('calculation_type')->default('percentage'); // percentage, fixed
            $table->decimal('employee_rate', 10, 2)->default(0);
            $table->decimal('employer_rate', 10, 2)->default(0);
            $table->date('effective_from')->useCurrent();
            $table->timestamps();

            $table->foreign('employee_id')->references('id')->on('employees')->cascadeOnDelete();
            $table->unique(['employee_id', 'fund_type']);
        });

        Schema::create('fund_transactions', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('employee_id');
            $table->string('fund_type');
            $table->string('transaction_type')->default('contribution');
            $table->decimal('employee_amount', 12, 2)->default(0);
            $table->decimal('employer_amount', 12, 2)->default(0);
            $table->decimal('total_amount', 12, 2)->default(0);
            $table->integer('month')->nullable();
            $table->integer('year')->nullable();
            $table->uuid('payroll_id')->nullable();
            $table->uuid('voucher_id')->nullable();
            $table->text('notes')->nullable();
            $table->uuid('created_by')->nullable();
            $table->timestamp('created_at')->useCurrent();

            $table->foreign('employee_id')->references('id')->on('employees')->cascadeOnDelete();
            $table->foreign('payroll_id')->references('id')->on('payroll');
            $table->foreign('voucher_id')->references('id')->on('acc_vouchers');

            $table->index('employee_id');
            $table->index(['year', 'month']);
            $table->index('fund_type');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('fund_transactions');
        Schema::dropIfExists('employee_fund_settings');
    }
};
