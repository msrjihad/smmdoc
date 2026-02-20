'use client';

import { signOut } from 'next-auth/react';
import { FaSignOutAlt } from 'react-icons/fa';
import { Button } from './ui/button';

export default function LogoutButton() {
  const handleSignOut = async () => {
    await signOut({
      callbackUrl: '/',
      redirect: true
    });
  };
  
  return (
    <Button className="cursor-pointer" variant="outline" onClick={handleSignOut}>
      <FaSignOutAlt /> Sign Out
    </Button>
  );
}
