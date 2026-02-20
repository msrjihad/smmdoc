import { cn } from '@/lib/utils';
import React from 'react';

interface InfoCardProps {
  title: string;
  value: string | number;
  description?: string;
  icon?: React.ReactNode;
  iconColor?: 'purple' | 'blue' | 'green' | 'red' | 'orange' | 'indigo' | 'mainColor';
  className?: string;
}

export const InfoCard: React.FC<InfoCardProps> = ({
  title,
  value,
  description,
  icon,
  iconColor = 'mainColor',
  className,
}) => {
  const iconColorClasses = {
    purple: 'bg-purple-100 text-purple-600 dark:bg-purple-900/20 dark:text-purple-400',
    blue: 'bg-blue-100 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400',
    green: 'bg-green-100 text-green-600 dark:bg-green-900/20 dark:text-green-400',
    red: 'bg-red-100 text-red-600 dark:bg-red-900/20 dark:text-red-400',
    orange: 'bg-orange-100 text-orange-600 dark:bg-orange-900/20 dark:text-orange-400',
    indigo: 'bg-indigo-100 text-indigo-600 dark:bg-indigo-900/20 dark:text-indigo-400',
    mainColor: 'bg-mainColor/10 text-mainColor dark:bg-mainColor/20 dark:text-mainColor',
  };

  return (
    <div className={cn(
      "bg-white dark:bg-gray-800 rounded-lg shadow-md p-5 transition-all hover:shadow-lg",
      className
    )}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{title}</p>
          <h3 className="text-2xl font-bold mt-1">{value}</h3>
          {description && (
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{description}</p>
          )}
        </div>

        {icon && (
          <div className={cn(
            "w-10 h-10 rounded-full flex items-center justify-center",
            iconColorClasses[iconColor]
          )}>
            {icon}
          </div>
        )}
      </div>
    </div>
  );
}; 