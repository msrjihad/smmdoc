import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const apiKey = 'd51d09535663bf9b5c171e360a0892ee';

    const testUrls = [
      'https://smmcoder.com/api/v2',
      'https://api.smmcoder.com/v2',
      'https://smmcoder.com/api',
      'https://api.smmcoder.com'
    ];

    console.log('Testing SMMCoder API with multiple URLs...');

    for (const apiUrl of testUrls) {
      console.log(`\nTesting URL: ${apiUrl}/services?key=${apiKey}`);

      try {
        const response = await fetch(`${apiUrl}/services?key=${apiKey}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          }
        });

        console.log(`Response status for ${apiUrl}:`, response.status);

        if (response.ok) {
          const data = await response.json();
          console.log(`SUCCESS with ${apiUrl}!`);
          console.log('Data type:', typeof data);
          console.log('Is array:', Array.isArray(data));

          if (Array.isArray(data) && data.length > 0) {
            const categoryMap = new Map();
            data.forEach((service: any) => {
              const categoryName = service.category || 'Uncategorized';
              if (categoryMap.has(categoryName)) {
                categoryMap.set(categoryName, categoryMap.get(categoryName) + 1);
              } else {
                categoryMap.set(categoryName, 1);
              }
            });

            const categories = Array.from(categoryMap.entries()).map(([name, count]) => ({
              name,
              count
            }));

            return NextResponse.json({
              success: true,
              workingUrl: apiUrl,
              data: {
                totalServices: data.length,
                categories: categories,
                sampleService: data[0]
              }
            });
          }
        } else {
          console.log(`Failed with ${apiUrl}: ${response.status} ${response.statusText}`);
        }
      } catch (urlError) {
        console.log(`Error with ${apiUrl}:`, urlError instanceof Error ? urlError.message : urlError);
      }
    }

    return NextResponse.json({
      success: false,
      error: 'All API URLs failed',
      testedUrls: testUrls,
      message: 'None of the tested URLs returned valid data'
    });

  } catch (error) {
    console.error('SMMCoder API test error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      details: error
    });
  }
}

export async function POST() {
  return new Response(`
    <html>
      <head><title>SMMCoder API Test</title></head>
      <body>
        <h1>SMMCoder API Test</h1>
        <button onclick="testAPI()">Test API</button>
        <div id="result"></div>
        <script>
          async function testAPI() {
            const result = document.getElementById('result');
            result.innerHTML = 'Testing...';

            try {
              const response = await fetch('/api/test-smmcoder');
              const data = await response.json();
              result.innerHTML = '<pre>' + JSON.stringify(data, null, 2) + '</pre>';
            } catch (error) {
              result.innerHTML = 'Error: ' + error.message;
            }
          }
        </script>
      </body>
    </html>
  `, {
    headers: { 'Content-Type': 'text/html' }
  });
}
