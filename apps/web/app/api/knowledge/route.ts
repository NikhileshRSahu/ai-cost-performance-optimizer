import { randomUUID } from 'node:crypto';
import { NextResponse } from 'next/server';
import { withRuntimeWorkspace } from '@/lib/runtime-workspace';
export const runtime='nodejs'; export const dynamic='force-dynamic';
const MAX_BYTES=2*1024*1024; const ALLOWED=new Set(['text/plain','text/markdown','application/json','']);
function splitChunks(text:string){
  const normalized=text.replace(/\r\n/g,'\n').replace(/\n{3,}/g,'\n\n').trim(); const out:string[]=[]; let cursor=0;
  while(cursor<normalized.length){let end=Math.min(normalized.length,cursor+1400);if(end<normalized.length){const p=normalized.lastIndexOf('\n\n',end);const s=Math.max(normalized.lastIndexOf('. ',end),normalized.lastIndexOf('\n',end));const cut=Math.max(p,s);if(cut>cursor+650)end=cut+1}const part=normalized.slice(cursor,end).trim();if(part)out.push(part);if(end>=normalized.length)break;cursor=Math.max(cursor+1,end-140)}
  return out.slice(0,400);
}
export async function GET(){
  try{const documents=await withRuntimeWorkspace(async({workspace,database})=>(await database.pool.query(
    `SELECT d.id,d.title,d.source,d.created_at::text,count(c.id)::int AS chunks FROM public.ai_knowledge_documents d LEFT JOIN public.ai_knowledge_chunks c ON c.document_id=d.id WHERE d.organization_id=$1 GROUP BY d.id ORDER BY d.created_at DESC LIMIT 50`,
    [workspace.organizationId])).rows);return NextResponse.json({ok:true,documents})}
  catch(error){const m=error instanceof Error?error.message:'KNOWLEDGE_LIST_FAILED';return NextResponse.json({ok:false,error:m},{status:m==='AUTH_REQUIRED'?401:500})}
}
export async function POST(request:Request){
  try{const form=await request.formData();const file=form.get('file');if(!(file instanceof File))return NextResponse.json({ok:false,error:'FILE_REQUIRED'},{status:400});if(file.size>MAX_BYTES)return NextResponse.json({ok:false,error:'FILE_TOO_LARGE'},{status:413});if(!ALLOWED.has(file.type))return NextResponse.json({ok:false,error:'TEXT_FILES_ONLY'},{status:400});const text=(await file.text()).trim();if(text.length<40)return NextResponse.json({ok:false,error:'DOCUMENT_TOO_SHORT'},{status:400});const parts=splitChunks(text);if(!parts.length)return NextResponse.json({ok:false,error:'NO_TEXT_FOUND'},{status:400});
    const document=await withRuntimeWorkspace(async({workspace,database})=>{if(workspace.role==='VIEWER')throw new Error('OPERATOR_REQUIRED');const id='doc_'+randomUUID().replaceAll('-','');await database.pool.query('BEGIN');try{await database.pool.query('INSERT INTO public.ai_knowledge_documents(id,organization_id,user_id,title,source) VALUES($1,$2,$3,$4,$5)',[id,workspace.organizationId,workspace.userId,file.name,'UPLOAD']);for(let i=0;i<parts.length;i++)await database.pool.query('INSERT INTO public.ai_knowledge_chunks(id,document_id,organization_id,chunk_index,content) VALUES($1,$2,$3,$4,$5)',['chunk_'+randomUUID().replaceAll('-',''),id,workspace.organizationId,i,parts[i]]);await database.pool.query('COMMIT');return {id,title:file.name,chunks:parts.length}}catch(e){await database.pool.query('ROLLBACK');throw e}});
    return NextResponse.json({ok:true,document});
  }catch(error){const m=error instanceof Error?error.message:'KNOWLEDGE_UPLOAD_FAILED';return NextResponse.json({ok:false,error:m},{status:m==='AUTH_REQUIRED'?401:m==='OPERATOR_REQUIRED'?403:500})}
}
export async function DELETE(request:Request){
  try{const body=await request.json() as {id?:string};const id=(body.id||'').trim();if(!id)return NextResponse.json({ok:false,error:'DOCUMENT_ID_REQUIRED'},{status:400});const deleted=await withRuntimeWorkspace(async({workspace,database})=>{if(workspace.role==='VIEWER')throw new Error('OPERATOR_REQUIRED');return (await database.pool.query('DELETE FROM public.ai_knowledge_documents WHERE id=$1 AND organization_id=$2 RETURNING id',[id,workspace.organizationId])).rowCount===1});return NextResponse.json({ok:true,deleted})}
  catch(error){const m=error instanceof Error?error.message:'KNOWLEDGE_DELETE_FAILED';return NextResponse.json({ok:false,error:m},{status:m==='AUTH_REQUIRED'?401:m==='OPERATOR_REQUIRED'?403:500})}
}
