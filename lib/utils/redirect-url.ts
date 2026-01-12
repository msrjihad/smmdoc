/**
 * Gets the port from environment variable or defaults to 80
 */
function getAppPort(): string {
  // Check for PORT environment variable first
  if (process.env.PORT) {
    return process.env.PORT;
  }
  
  // Extract port from NEXT_PUBLIC_APP_URL or NEXTAUTH_URL
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXTAUTH_URL;
  if (appUrl) {
    try {
      const urlObj = new URL(appUrl);
      if (urlObj.port) {
        return urlObj.port;
      }
    } catch (e) {
      // Ignore URL parse errors
    }
  }
  
  // Default to port 80 (standard HTTP port)
  return '80';
}

/**
 * Ensures localhost URLs always include the correct port
 * This is critical because payment gateways often strip ports from redirect URLs
 */
export function ensureLocalhostPort(url: string): string {
  if (!url) return url;
  
  const targetPort = getAppPort();
  
  try {
    const urlObj = new URL(url);
    
    // If it's localhost without a port, keep it without port (defaults to 80 for http, 443 for https)
    // Only add port if target port is not 80/443
    if (urlObj.hostname === 'localhost' && !urlObj.port) {
      if (targetPort !== '80' && targetPort !== '443') {
        urlObj.port = targetPort;
      }
      // For port 80/443, keep URL without port (cleaner, and browsers handle it correctly)
      return urlObj.toString().replace(/\/$/, ''); // Remove trailing slash
    }
    
    // If it's localhost with port 80 or 443, remove the port (cleaner URL)
    if (urlObj.hostname === 'localhost' && (urlObj.port === '80' || urlObj.port === '443')) {
      urlObj.port = ''; // Remove port for default ports
      return urlObj.toString().replace(/\/$/, '');
    }
    
    // If target port is 80/443 but URL has different port, remove port
    if (urlObj.hostname === 'localhost' && (targetPort === '80' || targetPort === '443')) {
      if (urlObj.port === '80' || urlObj.port === '443') {
        urlObj.port = ''; // Remove port
        return urlObj.toString().replace(/\/$/, '');
      }
    }
    
    return urlObj.toString().replace(/\/$/, '');
  } catch (urlError) {
    // Fallback: string replacement
    let fixedUrl = url;
    
    // For port 80/443, remove port from URL (cleaner)
    if (targetPort === '80' || targetPort === '443') {
      // Remove :80 or :443 from URLs
      fixedUrl = fixedUrl.replace(/http:\/\/localhost:80\//g, 'http://localhost/');
      fixedUrl = fixedUrl.replace(/http:\/\/localhost:80\?/g, 'http://localhost?');
      fixedUrl = fixedUrl.replace(/http:\/\/localhost:80#/g, 'http://localhost#');
      fixedUrl = fixedUrl.replace(/http:\/\/localhost:80$/g, 'http://localhost');
      
      fixedUrl = fixedUrl.replace(/https:\/\/localhost:443\//g, 'https://localhost/');
      fixedUrl = fixedUrl.replace(/https:\/\/localhost:443\?/g, 'https://localhost?');
      fixedUrl = fixedUrl.replace(/https:\/\/localhost:443#/g, 'https://localhost#');
      fixedUrl = fixedUrl.replace(/https:\/\/localhost:443$/g, 'https://localhost');
    } else {
      // For other ports, add the port
      const portStr = `:${targetPort}`;
      fixedUrl = fixedUrl.replace(/http:\/\/localhost\//g, `http://localhost${portStr}/`);
      fixedUrl = fixedUrl.replace(/http:\/\/localhost\?/g, `http://localhost${portStr}?`);
      fixedUrl = fixedUrl.replace(/http:\/\/localhost#/g, `http://localhost${portStr}#`);
      fixedUrl = fixedUrl.replace(/http:\/\/localhost$/g, `http://localhost${portStr}`);
      
      fixedUrl = fixedUrl.replace(/https:\/\/localhost\//g, `https://localhost${portStr}/`);
      fixedUrl = fixedUrl.replace(/https:\/\/localhost\?/g, `https://localhost${portStr}?`);
      fixedUrl = fixedUrl.replace(/https:\/\/localhost#/g, `https://localhost${portStr}#`);
      fixedUrl = fixedUrl.replace(/https:\/\/localhost$/g, `https://localhost${portStr}`);
    }
    
    return fixedUrl;
  }
}

/**
 * Gets the app URL from environment variables and ensures localhost has the correct port
 */
export function getAppUrlWithPort(): string {
  let appUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXTAUTH_URL;
  
  if (!appUrl) {
    // Default to localhost (port 80 is implicit for http)
    appUrl = 'http://localhost';
  }
  
  return ensureLocalhostPort(appUrl);
}

