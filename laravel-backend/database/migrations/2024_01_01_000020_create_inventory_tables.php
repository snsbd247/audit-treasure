<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('units', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('name', 50)->unique();
            $table->string('abbreviation', 10);
            $table->timestamps();
        });

        Schema::create('item_categories', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('name', 100);
            $table->text('description')->nullable();
            $table->uuid('parent_id')->nullable();
            $table->tinyInteger('is_active')->default(1);
            $table->timestamp('created_at')->useCurrent();

            $table->foreign('parent_id')->references('id')->on('item_categories')->nullOnDelete();
        });

        Schema::create('item_master', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('item_code', 30)->unique();
            $table->string('item_name', 200);
            $table->string('item_type', 30)->default('product'); // product, raw_material, finished_goods, service
            $table->text('description')->nullable();
            $table->uuid('category_id')->nullable();
            $table->uuid('unit_id')->nullable();
            $table->decimal('cost_price', 15, 2)->default(0);
            $table->decimal('selling_price', 15, 2)->default(0);
            $table->decimal('opening_stock', 15, 2)->default(0);
            $table->decimal('min_stock_level', 15, 2)->default(0);
            $table->tinyInteger('is_stock_item')->default(1);
            $table->string('status', 20)->default('active');
            $table->timestamps();

            $table->foreign('category_id')->references('id')->on('item_categories')->nullOnDelete();
            $table->foreign('unit_id')->references('id')->on('units')->nullOnDelete();
            $table->index('item_type');
        });

        Schema::create('warehouses', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('name', 100);
            $table->string('code', 20)->unique();
            $table->text('address')->nullable();
            $table->uuid('branch_id')->nullable();
            $table->tinyInteger('is_active')->default(1);
            $table->timestamps();

            $table->foreign('branch_id')->references('id')->on('branches')->nullOnDelete();
        });

        Schema::create('warehouse_stock', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('item_id');
            $table->uuid('warehouse_id');
            $table->decimal('quantity', 15, 2)->default(0);
            $table->timestamps();

            $table->foreign('item_id')->references('id')->on('item_master')->cascadeOnDelete();
            $table->foreign('warehouse_id')->references('id')->on('warehouses')->cascadeOnDelete();
            $table->unique(['item_id', 'warehouse_id']);
        });

        Schema::create('stock_movements', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('product_id');
            $table->uuid('item_id')->nullable();
            $table->uuid('warehouse_id')->nullable();
            $table->uuid('branch_id')->nullable();
            $table->string('movement_type', 30);
            $table->string('reference_type', 30)->nullable();
            $table->uuid('reference_id')->nullable();
            $table->decimal('quantity', 15, 2);
            $table->timestamp('created_at')->useCurrent();

            $table->foreign('product_id')->references('id')->on('item_master')->restrictOnDelete();
            $table->foreign('branch_id')->references('id')->on('branches')->nullOnDelete();
            $table->index(['product_id', 'movement_type']);
        });

        Schema::create('stock_ledger', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('transaction_type', 30);
            $table->uuid('transaction_id')->nullable();
            $table->uuid('item_id');
            $table->uuid('branch_id')->nullable();
            $table->uuid('warehouse_id')->nullable();
            $table->decimal('quantity_in', 15, 2)->default(0);
            $table->decimal('quantity_out', 15, 2)->default(0);
            $table->decimal('balance_quantity', 15, 2)->default(0);
            $table->decimal('unit_cost', 15, 2)->default(0);
            $table->decimal('total_value', 15, 2)->default(0);
            $table->string('reference_number', 50)->nullable();
            $table->date('transaction_date');
            $table->timestamp('created_at')->useCurrent();

            $table->foreign('item_id')->references('id')->on('item_master')->restrictOnDelete();
            $table->index(['item_id', 'warehouse_id', 'created_at']);
        });

        Schema::create('stock_transfers', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('transfer_number', 30)->unique();
            $table->uuid('from_warehouse_id');
            $table->uuid('to_warehouse_id');
            $table->uuid('item_id');
            $table->decimal('quantity', 15, 2);
            $table->text('notes')->nullable();
            $table->uuid('created_by')->nullable();
            $table->timestamps();

            $table->foreign('from_warehouse_id')->references('id')->on('warehouses')->restrictOnDelete();
            $table->foreign('to_warehouse_id')->references('id')->on('warehouses')->restrictOnDelete();
            $table->foreign('item_id')->references('id')->on('item_master')->restrictOnDelete();
        });

        // Legacy products table for backward compat
        Schema::create('product_categories', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('name', 100);
            $table->timestamp('created_at')->useCurrent();
        });

        Schema::create('products', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('product_code', 30)->unique();
            $table->string('product_name', 200);
            $table->uuid('category_id')->nullable();
            $table->string('unit', 20)->default('pcs');
            $table->decimal('cost_price', 15, 2)->default(0);
            $table->decimal('selling_price', 15, 2)->default(0);
            $table->integer('low_stock_threshold')->default(10);
            $table->string('status', 20)->default('active');
            $table->timestamps();

            $table->foreign('category_id')->references('id')->on('product_categories')->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('products');
        Schema::dropIfExists('product_categories');
        Schema::dropIfExists('stock_transfers');
        Schema::dropIfExists('stock_ledger');
        Schema::dropIfExists('stock_movements');
        Schema::dropIfExists('warehouse_stock');
        Schema::dropIfExists('warehouses');
        Schema::dropIfExists('item_master');
        Schema::dropIfExists('item_categories');
        Schema::dropIfExists('units');
    }
};
