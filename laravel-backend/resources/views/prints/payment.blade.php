@extends('prints.layout')

@section('title', 'Payment Receipt')
@section('doc-title', 'Payment Receipt')

@section('content')
    <div class="doc-info">
        <div class="info-item"><span class="label">Receipt #:</span> {{ $payment->reference ?? $payment->id }}</div>
        <div class="info-item"><span class="label">Date:</span> {{ \Carbon\Carbon::parse($payment->payment_date)->format('d M Y') }}</div>
        <div class="info-item"><span class="label">{{ ucfirst($payment->party_type) }}:</span> {{ $party_name }}</div>
    </div>

    <div style="margin-bottom: 20px; padding: 16px; background: #f8f8f8; border-radius: 6px; border: 1px solid #eee;">
        <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
            <div>
                <div style="font-size: 11px; color: #666; text-transform: uppercase;">Amount Received</div>
                <div style="font-size: 22px; font-weight: 700; color: #166534;">{{ number_format($payment->amount, 2) }}</div>
            </div>
            <div style="text-align: right;">
                <div style="font-size: 11px; color: #666; text-transform: uppercase;">Payment Method</div>
                <div style="font-size: 14px; font-weight: 600;">{{ ucfirst($payment->payment_method) }}</div>
            </div>
        </div>
        @if($payment->notes)
            <div style="font-size: 11px; color: #555; border-top: 1px solid #ddd; padding-top: 8px; margin-top: 8px;">
                <strong>Notes:</strong> {{ $payment->notes }}
            </div>
        @endif
    </div>

    @if(count($allocations) > 0)
        <h3 style="font-size: 13px; font-weight: 600; margin-bottom: 8px; border-bottom: 1px solid #ddd; padding-bottom: 4px;">Payment Allocation</h3>
        <table>
            <thead>
                <tr>
                    <th>#</th>
                    <th>Invoice / Bill No</th>
                    <th class="text-right">Allocated Amount</th>
                </tr>
            </thead>
            <tbody>
                @foreach($allocations as $i => $alloc)
                    <tr>
                        <td class="text-center">{{ $i + 1 }}</td>
                        <td style="font-family: monospace;">{{ $alloc['invoice_number'] }}</td>
                        <td class="text-right tabular">{{ number_format($alloc['allocated_amount'], 2) }}</td>
                    </tr>
                @endforeach
                <tr class="total-row">
                    <td colspan="2" class="text-right">Total Allocated</td>
                    <td class="text-right tabular">{{ number_format(collect($allocations)->sum('allocated_amount'), 2) }}</td>
                </tr>
                @php $unallocated = $payment->amount - collect($allocations)->sum('allocated_amount'); @endphp
                @if($unallocated > 0.01)
                    <tr>
                        <td colspan="2" class="text-right" style="color: #92400e;">Unallocated (Advance)</td>
                        <td class="text-right tabular" style="color: #92400e;">{{ number_format($unallocated, 2) }}</td>
                    </tr>
                @endif
            </tbody>
        </table>
    @endif

    <div style="margin-top: 30px; text-align: center; font-size: 12px; color: #555;">
        <p>Thank you for your payment.</p>
    </div>
@endsection
