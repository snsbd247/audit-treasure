<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;

class NumberSequence extends Model
{
    public $timestamps = false;
    public $incrementing = false;
    protected $keyType = 'string';
    protected $fillable = ['id', 'prefix', 'current_number', 'year', 'description'];
}
