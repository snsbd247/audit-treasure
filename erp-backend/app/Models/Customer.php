<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

class Customer extends Model
{
    use HasUuids;
    public $timestamps = false;
    protected $fillable = ['name', 'email', 'phone', 'address', 'status'];
    public function invoices() { return $this->hasMany(SalesInvoice::class); }
}
