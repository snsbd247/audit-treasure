<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

class EmployeeFundSetting extends Model
{
    use HasUuids;

    protected $fillable = [
        'employee_id', 'fund_type', 'is_active', 'calculation_type',
        'employee_rate', 'employer_rate', 'effective_from',
    ];

    protected $casts = [
        'is_active' => 'boolean',
        'employee_rate' => 'float',
        'employer_rate' => 'float',
        'effective_from' => 'date',
    ];

    public function employee() { return $this->belongsTo(Employee::class); }
}
