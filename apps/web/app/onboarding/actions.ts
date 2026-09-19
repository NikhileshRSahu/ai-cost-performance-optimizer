'use server';
import { cookies } from 'next/headers';

export async function completeOnboarding(workspaceName:string){
  const jar=await cookies();
  const safe=(workspaceName || 'My workspace').trim().slice(0,80);
  jar.set('evalomics_onboarded','1',{httpOnly:true,sameSite:'lax',secure:true,path:'/',maxAge:60*60*24*365});
  jar.set('evalomics_workspace',safe,{httpOnly:true,sameSite:'lax',secure:true,path:'/',maxAge:60*60*24*365});
}
