<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

class Employee extends Model
{
    use HasUuids;

    protected $fillable = [
        'employee_code', 'first_name', 'last_name', 'email', 'mobile', 'address',
        'national_id', 'photo_url', 'department_id', 'designation_id', 'branch_id',
        'shift_id', 'user_id', 'joining_date', 'employment_type', 'salary', 'status',
    ];

    protected $casts = ['joining_date' => 'date'];

    public function department() { return $this->belongsTo(Department::class); }
    public function designation() { return $this->belongsTo(Designation::class); }
    public function branch() { return $this->belongsTo(Branch::class); }
    public function shift() { return $this->belongsTo(Shift::class); }
    public function user() { return $this->belongsTo(User::class); }
    public function attendance() { return $this->hasMany(Attendance::class); }
    public function leaveRequests() { return $this->hasMany(LeaveRequest::class); }
    public function salaryStructures() { return $this->hasMany(SalaryStructure::class); }
    public function payroll() { return $this->hasMany(Payroll::class); }

    public function getFullNameAttribute(): string
    {
        return "{$this->first_name} {$this->last_name}";
    }
}
