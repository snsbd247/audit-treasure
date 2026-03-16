<?php

namespace App\Services;

use App\Models\NumberSequence;
use Illuminate\Support\Facades\DB;

class NumberSequenceService
{
    /**
     * Get the next number for a sequence and increment atomically.
     */
    public function next(string $sequenceId): string
    {
        return DB::transaction(function () use ($sequenceId) {
            $seq = NumberSequence::lockForUpdate()->findOrFail($sequenceId);
            $seq->increment('current_number');
            $num = str_pad($seq->current_number, 5, '0', STR_PAD_LEFT);
            return "{$seq->prefix}-{$seq->year}-{$num}";
        });
    }
}
