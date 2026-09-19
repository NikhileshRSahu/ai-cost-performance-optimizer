import { NextResponse } from 'next/server';
import { connectAndValidateProvider, providerConnectionSafeError } from '@/backend/workbench/provider-connection-service';
import { withRuntimeWorkspace } from '@/lib/runtime-workspace';

export const runtime='nodejs';
export const dynamic='force-dynamic';

export async function POST(request:Request){
  try{
    const body=await request.json() as {provider?:string;adminKey?:string};
    if(body.provider!=='OPENAI' && body.provider!=='ANTHROPIC'){
      return NextResponse.json({ok:false,error:'Choose OpenAI or Anthropic.'},{status:400});
    }
    const adminKey=body.adminKey?.trim() ?? '';
    if(!adminKey) return NextResponse.json({ok:false,error:'Enter the provider admin key.'},{status:400});

    const result=await withRuntimeWorkspace(async({workspace,database})=>{
      return connectAndValidateProvider({
        db:database.db,
        session:workspace.session,
        organizationId:workspace.organizationId,
        provider:body.provider as 'OPENAI'|'ANTHROPIC',
        adminKey,
        encryptionKeyEnv:process.env.PROVIDER_CREDENTIAL_ENCRYPTION_KEY,
        encryptionFallbackSecret:process.env.AUTH_SECRET || process.env.BETTER_AUTH_SECRET
      });
    });
    return NextResponse.json({ok:true,result});
  }catch(error){
    const safe=providerConnectionSafeError(error);
    const status=safe==='PROVIDER_CREDENTIAL_REJECTED'?401:safe==='PROVIDER_RATE_LIMITED'?429:400;
    return NextResponse.json({ok:false,error:safe},{status});
  }
}
