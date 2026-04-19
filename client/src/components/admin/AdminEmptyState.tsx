import { InboxIcon } from 'lucide-react';

interface AdminEmptyStateProps {
  icon?: React.ElementType;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export default function AdminEmptyState({
  icon: Icon = InboxIcon,
  title,
  description,
  action,
}: AdminEmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      <div
        className="flex items-center justify-center rounded-full mb-4"
        style={{ width: 72, height: 72, backgroundColor: '#f1f5f9' }}
      >
        <Icon size={32} className="text-gray-400" />
      </div>

      <h3 className="text-base font-semibold text-gray-800 mb-1">{title}</h3>

      {description && (
        <p className="text-sm text-gray-500 max-w-sm mb-4">{description}</p>
      )}

      {action && (
        <button
          onClick={action.onClick}
          className="mt-2 inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white border-0 cursor-pointer transition-opacity hover:opacity-90"
          style={{ backgroundColor: '#009A44' }}
        >
          {action.label}
        </button>
      )}
    </div>
  );
}
