'use client';

import { useRef } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { CheckCircle2, Database, FileSpreadsheet, FlaskConical, Network } from 'lucide-react';

function UploadScreen() {
  return <div className="et-stack-screen">
    <div className="et-stack-top"><span>USAGE · CONNECT</span><b>Connect or upload usage</b></div>
    <div className="et-stack-grid">
      <div className="et-stack-tile active"><FileSpreadsheet size={18}/><b>CSV upload</b><small>demo-usage.csv</small></div>
      <div className="et-stack-tile"><Database size={18}/><b>OpenAI</b><small>Connect provider</small></div>
      <div className="et-stack-tile"><Network size={18}/><b>Anthropic</b><small>Connect provider</small></div>
    </div>
    <div className="et-stack-success"><CheckCircle2 size={17}/><div><b>demo-usage.csv uploaded</b><small>Ready for analysis</small></div></div>
  </div>
}

function AnalyzeScreen() {
  return <div className="et-stack-screen">
    <div className="et-stack-top"><span>USAGE · ANALYZED</span><b>Cost intelligence</b></div>
    <div className="et-stack-metrics">
      <div><small>Observed spend</small><b>$1,774.78</b></div>
      <div><small>Requests</small><b>22,380</b></div>
      <div><small>Models used</small><b>7</b></div>
    </div>
    <div className="et-stack-chart"><i/><i/><i/><i/><i/><i/><i/><i/><i/><i/><i/><i/></div>
    <div className="et-stack-caption">Provider evidence normalized across requests, tokens, models, and spend.</div>
  </div>
}

function DetectScreen() {
  return <div className="et-stack-screen">
    <div className="et-stack-top"><span>OPPORTUNITY · HIGH CONFIDENCE</span><b>Repeated input detected</b></div>
    <div className="et-stack-signal"><div><small>Similar requests</small><b>1,248</b></div><div><small>Avoidable spend</small><b>$87.42</b></div><div><small>Evidence</small><b>High</b></div></div>
    <div className="et-stack-bars"><span style={{width:'92%'}}/><span style={{width:'76%'}}/><span style={{width:'58%'}}/><span style={{width:'39%'}}/></div>
    <div className="et-stack-action">Recommended next action <b>Test cache reuse →</b></div>
  </div>
}

function VerifyScreen() {
  return <div className="et-stack-screen">
    <div className="et-stack-top"><span>PROOF · RECONCILED</span><b>Verified savings</b></div>
    <div className="et-stack-proof">
      <div><small>Potential</small><b>$286–$421</b></div>
      <div><small>Tested</small><b>$142.17</b></div>
      <div className="verified"><small>Verified</small><b>$109.32</b></div>
    </div>
    <div className="et-stack-quality"><FlaskConical size={17}/><div><b>Quality floor passed</b><small>96.8% retained quality</small></div></div>
    <div className="et-stack-success"><CheckCircle2 size={17}/><div><b>$109.32 verified</b><small>Production evidence reconciled</small></div></div>
  </div>
}

// Recommit: Launch-style stacked showcase deployment trigger v4\nexport function GuidedShowcaseDemo(){
  const ref=useRef<HTMLElement>(null);
  const {scrollYProgress}=useScroll({target:ref,offset:['start start','end end']});
  const x1=useTransform(scrollYProgress,[0,1],['-18%','-34%']);
  const y1=useTransform(scrollYProgress,[0,1],['10%','-6%']);
  const r1=useTransform(scrollYProgress,[0,1],[-8,-3]);
  const s1=useTransform(scrollYProgress,[0,1],[.94,1.02]);
  const x2=useTransform(scrollYProgress,[0,1],['10%','-4%']);
  const y2=useTransform(scrollYProgress,[0,1],['18%','3%']);
  const r2=useTransform(scrollYProgress,[0,1],[-5,-1]);
  const s2=useTransform(scrollYProgress,[0,1],[.98,1.06]);
  const x3=useTransform(scrollYProgress,[0,1],['36%','18%']);
  const y3=useTransform(scrollYProgress,[0,1],['26%','8%']);
  const r3=useTransform(scrollYProgress,[0,1],[-2,1]);
  const s3=useTransform(scrollYProgress,[0,1],[1.02,1.10]);
  const opacity1=useTransform(scrollYProgress,[0,.72,.9],[1,1,0]);
  const opacity4=useTransform(scrollYProgress,[.58,.82],[0,1]);
  const titleY=useTransform(scrollYProgress,[0,1],[40,-30]);

  return <section ref={ref} className="et-launch-scroll">
    <div className="et-launch-sticky">
      <div className="et-launch-glow"/>
      <motion.div className="et-launch-copy" style={{y:titleY}}>
        <span>How Evalomics works</span>
        <h2>From raw usage<br/>to verified savings.</h2>
        <p>Scroll through the evidence chain. Evalomics turns provider usage into cost intelligence, isolates waste, tests the change, and only then calls savings verified.</p>
      </motion.div>
      <div className="et-launch-stage">
        <motion.div className="et-launch-card back" style={{x:x1,y:y1,rotate:r1,scale:s1,opacity:opacity1}}><UploadScreen/></motion.div>
        <motion.div className="et-launch-card middle" style={{x:x2,y:y2,rotate:r2,scale:s2}}><AnalyzeScreen/></motion.div>
        <motion.div className="et-launch-card front" style={{x:x3,y:y3,rotate:r3,scale:s3}}><DetectScreen/></motion.div>
        <motion.div className="et-launch-card final" style={{x:x1,y:y1,rotate:r1,scale:s1,opacity:opacity4}}><VerifyScreen/></motion.div>
      </div>
      <div className="et-launch-scrollhint">SCROLL TO EXPLORE <span>↓</span></div>
    </div>
  </section>
}
