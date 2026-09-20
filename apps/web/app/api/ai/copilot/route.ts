import { generateText } from 'ai';
import { NextResponse } from 'next/server';
import { randomBytes } from 'node:crypto';
import { loadWorkspaceSummary } from '@/lib/workspace-summary';
import { withRuntimeWorkspace } from '@/lib/runtime-workspace';

export const runtime='nodejs';
export const dynamic='force-dynamic';
export const maxDuration=60;

type CopilotBody={question?:string;screen?:string;kind?:'COPILOT'|'IMPORT_DOCTOR';extra?:unknown};

function extractJson(text:string){
  const trimmed=text.trim().replace(/^\`\`\`json\s*/i,'').replace(/\`\`\`$/,'').trim();
  try{return JSON.parse(trimmed)}catch{return {answer:trimmed,why:'',numbers:[],next_action:'',confidence:'LOW',caveat:'AI response could not be fully structured.'}}
}

export async function POST(request:Request){
  try{
    const body=await request.json() as CopilotBody;
    const question=(body.question||'What should I know about this workspace?').trim().slice(0,1000);
    const screen=(body.screen||'dashboard').trim().slice(0,160);
    const kind=body.kind==='IMPORT_DOCTOR'?'IMPORT_DOCTOR':'COPILOT';
    const summary=await loadWorkspaceSummary();

    const context={
      workspace:{
        name:summary.organizationName,
        currency:summary.currency,
        observedSpend:summary.observedSpend,
        requests:summary.requests,
        dataRange:summary.dataRange
      },
      latestImport:summary.latestImport,
      providers:summary.providers,
      topModels:summary.topModels,
      evidenceCounts:summary.evidenceCounts,
      verifiedSavings:summary.verifiedSavings,
      opportunities:summary.recommendations.slice(0,12).map(r=>({
        state:r.state,title:r.title,decision:r.decision,confidence:r.confidence,
        measuredFact:r.measuredFact,nextAction:r.nextAction,limitation:r.limitation,amount:r.amount,currency:r.currency
      })),
      extra:body.extra??null
    };

    const interactionId='ai_'+randomBytes(12).toString('hex');
    await withRuntimeWorkspace(async({workspace,database})=>{
      await database.pool.query(
        "INSERT INTO public.ai_interactions(id,organization_id,user_id,kind,question,status,created_at) VALUES($1,$2,$3,$4,$5,'STARTED',now())",
        [interactionId,workspace.organizationId,workspace.userId,kind,question]
      );
    });

    const system=[
      'You are Evalomics Intelligence, an AI efficiency analyst for production LLM workloads.',
      'You explain deterministic evidence supplied by Evalomics; never invent spend, requests, savings, experiments, quality, or provider facts.',
      'Observed means measured usage/cost. Potential is a hypothesis or estimate. Tested requires measured experiment evidence. Verified requires rollout plus production reconciliation.',
      'Never call Potential or Tested money saved. Only the supplied verifiedSavings field may be described as verified savings.',
      'For import problems, decide whether the likely issue is SOURCE DATA, SCHEMA/MAPPING, or INSUFFICIENT EVIDENCE and say so plainly.',
      'Do not tell the user to inspect technical IDs unless necessary. Lead with the answer, then why, useful numbers, then one concrete next action.',
      'Return strict JSON with exactly: answer:string, why:string, numbers:string[], next_action:string, confidence:"HIGH"|"MEDIUM"|"LOW", caveat:string.'
    ].join('\n');

    const prompt='Question: '+question+'\nScreen: '+screen+'\nKind: '+kind+'\nDeterministic evidence:\n'+JSON.stringify(context,null,2);
    const result=await generateText({
      model:'openai/gpt-5.6-sol',
      system,
      prompt,
      maxOutputTokens:900,
      temperature:0.1,
      providerOptions:{gateway:{disallowPromptTraining:true}}
    } as any);
    const answer=extractJson(result.text);

    await withRuntimeWorkspace(async({database})=>{
      await database.pool.query(
        "UPDATE public.ai_interactions SET answer=$2::jsonb,model=$3,status='COMPLETED',completed_at=now() WHERE id=$1",
        [interactionId,JSON.stringify(answer),'openai/gpt-5.6-sol']
      );
    });
    return NextResponse.json({ok:true,interactionId,result:answer});
  }catch(error){
    const message=error instanceof Error?error.message:'AI_FAILED';
    return NextResponse.json({ok:false,error:message==='AUTH_REQUIRED'?'AUTH_REQUIRED':'AI_FAILED'},{status:message==='AUTH_REQUIRED'?401:500});
  }
}
