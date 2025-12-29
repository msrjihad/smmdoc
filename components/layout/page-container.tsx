import React from 'react';

interface PageContainerProps {
  children: React.ReactNode;
  title: string;
  subtitle?: string;
}

export const PageContainer: React.FC<PageContainerProps> = ({
  children,
  title,
  subtitle,
}) => {
  return (
    <div className="space-y-6">
      <div className="page-header">
        <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
        {subtitle && (
          <p className="text-sm text-muted-foreground">{subtitle}</p>
        )}
      </div>
      <div className="page-content">
        {children}
      </div>
    </div>
  );
}; 