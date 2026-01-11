'use client';

import { useEffect, useState } from 'react';

interface CustomCodesSettings {
  headerCodes: string;
  footerCodes: string;
}

export function CustomCodesInjector() {
  const [customCodes, setCustomCodes] = useState<CustomCodesSettings | null>(null);

  const fetchCustomCodes = async () => {
    try {
      const response = await fetch('/api/public/custom-codes');
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.customCodesSettings) {
          setCustomCodes(data.customCodesSettings);
        }
      }
    } catch (error) {
      console.error('Error fetching custom codes:', error);
    }
  };

  useEffect(() => {

    fetchCustomCodes();

    const handleCustomCodesUpdate = () => {
      fetchCustomCodes();
    };

    window.addEventListener('customCodesUpdated', handleCustomCodesUpdate);

    return () => {
      window.removeEventListener('customCodesUpdated', handleCustomCodesUpdate);
    };
  }, []);

  const executeScripts = (container: HTMLElement) => {
    const scripts = container.querySelectorAll('script');
    scripts.forEach((oldScript) => {
      try {
        const newScript = document.createElement('script');
        Array.from(oldScript.attributes).forEach((attr) => {
          newScript.setAttribute(attr.name, attr.value);
        });
        newScript.appendChild(document.createTextNode(oldScript.innerHTML));
        // Check if element still exists in DOM before replacing
        if (oldScript.parentNode && (document.head.contains(oldScript) || document.body.contains(oldScript))) {
          oldScript.parentNode.replaceChild(newScript, oldScript);
        } else if (oldScript.isConnected) {
          oldScript.replaceWith(newScript);
        }
      } catch (error) {
        console.warn('Error executing script:', error);
      }
    });
  };

  useEffect(() => {
    if (!customCodes) return;

    if (customCodes.headerCodes && customCodes.headerCodes.trim()) {

      try {
        const existingHeaderCodes = document.getElementById('custom-header-codes');
        if (existingHeaderCodes && existingHeaderCodes.parentNode && document.head.contains(existingHeaderCodes)) {
          existingHeaderCodes.remove();
        }
      } catch (error) {
        // Element already removed - ignore silently
      }

      const headerDiv = document.createElement('div');
      headerDiv.id = 'custom-header-codes';
      headerDiv.innerHTML = customCodes.headerCodes;
      document.head.appendChild(headerDiv);

      executeScripts(headerDiv);
    }

    if (customCodes.footerCodes && customCodes.footerCodes.trim()) {

      try {
        const existingFooterCodes = document.getElementById('custom-footer-codes');
        if (existingFooterCodes && existingFooterCodes.parentNode && document.body.contains(existingFooterCodes)) {
          existingFooterCodes.remove();
        }
      } catch (error) {
        // Element already removed - ignore silently
      }

      const footerDiv = document.createElement('div');
      footerDiv.id = 'custom-footer-codes';
      footerDiv.innerHTML = customCodes.footerCodes;
      document.body.appendChild(footerDiv);

      executeScripts(footerDiv);
    }

    return () => {
      try {
        // Check if document is still available
        if (typeof document === 'undefined' || !document.body || !document.head) {
          return;
        }

        const headerCodes = document.getElementById('custom-header-codes');
        const footerCodes = document.getElementById('custom-footer-codes');
        
        if (headerCodes && headerCodes.parentNode && document.head.contains(headerCodes)) {
          headerCodes.remove();
        }
        if (footerCodes && footerCodes.parentNode && document.body.contains(footerCodes)) {
          footerCodes.remove();
        }
      } catch (error) {
        // DOM not available during cleanup - ignore silently
      }
    };
  }, [customCodes]);

  return null;
}