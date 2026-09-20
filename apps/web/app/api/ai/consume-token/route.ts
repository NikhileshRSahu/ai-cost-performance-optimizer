import { createHash } from 'node:crypto';
import { NextResponse } from 'next/server';
import { createDatabase } from '@/backend/persistence/database';

export const runtime='nodejs';
export const dynamic='force-dynamic';

function databaseUrl(){
  const value=process.env.DATABASE_URL?.trim();
  if(!value) throw new Error('DATABASE_URL_REQUIRED');
  return value;
}
function hash(raw:string){return createHash('sha256').update(raw).digest('hex')}

export async function POST(request:Request){
  const database=createDatabase(databaseUrl());
  try{
    const body=await request.json() as {token?:string};
    const token=body.token?.trim()||'';
    if(token.length<32||token.length>256) return NextResponse.json({ok:false,error:'INVALID_TOKEN'},{status:401});
    const result=await database.pool.query(
      "UPDATE public.ai_invocation_tokens SET used_at=now() WHERE token_hash=$1 AND used_at IS NULL AND expires_at>now() RETURNING payload",
      [hash(token)]
    );
    const payload=result.rows[0]?.payload;
    await database.pool.query("DELETE FROM public.ai_invocation_tokens WHERE expires_at<now()-interval '10 minutes'");
    if(!payload) return NextResponse.json({ok:false,error:'TOKEN_EXPIRED_OR_USED'},{status:401});
    return NextResponse.json({ok:true,payload});
  }finally{await database.close();}
}
