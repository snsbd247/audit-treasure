<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

class Payroll extends Model
{
    use HasUuids;
    public $timestamps = false;
    protected $table = 'payroll';
    protected $fillable = ['employee_id', 'month', 'year', 'basic_salary', 'allowances', 'deductions', 'net_salary', 'status', 'voucher_id'];
    public function employee() { return $this->belongsTo(Employee::class); }
    public function voucher() { return $this->belongsTo(AccVoucher::class, 'voucher_id'); }
}
