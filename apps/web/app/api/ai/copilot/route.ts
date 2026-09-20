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

function fallback(summary:Awaited<ReturnType<typeof loadWorkspaceSummary>>,question:string){
  const q=question.toLowerCase();
  const latest=summary.latestImport;
  const top=summary.topModels[0];
  const importQuestion=q.includes('csv')||q.includes('import')||q.includes('reject');
  const spendQuestion=q.includes('spend')||q.includes('cost')||q.includes('expensive');
  const verifyQuestion=q.includes('verified')||q.includes('verify')||q.includes('saving');

  let answer='';
  if(importQuestion&&latest){
    answer=latest.rejected>0
      ? 'Your latest import is partial: '+latest.accepted+' rows were accepted and '+latest.rejected+' were rejected, so dashboard totals cover accepted evidence only.'
      : 'Your latest import is healthy: '+latest.accepted+' rows were accepted with no rejected rows.';
  }else if(spendQuestion){
    answer=summary.observedSpend
      ? 'Observed spend is '+summary.currency+' '+Number(summary.observedSpend).toLocaleString(undefined,{maximumFractionDigits:2})+' across '+Number(summary.requests).toLocaleString()+' measured requests.'
      : 'There is no observed spend in the active evidence window yet.';
  }else if(verifyQuestion){
    answer=summary.verifiedSavings
      ? 'Verified savings currently total '+summary.currency+' '+Number(summary.verifiedSavings).toLocaleString(undefined,{maximumFractionDigits:2})+'. Potential and Tested values are excluded.'
      : 'Nothing is Verified yet. Evalomics will not call an estimate or experiment result savings until production verification closes.';
  }else{
    answer=top
      ? 'The clearest place to investigate first is '+top.model+', currently the largest measured model spend bucket in this workspace.'
      : 'Start by improving data coverage, then investigate the largest measured cost driver before testing any optimization.';
  }

  const evidence:string[]=[];
  if(latest) evidence.push('Latest import: '+latest.accepted+' accepted, '+latest.rejected+' rejected.');
  if(top) evidence.push(top.model+': '+summary.currency+' '+Number(top.spend).toLocaleString(undefined,{maximumFractionDigits:2})+' across '+Number(top.requests).toLocaleString()+' requests.');
  evidence.push('Evidence states: '+summary.evidenceCounts.potential+' Potential, '+summary.evidenceCounts.tested+' Tested, '+summary.evidenceCounts.verified+' Verified.');

  return {
    answer,
    why:importQuestion&&latest&&latest.rejected>0
      ? 'Rejected rows are deliberately excluded rather than guessed, which can make totals look smaller than the source file.'
      : top
        ? top.model+' is the largest measured model spend bucket in the current workspace evidence.'
        : 'This answer comes directly from the deterministic workspace evidence currently available.',
    evidence,
    nextAction:importQuestion&&latest&&latest.rejected>0
      ? 'Repair the import before trusting cost or optimization conclusions.'
      : verifyQuestion
        ? 'Run a controlled test, roll out only after guardrails pass, then measure a production verification window.'
        : 'Inspect the largest measured driver first and test one reversible change at a time.',
    confidence:'high' as const,
    caveats:['Language-model reasoning is temporarily unavailable; this answer is computed from deterministic workspace evidence.']
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
    try{
      const ai=await invokeEvalomicsAI({kind:'COPILOT',question,context:{...safeContext(summary,screen),retrievedKnowledge:knowledge}});
      return NextResponse.json({ok:true,...ai,mode:'ai'});
    }catch{
      return NextResponse.json({ok:true,model:'deterministic-evidence',result:fallback(summary,question),mode:'fallback'});
    }
  }catch(error){
    const message=error instanceof Error?error.message:'AI_UNAVAILABLE';
    const status=message==='AUTH_REQUIRED'?401:503;
    return NextResponse.json({ok:false,error:message},{status});
  }
}
