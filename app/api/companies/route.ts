import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { Company } from '@/models/Company';

function escapeRegex(s: string) {
    return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// -------------------------------------------------------------
// GET: Search companies by name (case-insensitive, partial match).
// Returns every match so the caller can disambiguate similarly-named
// companies instead of guessing which one "the" match is.
// URL Example: /api/companies?name=acme
// -------------------------------------------------------------
export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const name = searchParams.get('name');

        if (!name) {
            return NextResponse.json(
                { error: 'name parameter is required' },
                { status: 400 },
            );
        }

        await connectToDatabase();

        const companies = await Company.find({
            name: { $regex: escapeRegex(name), $options: 'i' },
        }).lean();

        return NextResponse.json({
            companies: companies.map((c) => ({
                id: c._id.toString(),
                name: c.name,
            })),
        });
    } catch (error) {
        console.error('GET /api/companies error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
