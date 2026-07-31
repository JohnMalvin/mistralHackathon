import { Workspace } from '@/models/Workspace';
import { Project } from '@/models/Project';

export async function buildCompanyResponse(companyDoc: {
    _id: unknown;
    name: string;
}) {
    const workspaces = await Workspace.find({ companyId: companyDoc._id }).lean();
    const projects = await Project.find({
        workspaceId: { $in: workspaces.map((w) => w._id) },
    }).lean();

    return {
        id: (companyDoc._id as { toString(): string }).toString(),
        name: companyDoc.name,
        workspaces: workspaces.map((w) => ({
            id: w._id.toString(),
            name: w.name,
            projects: projects
                .filter((p) => p.workspaceId.toString() === w._id.toString())
                .map((p) => ({ id: p._id.toString(), name: p.name })),
        })),
    };
}
