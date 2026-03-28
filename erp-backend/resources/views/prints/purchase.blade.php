@extends('prints.layout')

@section('title', 'Purchase Invoice')
@section('doc-title', 'Purchase Invoice')

@section('content')
    <div class="doc-info">
        <div class="info-item"><span class="label">Purchase #:</span> {{ $purchase->purchase_number }}</div>
        <div class="info-item"><span class="label">Date:</span> {{ \Carbon\Carbon::parse($purchase->purchase_date)->format('d M Y') }}</div>
        @if($purchase->branch)
            <div class="info-item"><span class="label">Branch:</span> {{ $purchase->branch->name }}</div>
        @endif
        @if($purchase->supplier)
            <div class="info-item"><span class="label">Supplier:</span> {{ $purchase->supplier->name }}</div>
        @endif
    </div>

    @if($purchase->supplier)
        <div style="margin-bottom: 16px; font-size: 12px;">
            @if($purchase->supplier->phone)<div>Phone: {{ $purchase->supplier->phone }}</div>@endif
            @if($purchase->supplier->email)<div>Email: {{ $purchase->supplier->email }}</div>@endif
            @if($purchase->supplier->address)<div>Address: {{ $purchase->supplier->address }}</div>@endif
        </div>
    @endif

    @php
        $hasVat = $purchase->items->contains(fn($item) => ($item->vat_rate ?? 0) > 0);
        $totalVat = $purchase->items->sum(fn($item) => $item->total * (($item->vat_rate ?? 0) / 100));
        $grandTotal = $purchase->total_amount + $totalVat;
    @endphp

    <table>
        <thead>
            <tr>
                <th style="width: 40px;">#</th>
                <th>Product</th>
                <th class="text-right">Qty</th>
                <th class="text-right">Unit Price</th>
                @if($hasVat)
                    <th class="text-right">VAT %</th>
                    <th class="text-right">VAT Amt</th>
                @endif
                <th class="text-right">Amount</th>
            </tr>
        </thead>
        <tbody>
            @foreach($purchase->items as $i => $item)
                @php
                    $vatRate = $item->vat_rate ?? 0;
                    $vatAmt = $item->total * ($vatRate / 100);
                    $lineTotal = $hasVat ? ($item->total + $vatAmt) : $item->total;
                @endphp
                <tr>
                    <td class="text-center">{{ $i + 1 }}</td>
                    <td>{{ $item->product ? $item->product->item_code . ' — ' . $item->product->item_name : '—' }}</td>
                    <td class="text-right tabular">{{ number_format($item->quantity, 2) }}</td>
                    <td class="text-right tabular">{{ number_format($item->unit_price, 2) }}</td>
                    @if($hasVat)
                        <td class="text-right tabular">{{ $vatRate }}%</td>
                        <td class="text-right tabular">{{ number_format($vatAmt, 2) }}</td>
                    @endif
                    <td class="text-right tabular" style="font-weight: 600;">{{ number_format($lineTotal, 2) }}</td>
                </tr>
            @endforeach

            <tr class="total-row">
                <td colspan="{{ $hasVat ? 6 : 4 }}" class="text-right" style="font-size: 13px;">Subtotal</td>
                <td class="text-right tabular" style="font-size: 13px;">{{ number_format($purchase->total_amount, 2) }}</td>
            </tr>

            @if($hasVat)
                <tr class="summary-row">
                    <td colspan="{{ $hasVat ? 6 : 4 }}" class="text-right">VAT Total</td>
                    <td class="text-right tabular">{{ number_format($totalVat, 2) }}</td>
                </tr>
                <tr class="total-row">
                    <td colspan="{{ $hasVat ? 6 : 4 }}" class="text-right" style="font-size: 13px;">Grand Total</td>
                    <td class="text-right tabular" style="font-size: 13px;">{{ number_format($grandTotal, 2) }}</td>
                </tr>
            @endif

            <tr class="summary-row">
                <td colspan="{{ $hasVat ? 6 : 4 }}" class="text-right">Paid</td>
                <td class="text-right tabular" style="color: #166534;">{{ number_format($paid_amount, 2) }}</td>
            </tr>

            <tr class="total-row">
                <td colspan="{{ $hasVat ? 6 : 4 }}" class="text-right" style="font-size: 13px;">
                    Balance Due
                    @if($due_amount <= 0)
                        <span class="badge badge-paid">PAID</span>
                    @elseif($paid_amount > 0)
                        <span class="badge badge-partial">PARTIAL</span>
                    @else
                        <span class="badge badge-unpaid">UNPAID</span>
                    @endif
                </td>
                <td class="text-right tabular" style="font-size: 13px; color: {{ $due_amount > 0 ? '#991b1b' : '#166534' }};">{{ number_format($due_amount, 2) }}</td>
            </tr>
        </tbody>
    </table>

    <div style="font-size: 10px; color: #94a3b8; border-top: 1px solid #e2e8f0; padding-top: 8px; margin-top: 8px;">
        <strong>Terms:</strong> Payment is due within the agreed credit terms. All disputes subject to local jurisdiction.
    </div>
@endsection

@section('notes')
    {{ $purchase->notes ?? '' }}
@endsection
