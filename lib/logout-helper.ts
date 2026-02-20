export function clearAllSessionData(): void {
  if (typeof window === 'undefined') return;

  try {
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key) {
        if (
          key.startsWith('next-auth') ||
          key.includes('session') ||
          key.includes('auth') ||
          key.includes('token') ||
          key.includes('user')
        ) {
          keysToRemove.push(key);
        }
      }
    }
    keysToRemove.forEach(key => localStorage.removeItem(key));

    sessionStorage.clear();

    const cookiesToClear = [
      'next-auth.session-token',
      'next-auth.csrf-token',
      '__Secure-next-auth.session-token',
      '__Secure-next-auth.csrf-token',
      'impersonated-user-id',
      'original-admin-id',
    ];

    cookiesToClear.forEach(cookieName => {
      document.cookie = `${cookieName}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax`;
      document.cookie = `${cookieName}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax; Secure`;
      document.cookie = `${cookieName}=; path=/; domain=${window.location.hostname}; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax`;
      document.cookie = `${cookieName}=; path=/; domain=.${window.location.hostname}; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax`;
    });
  } catch (error) {
    console.error('Error clearing session data:', error);
  }
}

export async function performCompleteLogout(
  signOut: any,
  callbackUrl: string = '/sign-in'
): Promise<void> {
  try {
    clearAllSessionData();

    fetch('/api/auth/logout', {
      method: 'POST',
    }).catch(e => {
      console.error('Failed to log logout activity:', e);
    });

    await signOut({
      callbackUrl,
      redirect: true,
    });
  } catch (error) {
    console.error('Logout failed:', error);
    clearAllSessionData();
    window.location.href = callbackUrl || '/sign-in';
  }
}

