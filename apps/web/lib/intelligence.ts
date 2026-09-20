import { createHash, randomBytes, randomUUID } from 'node:crypto';
import { withRuntimeWorkspace } from './runtime-workspace';

const FUNCTION_URL='https://br-icy-mountain-b484w1w7-evalomicsai.compute.c-6.us-east-2.aws.neon.tech/';

export type IntelligenceResult=Readonly<{
  answer:string;
  why:string;
  evidence:readonly string[];
  nextAction:string;
  confidence:'high'|'medium'|'low';
  caveats:readonly string[];
}>;

function tokenHash(raw:string){
  return createHash('sha256').update(raw).digest('hex');
}

export async function invokeEvalomicsAI(input:{
  kind:'COPILOT'|'IMPORT_DOCTOR';
  question:string;
  context:unknown;
}):Promise<{model:string;result:IntelligenceResult}>{
  return withRuntimeWorkspace(async({workspace,database})=>{
    const rawToken=randomBytes(32).toString('base64url');
    const hash=tokenHash(rawToken);
    const interactionId='ai_'+randomUUID().replaceAll('-','');
    const expiresAt=new Date(Date.now()+2*60*1000).toISOString();
    const payload={kind:input.kind,question:input.question,context:input.context};

    await database.pool.query(
      'INSERT INTO public.ai_invocation_tokens(token_hash,organization_id,user_id,kind,payload,expires_at) VALUES($1,$2,$3,$4,$5::jsonb,$6)',
      [hash,workspace.organizationId,workspace.userId,input.kind,JSON.stringify(payload),expiresAt]
    );
    await database.pool.query(
      "INSERT INTO public.ai_interactions(id,organization_id,user_id,kind,question,status) VALUES($1,$2,$3,$4,$5,'STARTED')",
      [interactionId,workspace.organizationId,workspace.userId,input.kind,input.question]
    );

    try{
      const response=await fetch(FUNCTION_URL,{
        method:'POST',
        headers:{'content-type':'application/json'},
        body:JSON.stringify({token:rawToken}),
        cache:'no-store'
      });
      const json=await response.json() as {ok?:boolean;model?:string;result?:IntelligenceResult;error?:string};
      if(!response.ok||!json.ok||!json.result) throw new Error(json.error||'AI_INVOCATION_FAILED');
      await database.pool.query(
        "UPDATE public.ai_interactions SET answer=$2::jsonb,model=$3,status='COMPLETED',completed_at=now() WHERE id=$1",
        [interactionId,JSON.stringify(json.result),json.model||'gpt-5-mini']
      );
      return {model:json.model||'gpt-5-mini',result:json.result};
    }catch(error){
      await database.pool.query(
        "UPDATE public.ai_interactions SET status='FAILED',completed_at=now() WHERE id=$1",
        [interactionId]
      );
      throw error;
    }
  });
}
