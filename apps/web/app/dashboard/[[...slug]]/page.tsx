import { redirect } from 'next/navigation';
import DashboardApp from '@/components/DashboardApp';
import { resolveRuntimeWorkspace } from '@/lib/runtime-workspace';
import { loadWorkspaceSummary } from '@/lib/workspace-summary';

export const dynamic='force-dynamic';

export default async function DashboardPage(){
  const workspace=await resolveRuntimeWorkspace();
  if(!workspace) redirect('/auth/sign-in');
  if(!workspace.onboardingCompleted) redirect('/onboarding');
  const summary=await loadWorkspaceSummary();
  return <DashboardApp
    userName={workspace.name}
    userEmail={workspace.email}
    workspaceName={workspace.organizationName}
    realSummary={summary}
  />;
}
