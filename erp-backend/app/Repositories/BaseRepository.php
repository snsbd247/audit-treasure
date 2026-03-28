<?php

namespace App\Repositories;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Builder;

abstract class BaseRepository
{
    protected Model $model;

    public function __construct(Model $model)
    {
        $this->model = $model;
    }

    public function all(array $filters = [], int $perPage = 25)
    {
        $query = $this->model->newQuery();
        $query = $this->applyFilters($query, $filters);
        return $query->orderBy($filters['sort'] ?? 'created_at', $filters['order'] ?? 'desc')
            ->paginate($filters['per_page'] ?? $perPage);
    }

    public function find(string $id)
    {
        return $this->model->findOrFail($id);
    }

    public function create(array $data)
    {
        return $this->model->create($data);
    }

    public function update(string $id, array $data)
    {
        $record = $this->find($id);
        $record->update($data);
        return $record->fresh();
    }

    public function delete(string $id): bool
    {
        return $this->find($id)->delete();
    }

    protected function applyFilters(Builder $query, array $filters): Builder
    {
        if (!empty($filters['branch_id'])) {
            $query->where('branch_id', $filters['branch_id']);
        }
        if (!empty($filters['status'])) {
            $query->where('status', $filters['status']);
        }
        if (!empty($filters['search'])) {
            $query = $this->applySearch($query, $filters['search']);
        }
        return $query;
    }

    protected function applySearch(Builder $query, string $search): Builder
    {
        return $query; // Override in child repos
    }
}
