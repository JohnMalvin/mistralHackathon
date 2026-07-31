import { connectToDatabase } from '@/lib/mongodb';
import { Project } from '@/models/Project';
import { Page } from '@/models/Page';

export async function getReconstructedJiraContext(projectId?: string) {
  await connectToDatabase();

  // 1. Fetch Project (or default to the latest sync if no ID provided)
  const project = projectId
    ? await Project.findById(projectId).lean()
    : await Project.findOne().sort({ updatedAt: -1 }).lean();

  if (!project) return 'No Jira context available.';

  // 2. Fetch all Pages belonging to this Project
  const pages = await Page.find({ projectId: project._id }).lean();

  // 3. Reconstruct into a clean Markdown payload for Mistral
  const projectHeader = `# Project: ${project.name} (${project.jiraProjectKey || 'N/A'})\n\n`;

  const pagesContent = pages
    .map(
      (p:any) => `## Page: ${p.title}\n${JSON.stringify(p.content, null, 2)}\n`
    )
    .join('\n---\n\n');

  return `${projectHeader}${pagesContent}`;
}