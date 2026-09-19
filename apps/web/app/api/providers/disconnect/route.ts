import { NextResponse } from 'next/server';
import { disconnectProvider } from '@/backend/workbench/provider-connection-service';
import { withRuntimeWorkspace } from '@/lib/runtime-workspace';

export const runtime='nodejs';
export const dynamic='force-dynamic';

export async function POST(request:Request){
  try{
    const body=await request.json() as {provider?:string};
    if(body.provider!=='OPENAI' && body.provider!=='ANTHROPIC'){
      return NextResponse.json({ok:false,error:'INVALID_PROVIDER'},{status:400});
    }
    await withRuntimeWorkspace(async({workspace,database})=>
      disconnectProvider({
        db:database.db,session:workspace.session,organizationId:workspace.organizationId,
        provider:body.provider as 'OPENAI'|'ANTHROPIC'
      })
    );
    return NextResponse.json({ok:true});
  }catch{
    return NextResponse.json({ok:false,error:'DISCONNECT_FAILED'},{status:400});
  }
}
