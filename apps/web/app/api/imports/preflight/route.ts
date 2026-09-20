import { NextResponse } from 'next/server';
import { parseUsageCsv } from '@/backend/ingestion/csv';
import { resolveRuntimeWorkspace } from '@/lib/runtime-workspace';

export const runtime='nodejs';
export const dynamic='force-dynamic';

function safeError(error:unknown){
  const message=error instanceof Error?error.message:'PREFLIGHT_FAILED';
  if(message.startsWith('MISSING_COLUMN:')) return message;
  if(message.startsWith('UNSUPPORTED_COLUMN:')) return message;
  if(message.startsWith('DUPLICATE_CANONICAL_COLUMN:')) return message;
  if(['FILE_TOO_LARGE','TOO_MANY_ROWS','EMPTY_CSV','UNCLOSED_QUOTE','DUPLICATE_HEADER'].includes(message)) return message;
  return message.startsWith('INVALID_')?message:'PREFLIGHT_FAILED';
}

export async function POST(request:Request){
  const workspace=await resolveRuntimeWorkspace();
  if(!workspace) return NextResponse.json({ok:false,error:'AUTH_REQUIRED'},{status:401});
  try{
    const form=await request.formData();
    const file=form.get('file');
    if(!(file instanceof File)) return NextResponse.json({ok:false,error:'CSV_REQUIRED'},{status:400});
    const parsed=parseUsageCsv(new Uint8Array(await file.arrayBuffer()),workspace.organizationId,false);
    const issueCounts=parsed.issues.reduce<Record<string,number>>((acc,issue)=>{
      const key=String((issue as any).code || (issue as any).category || 'ROW_REJECTED');
      acc[key]=(acc[key]||0)+1; return acc;
    },{});
    return NextResponse.json({
      ok:true,
      result:{
        fileName:file.name,
        accepted:parsed.records.length,
        rejected:parsed.issues.length,
        totalRows:parsed.records.length+parsed.issues.length,
        issueCounts,
        capabilities:parsed.capabilities
      }
    });
  }catch(error){
    return NextResponse.json({ok:false,error:safeError(error)},{status:400});
  }
}
