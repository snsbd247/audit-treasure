<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

class LeaveRequest extends Model
{
    use HasUuids;
    public $timestamps = false;
    protected $fillable = ['employee_id', 'leave_type_id', 'start_date', 'end_date', 'reason', 'status', 'approved_by'];
    protected $casts = ['start_date' => 'date', 'end_date' => 'date'];
    public function employee() { return $this->belongsTo(Employee::class); }
    public function leaveType() { return $this->belongsTo(LeaveType::class); }
}
