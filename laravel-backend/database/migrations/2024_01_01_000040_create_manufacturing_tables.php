<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('bill_of_materials', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('name', 200);
            $table->uuid('product_id');
            $table->text('notes')->nullable();
            $table->timestamps();

            $table->foreign('product_id')->references('id')->on('item_master')->restrictOnDelete();
        });

        Schema::create('bom_items', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('bom_id');
            $table->uuid('material_id');
            $table->decimal('quantity', 15, 2)->default(1);
            $table->string('unit', 20)->default('pcs');

            $table->foreign('bom_id')->references('id')->on('bill_of_materials')->cascadeOnDelete();
            $table->foreign('material_id')->references('id')->on('item_master')->restrictOnDelete();
        });

        Schema::create('production_entries', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('production_number', 30)->unique();
            $table->date('production_date');
            $table->uuid('product_id');
            $table->uuid('bom_id')->nullable();
            $table->uuid('branch_id')->nullable();
            $table->decimal('quantity', 15, 2)->default(1);
            $table->decimal('raw_material_cost', 15, 2)->default(0);
            $table->decimal('labor_cost', 15, 2)->default(0);
            $table->decimal('electricity_cost', 15, 2)->default(0);
            $table->decimal('total_cost', 15, 2)->default(0);
            $table->text('notes')->nullable();
            $table->string('status', 20)->default('draft');
            $table->uuid('created_by')->nullable();
            $table->timestamps();

            $table->foreign('product_id')->references('id')->on('item_master')->restrictOnDelete();
            $table->foreign('bom_id')->references('id')->on('bill_of_materials')->nullOnDelete();
            $table->foreign('branch_id')->references('id')->on('branches')->nullOnDelete();
        });

        Schema::create('production_materials', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('production_id');
            $table->uuid('material_id');
            $table->decimal('quantity', 15, 2)->default(0);
            $table->decimal('cost', 15, 2)->default(0);

            $table->foreign('production_id')->references('id')->on('production_entries')->cascadeOnDelete();
            $table->foreign('material_id')->references('id')->on('item_master')->restrictOnDelete();
        });

        // Legacy raw_materials table
        Schema::create('raw_materials', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('material_code', 30)->unique();
            $table->string('material_name', 200);
            $table->string('unit', 20)->default('kg');
            $table->decimal('cost_price', 15, 2)->default(0);
            $table->uuid('supplier_id')->nullable();
            $table->string('status', 20)->default('active');
            $table->timestamps();

            $table->foreign('supplier_id')->references('id')->on('suppliers')->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('raw_materials');
        Schema::dropIfExists('production_materials');
        Schema::dropIfExists('production_entries');
        Schema::dropIfExists('bom_items');
        Schema::dropIfExists('bill_of_materials');
    }
};
