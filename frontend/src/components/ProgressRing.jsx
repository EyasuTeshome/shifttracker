export default function ProgressRing({ pct, color = '#6366f1', size = 80, stroke = 6 }) {
  const r  = (size - stroke) / 2;
  const c  = 2 * Math.PI * r;
  const offset = c - (Math.min(pct, 100) / 100) * c;
  const over = pct > 100;

  return (
    <svg width={size} height={size} className="-rotate-90">
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="#ffffff08" strokeWidth={stroke} />
      <circle
        cx={size/2} cy={size/2} r={r} fill="none"
        stroke={over ? '#ef4444' : color}
        strokeWidth={stroke}
        strokeDasharray={c}
        strokeDashoffset={offset}
        strokeLinecap="round"
        style={{ transition: 'stroke-dashoffset 0.6s ease' }}
      />
    </svg>
  );
}
