import { NextRequest, NextResponse } from 'next/server';
import { readCache } from '@/lib/cache/fileCache';
import { JobStatus } from '@/types/api';

export async function GET(
  _req: NextRequest,
  { params }: { params: { jobId: string } }
) {
  const { jobId } = params;
  const status = readCache<JobStatus>(`jobs/${jobId}`);

  if (!status) {
    return NextResponse.json({ error: 'Job not found' }, { status: 404 });
  }

  return NextResponse.json(status);
}
