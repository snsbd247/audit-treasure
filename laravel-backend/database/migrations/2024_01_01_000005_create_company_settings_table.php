<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('company_settings', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('company_name', 200)->default('My Company');
            $table->string('email', 100)->nullable();
            $table->string('phone', 30)->nullable();
            $table->text('address')->nullable();
            $table->string('website', 200)->nullable();
            $table->string('company_logo_url', 500)->nullable();
            $table->string('currency_code', 10)->default('USD');
            $table->string('currency_symbol', 10)->default('$');
            $table->string('currency_name', 50)->default('US Dollar');
            $table->string('currency_position', 10)->default('before');
            $table->uuid('default_branch_id')->nullable();
            $table->uuid('default_financial_year_id')->nullable();
            $table->timestamps();

            $table->foreign('default_branch_id')->references('id')->on('branches')->nullOnDelete();
        });

        Schema::create('financial_years', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('name', 50);
            $table->date('start_date');
            $table->date('end_date');
            $table->tinyInteger('is_active')->default(0);
            $table->timestamp('created_at')->useCurrent();
        });

        // Add FK after financial_years exists
        Schema::table('company_settings', function (Blueprint $table) {
            $table->foreign('default_financial_year_id')->references('id')->on('financial_years')->nullOnDelete();
        });

        Schema::create('number_sequences', function (Blueprint $table) {
            $table->string('id', 50)->primary();
            $table->string('prefix', 20);
            $table->integer('current_number')->default(0);
            $table->integer('year')->default(2026);
            $table->string('description')->nullable();
        });

        Schema::create('module_settings', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('module_key', 50)->unique();
            $table->string('module_name', 100);
            $table->tinyInteger('is_enabled')->default(1);
            $table->uuid('updated_by')->nullable();
            $table->timestamps();
        });

        Schema::create('page_shortcuts', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('shortcut_code', 20)->unique();
            $table->string('page_name', 100);
            $table->string('page_url', 200);
            $table->string('module_name', 50);
            $table->tinyInteger('is_active')->default(1);
            $table->timestamps();
        });

        Schema::create('audit_log', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('user_id')->nullable();
            $table->string('user_name', 100)->nullable();
            $table->string('module', 50);
            $table->string('action', 50);
            $table->uuid('record_id')->nullable();
            $table->text('details')->nullable();
            $table->string('ip_address', 45)->nullable();
            $table->timestamp('created_at')->useCurrent();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('audit_log');
        Schema::dropIfExists('page_shortcuts');
        Schema::dropIfExists('module_settings');
        Schema::table('company_settings', fn ($t) => $t->dropForeign(['default_financial_year_id']));
        Schema::dropIfExists('number_sequences');
        Schema::dropIfExists('financial_years');
        Schema::dropIfExists('company_settings');
    }
};
