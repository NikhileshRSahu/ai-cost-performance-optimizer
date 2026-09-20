'use client';

import { useEffect, useRef } from 'react';

type Particle = {
  x:number; y:number; tx:number; ty:number; vx:number; vy:number;
  size:number; phase:number; tone:0|1|2|3; ambient:boolean;
};

function flowPoint(t:number, lane:number){
  const x=.08 + .84*t;
  const amp=lane===0?.12:lane===1?.18:.22;
  const offset=lane===0?-.10:lane===1?.04:.13;
  const y=.5 + Math.sin((t*1.6 + lane*.18)*Math.PI*2)*amp + offset;
  return {x,y};
}

export default function EconomicConstellation(){
  const ref=useRef<HTMLCanvasElement|null>(null);

  useEffect(()=>{
    const canvas=ref.current;
    if(!canvas) return;
    const ctx=canvas.getContext('2d');
    if(!ctx) return;

    const reduce=window.matchMedia('(prefers-reduced-motion: reduce)');
    const fine=window.matchMedia('(pointer:fine)');
    let dpr=1,w=1,h=1,raf=0,visible=true,docVisible=document.visibilityState==='visible';
    let particles:Particle[]=[];
    let mouse={x:-9999,y:-9999,active:false};
    let last=performance.now();

    const rebuild=()=>{
      const rect=canvas.getBoundingClientRect();
      w=Math.max(1,rect.width); h=Math.max(1,rect.height);
      dpr=Math.min(window.devicePixelRatio||1,1.5);
      canvas.width=Math.round(w*dpr); canvas.height=Math.round(h*dpr);
      ctx.setTransform(dpr,0,0,dpr,0,0);

      const count=w<640?260:620;
      const next:Particle[]=[];
      for(let i=0;i<count;i++){
        const r=Math.random();
        let nx:number,ny:number,ambient=false;
        if(r<.72){
          const lane=i%3;
          const t=Math.random();
          const p=flowPoint(t,lane);
          nx=p.x+(Math.random()-.5)*.08;
          ny=p.y+(Math.random()-.5)*.08;
        } else if(r<.90){
          const a=Math.random()*Math.PI*2;
          const rad=.10+Math.random()*.22;
          nx=.57+Math.cos(a)*rad;
          ny=.49+Math.sin(a)*rad*.72;
        } else {
          ambient=true;
          nx=Math.random();
          ny=Math.random();
        }
        const tone:0|1|2|3 = r<.58?0:r<.72?1:r<.88?2:3;
        next.push({
          x:nx*w,y:ny*h,tx:nx*w,ty:ny*h,
          vx:0,vy:0,size:.7+Math.random()*1.5,
          phase:Math.random()*Math.PI*2,tone,ambient
        });
      }
      particles=next;
    };

    const triangle=(x:number,y:number,r:number,rotation:number,stroke:string,alpha:number)=>{
      ctx.save();
      ctx.translate(x,y);ctx.rotate(rotation);
      ctx.globalAlpha=alpha;
      ctx.strokeStyle=stroke;ctx.lineWidth=.8;
      ctx.beginPath();
      ctx.moveTo(0,-r);
      ctx.lineTo(r*.86,r*.58);
      ctx.lineTo(-r*.86,r*.58);
      ctx.closePath();ctx.stroke();
      ctx.restore();
    };

    const palette=['#f7f7f4','#ffad68','#6d8dff','#59d5be'];

    const draw=(now:number)=>{
      if(!visible||!docVisible) return;
      const dt=Math.min(32,now-last); last=now;
      ctx.clearRect(0,0,w,h);

      // connections are intentionally sparse: enough structure to read as a system,
      // never enough to turn into a generic network wallpaper.
      ctx.lineWidth=.55;
      for(let i=0;i<particles.length;i+=5){
        const a=particles[i];
        const b=particles[(i+11)%particles.length];
        const dx=a.x-b.x,dy=a.y-b.y;
        const dist=Math.hypot(dx,dy);
        if(dist<110){
          ctx.globalAlpha=(1-dist/110)*.12;
          ctx.strokeStyle=i%4===0?'#ffad68':'#6d8dff';
          ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);ctx.stroke();
        }
      }

      for(let i=0;i<particles.length;i++){
        const p=particles[i];
        if(!reduce.matches){
          const drift=Math.sin(now*.00055+p.phase)*1.8;
          const dx=p.tx+p.ambient?0:0;
          const tx=p.tx + Math.sin(now*.00035+p.phase)*3.2;
          const ty=p.ty + Math.cos(now*.00029+p.phase)*3.2 + drift;
          p.vx+=(tx-p.x)*.0045;
          p.vy+=(ty-p.y)*.0045;
          if(mouse.active&&fine.matches){
            const mx=p.x-mouse.x,my=p.y-mouse.y;
            const d2=mx*mx+my*my;
            if(d2<16000&&d2>1){
              const force=(1-d2/16000)*.38;
              p.vx+=(mx/Math.sqrt(d2))*force*dt;
              p.vy+=(my/Math.sqrt(d2))*force*dt;
            }
          }
          p.vx*=.92;p.vy*=.92;
          p.x+=p.vx;p.y+=p.vy;
        }
        const alpha=p.ambient?.16:.34 + Math.sin(now*.001+p.phase)*.08;
        triangle(p.x,p.y,p.size+(i%17===0?1.1:0),p.phase+now*.00005*(i%2?1:-1),palette[p.tone],alpha);
      }

      // moving economics signals — warm means waste/opportunity, cobalt means tested route.
      for(let k=0;k<5;k++){
        const t=((now*.000055)+(k*.19))%1;
        const lane=k%3;
        const p=flowPoint(t,lane);
        const x=p.x*w,y=p.y*h;
        const color=k<3?'#ffad68':'#6d8dff';
        ctx.globalAlpha=.24;ctx.fillStyle=color;
        ctx.beginPath();ctx.arc(x,y,10,0,Math.PI*2);ctx.fill();
        ctx.globalAlpha=.95;
        ctx.beginPath();ctx.arc(x,y,2.2,0,Math.PI*2);ctx.fill();
      }

      raf=requestAnimationFrame(draw);
    };

    const onPointer=(e:PointerEvent)=>{
      if(!fine.matches||reduce.matches) return;
      const rect=canvas.getBoundingClientRect();
      mouse={x:e.clientX-rect.left,y:e.clientY-rect.top,active:e.clientX>=rect.left&&e.clientX<=rect.right&&e.clientY>=rect.top&&e.clientY<=rect.bottom};
    };
    const onLeave=()=>{mouse.active=false};
    const onVisibility=()=>{docVisible=document.visibilityState==='visible'; if(docVisible&&visible){last=performance.now();raf=requestAnimationFrame(draw)}else cancelAnimationFrame(raf)};

    const resizeObserver=new ResizeObserver(rebuild);
    resizeObserver.observe(canvas);
    const io=new IntersectionObserver(([entry])=>{
      visible=entry.isIntersecting;
      if(visible&&docVisible){last=performance.now();raf=requestAnimationFrame(draw)}else cancelAnimationFrame(raf);
    },{rootMargin:'200px 0px'});
    io.observe(canvas);

    window.addEventListener('pointermove',onPointer,{passive:true});
    window.addEventListener('pointerleave',onLeave);
    document.addEventListener('visibilitychange',onVisibility);
    rebuild();
    raf=requestAnimationFrame(draw);

    return ()=>{
      cancelAnimationFrame(raf);
      resizeObserver.disconnect();io.disconnect();
      window.removeEventListener('pointermove',onPointer);
      window.removeEventListener('pointerleave',onLeave);
      document.removeEventListener('visibilitychange',onVisibility);
    };
  },[]);

  return (
    <div className="economic-constellation" aria-hidden="true">
      <canvas ref={ref}/>
      <div className="constellation-label label-observed"><span>OBSERVED</span><b>$41,208</b><small>30d baseline</small></div>
      <div className="constellation-label label-waste"><span>WASTE SIGNAL</span><b>61%</b><small>model overkill</small></div>
      <div className="constellation-label label-quality"><span>QUALITY FLOOR</span><b>98.6%</b><small>candidate result</small></div>
      <div className="constellation-label label-verified"><span>VERIFIED</span><b>$4,214/mo</b><small>production evidence</small></div>
    </div>
  );
}
