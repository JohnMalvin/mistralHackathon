import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { Company } from '@/models/Company';

// -------------------------------------------------------------
// GET: Look up a company by exact name (read-only — does not create).
// URL Example: /api/companies?name=Acme
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

        const company = await Company.findOne({ name }).lean();

        if (!company) {
            return NextResponse.json({ error: 'Company not found' }, { status: 404 });
        }

        return NextResponse.json({
            id: company._id.toString(),
            name: company.name,
        });
    } catch (error) {
        console.error('GET /api/companies error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
