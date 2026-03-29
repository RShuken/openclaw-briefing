import { NextResponse } from 'next/server';

export function successResponse(data: Record<string, unknown>, status = 200) {
  return NextResponse.json({ success: true, ...data }, { status });
}

export function errorResponse(message: string, status = 400) {
  return NextResponse.json({ success: false, error: message }, { status });
}

export function corsOptionsResponse() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}

export function logRequest(
  method: string,
  path: string,
  status: number,
  durationMs: number,
  meta?: Record<string, unknown>
) {
  console.log(`[API] ${method} ${path} ${status} ${durationMs}ms`, meta ?? '');
}
