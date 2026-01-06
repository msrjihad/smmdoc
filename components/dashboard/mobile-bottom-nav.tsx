'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useState, useEffect } from 'react';
import { 
  FaTachometerAlt, 
  FaPlus, 
  FaBriefcase, 
  FaUser,
  FaEllipsisH
} from 'react-icons/fa';
import { cn } from '@/lib/utils';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import SideBarNav from './sidebar-nav';
import Image from 'next/image';

interface NavItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

const navItems: NavItem[] = [
  {
    href: '/dashboard',
    label: 'Dashboard',
    icon: FaTachometerAlt,
  },
  {
    href: '/new-order',
    label: 'New Order',
    icon: FaPlus,
  },
  {
    href: '/services',
    label: 'Services',
    icon: FaBriefcase,
  },
  {
    href: '/account-settings',
    label: 'Profile',
    icon: FaUser,
  },
];

export default function MobileBottomNav() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (session?.user) {
      const timer = setTimeout(() => {
        setIsLoading(false);
      }, 500);
      return () => clearTimeout(timer);
    } else {
      setIsLoading(true);
    }
  }, [session]);

  const isUser = session?.user?.role === 'user' || 
                 (!session?.user?.role || 
                  (session?.user?.role !== 'admin' && 
                   session?.user?.role !== 'ADMIN' && 
                   session?.user?.role !== 'moderator' && 
                   session?.user?.role !== 'MODERATOR'));

  const isAdminPage = pathname?.startsWith('/admin');

  if (!isUser || isAdminPage) {
    return null;
  }

  const showSkeleton = isLoading || !session?.user;

  return (
    <>
      <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white dark:bg-slate-800 border-t border-gray-200 dark:border-gray-700 lg:hidden">
        <div className="flex items-center justify-around h-16 px-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || 
                            (item.href === '/services' && pathname?.startsWith('/services'));
            
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex flex-col items-center justify-center flex-1 h-full transition-all duration-200",
                  "hover:bg-gray-50 dark:hover:bg-slate-700/50 active:scale-95"
                )}
              >
                <div className="flex flex-col items-center gap-1.5">
                  <div className="relative">
                    <Icon
                      className={cn(
                        "w-5 h-5 transition-all duration-200",
                        isActive
                          ? "text-[var(--primary)] dark:text-[var(--secondary)]"
                          : "text-gray-400 dark:text-gray-500"
                      )}
                    />
                  </div>
                  <span
                    className={cn(
                      "text-xs font-medium transition-colors duration-200 leading-tight",
                      isActive
                        ? "text-[var(--primary)] dark:text-[var(--secondary)]"
                        : "text-gray-500 dark:text-gray-400"
                    )}
                  >
                    {item.label}
                  </span>
                </div>
              </Link>
            );
          })}
          <button
            onClick={() => setSidebarOpen(true)}
            className={cn(
              "flex flex-col items-center justify-center flex-1 h-full transition-all duration-200",
              "hover:bg-gray-50 dark:hover:bg-slate-700/50 active:scale-95"
            )}
          >
            <div className="flex flex-col items-center gap-1.5">
              <div className="relative">
                <FaEllipsisH
                  className={cn(
                    "w-5 h-5 transition-all duration-200",
                    sidebarOpen
                      ? "text-[var(--primary)] dark:text-[var(--secondary)]"
                      : "text-gray-400 dark:text-gray-500"
                  )}
                />
              </div>
              <span
                className={cn(
                  "text-xs font-medium transition-colors duration-200 leading-tight",
                  sidebarOpen
                    ? "text-[var(--primary)] dark:text-[var(--secondary)]"
                    : "text-gray-500 dark:text-gray-400"
                )}
              >
                More
              </span>
            </div>
          </button>
        </div>
      </nav>

      <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
        <SheetContent
          side="left"
          className="p-0 bg-slate-800 text-white w-[280px]"
        >
          <SheetHeader className="p-4 flex items-center border-b border-slate-700/50">
            <SheetTitle className="sr-only">Navigation Menu</SheetTitle>
            <div className="flex items-center w-full">
              <div className="logo-container w-full flex items-center">
                {showSkeleton ? (
                  <div className="w-full h-[40px] bg-slate-700/50 animate-pulse rounded"></div>
                ) : (
                  <Link href="/" onClick={() => setSidebarOpen(false)}>
                    <Image 
                      src="/logo.png" 
                      alt="SMMDOC Logo" 
                      width={280} 
                      height={60} 
                      className="object-cover w-full h-[40px] cursor-pointer hover:opacity-80 transition-opacity duration-200"
                      priority={true}
                    />
                  </Link>
                )}
              </div>
            </div>
          </SheetHeader>
          <div className="sidebar-nav overflow-y-auto overflow-x-hidden h-[calc(100vh-6rem)]">
            <SideBarNav session={session} setOpen={() => setSidebarOpen(false)} />
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}

