'use client';

import { useEffect, useRef, useState } from 'react';

interface ReCAPTCHAProps {
  siteKey: string;
  version: 'v2' | 'v3';
  action?: string;
  threshold?: number;
  onVerify: (token: string) => void;
  onError?: () => void;
  onExpired?: () => void;
  className?: string;
  size?: 'compact' | 'normal';
  theme?: 'light' | 'dark';
}

declare global {
  interface Window {
    grecaptcha: any;
    onRecaptchaLoad: () => void;
  }
}

const ReCAPTCHA: React.FC<ReCAPTCHAProps> = ({
  siteKey,
  version,
  action = 'submit',
  threshold = 0.5,
  onVerify,
  onError,
  onExpired,
  className = '',
  size = 'normal',
  theme = 'light'
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [widgetId, setWidgetId] = useState<number | null>(null);
  const recaptchaRef = useRef<HTMLDivElement>(null);
  const savedTitleRef = useRef<string | null>(null);

  useEffect(() => {
    const saveAndRestore = () => {
      if (typeof document !== 'undefined' && document.title) {
        savedTitleRef.current = document.title;
      }
    };
    saveAndRestore();
    const t = setTimeout(saveAndRestore, 300);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    const restoreTitle = () => {
      if (savedTitleRef.current && typeof document !== 'undefined') {
        document.title = savedTitleRef.current;
      }
    };
    restoreTitle();
    const t1 = setTimeout(restoreTitle, 50);
    const t2 = setTimeout(restoreTitle, 200);
    const t3 = setTimeout(restoreTitle, 500);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, [isLoaded, widgetId]);

  useEffect(() => {
    if (version === 'v2') {
      const existingScript = document.querySelector('script[src*="recaptcha/api.js"]');
      if (existingScript) {
        if (window.grecaptcha?.render) {
          setIsLoaded(true);
        } else {
          const checkReady = () => {
            if (window.grecaptcha?.render) {
              setIsLoaded(true);
            } else {
              setTimeout(checkReady, 50);
            }
          };
          checkReady();
        }
        return;
      }

      const script = document.createElement('script');
      script.src = 'https://www.google.com/recaptcha/api.js?render=explicit';
      script.async = true;
      script.defer = true;
      script.onload = () => {
        const checkReady = () => {
          if (window.grecaptcha?.render) {
            setIsLoaded(true);
          } else {
            setTimeout(checkReady, 50);
          }
        };
        checkReady();
      };
      script.onerror = () => {
        console.error('Failed to load ReCAPTCHA v2 script');
      };
      document.head.appendChild(script);
    } else {
      if (window.grecaptcha?.ready) {
        setIsLoaded(true);
        return;
      }
      const existingScript = document.querySelector('script[src*="recaptcha/api.js"]');
      if (existingScript) {
        const checkLoaded = () => {
          if (window.grecaptcha?.ready) {
            setIsLoaded(true);
          } else {
            setTimeout(checkLoaded, 50);
          }
        };
        checkLoaded();
        return;
      }

      const script = document.createElement('script');
      script.src = `https://www.google.com/recaptcha/api.js?render=${siteKey}`;
      script.async = true;
      script.defer = true;
      script.onload = () => {
        window.grecaptcha?.ready?.(() => setIsLoaded(true));
      };
      document.head.appendChild(script);
    }
  }, [siteKey, version]);

  useEffect(() => {
    if (siteKey && version) setWidgetId(null);
  }, [siteKey, version]);

  useEffect(() => {
    if (version !== 'v2' || !isLoaded || widgetId !== null || !window.grecaptcha?.render) return;
    const container = recaptchaRef.current;
    if (!container || !container.parentNode || !document.body.contains(container)) return;

    try {
      const newWidgetId = window.grecaptcha.render(container, {
        sitekey: siteKey,
        callback: onVerify,
        'error-callback': onError,
        'expired-callback': onExpired,
        size: size || 'normal',
        theme: theme || 'light',
      });
      setWidgetId(newWidgetId);
    } catch (error) {
      console.error('Failed to render reCAPTCHA:', error);
      onError?.();
    }
  }, [isLoaded, siteKey, version, widgetId]);

  const executeV3 = async () => {
    if (!isLoaded || !window.grecaptcha || version !== 'v3') return;

    try {
      const token = await window.grecaptcha.execute(siteKey, { action });
      onVerify(token);
    } catch (error) {
      console.error('reCAPTCHA v3 execution failed:', error);
      if (onError) onError();
    }
  };

  const reset = () => {
    if (version === 'v2' && widgetId !== null && window.grecaptcha) {
      try {

        if (typeof widgetId === 'number' && window.grecaptcha.getResponse) {

          try {
            window.grecaptcha.getResponse(widgetId);

            window.grecaptcha.reset(widgetId);
          } catch (widgetError) {

          }
        }
      } catch (error) {
        console.warn('Failed to reset reCAPTCHA widget:', error);
      }
    }
  };

  useEffect(() => {
    return () => {
      if (version === 'v2' && widgetId !== null) {
        setWidgetId(null);
      }
    };
  }, [version, widgetId]);

  useEffect(() => {
    if (version === 'v3') {

      executeV3();
    }
  }, [isLoaded, version]);

  const isTestKey = siteKey === '6LeIxAcTAAAAAJcZVRqyHh71UMIEGNQ_MXjiZKhI';

  if (version === 'v2') {
    return (
      <div className={`flex justify-center mb-4 ${className || ''}`}>
        <div className="w-full">
          {isTestKey && (
            <div style={{
              padding: '10px',
              backgroundColor: '#fff3cd',
              border: '1px solid #ffeaa7',
              borderRadius: '4px',
              marginBottom: '10px',
              fontSize: '12px',
              color: '#856404'
            }}>
              ⚠️ Test reCAPTCHA - This will always pass verification
            </div>
          )}
          {widgetId === null && (
            <div className="min-h-[78px] flex items-center justify-center text-gray-500 text-sm">
              {!isLoaded && 'Loading ReCAPTCHA...'}
              {isLoaded && !isTestKey && 'Rendering...'}
              {isLoaded && isTestKey && (
                <button
                  type="button"
                  className="flex items-center gap-2 px-4 py-3 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-50 dark:hover:bg-gray-600"
                  onClick={() => onVerify('test-token-' + Date.now())}
                >
                  <span className="w-6 h-6 border-2 border-gray-400 rounded" />
                  <span>I&apos;m not a robot (Test Mode)</span>
                </button>
              )}
            </div>
          )}
          <div
            ref={recaptchaRef}
            className="g-recaptcha"
            style={{ minHeight: widgetId !== null ? 78 : 0 }}
          />
        </div>
      </div>
    );
  }

  return null;
};

export default ReCAPTCHA;
export type { ReCAPTCHAProps };