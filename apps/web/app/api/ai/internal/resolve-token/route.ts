import { createHash } from 'node:crypto';
import { NextResponse } from 'next/server';
import { createDatabase } from '@/backend/persistence/database';

export const runtime='nodejs';
export const dynamic='force-dynamic';

function hashToken(value:string){
  return createHash('sha256').update(value).digest('hex');
}

export async function POST(request:Request){
  const body=await request.json().catch(()=>null) as {token?:string}|null;
  const token=body?.token?.trim();
  if(!token) return NextResponse.json({ok:false,error:'TOKEN_REQUIRED'},{status:400});

  const url=process.env.DATABASE_URL?.trim();
  if(!url) return NextResponse.json({ok:false,error:'DATABASE_URL_REQUIRED'},{status:503});
  const database=createDatabase(url);
  try{
    const result=await database.pool.query(
      `UPDATE public.ai_invocation_tokens
       SET used_at=now()
       WHERE token_hash=$1 AND used_at IS NULL AND expires_at>now()
       RETURNING payload`,
      [hashToken(token)]
    );
    const payload=result.rows[0]?.payload;
    if(!payload) return NextResponse.json({ok:false,error:'TOKEN_INVALID_OR_EXPIRED'},{status:401});
    return NextResponse.json({ok:true,payload},{headers:{'cache-control':'no-store'}});
  }finally{
    await database.close();
  }
}
