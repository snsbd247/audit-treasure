@extends('prints.layout')

@section('title', ucfirst($party_type) . ' Ledger')
@section('doc-title', ucfirst($party_type) . ' Ledger')

@section('content')
    <div class="doc-info">
        <div class="info-item"><span class="label">{{ ucfirst($party_type) }}:</span> {{ $party_name }}</div>
        @if($from)
            <div class="info-item"><span class="label">From:</span> {{ \Carbon\Carbon::parse($from)->format('d M Y') }}</div>
        @endif
        @if($to)
            <div class="info-item"><span class="label">To:</span> {{ \Carbon\Carbon::parse($to)->format('d M Y') }}</div>
        @endif
        <div class="info-item"><span class="label">Entries:</span> {{ count($entries) }}</div>
    </div>

    <table>
        <thead>
            <tr>
                <th>Date</th>
                <th>Description</th>
                <th>Reference</th>
                <th class="text-right">Debit</th>
                <th class="text-right">Credit</th>
                <th class="text-right">Balance</th>
            </tr>
        </thead>
        <tbody>
            @php $openingBalance = 0; @endphp
            @if(count($entries) > 0)
                <tr style="background: #f8f8f8; font-weight: 600;">
                    <td colspan="5">Opening Balance</td>
                    <td class="text-right tabular">{{ number_format($openingBalance, 2) }}</td>
                </tr>
            @endif

            @foreach($entries as $entry)
                <tr>
                    <td>{{ \Carbon\Carbon::parse($entry['date'])->format('d M Y') }}</td>
                    <td>{{ $entry['description'] ?? '' }}</td>
                    <td style="font-family: monospace; font-size: 11px;">{{ $entry['reference'] ?? '' }}</td>
                    <td class="text-right tabular">{{ $entry['debit'] > 0 ? number_format($entry['debit'], 2) : '—' }}</td>
                    <td class="text-right tabular">{{ $entry['credit'] > 0 ? number_format($entry['credit'], 2) : '—' }}</td>
                    <td class="text-right tabular" style="font-weight: 600;">{{ number_format($entry['balance'], 2) }}</td>
                </tr>
            @endforeach

            @if(count($entries) > 0)
                @php $closing = end($entries)['balance'] ?? 0; @endphp
                <tr class="total-row">
                    <td colspan="3" class="text-right" style="font-size: 13px;">Closing Balance</td>
                    <td class="text-right tabular">{{ number_format(collect($entries)->sum('debit'), 2) }}</td>
                    <td class="text-right tabular">{{ number_format(collect($entries)->sum('credit'), 2) }}</td>
                    <td class="text-right tabular" style="font-size: 13px; color: {{ $closing >= 0 ? '#991b1b' : '#166534' }};">{{ number_format($closing, 2) }}</td>
                </tr>
            @endif
        </tbody>
    </table>
@endsection
