<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('isp_routers', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('name');
            $table->string('ip_address');
            $table->string('username')->default('admin');
            $table->string('password')->nullable();
            $table->integer('port')->default(8728);
            $table->boolean('is_active')->default(true);
            $table->text('notes')->nullable();
            $table->timestamps();
        });

        // Link customers to a specific router
        if (!Schema::hasColumn('isp_customers', 'router_id')) {
            Schema::table('isp_customers', function (Blueprint $table) {
                $table->uuid('router_id')->nullable()->after('package_id');
                $table->foreign('router_id')->references('id')->on('isp_routers')->nullOnDelete();
            });
        }
    }

    public function down(): void
    {
        if (Schema::hasColumn('isp_customers', 'router_id')) {
            Schema::table('isp_customers', function (Blueprint $table) {
                $table->dropForeign(['router_id']);
                $table->dropColumn('router_id');
            });
        }
        Schema::dropIfExists('isp_routers');
    }
};
