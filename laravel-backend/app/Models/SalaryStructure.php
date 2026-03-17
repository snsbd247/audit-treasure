<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

class SalaryStructure extends Model
{
    use HasUuids;
    protected $fillable = ['employee_id', 'basic_salary', 'house_rent', 'medical_allowance', 'other_allowance', 'total_salary', 'effective_from'];
    protected $casts = ['effective_from' => 'date'];
    public function employee() { return $this->belongsTo(Employee::class); }
}
