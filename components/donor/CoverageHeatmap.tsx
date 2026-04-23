const data = [
  { state: 'Kano', coverage: 74 },
  { state: 'Oyo', coverage: 68 },
  { state: 'Lagos', coverage: 71 },
  { state: 'Abuja', coverage: 66 },
  { state: 'Kaduna', coverage: 62 },
  { state: 'Enugu', coverage: 59 },
];

function coverageColor(pct: number) {
  if (pct >= 70) return 'bg-who-green';
  if (pct >= 65) return 'bg-who-blue';
  return 'bg-who-orange';
}

export function CoverageHeatmap() {
  return (
    <div className="space-y-3">
      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {data.map((item) => (
          <div key={item.state} className="rounded-lg border border-ui-border p-3">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium text-ui-text">{item.state}</span>
              <span className="text-ui-text-muted font-semibold">{item.coverage}%</span>
            </div>
            <div className="mt-2 h-2 rounded-full bg-gray-100">
              <div
                className={`h-2 rounded-full ${coverageColor(item.coverage)} transition-all`}
                style={{ width: `${item.coverage}%` }}
              />
            </div>
          </div>
        ))}
      </div>
      <p className="text-xs text-ui-text-muted text-center">
        Regional DTP3 coverage rates · Source: Vite field data
      </p>
    </div>
  );
}



