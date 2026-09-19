import { NextResponse } from 'next/server';
import { loadWorkspaceSummary } from '@/lib/workspace-summary';

export const runtime='nodejs';
export const dynamic='force-dynamic';

export async function GET(){
  try{
    const summary=await loadWorkspaceSummary();
    return NextResponse.json({ok:true,summary});
  }catch(error){
    const message=error instanceof Error?error.message:'WORKSPACE_SUMMARY_FAILED';
    return NextResponse.json({ok:false,error:message},{status:message==='AUTH_REQUIRED'?401:500});
  }
}
