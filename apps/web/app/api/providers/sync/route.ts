import { NextResponse } from 'next/server';
import { syncConnectedProvider, providerConnectionSafeError } from '@/backend/workbench/provider-connection-service';
import { withRuntimeWorkspace } from '@/lib/runtime-workspace';

export const runtime='nodejs';
export const dynamic='force-dynamic';

export async function POST(request:Request){
  try{
    const body=await request.json() as {provider?:string};
    if(body.provider!=='OPENAI' && body.provider!=='ANTHROPIC'){
      return NextResponse.json({ok:false,error:'INVALID_PROVIDER'},{status:400});
    }
    const result=await withRuntimeWorkspace(async({workspace,database})=>
      syncConnectedProvider({
        db:database.db,session:workspace.session,organizationId:workspace.organizationId,
        provider:body.provider as 'OPENAI'|'ANTHROPIC',
        encryptionKeyEnv:process.env.PROVIDER_CREDENTIAL_ENCRYPTION_KEY,
        encryptionFallbackSecret:process.env.AUTH_SECRET || process.env.BETTER_AUTH_SECRET
      })
    );
    return NextResponse.json({ok:true,result});
  }catch(error){
    const safe=providerConnectionSafeError(error);
    return NextResponse.json({ok:false,error:safe},{status:400});
  }
}
