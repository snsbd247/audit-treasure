<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

class OvertimeRecord extends Model
{
    use HasUuids;

    public $timestamps = false;
    protected $table = 'overtime_records';

    protected $fillable = [
        'employee_id', 'date', 'hours', 'status', 'approved_by',
    ];

    protected $casts = ['date' => 'date', 'hours' => 'float'];

    public function employee()
    {
        return $this->belongsTo(Employee::class);
    }
}
