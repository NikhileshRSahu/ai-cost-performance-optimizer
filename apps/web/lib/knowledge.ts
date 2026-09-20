import { withRuntimeWorkspace } from './runtime-workspace';
export type KnowledgeSnippet=Readonly<{title:string;content:string;rank:number}>;
export async function retrieveKnowledge(question:string,limit=5):Promise<readonly KnowledgeSnippet[]>{
  const q=question.trim(); if(q.length<2)return [];
  return withRuntimeWorkspace(async({workspace,database})=>{
    const result=await database.pool.query(
      `SELECT d.title,c.content,ts_rank(c.search_vector,plainto_tsquery('english',$2))::float8 AS rank
       FROM public.ai_knowledge_chunks c
       JOIN public.ai_knowledge_documents d ON d.id=c.document_id
       WHERE c.organization_id=$1 AND c.search_vector @@ plainto_tsquery('english',$2)
       ORDER BY rank DESC,c.chunk_index ASC LIMIT $3`,
      [workspace.organizationId,q,Math.max(1,Math.min(limit,8))]
    );
    return Object.freeze(result.rows.map((r:any)=>Object.freeze({title:String(r.title),content:String(r.content).slice(0,1800),rank:Number(r.rank||0)})));
  });
}
