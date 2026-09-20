const MODEL='gpt-5-mini';
const VALIDATE='https://evalomics.vercel.app/api/ai/consume-token';
const SYSTEM=`You are Evalomics Intelligence, an evidence-grounded AI efficiency analyst.
Rules:
1. Use only the supplied tenant evidence. Never invent spend, savings, counts, prices, tests, or verification.
2. Potential is not savings. Tested is not savings. Only explicit Verified production evidence may be called savings.
3. Answer the user's intent first, then explain why, cite the supplied evidence, and give one useful next action.
4. If data is incomplete or ambiguous, say that clearly and reduce confidence.
5. For import diagnostics, distinguish invalid source data from parser/schema/mapping problems. A parser rejection does not prove the customer's data is wrong.
6. Never claim you changed production or verified a saving.
Return JSON only with: answer (string), why (string), evidence (array of short strings), nextAction (string), confidence ("high"|"medium"|"low"), caveats (array of strings).`;

function json(data,status=200){return new Response(JSON.stringify(data),{status,headers:{'content-type':'application/json'}})}
export default {
  async fetch(request){
    if(request.method!=='POST') return json({ok:false,error:'METHOD_NOT_ALLOWED'},405);
    try{
      const body=await request.json();
      const token=typeof body?.token==='string'?body.token:'';
      if(token.length<32) return json({ok:false,error:'INVALID_TOKEN'},401);
      const validation=await fetch(VALIDATE,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({token})});
      const v=await validation.json();
      if(!validation.ok||!v?.ok||!v?.payload) return json({ok:false,error:'TOKEN_REJECTED'},401);
      const base=process.env.NEON_AI_GATEWAY_BASE_URL;
      const gatewayToken=process.env.NEON_AI_GATEWAY_TOKEN;
      if(!base||!gatewayToken) return json({ok:false,error:'AI_GATEWAY_NOT_CONFIGURED'},503);
      const prompt='Task kind: '+v.payload.kind+'\nUser question: '+v.payload.question+'\nTenant evidence JSON:\n'+JSON.stringify(v.payload.context);
      const response=await fetch(base.replace(/\/$/,'')+'/v1/chat/completions',{
        method:'POST',
        headers:{authorization:'Bearer '+gatewayToken,'content-type':'application/json'},
        body:JSON.stringify({model:MODEL,messages:[{role:'system',content:SYSTEM},{role:'user',content:prompt}],max_tokens:900,response_format:{type:'json_object'}})
      });
      const data=await response.json();
      if(!response.ok) return json({ok:false,error:data?.error?.message||'MODEL_FAILED'},502);
      const content=data?.choices?.[0]?.message?.content;
      if(typeof content!=='string') return json({ok:false,error:'EMPTY_MODEL_RESPONSE'},502);
      let result;
      try{result=JSON.parse(content)}catch{return json({ok:false,error:'INVALID_MODEL_JSON'},502)}
      return json({ok:true,model:MODEL,result});
    }catch(error){return json({ok:false,error:error instanceof Error?error.message:'FUNCTION_FAILED'},500)}
  }
};
