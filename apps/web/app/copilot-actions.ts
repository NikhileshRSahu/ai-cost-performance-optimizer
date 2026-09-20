'use server';

import { askIntelligence } from '@/lib/intelligence-client';

export async function askEvalomics(question:string,context:unknown){
  const clean=question.trim();
  if(clean.length<2||clean.length>1200) return {ok:false as const,error:'QUESTION_LENGTH_INVALID'};
  const response=await askIntelligence(clean,context);
  return {ok:true as const,...response};
}
