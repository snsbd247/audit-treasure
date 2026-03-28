<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

class EmployeeBankInfo extends Model
{
    use HasUuids;
    protected $table = 'employee_bank_info';
    protected $fillable = ['employee_id', 'bank_name', 'account_name', 'account_number', 'branch_name', 'routing_number'];
    public function employee() { return $this->belongsTo(Employee::class); }
}
