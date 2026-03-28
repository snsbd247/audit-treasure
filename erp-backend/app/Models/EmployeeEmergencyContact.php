<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

class EmployeeEmergencyContact extends Model
{
    use HasUuids;
    protected $table = 'employee_emergency_contacts';
    public $timestamps = false;
    protected $fillable = ['employee_id', 'name', 'relation', 'phone', 'address'];
    public function employee() { return $this->belongsTo(Employee::class); }
}
