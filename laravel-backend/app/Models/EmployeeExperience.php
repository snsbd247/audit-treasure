<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

class EmployeeExperience extends Model
{
    use HasUuids;
    protected $table = 'employee_experience';
    public $timestamps = false;
    protected $fillable = ['employee_id', 'company_name', 'designation', 'start_date', 'end_date', 'job_description'];
    protected $casts = ['start_date' => 'date', 'end_date' => 'date'];
    public function employee() { return $this->belongsTo(Employee::class); }
}
