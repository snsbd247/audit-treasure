<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\BaseController;
use App\Models\CompanySetting;
use Illuminate\Http\Request;

class SettingsController extends BaseController
{
    public function show()
    {
        return $this->success(CompanySetting::first());
    }

    public function update(Request $request)
    {
        $data = $request->validate([
            'company_name' => 'sometimes|string|max:255',
            'address' => 'nullable|string',
            'phone' => 'nullable|string|max:30',
            'email' => 'nullable|email|max:100',
            'website' => 'nullable|string|max:255',
            'company_logo_url' => 'nullable|string',
            'currency_code' => 'sometimes|string|max:10',
            'currency_symbol' => 'sometimes|string|max:10',
            'currency_name' => 'sometimes|string|max:50',
            'currency_position' => 'sometimes|in:before,after',
            'default_branch_id' => 'nullable|exists:branches,id',
            'default_financial_year_id' => 'nullable|exists:financial_years,id',
        ]);

        $settings = CompanySetting::first();
        if (!$settings) {
            $settings = CompanySetting::create($data);
        } else {
            $settings->update($data);
        }

        return $this->success($settings->fresh());
    }
}
