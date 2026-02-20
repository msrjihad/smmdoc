import { cn } from '@/lib/utils';
import Image from 'next/image';
import Link from 'next/link';
import React from 'react';

interface ServiceTileProps {
  id: number;
  title: string;
  description?: string;
  price: string | number;
  icon?: React.ReactNode;
  bgColor?: 'purple' | 'blue' | 'green' | 'red' | 'orange' | 'indigo';
  badge?: string;
  href?: string;
  onClick?: () => void;
  className?: string;
  image?: string;
  name?: string;
  discount?: number;
}

export const ServiceTile: React.FC<ServiceTileProps> = ({
  id,
  title,
  description,
  price,
  icon,
  bgColor = 'blue',
  badge,
  href,
  onClick,
  className,
  image,
  name,
  discount,
}) => {
  const bgColorClasses = {
    purple: 'bg-gradient-to-br from-purple-500 to-purple-600',
    blue: 'bg-gradient-to-br from-blue-500 to-blue-600',
    green: 'bg-gradient-to-br from-green-500 to-green-600',
    red: 'bg-gradient-to-br from-red-500 to-red-600',
    orange: 'bg-gradient-to-br from-orange-500 to-orange-600',
    indigo: 'bg-gradient-to-br from-indigo-500 to-indigo-600',
  };

  const CardContent = () => (
    <>
      <div className="relative group">
        <div className="aspect-square overflow-hidden rounded-lg">
          <Image
            src={image || '/images/service-placeholder.jpg'}
            alt={name || title}
            width={300}
            height={300}
            className="w-full h-full object-cover transition-all duration-300 group-hover:scale-110"
          />
          {discount && discount > 0 && (
            <div className="absolute top-3 right-3 bg-mainColor/20 text-white text-xs rounded-full px-2 py-1">
              -{discount}%
            </div>
          )}
        </div>
        {badge && (
          <div className="absolute top-3 right-3 bg-black/20 text-white text-xs rounded-full px-2 py-1">
            {badge}
          </div>
        )}
      </div>
      <div className="p-4">
        <h4 className="font-medium text-base mb-1 truncate">{title}</h4>
        {description && (
          <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2 mb-3">
            {description}
          </p>
        )}
        <div className="flex justify-between items-center">
          <span className="font-bold text-primary">
            {typeof price === 'number' ? `$${price.toFixed(2)}` : price}
          </span>
          <button className="bg-primary hover:bg-primary/90 text-white py-1 px-3 rounded text-sm">
            Order Now
          </button>
        </div>
      </div>
    </>
  );

  return (
    <div
      className={cn(
        'bg-white dark:bg-gray-800 rounded-lg overflow-hidden shadow transition-all hover:shadow-lg relative',
        className
      )}
    >
      {href ? (
        <Link href={href}>
          <CardContent />
        </Link>
      ) : (
        <div onClick={onClick} className={onClick ? 'cursor-pointer' : ''}>
          <CardContent />
        </div>
      )}
    </div>
  );
};
