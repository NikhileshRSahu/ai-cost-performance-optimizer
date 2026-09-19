import { createDatabase } from '../../../../../src/persistence/database';

export const runtime='nodejs';
export const dynamic='force-dynamic';

export async function GET(){
  const databaseUrl=process.env.DATABASE_URL?.trim();
  if(!databaseUrl){
    return Response.json({ok:false,service:'evalomics',database:'missing',demoIsolation:'unknown'},{status:503});
  }
  const database=createDatabase(databaseUrl);
  try{
    await database.pool.query('SELECT 1');
    const isolation=await database.pool.query(
      "SELECT (SELECT count(*) FROM public.organizations WHERE is_demo=true) + (SELECT count(*) FROM public.import_runs WHERE is_demo=true) + (SELECT count(*) FROM public.usage_records WHERE is_demo=true) + (SELECT count(*) FROM public.recommendations WHERE is_demo=true) + (SELECT count(*) FROM public.provider_evidence_snapshots WHERE is_demo=true) AS contaminated"
    );
    const contaminated=Number(isolation.rows[0]?.contaminated ?? 0);
    return Response.json({
      ok:contaminated===0,service:'evalomics',database:'ok',
      demoIsolation:contaminated===0?'ok':'violated',
      evidenceModel:['observed','potential','tested','verified']
    },{status:contaminated===0?200:503});
  }catch{
    return Response.json({ok:false,service:'evalomics',database:'error',demoIsolation:'unknown'},{status:503});
  }finally{
    await database.close();
  }
}
