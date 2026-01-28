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

  useEffect(() => {
    console.log('ReCAPTCHA script loading effect triggered:', { version, siteKey });

    if (version === 'v2') {

      const existingScript = document.querySelector('script[src*="recaptcha/api.js"]');
      if (existingScript) {
        console.log('ReCAPTCHA script already exists');

        const checkReady = () => {
          if (window.grecaptcha && window.grecaptcha.render) {
            console.log('ReCAPTCHA v2 ready (existing script)');
            setIsLoaded(true);
          } else {
            setTimeout(checkReady, 100);
          }
        };
        checkReady();
        return;
      }

      const script = document.createElement('script');
      script.src = 'https://www.google.com/recaptcha/api.js?render=explicit';
      script.async = true;
      script.defer = true;

      script.onload = () => {

        const checkReady = () => {
          if (window.grecaptcha && window.grecaptcha.render) {
            setIsLoaded(true);
          } else {
            setTimeout(checkReady, 100);
          }
        };
        checkReady();
      };

      script.onerror = (error) => {
        console.error('Failed to load ReCAPTCHA v2 script:', error);
      };

      document.head.appendChild(script);
    } else {

      if (window.grecaptcha && window.grecaptcha.ready) {
        setIsLoaded(true);
        return;
      }

      const existingScript = document.querySelector(`script[src*="recaptcha/api.js"]`);
      if (existingScript) {
        const checkLoaded = () => {
          if (window.grecaptcha && window.grecaptcha.ready) {
            setIsLoaded(true);
          } else {
            setTimeout(checkLoaded, 100);
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
        if (window.grecaptcha && window.grecaptcha.ready) {
          window.grecaptcha.ready(() => {
            setIsLoaded(true);
          });
        }
      };

      document.head.appendChild(script);
    }
  }, [siteKey, version]);

  useEffect(() => {
    if (widgetId !== null) {
      setWidgetId(null);
    }
  }, [siteKey, version]);

  useEffect(() => {
    if (version === 'v2' && isLoaded && recaptchaRef.current && widgetId === null && window.grecaptcha) {

      const container = recaptchaRef.current;
      if (container && document.contains(container)) {
        try {

          while (container.firstChild) {
            try {
              container.firstChild.remove();
            } catch (error) {
              break;
            }
          }

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
          if (onError) onError();
        }
      }
    }
  }, [isLoaded, siteKey, version, widgetId]);

  useEffect(() => {
    return () => {
      if (version === 'v2' && widgetId !== null && window.grecaptcha && typeof widgetId === 'number') {
        try {
          if (window.grecaptcha.reset) {
            window.grecaptcha.reset(widgetId);
          }
          const container = recaptchaRef.current;
          if (container && document.contains(container)) {

            while (container.firstChild) {
              try {
                container.firstChild.remove();
              } catch (error) {
                break;
              }
            }
          }
        } catch (error) {

        }
      }
    };
  }, [version, widgetId]);

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
      if (version === 'v2' && widgetId !== null && window.grecaptcha) {
        try {

          if (typeof widgetId === 'number' && window.grecaptcha.getResponse) {

            try {
              window.grecaptcha.getResponse(widgetId);

              window.grecaptcha.reset(widgetId);
            } catch (widgetError) {

              console.log('Widget already cleaned up:', widgetError);
            }
          }

          if (recaptchaRef.current) {
            try {

              if (recaptchaRef.current.parentNode && document.body.contains(recaptchaRef.current)) {
                recaptchaRef.current.innerHTML = '';
              }
            } catch (domError) {

            }
          }

          setWidgetId(null);
        } catch (error) {
          console.warn('Failed to cleanup reCAPTCHA on unmount:', error);
        }
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
          <div
            ref={recaptchaRef}
            className="g-recaptcha border border-dashed border-gray-300 p-2"
            style={{ minHeight: '78px' }}
          >
            {widgetId === null && (
              <>
                {!isLoaded && <span className="text-gray-500 text-sm">Loading ReCAPTCHA script...</span>}
                {isLoaded && !isTestKey && <span className="text-gray-500 text-sm">Rendering widget...</span>}
                {isLoaded && isTestKey && (
                  <div
                    className="flex items-center justify-center h-16 bg-white border border-gray-300 rounded cursor-pointer hover:bg-gray-50"
                    onClick={() => {
                      console.log('Test reCAPTCHA clicked - simulating verification');
                      if (onVerify) onVerify('test-token-' + Date.now());
                    }}
                  >
                    <div className="flex items-center space-x-2">
                      <div className="w-6 h-6 border-2 border-gray-400 rounded"></div>
                      <span className="text-sm text-gray-700">I'm not a robot (Test Mode)</span>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    );
  }

  return null;
};

export default ReCAPTCHA;
export type { ReCAPTCHAProps };