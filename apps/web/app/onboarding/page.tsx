import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import OnboardingFlow from '@/components/OnboardingFlow';

export const dynamic='force-dynamic';

export default async function OnboardingPage(){
  const session=await auth();
  if(!session?.user?.email) redirect('/auth/sign-in');
  return <OnboardingFlow name={session.user.name || ''} email={session.user.email}/>;
}
