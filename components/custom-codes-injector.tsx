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
        if (oldScript.parentNode) {
          oldScript.parentNode.replaceChild(newScript, oldScript);
        } else {
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
        if (existingHeaderCodes && existingHeaderCodes.parentNode) {
          existingHeaderCodes.remove();
        }
      } catch (error) {
        console.warn('Error removing existing header codes:', error);
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
        if (existingFooterCodes && existingFooterCodes.parentNode) {
          existingFooterCodes.remove();
        }
      } catch (error) {
        console.warn('Error removing existing footer codes:', error);
      }

      const footerDiv = document.createElement('div');
      footerDiv.id = 'custom-footer-codes';
      footerDiv.innerHTML = customCodes.footerCodes;
      document.body.appendChild(footerDiv);

      executeScripts(footerDiv);
    }

    return () => {
      try {
        const headerCodes = document.getElementById('custom-header-codes');
        const footerCodes = document.getElementById('custom-footer-codes');
        if (headerCodes && headerCodes.parentNode) {
          headerCodes.remove();
        }
        if (footerCodes && footerCodes.parentNode) {
          footerCodes.remove();
        }
      } catch (error) {
        console.warn('Error removing custom codes:', error);
      }
    };
  }, [customCodes]);

  return null;
}