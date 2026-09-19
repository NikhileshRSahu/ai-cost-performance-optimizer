import { auth } from '@/lib/auth/server';
import OnboardingFlow from '@/components/OnboardingFlow';
export const dynamic='force-dynamic';
export default async function OnboardingPage(){
  const {data:session}=await auth.getSession();
  return <OnboardingFlow name={session?.user?.name || ''} email={session?.user?.email || ''}/>;
}
