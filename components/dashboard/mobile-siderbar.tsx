'use client';
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from '@/components/ui/sheet';
import { MenuIcon } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import SideBarNav from './sidebar-nav';
import { useState } from 'react';
import { useSession } from 'next-auth/react';

export default function MobileSidebar() {
  const { data: session } = useSession();
  const [open, setOpen] = useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <button className="p-2 text-slate-600 hover:text-slate-800 transition-colors">
          <span className="sr-only">Open menu</span>
          <MenuIcon className="h-6 w-6" />
        </button>
      </SheetTrigger>
      <SheetContent
        side="left"
        className="p-0 bg-slate-800 text-white w-[280px]"
      >
        <SheetHeader className="p-4 flex items-center border-b border-slate-700/50">
          <SheetTitle className="sr-only">Navigation Menu</SheetTitle>
          <div className="flex items-center w-full">
            <div className="logo-container w-full flex items-center">
              <Link href="/" onClick={() => setOpen(false)}>
                <Image 
                  src="/logo.png" 
                  alt="SMMDOC Logo" 
                  width={280} 
                  height={60} 
                  className="object-cover w-full h-[40px] cursor-pointer hover:opacity-80 transition-opacity duration-200"
                  priority={true}
                />
              </Link>
            </div>
          </div>
        </SheetHeader>
        <div className="sidebar-nav overflow-y-auto overflow-x-hidden h-[calc(100vh-6rem)]">
          <SideBarNav session={session} setOpen={() => setOpen(false)} skipSkeleton={true} />
        </div>
      </SheetContent>
    </Sheet>
  );
}