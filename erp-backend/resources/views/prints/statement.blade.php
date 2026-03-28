@extends('prints.layout')

@section('content')
<div style="display: flex; justify-content: space-between; margin-bottom: 20px; border: 1px solid #ddd; padding: 12px; border-radius: 4px;">
    <div>
        <h3 style="font-size: 14px; font-weight: 600; margin-bottom: 4px;">{{ ucfirst($party_type) }} Statement</h3>
        <p style="font-size: 13px; font-weight: 600;">{{ $party_name }}</p>
        @if(isset($party) && $party->phone)<p style="font-size: 11px; color: #666;">Phone: {{ $party->phone }}</p>@endif
        @if(isset($party) && $party->email)<p style="font-size: 11px; color: #666;">Email: {{ $party->email }}</p>@endif
        @if(isset($party) && $party->address)<p style="font-size: 11px; color: #666;">Address: {{ $party->address }}</p>@endif
    </div>
    <div style="text-align: right;">
        @if($from && $to)
        <p style="font-size: 11px; color: #666;">Period: {{ $from }} to {{ $to }}</p>
        @endif
    </div>
</div>

<table>
    <thead>
        <tr>
            <th>Date</th>
            <th>Type</th>
            <th>Reference</th>
            <th>Description</th>
            <th style="text-align: right;">Debit</th>
            <th style="text-align: right;">Credit</th>
            <th style="text-align: right;">Balance</th>
        </tr>
    </thead>
    <tbody>
        @php $totalDebit = 0; $totalCredit = 0; $balance = 0; @endphp
        @foreach($entries as $entry)
        @php
            $totalDebit += $entry['debit'];
            $totalCredit += $entry['credit'];
            $balance = $entry['balance'];
        @endphp
        <tr>
            <td>{{ $entry['date'] }}</td>
            <td>{{ $entry['type'] }}</td>
            <td>{{ $entry['reference'] }}</td>
            <td>{{ $entry['description'] ?? '' }}</td>
            <td style="text-align: right;">{{ $entry['debit'] > 0 ? number_format($entry['debit'], 2) : '—' }}</td>
            <td style="text-align: right;">{{ $entry['credit'] > 0 ? number_format($entry['credit'], 2) : '—' }}</td>
            <td style="text-align: right; font-weight: 500;">{{ number_format(abs($entry['balance']), 2) }} {{ $entry['balance'] >= 0 ? 'Dr' : 'Cr' }}</td>
        </tr>
        @endforeach
        <tr class="total-row">
            <td colspan="4"><strong>Total / Closing Balance</strong></td>
            <td style="text-align: right;"><strong>{{ number_format($totalDebit, 2) }}</strong></td>
            <td style="text-align: right;"><strong>{{ number_format($totalCredit, 2) }}</strong></td>
            <td style="text-align: right;"><strong>{{ number_format(abs($balance), 2) }} {{ $balance >= 0 ? 'Dr' : 'Cr' }}</strong></td>
        </tr>
    </tbody>
</table>

<div style="margin-top: 40px; display: flex; justify-content: space-between; align-items: flex-end;">
    <p style="font-size: 10px; color: #999;">This is a system-generated statement.</p>
    <div style="text-align: center;">
        <div style="width: 160px; border-top: 1px solid #333; padding-top: 4px;">
            <span style="font-size: 11px;">Authorized Signature</span>
        </div>
    </div>
</div>
@endsection
