import { NextRequest, NextResponse } from 'next/server';

export async function POST(
    request: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    const { id } = await context.params;

    try {
        const backendUrl = process.env.BACKEND_API_URL || 'http://localhost:10000';
        const res = await fetch(`${backendUrl}/api/certificates/${id}/print`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(await request.json().catch(() => ({}))),
        });

        const data = await res.json().catch(() => ({}));

        if (!res.ok) {
            return NextResponse.json(
                { success: false, message: data.message || 'Failed to print sticker' },
                { status: res.status }
            );
        }

        return NextResponse.json(data);
    } catch (err: any) {
        return NextResponse.json(
            { success: false, message: err?.message || 'Print service connection error' },
            { status: 500 }
        );
    }
}
