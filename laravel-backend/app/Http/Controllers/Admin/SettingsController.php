<?php
namespace App\Http\Controllers\Admin;
use App\Http\Controllers\BaseController;
use App\Models\CompanySetting;
use Illuminate\Http\Request;

class SettingsController extends BaseController
{
    public function show() { return $this->success(CompanySetting::first()); }

    public function update(Request $request)
    {
        $settings = CompanySetting::first();
        if (!$settings) $settings = CompanySetting::create($request->all());
        else $settings->update($request->all());
        return $this->success($settings);
    }
}
