

function getAppPort(): string {

  if (process.env.PORT) {
    return process.env.PORT;
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXTAUTH_URL;
  if (appUrl) {
    try {
      const urlObj = new URL(appUrl);
      if (urlObj.port) {
        return urlObj.port;
      }
    } catch (e) {

    }
  }

  return '80';
}

export function ensureLocalhostPort(url: string): string {
  if (!url) return url;

  const targetPort = getAppPort();

  try {
    const urlObj = new URL(url);

    if (urlObj.hostname === 'localhost' && !urlObj.port) {
      if (targetPort !== '80' && targetPort !== '443') {
        urlObj.port = targetPort;
      }

      return urlObj.toString().replace(/\/$/, '');
    }

    if (urlObj.hostname === 'localhost' && (urlObj.port === '80' || urlObj.port === '443')) {
      urlObj.port = '';
      return urlObj.toString().replace(/\/$/, '');
    }

    if (urlObj.hostname === 'localhost' && (targetPort === '80' || targetPort === '443')) {
      if (urlObj.port === '80' || urlObj.port === '443') {
        urlObj.port = '';
        return urlObj.toString().replace(/\/$/, '');
      }
    }

    return urlObj.toString().replace(/\/$/, '');
  } catch (urlError) {

    let fixedUrl = url;

    if (targetPort === '80' || targetPort === '443') {

      fixedUrl = fixedUrl.replace(/http:\/\/localhost:80\//g, 'http://localhost/');
      fixedUrl = fixedUrl.replace(/http:\/\/localhost:80\?/g, 'http://localhost?');
      fixedUrl = fixedUrl.replace(/http:\/\/localhost:80#/g, 'http://localhost#');
      fixedUrl = fixedUrl.replace(/http:\/\/localhost:80$/g, 'http://localhost');

      fixedUrl = fixedUrl.replace(/https:\/\/localhost:443\//g, 'https://localhost/');
      fixedUrl = fixedUrl.replace(/https:\/\/localhost:443\?/g, 'https://localhost?');
      fixedUrl = fixedUrl.replace(/https:\/\/localhost:443#/g, 'https://localhost#');
      fixedUrl = fixedUrl.replace(/https:\/\/localhost:443$/g, 'https://localhost');
    } else {

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

export function getAppUrlWithPort(): string {
  let appUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXTAUTH_URL;

  if (!appUrl) {

    appUrl = 'http://localhost';
  }

  return ensureLocalhostPort(appUrl);
}

