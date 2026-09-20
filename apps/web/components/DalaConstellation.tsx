'use client';

import { useEffect, useRef } from 'react';

type Particle={x:number;y:number;tx:number;ty:number;phase:number;size:number;color:string};

export default function DalaConstellation(){
  const ref=useRef<HTMLCanvasElement|null>(null);

  useEffect(()=>{
    const canvas=ref.current;
    if(!canvas) return;
    const ctx=canvas.getContext('2d');
    if(!ctx) return;

    const reduce=window.matchMedia('(prefers-reduced-motion: reduce)');
    const fine=window.matchMedia('(pointer:fine)');
    let w=1,h=1,dpr=1,raf=0,visible=true;
    let pointer={x:-9999,y:-9999};
    let particles:Particle[]=[];

    const palette=['#8052ff','#ffb829','#15846e','#c74cff','#4d8fff','#ffffff'];

    const insideShape=(nx:number,ny:number)=>{
      // two organic lobes connected by a narrow bridge: intentionally brain/cloud-like
      const left=((nx-.42)/.28)**2+((ny-.48)/.26)**2 < 1;
      const right=((nx-.64)/.26)**2+((ny-.48)/.24)**2 < 1;
      const bridge=((nx-.53)/.18)**2+((ny-.50)/.12)**2 < 1;
      const bite=(((nx-.53)/.08)**2+((ny-.67)/.08)**2)<1;
      return (left||right||bridge)&&!bite;
    };

    const rebuild=()=>{
      const rect=canvas.getBoundingClientRect();
      w=Math.max(1,rect.width); h=Math.max(1,rect.height);
      dpr=Math.min(window.devicePixelRatio||1,1.5);
      canvas.width=Math.round(w*dpr); canvas.height=Math.round(h*dpr);
      ctx.setTransform(dpr,0,0,dpr,0,0);

      const count=w<700?520:1200;
      const next:Particle[]=[];
      for(let i=0;i<count;i++){
        let nx=Math.random(),ny=Math.random(),tries=0;
        const ambient=i<count*.15;
        if(!ambient){
          while(!insideShape(nx,ny)&&tries<80){nx=Math.random();ny=Math.random();tries++;}
        }
        const tx=nx*w,ty=ny*h;
        next.push({
          x:tx+(Math.random()-.5)*12,
          y:ty+(Math.random()-.5)*12,
          tx,ty,
          phase:Math.random()*Math.PI*2,
          size:.75+Math.random()*1.25,
          color:palette[Math.floor(Math.random()*palette.length)]
        });
      }
      particles=next;
    };

    const triangle=(p:Particle,t:number)=>{
      const drift=reduce.matches?0:Math.sin(t*.00055+p.phase)*2.6;
      let x=p.tx+Math.cos(t*.00033+p.phase)*3.6;
      let y=p.ty+Math.sin(t*.00029+p.phase)*3.6+drift;
      if(fine.matches&&!reduce.matches){
        const dx=x-pointer.x,dy=y-pointer.y,d=Math.hypot(dx,dy);
        if(d<125&&d>1){const f=(1-d/125)*10;x+=(dx/d)*f;y+=(dy/d)*f;}
      }
      ctx.save();
      ctx.translate(x,y);
      ctx.rotate(p.phase+t*.000045);
      ctx.globalAlpha=.18+.3*(.5+.5*Math.sin(t*.001+p.phase));
      ctx.strokeStyle=p.color;
      ctx.lineWidth=.8;
      const r=p.size;
      ctx.beginPath();
      ctx.moveTo(0,-r);
      ctx.lineTo(r*.86,r*.58);
      ctx.lineTo(-r*.86,r*.58);
      ctx.closePath();
      ctx.stroke();
      ctx.restore();
    };

    const draw=(t:number)=>{
      if(!visible)return;
      ctx.clearRect(0,0,w,h);

      // sparse connective lines create distributed-intelligence depth
      for(let i=0;i<particles.length;i+=19){
        const a=particles[i],b=particles[(i+37)%particles.length];
        const d=Math.hypot(a.tx-b.tx,a.ty-b.ty);
        if(d<100){
          ctx.globalAlpha=.08;
          ctx.strokeStyle=i%3===0?'#ffb829':'#8052ff';
          ctx.lineWidth=.5;
          ctx.beginPath();ctx.moveTo(a.tx,a.ty);ctx.lineTo(b.tx,b.ty);ctx.stroke();
        }
      }

      particles.forEach(p=>triangle(p,t));
      if(!reduce.matches)raf=requestAnimationFrame(draw);
    };

    const ro=new ResizeObserver(rebuild);
    ro.observe(canvas);
    const io=new IntersectionObserver(([entry])=>{
      visible=entry.isIntersecting;
      cancelAnimationFrame(raf);
      if(visible){raf=requestAnimationFrame(draw);}
    },{rootMargin:'150px 0px'});
    io.observe(canvas);

    const onPointer=(e:PointerEvent)=>{
      const r=canvas.getBoundingClientRect();
      pointer={x:e.clientX-r.left,y:e.clientY-r.top};
    };
    window.addEventListener('pointermove',onPointer,{passive:true});
    rebuild();
    raf=requestAnimationFrame(draw);

    return()=>{cancelAnimationFrame(raf);ro.disconnect();io.disconnect();window.removeEventListener('pointermove',onPointer);};
  },[]);

  return <canvas ref={ref} className="dala-constellation" aria-hidden="true"/>;
}
