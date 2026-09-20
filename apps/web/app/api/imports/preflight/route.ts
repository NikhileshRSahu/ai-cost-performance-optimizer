import { NextResponse } from 'next/server';
import { parseUsageCsv } from '@/backend/ingestion/csv';
import { withRuntimeWorkspace } from '@/lib/runtime-workspace';
import { invokeEvalomicsAI } from '@/lib/intelligence';

export const runtime='nodejs';
export const dynamic='force-dynamic';

function sumDecimal(values:string[]){
  let total=0;
  for(const value of values){const n=Number(value);if(Number.isFinite(n))total+=n}
  return total;
}
function issueGroups(issues:readonly {code:string;message:string}[]){
  const counts=new Map<string,number>();
  for(const issue of issues) counts.set(issue.code,(counts.get(issue.code)||0)+1);
  return [...counts.entries()].sort((a,b)=>b[1]-a[1]).slice(0,10).map(([code,count])=>({code,count}));
}
function roughHeaders(bytes:Uint8Array){
  try{
    const first=new TextDecoder().decode(bytes.slice(0,Math.min(bytes.length,64*1024))).split(/\r?\n/,1)[0]||'';
    return first.split(',').map(x=>x.replace(/^"|"$/g,'').trim()).filter(Boolean).slice(0,80);
  }catch{return []}
}

export async function POST(request:Request){
  try{
    const form=await request.formData();
    const file=form.get('file');
    if(!(file instanceof File)) return NextResponse.json({ok:false,error:'CSV_REQUIRED'},{status:400});
    if(file.size>10*1024*1024) return NextResponse.json({ok:false,error:'FILE_TOO_LARGE'},{status:413});
    const bytes=new Uint8Array(await file.arrayBuffer());

    const profile=await withRuntimeWorkspace(async({workspace})=>{ if(workspace.role==='VIEWER') throw new Error('OPERATOR_REQUIRED');
      try{
        const parsed=parseUsageCsv(bytes,workspace.organizationId,false);
        const accepted=parsed.records.length;
        const rejected=new Set(parsed.issues.flatMap(i=>i.line===null?[]:[i.line])).size;
        const totalRows=accepted+rejected;
        const requests=parsed.records.reduce((sum,r)=>sum+Number(r.requests||0),0);
        const spend=sumDecimal(parsed.records.map(r=>r.totalCost));
        const granularities=[...new Set(parsed.records.map(r=>r.granularity))];
        const currencies=[...new Set(parsed.records.map(r=>r.currency))];
        const providers=[...new Set(parsed.records.map(r=>r.provider))].slice(0,10);
        const models=[...new Set(parsed.records.map(r=>r.model))].slice(0,20);
        return {
          canImport:accepted>0,
          parserError:null,
          file:{name:file.name,size:file.size,headers:roughHeaders(bytes)},
          accepted,rejected,totalRows,
          acceptanceRate:totalRows?accepted/totalRows:0,
          requests,spend:Number(spend.toFixed(6)),
          granularities,currencies,providers,models,
          issueGroups:issueGroups(parsed.issues),
          capabilities:parsed.capabilities
        };
      }catch(error){
        const parserError=error instanceof Error?error.message:'CSV_PARSE_FAILED';
        return {
          canImport:false,parserError,file:{name:file.name,size:file.size,headers:roughHeaders(bytes)},
          accepted:0,rejected:0,totalRows:0,acceptanceRate:0,requests:0,spend:0,
          granularities:[],currencies:[],providers:[],models:[],issueGroups:[],capabilities:null
        };
      }
    });

    let doctor=null;
    try{
      const ai=await invokeEvalomicsAI({
        kind:'IMPORT_DOCTOR',
        question:'Assess this CSV before import. Is the data structurally understandable, what might be wrong, and what should the user do next? Do not invent values beyond this profile.',
        context:{preflight:profile}
      });
      doctor=ai.result;
    }catch{
      doctor=null;
    }
    return NextResponse.json({ok:true,profile,doctor});
  }catch(error){
    const message=error instanceof Error?error.message:'PREFLIGHT_FAILED';
    const status=message==='AUTH_REQUIRED'?401:message==='OPERATOR_REQUIRED'?403:400;
    return NextResponse.json({ok:false,error:message},{status});
  }
}
