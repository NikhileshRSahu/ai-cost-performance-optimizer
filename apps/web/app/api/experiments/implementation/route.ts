import { NextResponse } from 'next/server';
import { confirmImplementation } from '@/backend/workbench/implementation-service';
import { withRuntimeWorkspace } from '@/lib/runtime-workspace';
import { enforceRateLimit } from '@/lib/rate-limit';

export const runtime='nodejs';
export const dynamic='force-dynamic';

export async function POST(request:Request){
  try{
    const body=await request.json() as {
      recommendationId?:string;implementedAt?:string;rolloutStart?:string;stabilizationEnd?:string;
      deploymentNote?:string;rollbackInstructions?:string[];
    };
    if(!body.recommendationId||!body.implementedAt||!body.rolloutStart||!body.stabilizationEnd||!body.deploymentNote){
      return NextResponse.json({ok:false,error:'IMPLEMENTATION_FIELDS_REQUIRED'},{status:400});
    }
    const result=await withRuntimeWorkspace(async({workspace,database})=>{
      await enforceRateLimit({pool:database.pool,organizationId:workspace.organizationId,scope:'implementation',limit:10,windowSeconds:600});
      return confirmImplementation({
        db:database.db,session:workspace.session,organizationId:workspace.organizationId,
        recommendationId:body.recommendationId!,
        implementedAt:body.implementedAt!,rolloutStart:body.rolloutStart!,stabilizationEnd:body.stabilizationEnd!,
        deploymentNote:body.deploymentNote!,
        rollbackInstructions:(body.rollbackInstructions??[]).map(String).map(x=>x.trim()).filter(Boolean)
      });
    });
    return NextResponse.json({ok:true,result});
  }catch(error){
    const message=error instanceof Error?error.message:'IMPLEMENTATION_FAILED';
    const status=message==='AUTH_REQUIRED'?401:message==='RATE_LIMITED'?429:400;
    return NextResponse.json({ok:false,error:message},{status});
  }
}
