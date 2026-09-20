import { NextResponse } from 'next/server';
import { withRuntimeWorkspace } from '@/lib/runtime-workspace';

export const runtime='nodejs';
export const dynamic='force-dynamic';

export async function GET(){
  try{
    const events=await withRuntimeWorkspace(async({workspace,database})=>{
      const result=await database.pool.query(
        `SELECT event_id,recommendation_id,type::text,state::text,occurred_at::text,evidence_ref,reason,invalidates_event_id
         FROM public.ledger_events
         WHERE organization_id=$1
         ORDER BY occurred_at DESC
         LIMIT 100`,
        [workspace.organizationId]
      );
      return result.rows;
    });
    return NextResponse.json({ok:true,events});
  }catch(error){
    const message=error instanceof Error?error.message:'AUDIT_LOG_FAILED';
    return NextResponse.json({ok:false,error:message},{status:message==='AUTH_REQUIRED'?401:500});
  }
}
