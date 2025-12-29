import { NextResponse } from 'next/server';

const STATIC_NAMESERVERS = {
  ns1: 'ns1.smmdoc.com',
  ns2: 'ns2.smmdoc.com',
};

export async function GET() {
  return NextResponse.json({
    success: true,
    nameservers: STATIC_NAMESERVERS
  });
}

