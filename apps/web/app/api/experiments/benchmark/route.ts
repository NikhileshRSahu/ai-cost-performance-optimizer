import { NextResponse } from 'next/server';
import { evaluateAndPersistBenchmark } from '@/backend/workbench/benchmark-service';
import { saveWorkloadConstraints } from '@/backend/workbench/workload-service';
import { withRuntimeWorkspace } from '@/lib/runtime-workspace';
import { enforceRateLimit } from '@/lib/rate-limit';

export const runtime='nodejs';
export const dynamic='force-dynamic';

export async function POST(request:Request){
  try{
    const form=await request.formData();
    const file=form.get('file');
    if(!(file instanceof File)) return NextResponse.json({ok:false,error:'BENCHMARK_CSV_REQUIRED'},{status:400});
    if(file.size>5*1024*1024) return NextResponse.json({ok:false,error:'BENCHMARK_FILE_TOO_LARGE'},{status:413});
    const workloadName=String(form.get('workloadName')||'').trim();
    const environment=String(form.get('environment')||'production').trim();
    const requiredQuality=String(form.get('requiredQuality')||'').trim();
    const maxP95LatencyMs=String(form.get('maxP95LatencyMs')||'').trim()||null;
    const maxFailureRate=String(form.get('maxFailureRate')||'').trim()||null;
    const currentConfigurationId=String(form.get('currentConfigurationId')||'').trim();
    const candidateConfigurationId=String(form.get('candidateConfigurationId')||'').trim();
    const evaluatorVersion=String(form.get('evaluatorVersion')||'eval-v1').trim();
    const currency=String(form.get('currency')||'USD').trim().toUpperCase();
    const sourceRecommendationId=String(form.get('sourceRecommendationId')||'').trim()||null;
    if(!workloadName||!requiredQuality||!currentConfigurationId||!candidateConfigurationId){
      return NextResponse.json({ok:false,error:'BENCHMARK_FIELDS_REQUIRED'},{status:400});
    }

    const bytes=new Uint8Array(await file.arrayBuffer());
    const result=await withRuntimeWorkspace(async({workspace,database})=>{
      await enforceRateLimit({pool:database.pool,organizationId:workspace.organizationId,scope:'benchmark',limit:10,windowSeconds:600});
      const workload=await saveWorkloadConstraints({
        db:database.db,session:workspace.session,organizationId:workspace.organizationId,
        values:{name:workloadName,environment,requiredQuality,maxP95LatencyMs,maxFailureRate}
      });
      const benchmark=await evaluateAndPersistBenchmark({
        db:database.db,session:workspace.session,organizationId:workspace.organizationId,
        workloadId:workload.id,bytes,currentConfigurationId,candidateConfigurationId,
        evaluatorVersion,currency,isDemo:false,sourceRecommendationId
      });
      return {workloadId:workload.id,...benchmark};
    });
    return NextResponse.json({ok:true,result});
  }catch(error){
    const message=error instanceof Error?error.message:'BENCHMARK_FAILED';
    const status=message==='AUTH_REQUIRED'?401:message==='RATE_LIMITED'?429:400;
    return NextResponse.json({ok:false,error:message},{status});
  }
}
