'use server';
import { eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { organizations } from '../../../../src/persistence/schema';
import { withRuntimeWorkspace } from '@/lib/runtime-workspace';

function cleanName(workspaceName:string){
  const safe=(workspaceName||'My AI Workspace').trim().replace(/\s+/g,' ').slice(0,80);
  if(safe.length<2) throw new Error('WORKSPACE_NAME_REQUIRED');
  return safe;
}

export async function saveWorkspaceName(workspaceName:string){
  const safe=cleanName(workspaceName);
  await withRuntimeWorkspace(async({workspace,database})=>{
    await database.db.update(organizations).set({name:safe}).where(eq(organizations.id,workspace.organizationId));
  });
  revalidatePath('/onboarding');
}

export async function completeOnboarding(workspaceName:string){
  const safe=cleanName(workspaceName);
  await withRuntimeWorkspace(async({workspace,database})=>{
    await database.db.update(organizations).set({
      name:safe,onboardingCompletedAt:new Date().toISOString()
    }).where(eq(organizations.id,workspace.organizationId));
  });
  revalidatePath('/dashboard');
  revalidatePath('/onboarding');
}
