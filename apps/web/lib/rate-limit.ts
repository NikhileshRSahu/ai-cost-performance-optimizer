import type { Pool } from 'pg';

export async function enforceRateLimit(input:{
  pool:Pool;
  organizationId:string;
  scope:string;
  limit:number;
  windowSeconds:number;
}){
  const now=Date.now();
  const bucketStartMs=Math.floor(now/(input.windowSeconds*1000))*(input.windowSeconds*1000);
  const windowStart=new Date(bucketStartMs).toISOString();
  const result=await input.pool.query(
    `INSERT INTO public.rate_limit_windows(
       organization_id,scope_key,window_start,request_count,updated_at
     ) VALUES($1,$2,$3,1,now())
     ON CONFLICT(organization_id,scope_key,window_start)
     DO UPDATE SET request_count=public.rate_limit_windows.request_count+1,updated_at=now()
     RETURNING request_count`,
    [input.organizationId,input.scope,windowStart]
  );
  const count=Number(result.rows[0]?.request_count??1);
  if(count>input.limit) throw new Error('RATE_LIMITED');
  return {count,limit:input.limit,windowStart};
}
