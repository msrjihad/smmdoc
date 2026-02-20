import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest, { params }: { params: Promise<{ code: string }> }) {
  const { code } = await params
  const baseUrl = new URL('/', request.url)
  return NextResponse.redirect(new URL(`/ref/${code || ''}`, baseUrl))
}

