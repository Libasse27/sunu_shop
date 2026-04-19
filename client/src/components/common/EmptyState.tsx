import { Link } from 'react-router-dom';
import { LucideIcon } from 'lucide-react';

interface Props {
  icon: LucideIcon;
  title: string;
  description?: string;
  actionLabel?: string;
  actionHref?: string;
  onAction?: () => void;
}

export default function EmptyState({ icon: Icon, title, description, actionLabel, actionHref, onAction }: Props) {
  return (
    <div className="flex flex-col items-center justify-center py-10 px-4 text-center">
      <div
        className="flex items-center justify-center rounded-2xl mb-6 shadow-sm"
        style={{ width: '80px', height: '80px', background: 'linear-gradient(135deg, #009A44, #007A35)' }}
      >
        <Icon size={36} className="text-white" />
      </div>
      <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
      {description && <p className="text-gray-500 max-w-xs mb-6">{description}</p>}
      {actionLabel && actionHref && (
        <Link to={actionHref} className="btn-primary">{actionLabel}</Link>
      )}
      {actionLabel && onAction && !actionHref && (
        <button onClick={onAction} className="btn-primary">{actionLabel}</button>
      )}
    </div>
  );
}
