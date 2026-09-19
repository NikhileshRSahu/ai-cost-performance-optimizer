import { redirect } from 'next/navigation';
import OnboardingFlow from '@/components/OnboardingFlow';
import { resolveRuntimeWorkspace } from '@/lib/runtime-workspace';

export const dynamic='force-dynamic';

export default async function OnboardingPage({
  searchParams,
}:{searchParams:Promise<Record<string,string|string[]|undefined>>}){
  const workspace=await resolveRuntimeWorkspace();
  if(!workspace) redirect('/auth/sign-in');
  const params=await searchParams;
  const hasStep=typeof params.step==='string';
  if(workspace.onboardingCompleted && !hasStep) redirect('/dashboard');
  return <OnboardingFlow
    name={workspace.name}
    email={workspace.email}
    initialWorkspace={workspace.organizationName}
  />;
}
