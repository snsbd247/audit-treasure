<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>@yield('title') — {{ $company->company_name ?? 'Company' }}</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Segoe UI', system-ui, -apple-system, sans-serif; font-size: 12px; color: #1a1a1a; padding: 24px; background: #fff; }
        .print-header { text-align: center; border-bottom: 2px solid #1a1a1a; padding-bottom: 12px; margin-bottom: 20px; }
        .print-header h1 { font-size: 20px; font-weight: 700; margin-bottom: 2px; }
        .print-header .subtitle { font-size: 11px; color: #666; }
        .print-header .doc-title { font-size: 15px; font-weight: 600; margin-top: 10px; text-transform: uppercase; letter-spacing: 1.5px; color: #1a1a1a; }
        .doc-info { display: flex; justify-content: space-between; margin-bottom: 18px; padding: 10px 14px; background: #f8f8f8; border-radius: 4px; border: 1px solid #eee; }
        .doc-info .info-item { font-size: 12px; }
        .doc-info .label { font-weight: 600; color: #333; }
        table { width: 100%; border-collapse: collapse; margin-bottom: 16px; }
        th { background: #f0f0f0; font-weight: 600; text-align: left; padding: 8px 10px; border: 1px solid #ddd; font-size: 11px; text-transform: uppercase; letter-spacing: 0.3px; }
        td { padding: 7px 10px; border: 1px solid #ddd; font-size: 12px; }
        .text-right { text-align: right; }
        .text-center { text-align: center; }
        .tabular { font-variant-numeric: tabular-nums; }
        .total-row { background: #f0f0f0; font-weight: 700; }
        .summary-row td { border-top: none; }
        .footer { margin-top: 36px; border-top: 1px solid #ddd; padding-top: 16px; }
        .signatures { display: flex; justify-content: space-between; margin-top: 56px; }
        .sig-block { text-align: center; min-width: 140px; }
        .sig-line { border-top: 1px solid #666; padding-top: 4px; font-size: 11px; color: #666; }
        .notes { font-size: 11px; color: #555; margin-bottom: 8px; font-style: italic; }
        .timestamp { font-size: 10px; color: #999; text-align: center; margin-top: 20px; }
        .badge { display: inline-block; padding: 2px 8px; border-radius: 4px; font-size: 10px; font-weight: 600; text-transform: uppercase; }
        .badge-paid { background: #dcfce7; color: #166534; }
        .badge-partial { background: #fef3c7; color: #92400e; }
        .badge-unpaid { background: #fee2e2; color: #991b1b; }
        @media print {
            body { padding: 0; }
            .no-print { display: none !important; }
        }
    </style>
</head>
<body>
    {{-- Company Header --}}
    <div class="print-header">
        @if($company->company_logo_url)
            <img src="{{ $company->company_logo_url }}" alt="Logo" style="height: 52px; margin: 0 auto 8px; display: block;">
        @endif
        <h1>{{ $company->company_name ?? 'Company Name' }}</h1>
        @if($company->address)
            <p class="subtitle">{{ $company->address }}</p>
        @endif
        <p class="subtitle">
            @if($company->phone) Phone: {{ $company->phone }} @endif
            @if($company->phone && $company->email) | @endif
            @if($company->email) Email: {{ $company->email }} @endif
        </p>
        <div class="doc-title">@yield('doc-title')</div>
    </div>

    @yield('content')

    {{-- Footer --}}
    <div class="footer">
        @hasSection('notes')
            <p class="notes">Notes: @yield('notes')</p>
        @endif

        <div class="signatures">
            @foreach(['Prepared By', 'Checked By', 'Authorized By'] as $label)
                <div class="sig-block">
                    <div class="sig-line">{{ $label }}</div>
                </div>
            @endforeach
        </div>

        <p class="timestamp">{{ $company->company_name ?? 'Company' }} | Generated: {{ now()->format('d M Y, h:i A') }}</p>
    </div>
</body>
</html>
