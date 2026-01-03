import React from 'react';
import { cn } from '@/utils/helpers';

export interface TabItem {
  id: string;
  label: string;
  icon?: React.ReactNode;
  badge?: string | number;
  disabled?: boolean;
}

interface TabsProps {
  tabs: TabItem[];
  activeTab: string;
  onChange: (tabId: string) => void;
  variant?: 'default' | 'pills' | 'underline';
  fullWidth?: boolean;
  className?: string;
}

const Tabs: React.FC<TabsProps> = ({
  tabs,
  activeTab,
  onChange,
  variant = 'default',
  fullWidth = false,
  className,
}) => {
  const variants = {
    default: {
      container: 'border-b border-gray-200',
      tab: 'px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-px',
      active: 'border-primary-500 text-primary-600',
      inactive: 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300',
    },
    pills: {
      container: 'bg-gray-100 p-1 rounded-lg',
      tab: 'px-4 py-2 text-sm font-medium rounded-md transition-colors',
      active: 'bg-white text-gray-900 shadow-sm',
      inactive: 'text-gray-500 hover:text-gray-700',
    },
    underline: {
      container: '',
      tab: 'px-6 py-3 text-sm font-medium transition-colors relative',
      active: 'text-primary-600',
      inactive: 'text-gray-500 hover:text-gray-700',
    },
  };

  const style = variants[variant];

  return (
    <div className={cn('w-full', className)}>
      <nav className={cn('flex', style.container, fullWidth && 'justify-between')} aria-label="Tabs">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => !tab.disabled && onChange(tab.id)}
            disabled={tab.disabled}
            className={cn(
              style.tab,
              activeTab === tab.id ? style.active : style.inactive,
              fullWidth && 'flex-1 text-center',
              tab.disabled && 'opacity-50 cursor-not-allowed'
            )}
            aria-current={activeTab === tab.id ? 'page' : undefined}
          >
            <span className="flex items-center justify-center gap-2">
              {tab.icon}
              {tab.label}
              {tab.badge !== undefined && (
                <span
                  className={cn(
                    'ml-1 px-2 py-0.5 text-xs rounded-full',
                    activeTab === tab.id
                      ? 'bg-primary-100 text-primary-600'
                      : 'bg-gray-200 text-gray-600'
                  )}
                >
                  {tab.badge}
                </span>
              )}
            </span>
            {variant === 'underline' && activeTab === tab.id && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary-500" />
            )}
          </button>
        ))}
      </nav>
    </div>
  );
};

// Tab panels container
interface TabPanelProps {
  value: string;
  activeValue: string;
  children: React.ReactNode;
  className?: string;
}

export const TabPanel: React.FC<TabPanelProps> = ({ value, activeValue, children, className }) => {
  if (value !== activeValue) return null;

  return (
    <div className={cn('animate-fade-in', className)} role="tabpanel">
      {children}
    </div>
  );
};

export default Tabs;
