<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Database\Eloquent\Model;

/**
 * Generic CRUD controller for simple resources.
 * Extend and override $modelClass / $validationRules.
 */
class CrudController extends BaseController
{
    protected string $modelClass;
    protected array $validationRules = [];
    protected array $with = [];
    protected array $searchFields = [];

    public function index(Request $request)
    {
        $query = $this->modelClass::query();
        if (!empty($this->with)) $query->with($this->with);
        if ($request->search && !empty($this->searchFields)) {
            $query->where(function ($q) use ($request) {
                foreach ($this->searchFields as $f) $q->orWhere($f, 'like', "%{$request->search}%");
            });
        }
        if ($request->branch_id) $query->where('branch_id', $request->branch_id);
        if ($request->status) $query->where('status', $request->status);

        return $this->paginated($query->orderBy($request->sort ?? 'created_at', $request->order ?? 'desc')->paginate($request->per_page ?? 25));
    }

    public function store(Request $request)
    {
        $data = $request->validate($this->validationRules);
        return $this->created($this->modelClass::create($data));
    }

    public function show(string $id)
    {
        $query = $this->modelClass::query();
        if (!empty($this->with)) $query->with($this->with);
        return $this->success($query->findOrFail($id));
    }

    public function update(Request $request, string $id)
    {
        $record = $this->modelClass::findOrFail($id);
        $record->update($request->only(array_keys($this->validationRules)));
        return $this->success($record->fresh());
    }

    public function destroy(string $id)
    {
        $this->modelClass::findOrFail($id)->delete();
        return $this->success(null, 'Deleted');
    }
}
