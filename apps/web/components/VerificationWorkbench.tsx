'use client';
import { useMemo, useState } from 'react';

type Opportunity={id:string;title:string;state:string;sourceImportId:string|null};

function iso(local:string){
  const d=new Date(local);
  return Number.isFinite(d.getTime())?d.toISOString():'';
}

export default function VerificationWorkbench({opportunities,currency}:{opportunities:readonly Opportunity[];currency:string}){
  const source=useMemo(()=>opportunities.find(x=>x.state==='OPPORTUNITY')??null,[opportunities]);
  const [bench,setBench]=useState({workloadName:'',currentConfigurationId:'',candidateConfigurationId:'',requiredQuality:'0.90',maxP95LatencyMs:'',maxFailureRate:'',evaluatorVersion:'eval-v1'});
  const [benchmarkFile,setBenchmarkFile]=useState<File|null>(null);
  const [testedId,setTestedId]=useState('');
  const [benchResult,setBenchResult]=useState('');
  const [busy,setBusy]=useState('');
  const [error,setError]=useState('');

  const [impl,setImpl]=useState({implementedAt:'',rolloutStart:'',stabilizationEnd:'',deploymentNote:'',rollback:'Restore the previous configuration.'});
  const [implemented,setImplemented]=useState(false);

  const [postFile,setPostFile]=useState<File|null>(null);
  const [verify,setVerify]=useState({measuredQuality:'',postP95LatencyMs:'',postFailureRate:'',qualitySourceRef:'',implementationCost:'0',incrementalOperatingCost:'0'});
  const [attest,setAttest]=useState({unitDefinitionUnchanged:false,workloadMixComparable:false,concurrentDeploymentsResolved:false});
  const [verification,setVerification]=useState('');

  async function runBenchmark(){
    if(!benchmarkFile||!bench.workloadName||!bench.currentConfigurationId||!bench.candidateConfigurationId)return;
    setBusy('benchmark');setError('');setBenchResult('');
    const form=new FormData();form.set('file',benchmarkFile);
    Object.entries(bench).forEach(([k,v])=>form.set(k,v));
    form.set('currency',currency);if(source?.id)form.set('sourceRecommendationId',source.id);
    try{
      const response=await fetch('/api/experiments/benchmark',{method:'POST',body:form});
      const json=await response.json();if(!response.ok||!json.ok)throw new Error(json.error||'BENCHMARK_FAILED');
      setBenchResult(json.result.savingState==='TESTED'?'Benchmark passed. This change is now TESTED.':'Benchmark completed but did not justify a production change: '+String(json.result.decision));
      if(json.result.savingState==='TESTED')setTestedId(String(json.result.recommendationId));
    }catch(e){setError(e instanceof Error?e.message:'BENCHMARK_FAILED')}finally{setBusy('')}
  }

  async function confirmRollout(){
    if(!testedId)return;setBusy('implementation');setError('');
    try{
      const response=await fetch('/api/experiments/implementation',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({
        recommendationId:testedId,implementedAt:iso(impl.implementedAt),rolloutStart:iso(impl.rolloutStart),stabilizationEnd:iso(impl.stabilizationEnd),
        deploymentNote:impl.deploymentNote,rollbackInstructions:[impl.rollback]
      })});
      const json=await response.json();if(!response.ok||!json.ok)throw new Error(json.error||'IMPLEMENTATION_FAILED');
      setImplemented(true);
    }catch(e){setError(e instanceof Error?e.message:'IMPLEMENTATION_FAILED')}finally{setBusy('')}
  }

  async function verifyProduction(){
    if(!postFile||!testedId)return;setBusy('verify');setError('');setVerification('');
    const form=new FormData();form.set('file',postFile);form.set('recommendationId',testedId);
    Object.entries(verify).forEach(([k,v])=>form.set(k,v));
    Object.entries(attest).forEach(([k,v])=>form.set(k,String(v)));
    try{
      const response=await fetch('/api/experiments/verify',{method:'POST',body:form});
      const json=await response.json();if(!response.ok||!json.ok)throw new Error(json.error||'VERIFICATION_FAILED');
      const result=json.result.result;
      setVerification(result.status==='VERIFIED'?'VERIFIED — production reconciliation passed.':String(result.status)+' — '+(result.reasons??[]).join(', '));
    }catch(e){setError(e instanceof Error?e.message:'VERIFICATION_FAILED')}finally{setBusy('')}
  }

  return <section className="verification-workbench">
    <div className="section-title-row"><div><p className="eyebrow">PROVE ONE CHANGE END TO END</p><h2>Verification workbench</h2><p>Nothing becomes Verified from a recommendation alone. Bring benchmark evidence, confirm the rollout, then supply post-change production evidence.</p></div></div>
    {source?<div className="pilot-source"><span>Starting opportunity</span><strong>{source.title}</strong><small>{source.id}</small></div>:<div className="pilot-source"><strong>No active Potential opportunity is available yet.</strong><span>Import enough usage evidence first.</span></div>}
    <div className="verification-steps">
      <article>
        <span className="step-number">1</span><h3>Benchmark the candidate</h3><p>CSV columns: case_id, repetition_id, configuration_id, outcome, quality_score, latency_ms, cost, evaluator_version. Use at least 30 paired cases for a defensible result.</p>
        <label>Workload name<input value={bench.workloadName} onChange={e=>setBench({...bench,workloadName:e.target.value})} placeholder="e.g. support_answer"/></label>
        <div className="two-fields"><label>Current configuration<input value={bench.currentConfigurationId} onChange={e=>setBench({...bench,currentConfigurationId:e.target.value})}/></label><label>Candidate configuration<input value={bench.candidateConfigurationId} onChange={e=>setBench({...bench,candidateConfigurationId:e.target.value})}/></label></div>
        <div className="two-fields"><label>Required quality (0–1)<input value={bench.requiredQuality} onChange={e=>setBench({...bench,requiredQuality:e.target.value})}/></label><label>Max failure rate (optional)<input value={bench.maxFailureRate} onChange={e=>setBench({...bench,maxFailureRate:e.target.value})}/></label></div>
        <label>Benchmark CSV<input type="file" accept=".csv,text/csv" onChange={e=>setBenchmarkFile(e.target.files?.[0]??null)}/></label>
        <button className="btn black" disabled={busy!==''||!benchmarkFile||!source} onClick={()=>void runBenchmark()}>{busy==='benchmark'?'Evaluating…':'Evaluate benchmark'}</button>
        {benchResult&&<p className="success-line">{benchResult}</p>}
      </article>

      <article className={!testedId?'muted-step':''}>
        <span className="step-number">2</span><h3>Confirm the production rollout</h3><p>This records what actually changed. Evalomics still does not call the result savings.</p>
        <label>Implemented at<input type="datetime-local" value={impl.implementedAt} onChange={e=>setImpl({...impl,implementedAt:e.target.value})}/></label>
        <label>Rollout start<input type="datetime-local" value={impl.rolloutStart} onChange={e=>setImpl({...impl,rolloutStart:e.target.value})}/></label>
        <label>Stabilization end<input type="datetime-local" value={impl.stabilizationEnd} onChange={e=>setImpl({...impl,stabilizationEnd:e.target.value})}/></label>
        <label>Deployment note<textarea rows={3} value={impl.deploymentNote} onChange={e=>setImpl({...impl,deploymentNote:e.target.value})}/></label>
        <label>Rollback instruction<input value={impl.rollback} onChange={e=>setImpl({...impl,rollback:e.target.value})}/></label>
        <button className="btn black" disabled={!testedId||busy!==''||!impl.implementedAt||!impl.rolloutStart||!impl.stabilizationEnd||!impl.deploymentNote} onClick={()=>void confirmRollout()}>{busy==='implementation'?'Recording…':'Confirm rollout'}</button>
        {implemented&&<p className="success-line">Rollout recorded. The result remains TESTED until production verification passes.</p>}
      </article>

      <article className={!implemented?'muted-step':''}>
        <span className="step-number">3</span><h3>Verify against production</h3><p>Upload a post-change usage CSV for the same workload. Evalomics compares the baseline lineage, quality floor, unit economics, and production window.</p>
        <label>Post-change usage CSV<input type="file" accept=".csv,text/csv" onChange={e=>setPostFile(e.target.files?.[0]??null)}/></label>
        <div className="two-fields"><label>Measured quality<input value={verify.measuredQuality} onChange={e=>setVerify({...verify,measuredQuality:e.target.value})} placeholder="0.93"/></label><label>Quality evidence reference<input value={verify.qualitySourceRef} onChange={e=>setVerify({...verify,qualitySourceRef:e.target.value})} placeholder="eval-run-2026-09-20"/></label></div>
        <div className="two-fields"><label>p95 latency ms (optional)<input value={verify.postP95LatencyMs} onChange={e=>setVerify({...verify,postP95LatencyMs:e.target.value})}/></label><label>Failure rate (optional)<input value={verify.postFailureRate} onChange={e=>setVerify({...verify,postFailureRate:e.target.value})}/></label></div>
        <div className="attestations">
          <label><input type="checkbox" checked={attest.unitDefinitionUnchanged} onChange={e=>setAttest({...attest,unitDefinitionUnchanged:e.target.checked})}/> Unit definition is unchanged</label>
          <label><input type="checkbox" checked={attest.workloadMixComparable} onChange={e=>setAttest({...attest,workloadMixComparable:e.target.checked})}/> Workload mix is comparable</label>
          <label><input type="checkbox" checked={attest.concurrentDeploymentsResolved} onChange={e=>setAttest({...attest,concurrentDeploymentsResolved:e.target.checked})}/> Concurrent deployments are accounted for</label>
        </div>
        <button className="btn black" disabled={!implemented||!postFile||busy!==''||!verify.measuredQuality||!verify.qualitySourceRef||Object.values(attest).some(v=>!v)} onClick={()=>void verifyProduction()}>{busy==='verify'?'Reconciling…':'Run production verification'}</button>
        {verification&&<p className="success-line">{verification}</p>}
      </article>
    </div>
    {error&&<p className="form-error">{error}</p>}
  </section>
}
