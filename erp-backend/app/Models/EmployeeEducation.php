<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

class EmployeeEducation extends Model
{
    use HasUuids;
    protected $table = 'employee_education';
    public $timestamps = false;
    protected $fillable = ['employee_id', 'degree', 'institution', 'passing_year', 'result'];
    public function employee() { return $this->belongsTo(Employee::class); }
}
