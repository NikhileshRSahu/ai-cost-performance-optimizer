'use client';
import Link from 'next/link';

type Props={
  hasData:boolean;
  opportunities:number;
  tested:number;
  verified:number;
  incomplete:boolean;
};

export default function CustomerSuccessPanel({hasData,opportunities,tested,verified,incomplete}:Props){
  const steps=[
    {done:hasData&&!incomplete,label:'Connect trustworthy usage',detail:incomplete?'Repair the latest import before acting.':'Usage evidence is available.',href:'/onboarding?step=3'},
    {done:opportunities>0,label:'Find one useful opportunity',detail:opportunities>0?opportunities+' decision area'+(opportunities===1?'':'s')+' detected.':'Evalomics is still looking for a defensible action.',href:'/dashboard/opportunities'},
    {done:tested>0,label:'Test one reversible change',detail:tested>0?'Measured experiment evidence exists.':'Do not roll out from an estimate alone.',href:'/dashboard/experiments'},
    {done:verified>0,label:'Prove the result in production',detail:verified>0?'At least one result is production-verified.':'Verified stays empty until production reconciliation passes.',href:'/dashboard/reports'}
  ];
  const complete=steps.filter(s=>s.done).length;
  return <section className="panel">
    <div className="section-title-row"><div><p className="eyebrow">YOUR PATH TO VALUE</p><h2>{complete===4?'You have completed the proof loop.':'Finish the next useful step.'}</h2><p>{complete} of 4 milestones complete. Evalomics keeps the path focused on evidence, not setup work.</p></div></div>
    <div className="role-notes">{steps.map((s,i)=><article key={s.label}><h3>{s.done?'✓ ':String(i+1)+'. '}{s.label}</h3><p>{s.detail}</p>{!s.done&&<Link className="btn outline small" href={s.href}>Do this next</Link>}</article>)}</div>
  </section>
}
