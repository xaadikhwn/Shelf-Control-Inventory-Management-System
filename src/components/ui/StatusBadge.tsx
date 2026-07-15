import { getStatusColor } from '../../utils';

interface StatusBadgeProps {
  status: string;
  className?: string;
}

export default function StatusBadge({ status, className = '' }: StatusBadgeProps) {
  const { bg, text } = getStatusColor(status);

  return (
    <span
      className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold tracking-wide ${bg} ${text} ${className}`}
    >
      {status}
    </span>
  );
}
