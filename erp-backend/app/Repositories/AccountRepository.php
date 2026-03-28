<?php

namespace App\Repositories;

use App\Models\ChartOfAccount;
use Illuminate\Database\Eloquent\Builder;

class AccountRepository extends BaseRepository
{
    public function __construct(ChartOfAccount $model) { parent::__construct($model); }

    protected function applySearch(Builder $query, string $search): Builder
    {
        return $query->where(function ($q) use ($search) {
            $q->where('account_name', 'like', "%{$search}%")
              ->orWhere('account_code', 'like', "%{$search}%");
        });
    }

    public function getTree()
    {
        return ChartOfAccount::with('children.children.children')
            ->whereNull('parent_id')
            ->where('is_active', 1)
            ->orderBy('account_code')
            ->get();
    }

    public function findByName(string $name): ?ChartOfAccount
    {
        return ChartOfAccount::where('account_name', 'like', "%{$name}%")
            ->where('is_active', 1)->first();
    }

    public function findByCode(string $code): ?ChartOfAccount
    {
        return ChartOfAccount::where('account_code', $code)
            ->where('is_active', 1)->first();
    }

    public function getLedger(string $accountId, string $from, string $to)
    {
        return \App\Models\VoucherEntry::with('voucher')
            ->where('account_id', $accountId)
            ->whereHas('voucher', fn ($q) => $q->whereBetween('voucher_date', [$from, $to])->where('status', 'approved'))
            ->orderBy('sort_order')
            ->get();
    }
}
