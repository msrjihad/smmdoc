'use client';
import dynamic from 'next/dynamic';
import { useState, useEffect } from 'react';
import { Session } from 'next-auth';

const Image = dynamic(() => import('next/image'), { ssr: false });
const Link = dynamic(() => import('next/link'), { ssr: false });

import SideBarNav, { SidebarFooter } from './sidebar-nav';

interface SideBarProps {
  collapsed?: boolean;
  setCollapsed?: (collapsed: boolean) => void;
  session?: Session | null;
}

function SideBarContent({
  collapsed,
  setCollapsed,
  session,
}: {
  collapsed: boolean;
  setCollapsed: (value: boolean) => void;
  session: Session | null | undefined;
}) {
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

  const showSkeleton = isLoading || !session?.user;

  return (
    <div
      className={`h-full bg-slate-800 text-white transition-all duration-300 flex flex-col ${
        collapsed ? 'w-[80px]' : 'w-[280px]'
      } overflow-hidden`}
    >
      <div
        className={`sidebar-header ${
          collapsed ? 'p-4 flex-col space-y-3' : 'p-4'
        } flex items-center border-b border-slate-700/50`}
      >
        {collapsed ? (
          <>
            {showSkeleton ? (
              <div className="w-[50px] h-[50px] rounded bg-slate-700/50 animate-pulse"></div>
            ) : (
              <Link href="/">
                <Image
                  src="/favicon.png"
                  alt="Favicon"
                  width={50}
                  height={50}
                  className="object-contain cursor-pointer hover:opacity-80 transition-opacity duration-200"
                  priority={true}
                />
              </Link>
            )}
            <button
              className="p-2 bg-gradient-to-r from-[var(--primary)] to-[var(--secondary)] shadow-lg w-10 h-10 flex items-center justify-center text-white rounded-md transition-all duration-300"
              onClick={() => setCollapsed(!collapsed)}
              aria-label="Expand sidebar"
            >
              <i className="ri-menu-unfold-line text-lg transition-all duration-300"></i>
            </button>
          </>
        ) : (
          <>
            <div className="flex items-center w-full">
              <div className="logo-container w-full flex items-center">
                {showSkeleton ? (
                  <div className="w-full h-[40px] bg-slate-700/50 animate-pulse rounded"></div>
                ) : session?.user?.role === 'admin' ? (
                  <Link href="/">
                    <Image
                      src="/sit_logo-landscape-dark.png"
                      alt="Suitable IT Logo"
                      width={280}
                      height={60}
                      className="object-cover w-full h-[40px] cursor-pointer hover:opacity-80 transition-opacity duration-200"
                      priority={true}
                    />
                  </Link>
                ) : (
                  <Link href="/">
                    <Image
                      src="/logo.png"
                      alt="User Logo"
                      width={280}
                      height={60}
                      className="object-cover w-full h-[40px] cursor-pointer hover:opacity-80 transition-opacity duration-200"
                      priority={true}
                    />
                  </Link>
                )}
              </div>
            </div>
            <button
              className="ml-auto p-2 hover:bg-slate-700 text-white rounded-md transition-all duration-300"
              onClick={() => setCollapsed(!collapsed)}
              aria-label="Collapse sidebar"
            >
              <i className="ri-menu-fold-line text-xl transition-all duration-300"></i>
            </button>
          </>
        )}
      </div>
      <div className="sidebar-nav overflow-y-auto overflow-x-hidden flex-1">
        <SideBarNav collapsed={collapsed} session={session} setOpen={() => {}} />
      </div>
      <SidebarFooter collapsed={collapsed} session={session} setOpenAction={() => {}} />
    </div>
  );
}

export default function SideBar({
  collapsed: externalCollapsed,
  setCollapsed: setExternalCollapsed,
  session,
}: SideBarProps) {
  const [internalCollapsed, setInternalCollapsed] = useState(false);

  const collapsed =
    externalCollapsed !== undefined ? externalCollapsed : internalCollapsed;
  const setCollapsed = (value: boolean) => {
    setInternalCollapsed(value);
    if (setExternalCollapsed) {
      setExternalCollapsed(value);
    }
  };

  return (
    <SideBarContent
      collapsed={collapsed}
      setCollapsed={setCollapsed}
      session={session}
    />
  );
}
