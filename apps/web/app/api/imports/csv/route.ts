import { NextResponse } from 'next/server';
import { importCustomerUsage } from '@/backend/workbench/import-service';
import { analyzeImportedUsage } from '@/backend/workbench/analysis-service';
import { withRuntimeWorkspace } from '@/lib/runtime-workspace';
import { enforceRateLimit } from '@/lib/rate-limit';

export const runtime='nodejs';
export const dynamic='force-dynamic';

function safeError(error:unknown){
  const message=error instanceof Error?error.message:'IMPORT_FAILED';
  if(message.startsWith('MISSING_COLUMN:')) return message;
  if(message.startsWith('UNSUPPORTED_COLUMN:')) return message;
  if(message==='FILE_TOO_LARGE'||message==='TOO_MANY_ROWS'||message==='EMPTY_CSV') return message;
  return 'IMPORT_FAILED';
}

export async function POST(request:Request){
  try{
    const form=await request.formData();
    const file=form.get('file');
    if(!(file instanceof File)) return NextResponse.json({ok:false,error:'CSV_REQUIRED'},{status:400});
    if(file.size>10*1024*1024) return NextResponse.json({ok:false,error:'FILE_TOO_LARGE'},{status:413});
    const bytes=new Uint8Array(await file.arrayBuffer());
    const result=await withRuntimeWorkspace(async({workspace,database})=>{ if(workspace.role==='VIEWER') throw new Error('OPERATOR_REQUIRED'); await enforceRateLimit({pool:database.pool,organizationId:workspace.organizationId,scope:'import-csv',limit:10,windowSeconds:60});
      const imported=await importCustomerUsage({
        db:database.db,session:workspace.session,organizationId:workspace.organizationId,
        fileName:file.name,bytes,isDemo:false,receivedAt:new Date().toISOString()
      });
      if(imported.blocked) throw new Error('IMPORT_FAILED');
      await analyzeImportedUsage({
        db:database.db,session:workspace.session,organizationId:workspace.organizationId,
        importId:imported.importId
      });
      return imported;
    });
    return NextResponse.json({ok:true,result});
  }catch(error){
    if(error instanceof Error && error.message==='AUTH_REQUIRED') return NextResponse.json({ok:false,error:'AUTH_REQUIRED'},{status:401});
    if(error instanceof Error && error.message==='OPERATOR_REQUIRED') return NextResponse.json({ok:false,error:'OPERATOR_REQUIRED'},{status:403});
    if(error instanceof Error && error.message==='RATE_LIMITED') return NextResponse.json({ok:false,error:'RATE_LIMITED'},{status:429});
    return NextResponse.json({ok:false,error:safeError(error)},{status:400});
  }
}
