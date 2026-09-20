import { NextResponse } from 'next/server';
import { verifyCustomerChange } from '@/backend/workbench/verification-service';
import { withRuntimeWorkspace } from '@/lib/runtime-workspace';

export const runtime='nodejs';
export const dynamic='force-dynamic';

export async function POST(request:Request){
  try{
    const form=await request.formData();
    const file=form.get('file');
    if(!(file instanceof File)) return NextResponse.json({ok:false,error:'POST_CHANGE_CSV_REQUIRED'},{status:400});
    if(file.size>10*1024*1024) return NextResponse.json({ok:false,error:'FILE_TOO_LARGE'},{status:413});
    const recommendationId=String(form.get('recommendationId')||'').trim();
    const measuredQuality=String(form.get('measuredQuality')||'').trim();
    const postP95LatencyMs=String(form.get('postP95LatencyMs')||'').trim()||null;
    const postFailureRate=String(form.get('postFailureRate')||'').trim()||null;
    const qualitySourceRef=String(form.get('qualitySourceRef')||'').trim();
    const implementationCost=String(form.get('implementationCost')||'0').trim();
    const incrementalOperatingCost=String(form.get('incrementalOperatingCost')||'0').trim();
    if(!recommendationId||!measuredQuality||!qualitySourceRef){
      return NextResponse.json({ok:false,error:'VERIFICATION_FIELDS_REQUIRED'},{status:400});
    }
    const bool=(name:string)=>String(form.get(name)||'')==='true';
    const result=await withRuntimeWorkspace(async({workspace,database})=>
      verifyCustomerChange({
        db:database.db,session:workspace.session,organizationId:workspace.organizationId,
        recommendationId,postFileName:file.name,postBytes:new Uint8Array(await file.arrayBuffer()),
        receivedAt:new Date().toISOString(),measuredQuality,postP95LatencyMs,postFailureRate,
        qualitySourceRef,implementationCost,incrementalOperatingCost,
        attestations:{
          unitDefinitionUnchanged:bool('unitDefinitionUnchanged'),
          workloadMixComparable:bool('workloadMixComparable'),
          concurrentDeploymentsResolved:bool('concurrentDeploymentsResolved')
        }
      })
    );
    return NextResponse.json({ok:true,result});
  }catch(error){
    const message=error instanceof Error?error.message:'VERIFICATION_FAILED';
    const status=message==='AUTH_REQUIRED'?401:400;
    return NextResponse.json({ok:false,error:message},{status});
  }
}
