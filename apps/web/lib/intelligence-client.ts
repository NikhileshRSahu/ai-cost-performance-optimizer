export type IntelligenceAnswer = Readonly<{
  answer:string;
  why:readonly string[];
  evidence:readonly string[];
  nextAction:string;
  confidence:'high'|'medium'|'low';
  limitations:readonly string[];
}>;

const WORKER_URL='https://br-icy-mountain-b484w1w7-evalomicsai.compute.c-6.us-east-2.aws.neon.tech/';

export async function askIntelligence(question:string,context:unknown):Promise<{result:IntelligenceAnswer;mode:'ai'|'fallback';model:string}>{
  try{
    const response=await fetch(WORKER_URL,{
      method:'POST',
      headers:{'content-type':'application/json'},
      body:JSON.stringify({question,context}),
      cache:'no-store'
    });
    const json=await response.json().catch(()=>null);
    const candidate=json?.result ?? json;
    if(!response.ok||!candidate?.answer) throw new Error('AI_WORKER_UNAVAILABLE');
    return {result:candidate as IntelligenceAnswer,mode:'ai',model:String(json?.model||'gpt-5-mini')};
  }catch{
    return {
      mode:'fallback',
      model:'deterministic-fallback',
      result:{
        answer:'The AI explanation service is temporarily unavailable. Your deterministic Evalomics evidence remains unchanged.',
        why:['The language model is intentionally separate from the financial evidence engine.'],
        evidence:[],
        nextAction:'Use the measured evidence now and retry Ask Evalomics shortly.',
        confidence:'high',
        limitations:['No language-model reasoning was used for this response.']
      }
    };
  }
}
