import { NextResponse } from 'next/server';
import { createDatabase } from '@/backend/persistence/database';
import { syncConnectedProvider } from '@/backend/workbench/provider-connection-service';

export const runtime='nodejs';
export const dynamic='force-dynamic';

export async function GET(){
  const url=process.env.DATABASE_URL?.trim();
  if(!url) return NextResponse.json({ok:false,error:'DATABASE_URL_REQUIRED'},{status:503});
  const database=createDatabase(url);
  try{
    const rows=await database.pool.query(
      `SELECT pc.organization_id,pc.provider,m.user_id,m.role::text AS role
       FROM public.provider_connections pc
       JOIN public.memberships m ON m.organization_id=pc.organization_id
       WHERE pc.revoked_at IS NULL
       ORDER BY pc.provider,m.created_at`
    );
    const byProvider=new Map<string,any>();
    for(const row of rows.rows) if(!byProvider.has(row.provider)) byProvider.set(row.provider,row);
    const results:any={};
    for(const provider of ['OPENAI','ANTHROPIC'] as const){
      const row=byProvider.get(provider);
      if(!row){results[provider]={connected:false,status:'NOT_CONNECTED'};continue}
      const session={userId:String(row.user_id),memberships:[{organizationId:String(row.organization_id),role:String(row.role) as 'OWNER'|'OPERATOR'|'VIEWER'}]};
      try{
        const synced=await syncConnectedProvider({
          db:database.db,
          session,
          organizationId:String(row.organization_id),
          provider,
          encryptionKeyEnv:process.env.PROVIDER_CREDENTIAL_ENCRYPTION_KEY,
          encryptionFallbackSecret:process.env.AUTH_SECRET||process.env.BETTER_AUTH_SECRET,
          now:new Date()
        });
        results[provider]={connected:true,status:'READY',usageRows:synced.usageRows,costRows:synced.costRows,syncedAt:synced.syncedAt};
      }catch(error){
        results[provider]={connected:true,status:'FAILED',error:error instanceof Error?error.message:'UNKNOWN'};
      }
    }
    return NextResponse.json({ok:true,results},{headers:{'cache-control':'no-store'}});
  }finally{await database.close()}
}
