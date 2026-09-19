import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import DashboardApp from '@/components/DashboardApp';

export const dynamic='force-dynamic';

export default async function DashboardPage(){
  const session=await auth();
  if(!session?.user?.email) redirect('/auth/sign-in');
  return <DashboardApp userName={session.user.name || 'Evalomics user'} userEmail={session.user.email}/>;
}
