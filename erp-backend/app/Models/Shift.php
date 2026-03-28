<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

class Shift extends Model { use HasUuids; protected $fillable = ['shift_name', 'start_time', 'end_time', 'late_after_minutes']; public function employees() { return $this->hasMany(Employee::class); } }
