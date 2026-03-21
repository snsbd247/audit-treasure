<?php

namespace App\Modules\ISP\Controllers;

use App\Http\Controllers\BaseController;
use App\Modules\ISP\Services\UsageService;
use Illuminate\Http\Request;

class IspUsageController extends BaseController
{
    public function customerUsage(Request $request, string $customerId)
    {
        $data = app(UsageService::class)->getCustomerUsage(
            $customerId,
            $request->from,
            $request->to
        );

        return $this->success($data);
    }

    public function dailyChart(Request $request, string $customerId)
    {
        $days = (int) ($request->days ?? 30);

        return $this->success(
            app(UsageService::class)->getDailyUsage($customerId, $days)
        );
    }
}
