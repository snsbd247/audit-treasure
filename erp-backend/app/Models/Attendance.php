<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

class Attendance extends Model
{
    use HasUuids;
    public $timestamps = false;
    protected $table = 'attendance';
    protected $fillable = ['employee_id', 'date', 'status', 'check_in', 'check_out', 'notes'];
    protected $casts = ['date' => 'date'];
    public function employee() { return $this->belongsTo(Employee::class); }
}
