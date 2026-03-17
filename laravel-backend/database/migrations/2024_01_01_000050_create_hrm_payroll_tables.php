<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('departments', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('name', 100);
            $table->text('description')->nullable();
            $table->string('status', 20)->default('active');
            $table->timestamps();
        });

        Schema::create('designations', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('name', 100);
            $table->text('description')->nullable();
            $table->string('status', 20)->default('active');
            $table->timestamps();
        });

        Schema::create('shifts', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('shift_name', 100);
            $table->time('start_time')->default('09:00:00');
            $table->time('end_time')->default('17:00:00');
            $table->integer('late_after_minutes')->default(15);
            $table->timestamps();
        });

        Schema::create('employees', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('employee_code', 20)->unique();
            $table->string('first_name', 100);
            $table->string('last_name', 100);
            $table->string('email', 100)->nullable();
            $table->string('mobile', 30)->nullable();
            $table->text('address')->nullable();
            $table->string('national_id', 50)->nullable();
            $table->string('photo_url', 500)->nullable();
            $table->uuid('department_id')->nullable();
            $table->uuid('designation_id')->nullable();
            $table->uuid('branch_id')->nullable();
            $table->uuid('shift_id')->nullable();
            $table->uuid('user_id')->nullable();
            $table->date('joining_date');
            $table->string('employment_type', 30)->default('full_time');
            $table->decimal('salary', 15, 2)->default(0);
            $table->string('status', 20)->default('active');
            $table->timestamps();

            $table->foreign('department_id')->references('id')->on('departments')->nullOnDelete();
            $table->foreign('designation_id')->references('id')->on('designations')->nullOnDelete();
            $table->foreign('branch_id')->references('id')->on('branches')->nullOnDelete();
            $table->foreign('shift_id')->references('id')->on('shifts')->nullOnDelete();
            $table->foreign('user_id')->references('id')->on('users')->nullOnDelete();
        });

        Schema::create('attendance', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('employee_id');
            $table->date('date');
            $table->string('status', 20)->default('present');
            $table->time('check_in')->nullable();
            $table->time('check_out')->nullable();
            $table->text('notes')->nullable();
            $table->timestamp('created_at')->useCurrent();

            $table->foreign('employee_id')->references('id')->on('employees')->cascadeOnDelete();
            $table->unique(['employee_id', 'date']);
        });

        Schema::create('leave_types', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('name', 100);
            $table->integer('days_per_year')->default(10);
            $table->timestamps();
        });

        Schema::create('leave_requests', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('employee_id');
            $table->uuid('leave_type_id');
            $table->date('start_date');
            $table->date('end_date');
            $table->text('reason')->nullable();
            $table->string('status', 20)->default('pending');
            $table->uuid('approved_by')->nullable();
            $table->timestamp('created_at')->useCurrent();

            $table->foreign('employee_id')->references('id')->on('employees')->cascadeOnDelete();
            $table->foreign('leave_type_id')->references('id')->on('leave_types')->restrictOnDelete();
            $table->foreign('approved_by')->references('id')->on('users')->nullOnDelete();
        });

        Schema::create('overtime_records', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('employee_id');
            $table->date('date');
            $table->decimal('hours', 5, 2)->default(0);
            $table->string('status', 20)->default('pending');
            $table->uuid('approved_by')->nullable();
            $table->timestamp('created_at')->useCurrent();

            $table->foreign('employee_id')->references('id')->on('employees')->cascadeOnDelete();
        });

        Schema::create('salary_structures', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('employee_id');
            $table->decimal('basic_salary', 15, 2)->default(0);
            $table->decimal('house_rent', 15, 2)->default(0);
            $table->decimal('medical_allowance', 15, 2)->default(0);
            $table->decimal('other_allowance', 15, 2)->default(0);
            $table->decimal('total_salary', 15, 2)->default(0);
            $table->date('effective_from');
            $table->timestamps();

            $table->foreign('employee_id')->references('id')->on('employees')->cascadeOnDelete();
        });

        Schema::create('employee_bank_info', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('employee_id')->unique();
            $table->string('bank_name', 200)->default('');
            $table->string('account_name', 200)->default('');
            $table->string('account_number', 100)->default('');
            $table->string('branch_name', 200)->default('');
            $table->string('routing_number', 100)->default('');
            $table->timestamps();

            $table->foreign('employee_id')->references('id')->on('employees')->cascadeOnDelete();
        });

        Schema::create('employee_education', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('employee_id');
            $table->string('degree', 200)->default('');
            $table->string('institution', 300)->default('');
            $table->string('passing_year', 10)->default('');
            $table->string('result', 100)->default('');
            $table->timestamp('created_at')->useCurrent();

            $table->foreign('employee_id')->references('id')->on('employees')->cascadeOnDelete();
        });

        Schema::create('employee_experience', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('employee_id');
            $table->string('company_name', 300)->default('');
            $table->string('designation', 200)->default('');
            $table->date('start_date')->nullable();
            $table->date('end_date')->nullable();
            $table->text('job_description')->default('');
            $table->timestamp('created_at')->useCurrent();

            $table->foreign('employee_id')->references('id')->on('employees')->cascadeOnDelete();
        });

        Schema::create('employee_emergency_contacts', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('employee_id');
            $table->string('name', 200)->default('');
            $table->string('relation', 100)->default('');
            $table->string('phone', 30)->default('');
            $table->text('address')->default('');
            $table->timestamp('created_at')->useCurrent();

            $table->foreign('employee_id')->references('id')->on('employees')->cascadeOnDelete();
        });

        Schema::create('payroll', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('employee_id');
            $table->integer('month');
            $table->integer('year');
            $table->decimal('basic_salary', 15, 2)->default(0);
            $table->decimal('allowances', 15, 2)->default(0);
            $table->decimal('deductions', 15, 2)->default(0);
            $table->decimal('net_salary', 15, 2)->default(0);
            $table->string('status', 20)->default('draft');
            $table->uuid('voucher_id')->nullable();
            $table->timestamp('created_at')->useCurrent();

            $table->foreign('employee_id')->references('id')->on('employees')->cascadeOnDelete();
            $table->foreign('voucher_id')->references('id')->on('acc_vouchers')->nullOnDelete();
            $table->unique(['employee_id', 'month', 'year']);
        });

        Schema::create('biometric_logs', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('employee_code', 20);
            $table->string('device_id', 50);
            $table->date('date');
            $table->time('check_in_time')->nullable();
            $table->time('check_out_time')->nullable();
            $table->tinyInteger('processed')->default(0);
            $table->timestamp('created_at')->useCurrent();
        });

        Schema::create('employee_documents', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('employee_id');
            $table->string('document_type', 50);
            $table->string('document_title', 200);
            $table->longText('document_html')->nullable();
            $table->uuid('generated_by')->nullable();
            $table->timestamp('created_at')->useCurrent();

            $table->foreign('employee_id')->references('id')->on('employees')->cascadeOnDelete();
        });

        Schema::create('face_data', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('employee_id');
            $table->text('face_encoding')->nullable();
            $table->string('photo_url', 500)->nullable();
            $table->timestamp('created_at')->useCurrent();

            $table->foreign('employee_id')->references('id')->on('employees')->cascadeOnDelete();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('face_data');
        Schema::dropIfExists('employee_documents');
        Schema::dropIfExists('biometric_logs');
        Schema::dropIfExists('payroll');
        Schema::dropIfExists('employee_emergency_contacts');
        Schema::dropIfExists('employee_experience');
        Schema::dropIfExists('employee_education');
        Schema::dropIfExists('employee_bank_info');
        Schema::dropIfExists('salary_structures');
        Schema::dropIfExists('overtime_records');
        Schema::dropIfExists('overtime_records');
        Schema::dropIfExists('leave_requests');
        Schema::dropIfExists('leave_types');
        Schema::dropIfExists('attendance');
        Schema::dropIfExists('employees');
        Schema::dropIfExists('shifts');
        Schema::dropIfExists('designations');
        Schema::dropIfExists('departments');
    }
};
