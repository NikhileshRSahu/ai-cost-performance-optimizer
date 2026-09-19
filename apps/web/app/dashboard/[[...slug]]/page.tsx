import { auth } from '@/auth';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import DashboardApp from '@/components/DashboardApp';

export const dynamic='force-dynamic';

export default async function DashboardPage(){
  const session=await auth();
  if(!session?.user?.email) redirect('/auth/sign-in');
  const jar=await cookies();
  if(jar.get('evalomics_onboarded')?.value!=='1') redirect('/onboarding');
  const workspaceName=jar.get('evalomics_workspace')?.value || 'My workspace';
  return <DashboardApp userName={session.user.name || 'Evalomics user'} userEmail={session.user.email} workspaceName={workspaceName}/>;
}
