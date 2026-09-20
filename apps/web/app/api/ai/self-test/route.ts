import { createHash, randomBytes } from 'node:crypto';
import { NextResponse } from 'next/server';
import { createDatabase } from '@/backend/persistence/database';

export const runtime='nodejs';
export const dynamic='force-dynamic';

const FUNCTION_URL='https://br-icy-mountain-b484w1w7-evalomicsai.compute.c-6.us-east-2.aws.neon.tech/';

export async function GET(){
  const url=process.env.DATABASE_URL?.trim();
  if(!url) return NextResponse.json({ok:false,error:'DATABASE_URL_REQUIRED'},{status:503});
  const database=createDatabase(url);
  try{
    const owner=await database.pool.query(
      `SELECT m.organization_id,m.user_id
       FROM public.memberships m
       JOIN public.organizations o ON o.id=m.organization_id
       WHERE o.is_demo=false
       ORDER BY m.created_at ASC LIMIT 1`
    );
    const row=owner.rows[0];
    if(!row) return NextResponse.json({ok:false,error:'NO_PRODUCTION_MEMBER'},{status:503});

    const raw=randomBytes(32).toString('base64url');
    const hash=createHash('sha256').update(raw).digest('hex');
    const payload={
      kind:'COPILOT',
      question:'Return a short confirmation that Evalomics Intelligence can reason over sanitized measured context.',
      context:{screen:'self-test',workspace:{currency:'USD',observedSpend:'10.00',requests:'100',evidenceCounts:{potential:0,tested:0,verified:0},verifiedSavings:null}}
    };
    await database.pool.query(
      `INSERT INTO public.ai_invocation_tokens
       (token_hash,organization_id,user_id,kind,payload,expires_at)
       VALUES($1,$2,$3,'COPILOT',$4::jsonb,now()+interval '2 minutes')`,
      [hash,row.organization_id,row.user_id,JSON.stringify(payload)]
    );

    const response=await fetch(FUNCTION_URL,{
      method:'POST',headers:{'content-type':'application/json'},
      body:JSON.stringify({token:raw}),cache:'no-store'
    });
    const json=await response.json().catch(()=>null);
    return NextResponse.json({
      ok:response.ok&&Boolean(json?.ok),
      workerStatus:response.status,
      model:json?.model??null,
      resultShape:json?.result?Object.keys(json.result):[],
      error:json?.error??null
    },{status:response.ok&&json?.ok?200:503,headers:{'cache-control':'no-store'}});
  }finally{
    await database.close();
  }
}
