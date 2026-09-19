import { auth } from '@/lib/auth/server';
import DashboardApp from '@/components/DashboardApp';
export const dynamic='force-dynamic';
export default async function DashboardPage(){
  const {data:session}=await auth.getSession();
  return <DashboardApp userName={session?.user?.name || 'Evalomics user'} userEmail={session?.user?.email || 'user@company.com'}/>;
}
