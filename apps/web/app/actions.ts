'use server';
import { signOut } from '@/auth';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { withRuntimeWorkspace } from '@/lib/runtime-workspace';

export async function signOutAction() {
  await signOut({ redirectTo: '/' });
}

export async function switchWorkspaceAction(formData: FormData) {
  const organizationId=String(formData.get('organizationId') ?? '').trim();
  if(!organizationId) throw new Error('WORKSPACE_REQUIRED');
  await withRuntimeWorkspace(async({workspace})=>{
    const allowed=workspace.session.memberships.some(m=>m.organizationId===organizationId);
    if(!allowed) throw new Error('WORKSPACE_FORBIDDEN');
  });
  const store=await cookies();
  store.set('evalomics_workspace',organizationId,{
    httpOnly:true,
    sameSite:'lax',
    secure:process.env.NODE_ENV==='production',
    path:'/',
    maxAge:60*60*24*180
  });
  redirect('/dashboard');
}
