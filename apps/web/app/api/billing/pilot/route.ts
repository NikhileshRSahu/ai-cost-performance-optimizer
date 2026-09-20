import { randomUUID } from 'node:crypto';
import { NextResponse } from 'next/server';
import { withRuntimeWorkspace } from '@/lib/runtime-workspace';
import { enforceRateLimit } from '@/lib/rate-limit';

export const runtime='nodejs';
export const dynamic='force-dynamic';

export async function POST(request:Request){
  try{
    const body=await request.json() as {companyName?:string};
    const companyName=(body.companyName||'').trim().slice(0,160);
    if(companyName.length<2) return NextResponse.json({ok:false,error:'COMPANY_NAME_REQUIRED'},{status:400});
    const result=await withRuntimeWorkspace(async({workspace,database})=>{
      if(workspace.role!=='OWNER') throw new Error('OWNER_REQUIRED');
      await enforceRateLimit({pool:database.pool,organizationId:workspace.organizationId,scope:'pilot-request',limit:3,windowSeconds:3600});
      const existing=await database.pool.query(
        "SELECT id,status,created_at::text FROM public.pilot_invoice_requests WHERE organization_id=$1 AND plan='DESIGN_PARTNER_14D' AND status IN ('REQUESTED','INVOICED','PAID') ORDER BY created_at DESC LIMIT 1",
        [workspace.organizationId]
      );
      if(existing.rows[0]) return {created:false,...existing.rows[0]};
      const id='invreq_'+randomUUID().replaceAll('-','');
      await database.pool.query(
        'INSERT INTO public.pilot_invoice_requests(id,organization_id,plan,amount_cents,currency,contact_email,company_name,requested_by_user_id,status) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9)',
        [id,workspace.organizationId,'DESIGN_PARTNER_14D',19900,'USD',workspace.email,companyName,workspace.userId,'REQUESTED']
      );
      return {created:true,id,status:'REQUESTED'};
    });
    return NextResponse.json({ok:true,result});
  }catch(error){
    const message=error instanceof Error?error.message:'PILOT_REQUEST_FAILED';
    const status=message==='AUTH_REQUIRED'?401:message==='OWNER_REQUIRED'?403:message==='RATE_LIMITED'?429:500;
    return NextResponse.json({ok:false,error:message},{status});
  }
}
