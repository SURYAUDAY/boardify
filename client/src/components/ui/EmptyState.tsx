import type { ReactNode } from 'react';

interface Props {
  icon: ReactNode;
  title: string;
  description?: string;
  action?: { label: string; onClick: () => void; variant?: 'primary' | 'subtle' };
  size?: 'large' | 'subtle';
}

export default function EmptyState({
  icon,
  title,
  description,
  action,
  size = 'large',
}: Props) {
  if (size === 'subtle') {
    return (
      <div className="flex flex-col items-center text-center gap-2 min-h-[160px] justify-center">
        <div className="text-[#334155]">{icon}</div>
        <div className="text-[16px] text-[#475569]">{title}</div>
        {description && <div className="text-[13px] text-[#334155]">{description}</div>}
        {action && (
          <button
            onClick={action.onClick}
            className="text-[13px] text-indigo-400 hover:text-indigo-300 mt-1"
          >
            {action.label}
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center text-center gap-3 min-h-[280px] justify-center">
      <div className="w-16 h-16 flex items-center justify-center text-indigo-500">{icon}</div>
      <div className="text-[22px] font-semibold text-white">{title}</div>
      {description && (
        <div className="text-[15px] text-[#94A3B8] max-w-[340px]">{description}</div>
      )}
      {action && (
        <button
          onClick={action.onClick}
          className={`mt-2 ${
            action.variant === 'subtle'
              ? 'text-indigo-400 hover:text-indigo-300 text-[14px]'
              : 'bg-indigo-500 hover:bg-indigo-600 text-white text-[14px] font-semibold h-12 px-5 rounded-xl'
          }`}
        >
          {action.label}
        </button>
      )}
    </div>
  );
}
