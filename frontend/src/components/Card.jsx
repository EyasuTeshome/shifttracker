export default function Card({ children, className = '' }) {
  return (
    <div className={`bg-surface-1 border border-white/5 rounded-xl p-5 ${className}`}>
      {children}
    </div>
  );
}
