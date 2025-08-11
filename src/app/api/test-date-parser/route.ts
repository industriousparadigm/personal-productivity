import { NextRequest, NextResponse } from 'next/server';
import { parseCommitmentDeadline } from '@/lib/utils/ai-date-parser';

export async function POST(request: NextRequest) {
  try {
    const { input } = await request.json();
    
    if (!input) {
      return NextResponse.json({ error: 'Input required' }, { status: 400 });
    }
    
    const result = await parseCommitmentDeadline(input);
    
    return NextResponse.json({
      input,
      parsed: result.toISOString(),
      human: result.toLocaleString(),
      currentTime: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Date parsing error:', error);
    return NextResponse.json({ 
      error: 'Failed to parse date',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}