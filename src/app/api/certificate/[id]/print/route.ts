import { NextRequest, NextResponse } from 'next/server';
import { POST as printHandler } from '../../certificates/[id]/print/route';

export async function POST(
    request: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    return printHandler(request, context);
}
