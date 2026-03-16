<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

class AuditLog extends Model
{
    use HasUuids;
    public $timestamps = false;
    protected $table = 'audit_log';
    protected $fillable = ['user_id', 'user_name', 'module', 'action', 'record_id', 'details', 'ip_address'];
}
