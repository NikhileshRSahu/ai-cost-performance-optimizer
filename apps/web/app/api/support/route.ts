import { randomUUID } from 'node:crypto';
import { NextResponse } from 'next/server';
import { withRuntimeWorkspace } from '@/lib/runtime-workspace';
import { enforceRateLimit } from '@/lib/rate-limit';

export const runtime='nodejs';
export const dynamic='force-dynamic';

export async function POST(request:Request){
  try{
    const body=await request.json() as {category?:string;subject?:string;message?:string};
    const category=(body.category||'PRODUCT').trim().slice(0,40);
    const subject=(body.subject||'').trim().slice(0,160);
    const message=(body.message||'').trim().slice(0,5000);
    if(subject.length<3||message.length<10) return NextResponse.json({ok:false,error:'SUPPORT_FIELDS_REQUIRED'},{status:400});
    const ticket=await withRuntimeWorkspace(async({workspace,database})=>{
      await enforceRateLimit({pool:database.pool,organizationId:workspace.organizationId,scope:'support-request',limit:5,windowSeconds:600});
      const id='sup_'+randomUUID().replaceAll('-','');
      await database.pool.query(
        'INSERT INTO public.support_requests(id,organization_id,user_id,category,subject,message,status) VALUES($1,$2,$3,$4,$5,$6,$7)',
        [id,workspace.organizationId,workspace.userId,category,subject,message,'OPEN']
      );
      return {id,status:'OPEN'};
    });
    return NextResponse.json({ok:true,ticket});
  }catch(error){
    const message=error instanceof Error?error.message:'SUPPORT_REQUEST_FAILED';
    return NextResponse.json({ok:false,error:message},{status:message==='AUTH_REQUIRED'?401:message==='RATE_LIMITED'?429:500});
  }
}
