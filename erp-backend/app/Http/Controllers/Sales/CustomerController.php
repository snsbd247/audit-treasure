<?php
namespace App\Http\Controllers\Sales;
use App\Http\Controllers\CrudController;
use App\Models\Customer;
class CustomerController extends CrudController { protected string $modelClass = Customer::class; protected array $searchFields = ['name', 'email', 'phone']; protected array $validationRules = ['name' => 'required|max:200']; }
