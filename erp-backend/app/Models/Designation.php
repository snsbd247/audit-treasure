<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

class Designation extends Model { use HasUuids; protected $fillable = ['name', 'description', 'status']; public function employees() { return $this->hasMany(Employee::class); } }
