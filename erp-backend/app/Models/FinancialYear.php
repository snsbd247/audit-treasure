<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

class FinancialYear extends Model
{
    use HasUuids;
    public $timestamps = false;
    protected $fillable = ['name', 'start_date', 'end_date', 'is_active'];
    protected $casts = ['start_date' => 'date', 'end_date' => 'date'];
}
