@extends('prints.layout')

@section('title', 'Sales Invoice')
@section('doc-title', 'Sales Invoice')

@section('content')
    <div class="doc-info">
        <div class="info-item"><span class="label">Invoice #:</span> {{ $invoice->invoice_number }}</div>
        <div class="info-item"><span class="label">Date:</span> {{ \Carbon\Carbon::parse($invoice->invoice_date)->format('d M Y') }}</div>
        @if($invoice->branch)
            <div class="info-item"><span class="label">Branch:</span> {{ $invoice->branch->name }}</div>
        @endif
        @if($invoice->customer)
            <div class="info-item"><span class="label">Customer:</span> {{ $invoice->customer->name }}</div>
        @endif
    </div>

    @if($invoice->customer)
        <div style="margin-bottom: 16px; font-size: 12px;">
            @if($invoice->customer->phone)<div>Phone: {{ $invoice->customer->phone }}</div>@endif
            @if($invoice->customer->email)<div>Email: {{ $invoice->customer->email }}</div>@endif
            @if($invoice->customer->address)<div>Address: {{ $invoice->customer->address }}</div>@endif
        </div>
    @endif

    @php
        $hasVat = $invoice->items->contains(fn($item) => ($item->vat_rate ?? 0) > 0);
        $totalVat = $invoice->items->sum(fn($item) => $item->total * (($item->vat_rate ?? 0) / 100));
        $grandTotal = $invoice->net_amount + $totalVat;
    @endphp

    <table>
        <thead>
            <tr>
                <th style="width: 40px;">#</th>
                <th>Product</th>
                <th class="text-right">Qty</th>
                <th class="text-right">Rate</th>
                <th class="text-right">Discount</th>
                @if($hasVat)
                    <th class="text-right">VAT %</th>
                    <th class="text-right">VAT Amt</th>
                @endif
                <th class="text-right">Amount</th>
            </tr>
        </thead>
        <tbody>
            @foreach($invoice->items as $i => $item)
                @php
                    $vatRate = $item->vat_rate ?? 0;
                    $vatAmt = $item->total * ($vatRate / 100);
                    $lineTotal = $hasVat ? ($item->total + $vatAmt) : $item->total;
                @endphp
                <tr>
                    <td class="text-center">{{ $i + 1 }}</td>
                    <td>{{ $item->product ? $item->product->item_code . ' — ' . $item->product->item_name : '—' }}</td>
                    <td class="text-right tabular">{{ number_format($item->quantity, 2) }}</td>
                    <td class="text-right tabular">{{ number_format($item->price, 2) }}</td>
                    <td class="text-right tabular">{{ number_format($item->discount, 2) }}</td>
                    @if($hasVat)
                        <td class="text-right tabular">{{ $vatRate }}%</td>
                        <td class="text-right tabular">{{ number_format($vatAmt, 2) }}</td>
                    @endif
                    <td class="text-right tabular" style="font-weight: 600;">{{ number_format($lineTotal, 2) }}</td>
                </tr>
            @endforeach

            {{-- Subtotal --}}
            <tr class="total-row">
                <td colspan="{{ $hasVat ? 7 : 5 }}" class="text-right">Subtotal</td>
                <td class="text-right tabular">{{ number_format($invoice->total_amount, 2) }}</td>
            </tr>

            @if($invoice->discount > 0)
                <tr class="summary-row">
                    <td colspan="{{ $hasVat ? 7 : 5 }}" class="text-right">Discount</td>
                    <td class="text-right tabular">({{ number_format($invoice->discount, 2) }})</td>
                </tr>
            @endif

            @if($hasVat)
                <tr class="summary-row">
                    <td colspan="{{ $hasVat ? 7 : 5 }}" class="text-right">VAT Total</td>
                    <td class="text-right tabular">{{ number_format($totalVat, 2) }}</td>
                </tr>
            @endif

            <tr class="total-row">
                <td colspan="{{ $hasVat ? 7 : 5 }}" class="text-right" style="font-size: 13px;">Grand Total</td>
                <td class="text-right tabular" style="font-size: 13px;">{{ number_format($grandTotal, 2) }}</td>
            </tr>

            <tr class="summary-row">
                <td colspan="{{ $hasVat ? 7 : 5 }}" class="text-right">Paid</td>
                <td class="text-right tabular" style="color: #166534;">{{ number_format($paid_amount, 2) }}</td>
            </tr>

            <tr class="total-row">
                <td colspan="{{ $hasVat ? 7 : 5 }}" class="text-right" style="font-size: 13px;">
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
        <strong>Terms:</strong> Payment is due within the agreed credit terms. Goods once sold will not be taken back. All disputes subject to local jurisdiction.
    </div>
@endsection

@section('notes')
    {{ $invoice->notes ?? '' }}
@endsection
