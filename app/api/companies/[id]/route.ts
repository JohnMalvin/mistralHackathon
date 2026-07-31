import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { connectToDatabase } from '@/lib/mongodb';
import { Company } from '@/models/Company';
import { buildCompanyResponse } from '@/lib/companyTree';

// -------------------------------------------------------------
// GET: Fetch a company plus its workspaces, each with its projects
// (id/name only — a project's full page tree is fetched separately
// via the existing GET /api/projects/[id]).
// URL Example: /api/companies/507f1f77bcf86cd799439011
// -------------------------------------------------------------
export async function GET(
    request: Request,
    { params }: { params: { id: string } },
) {
    try {
        const { id } = params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return NextResponse.json({ error: 'Invalid company id' }, { status: 400 });
        }

        await connectToDatabase();

        const userId = request.headers.get('x-user-id');
        if (!userId) {
            return NextResponse.json(
                { error: 'Authentication required' },
                { status: 401 },
            );
        }

        const company = await Company.findOne({ _id: id, userId }).lean();
        if (!company) {
            return NextResponse.json({ error: 'Company not found' }, { status: 404 });
        }

        return NextResponse.json(await buildCompanyResponse(company));
    } catch (error) {
        console.error('GET /api/companies/[id] error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
