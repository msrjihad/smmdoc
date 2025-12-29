'use client';

import { useEffect } from 'react';

export default function FaviconUpdater() {
  useEffect(() => {
    const forceUpdateFavicon = () => {
      const timestamp = Date.now();
      const faviconHref = `/api/favicon?t=${timestamp}`;
      
      const existingLinks = document.querySelectorAll("link[rel='icon'], link[rel='shortcut icon'], link[rel='apple-touch-icon']");
      existingLinks.forEach(link => link.remove());
      
      const faviconLink = document.createElement('link');
      faviconLink.rel = 'icon';
      faviconLink.href = faviconHref;
      faviconLink.type = 'image/png';
      document.head.appendChild(faviconLink);
      
      const shortcutLink = document.createElement('link');
      shortcutLink.rel = 'shortcut icon';
      shortcutLink.href = faviconHref;
      shortcutLink.type = 'image/png';
      document.head.appendChild(shortcutLink);
      
      const appleLink = document.createElement('link');
      appleLink.rel = 'apple-touch-icon';
      appleLink.href = faviconHref;
      document.head.appendChild(appleLink);
    };

    forceUpdateFavicon();
    
    const timeoutId = setTimeout(forceUpdateFavicon, 100);
    
    return () => {
      clearTimeout(timeoutId);
    };
  }, []);

  return null;
}

