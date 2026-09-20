import { NextResponse } from 'next/server';
import { purgeOrganizationEvidence } from '@/backend/workbench/data-lifecycle';
import { withRuntimeWorkspace } from '@/lib/runtime-workspace';

export const runtime='nodejs';
export const dynamic='force-dynamic';

export async function DELETE(request:Request){
  try{
    const body=await request.json().catch(()=>null) as {confirmationOrganizationId?:string}|null;
    return await withRuntimeWorkspace(async({workspace,database})=>{
      if(workspace.role!=='OWNER') return NextResponse.json({ok:false,error:'OWNER_REQUIRED'},{status:403});
      if(body?.confirmationOrganizationId!==workspace.organizationId){
        return NextResponse.json({ok:false,error:'CONFIRMATION_MISMATCH'},{status:400});
      }

      await purgeOrganizationEvidence({
        db:database.db,
        session:workspace.session,
        organizationId:workspace.organizationId,
        confirmationOrganizationId:workspace.organizationId
      });

      const client=await database.pool.connect();
      try{
        await client.query('BEGIN');
        await client.query('DELETE FROM public.provider_evidence_snapshots WHERE organization_id=$1',[workspace.organizationId]);
        await client.query('DELETE FROM public.provider_connections WHERE organization_id=$1',[workspace.organizationId]);
        await client.query('DELETE FROM public.ai_knowledge_chunks WHERE organization_id=$1',[workspace.organizationId]);
        await client.query('DELETE FROM public.ai_knowledge_documents WHERE organization_id=$1',[workspace.organizationId]);
        await client.query('DELETE FROM public.ai_interactions WHERE organization_id=$1',[workspace.organizationId]);
        await client.query('DELETE FROM public.ai_invocation_tokens WHERE organization_id=$1',[workspace.organizationId]);
        await client.query('COMMIT');
      }catch(error){
        await client.query('ROLLBACK');
        throw error;
      }finally{
        client.release();
      }

      return NextResponse.json({ok:true,purged:true,retained:['organization','memberships','user account']});
    });
  }catch(error){
    const message=error instanceof Error?error.message:'DELETE_FAILED';
    const status=message==='AUTH_REQUIRED'?401:400;
    return NextResponse.json({ok:false,error:message},{status});
  }
}
