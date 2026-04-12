import { Badge } from '@/components/ui/badge';

const data = [
  { state: 'Kano', coverage: 74 },
  { state: 'Oyo', coverage: 68 },
  { state: 'Lagos', coverage: 71 },
  { state: 'Abuja', coverage: 66 },
  { state: 'Kaduna', coverage: 62 },
  { state: 'Enugu', coverage: 59 },
];

export function CoverageHeatmap() {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-base font-semibold text-gray-900">Coverage Heatmap</h3>
        <Badge variant="simulated">Simulated coverage data</Badge>
      </div>
      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {data.map((item) => (
          <div key={item.state} className="rounded-lg border border-gray-200 p-3">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium text-gray-800">{item.state}</span>
              <span className="text-gray-600">{item.coverage}%</span>
            </div>
            <div className="mt-2 h-2 rounded-full bg-gray-200">
              <div
                className="h-2 rounded-full bg-teal-primary"
                style={{ width: `${item.coverage}%`, opacity: item.coverage / 100 }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}


