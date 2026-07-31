import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { Company } from '@/models/Company';

// -------------------------------------------------------------
// GET: Does the signed-in user own a company? Drives which sidebar
// action shows — company owners get "Import from Jira", everyone
// else gets "Browse companies".
// -------------------------------------------------------------
export async function GET(request: Request) {
    try {
        const userId = request.headers.get('x-user-id');
        if (!userId) {
            return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
        }

        await connectToDatabase();

        const company = await Company.findOne({ userId }).lean();

        return NextResponse.json({
            hasCompany: !!company,
            companyId: company ? company._id.toString() : null,
        });
    } catch (error) {
        console.error('GET /api/companies/mine error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
