<?php
namespace App\Http\Controllers\Payroll;
use App\Http\Controllers\BaseController;
use App\Services\PayrollService;
use App\Models\Payroll;
use Illuminate\Http\Request;

class PayrollController extends BaseController
{
    public function __construct(private PayrollService $service) {}

    public function index(Request $request)
    {
        $query = Payroll::with('employee');
        if ($request->month) $query->where('month', $request->month);
        if ($request->year) $query->where('year', $request->year);
        return $this->paginated($query->orderByDesc('year')->orderByDesc('month')->paginate($request->per_page ?? 50));
    }

    public function process(Request $request)
    {
        $request->validate(['month' => 'required|integer|between:1,12', 'year' => 'required|integer']);
        $results = $this->service->process($request->month, $request->year, $request->employee_ids ?? []);
        return $this->created($results, count($results) . ' payroll records created');
    }

    public function show(string $id)
    {
        return $this->success(Payroll::with('employee.department', 'employee.designation')->findOrFail($id));
    }

    public function approve(Request $request, string $id)
    {
        return $this->success($this->service->approve($id, $request->user()->id));
    }
}
