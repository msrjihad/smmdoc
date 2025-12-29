import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const databaseUrl = process.env.DATABASE_URL;
    
    if (!databaseUrl) {
      return NextResponse.json({
        success: false,
        error: 'Database URL not configured'
      }, { status: 500 });
    }

    const urlMatch = databaseUrl.match(/^mysql:\/\/([^:]+):([^@]+)@([^:]+):(\d+)\/(.+)$/);
    
    if (!urlMatch) {
      return NextResponse.json({
        success: false,
        error: 'Invalid database URL format'
      }, { status: 500 });
    }

    const [, username, , host, port, database] = urlMatch;

    const currentTime = new Date().toLocaleString('en-US', {
      timeZone: 'UTC',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    });

    const uptimeSeconds = process.uptime();
    const uptimeHours = Math.floor(uptimeSeconds / 3600);
    const uptimeMinutes = Math.floor((uptimeSeconds % 3600) / 60);
    const uptime = `${uptimeHours}h ${uptimeMinutes}m`;

    return NextResponse.json({
      success: true,
      databaseInfo: {
        host: host,
        port: parseInt(port),
        database: database,
        username: username,
        currentTime: currentTime,
        serverUptime: uptime,
        connectionString: `${host}:${port}/${database}`,
        lastAttempt: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Error getting database info:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Failed to retrieve database information',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
