import { NextResponse } from 'next/server';
import { loadWorkspaceSummary } from '@/lib/workspace-summary';
import { invokeEvalomicsAI } from '@/lib/intelligence';
import { retrieveKnowledge } from '@/lib/knowledge';

export const runtime='nodejs';
export const dynamic='force-dynamic';

function safeContext(summary:Awaited<ReturnType<typeof loadWorkspaceSummary>>,screen:string){
  return {
    screen,
    workspace:{
      name:summary.organizationName,
      currency:summary.currency,
      observedSpend:summary.observedSpend,
      requests:summary.requests,
      dataRange:summary.dataRange,
      latestImport:summary.latestImport,
      providers:summary.providers.map(p=>({provider:p.provider,status:p.status,lastSyncAt:p.lastSyncAt})),
      topModels:summary.topModels.slice(0,5),
      evidenceCounts:summary.evidenceCounts,
      verifiedSavings:summary.verifiedSavings,
      recommendations:summary.recommendations.slice(0,12).map(r=>({
        state:r.state,title:r.title,confidence:r.confidence,amount:r.amount,currency:r.currency,
        measuredFact:r.measuredFact,nextAction:r.nextAction,limitation:r.limitation,kind:r.kind
      }))
    }
  };
}

export async function POST(request:Request){
  try{
    const body=await request.json() as {question?:string;screen?:string};
    const question=(body.question||'').trim();
    if(question.length<2||question.length>2000) return NextResponse.json({ok:false,error:'QUESTION_LENGTH'},{status:400});
    const screen=(body.screen||'overview').slice(0,80);
    const summary=await loadWorkspaceSummary();
    const knowledge=await retrieveKnowledge(question,5);
    const ai=await invokeEvalomicsAI({kind:'COPILOT',question,context:{...safeContext(summary,screen),retrievedKnowledge:knowledge}});
    return NextResponse.json({ok:true,...ai});
  }catch(error){
    const message=error instanceof Error?error.message:'AI_UNAVAILABLE';
    const status=message==='AUTH_REQUIRED'?401:503;
    return NextResponse.json({ok:false,error:message},{status});
  }
}
