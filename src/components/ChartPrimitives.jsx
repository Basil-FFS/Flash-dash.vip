export function SimpleLineChart({ data, dataKey, labelKey, color = '#14b8a6' }) {
  if (!Array.isArray(data) || data.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center bg-gray-50 rounded-2xl text-sm text-gray-500">
        Chart data unavailable
      </div>
    );
  }

  const values = data.map((item) => Number(item[dataKey]) || 0);
  const max = Math.max(...values, 1);
  const points = values
    .map((value, index) => {
      const x = (index / Math.max(values.length - 1, 1)) * 100;
      const y = 100 - (value / max) * 100;
      return `${x},${y}`;
    })
    .join(' ');

  return (
    <div className="h-64 bg-white border border-gray-100 rounded-2xl p-6">
      <svg viewBox="0 0 100 100" className="w-full h-full">
        <polyline
          fill="none"
          stroke={color}
          strokeWidth="2"
          points={points}
          strokeLinejoin="round"
          strokeLinecap="round"
        />
        {values.map((value, index) => {
          const x = (index / Math.max(values.length - 1, 1)) * 100;
          const y = 100 - (value / max) * 100;
          return <circle key={index} cx={x} cy={y} r={1.5} fill={color} />;
        })}
      </svg>
      <div className="mt-4 grid grid-cols-2 gap-2 text-xs text-gray-500">
        {data.map((item, index) => (
          <div key={index} className="flex items-center justify-between">
            <span>{item[labelKey]}</span>
            <span className="font-medium text-gray-700">{item[dataKey]}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function SimpleBarChart({ data, valueKey, labelKey, color = '#0ea5e9' }) {
  if (!Array.isArray(data) || data.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center bg-gray-50 rounded-2xl text-sm text-gray-500">
        Comparison data unavailable
      </div>
    );
  }

  const values = data.map((item) => Number(item[valueKey]) || 0);
  const max = Math.max(...values, 1);

  return (
    <div className="h-64 bg-white border border-gray-100 rounded-2xl p-6 flex items-end gap-4">
      {data.map((item, index) => {
        const height = `${(Number(item[valueKey]) || 0) / max * 100}%`;
        return (
          <div key={index} className="flex-1 text-center">
            <div className="relative flex items-end justify-center h-full">
              <div
                className="w-10 rounded-t-lg"
                style={{ height, background: `linear-gradient(180deg, ${color}, #38bdf8)` }}
              />
            </div>
            <div className="mt-2 text-xs text-gray-500">{item[labelKey]}</div>
            <div className="text-sm font-semibold text-gray-700">{item[valueKey]}</div>
          </div>
        );
      })}
    </div>
  );
}
