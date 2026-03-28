<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Customers & Suppliers
        Schema::create('customers', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('name', 200);
            $table->string('email', 100)->nullable();
            $table->string('phone', 30)->nullable();
            $table->text('address')->nullable();
            $table->string('status', 20)->default('active');
            $table->timestamp('created_at')->useCurrent();
        });

        Schema::create('suppliers', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('name', 200);
            $table->string('email', 100)->nullable();
            $table->string('phone', 30)->nullable();
            $table->text('address')->nullable();
            $table->string('status', 20)->default('active');
            $table->timestamp('created_at')->useCurrent();
        });

        // Sales Invoices
        Schema::create('sales_invoices', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('invoice_number', 30)->unique();
            $table->date('invoice_date');
            $table->uuid('customer_id')->nullable();
            $table->uuid('branch_id')->nullable();
            $table->decimal('total_amount', 15, 2)->default(0);
            $table->decimal('discount', 15, 2)->default(0);
            $table->decimal('net_amount', 15, 2)->default(0);
            $table->text('notes')->nullable();
            $table->string('status', 20)->default('draft');
            $table->uuid('created_by')->nullable();
            $table->timestamps();

            $table->foreign('customer_id')->references('id')->on('customers')->nullOnDelete();
            $table->foreign('branch_id')->references('id')->on('branches')->nullOnDelete();
            $table->index(['invoice_date', 'branch_id']);
        });

        Schema::create('sales_invoice_items', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('sales_invoice_id');
            $table->uuid('product_id');
            $table->decimal('quantity', 15, 2)->default(1);
            $table->decimal('price', 15, 2)->default(0);
            $table->decimal('discount', 15, 2)->default(0);
            $table->decimal('total', 15, 2)->default(0);

            $table->foreign('sales_invoice_id')->references('id')->on('sales_invoices')->cascadeOnDelete();
            $table->foreign('product_id')->references('id')->on('item_master')->restrictOnDelete();
        });

        // Sales Returns
        Schema::create('sales_returns', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('return_number', 30)->unique();
            $table->date('return_date');
            $table->uuid('customer_id')->nullable();
            $table->uuid('sales_invoice_id')->nullable();
            $table->uuid('branch_id')->nullable();
            $table->decimal('total_amount', 15, 2)->default(0);
            $table->text('reason')->nullable();
            $table->string('status', 20)->default('draft');
            $table->uuid('created_by')->nullable();
            $table->timestamps();

            $table->foreign('customer_id')->references('id')->on('customers')->nullOnDelete();
            $table->foreign('sales_invoice_id')->references('id')->on('sales_invoices')->nullOnDelete();
            $table->foreign('branch_id')->references('id')->on('branches')->nullOnDelete();
        });

        Schema::create('sales_return_items', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('sales_return_id');
            $table->uuid('product_id');
            $table->decimal('quantity', 15, 2)->default(1);
            $table->decimal('price', 15, 2)->default(0);
            $table->decimal('total', 15, 2)->default(0);

            $table->foreign('sales_return_id')->references('id')->on('sales_returns')->cascadeOnDelete();
            $table->foreign('product_id')->references('id')->on('item_master')->restrictOnDelete();
        });

        // Purchases
        Schema::create('purchases', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('purchase_number', 30)->unique();
            $table->date('purchase_date');
            $table->uuid('supplier_id')->nullable();
            $table->uuid('branch_id')->nullable();
            $table->decimal('total_amount', 15, 2)->default(0);
            $table->string('payment_method', 30)->nullable();
            $table->text('notes')->nullable();
            $table->string('status', 20)->default('draft');
            $table->uuid('created_by')->nullable();
            $table->timestamps();

            $table->foreign('supplier_id')->references('id')->on('suppliers')->nullOnDelete();
            $table->foreign('branch_id')->references('id')->on('branches')->nullOnDelete();
            $table->index(['purchase_date', 'branch_id']);
        });

        Schema::create('purchase_items', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('purchase_id');
            $table->uuid('product_id');
            $table->decimal('quantity', 15, 2)->default(1);
            $table->decimal('unit_price', 15, 2)->default(0);
            $table->decimal('total', 15, 2)->default(0);

            $table->foreign('purchase_id')->references('id')->on('purchases')->cascadeOnDelete();
            $table->foreign('product_id')->references('id')->on('item_master')->restrictOnDelete();
        });

        // Purchase Returns
        Schema::create('purchase_returns', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('return_number', 30)->unique();
            $table->date('return_date');
            $table->uuid('supplier_id')->nullable();
            $table->uuid('purchase_id')->nullable();
            $table->uuid('branch_id')->nullable();
            $table->decimal('total_amount', 15, 2)->default(0);
            $table->text('reason')->nullable();
            $table->string('status', 20)->default('draft');
            $table->uuid('created_by')->nullable();
            $table->timestamps();

            $table->foreign('supplier_id')->references('id')->on('suppliers')->nullOnDelete();
            $table->foreign('purchase_id')->references('id')->on('purchases')->nullOnDelete();
            $table->foreign('branch_id')->references('id')->on('branches')->nullOnDelete();
        });

        Schema::create('purchase_return_items', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('purchase_return_id');
            $table->uuid('product_id');
            $table->decimal('quantity', 15, 2)->default(1);
            $table->decimal('unit_price', 15, 2)->default(0);
            $table->decimal('total', 15, 2)->default(0);

            $table->foreign('purchase_return_id')->references('id')->on('purchase_returns')->cascadeOnDelete();
            $table->foreign('product_id')->references('id')->on('item_master')->restrictOnDelete();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('purchase_return_items');
        Schema::dropIfExists('purchase_returns');
        Schema::dropIfExists('purchase_items');
        Schema::dropIfExists('purchases');
        Schema::dropIfExists('sales_return_items');
        Schema::dropIfExists('sales_returns');
        Schema::dropIfExists('sales_invoice_items');
        Schema::dropIfExists('sales_invoices');
        Schema::dropIfExists('suppliers');
        Schema::dropIfExists('customers');
    }
};
