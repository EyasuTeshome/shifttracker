export default function EmptyState({ icon = '◌', title, description, action }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <span className="text-4xl mb-4 opacity-30">{icon}</span>
      <h3 className="text-white font-medium mb-1">{title}</h3>
      {description && <p className="text-gray-500 text-sm mb-4 max-w-xs">{description}</p>}
      {action}
    </div>
  );
}
