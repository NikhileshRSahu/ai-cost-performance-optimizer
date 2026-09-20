'use client';

import { useEffect } from 'react';

export default function MotionRuntime(){
  useEffect(()=>{
    const root=document.querySelector<HTMLElement>('[data-cinematic-root]');
    if(!root) return;

    const reduce=window.matchMedia('(prefers-reduced-motion: reduce)');
    const finePointer=window.matchMedia('(pointer:fine)');
    let scrollRaf=0;
    let pointerRaf=0;
    let pointerX=.5;
    let pointerY=.5;

    const updateScroll=()=>{
      scrollRaf=0;
      const y=window.scrollY;
      root.style.setProperty('--motion-scroll',String(y));
      root.toggleAttribute('data-scrolled',y>56);

      const hero=root.querySelector<HTMLElement>('[data-hero-scene]');
      if(hero){
        const rect=hero.getBoundingClientRect();
        const travel=Math.max(1,rect.height*0.72);
        const progress=Math.min(1,Math.max(0,-rect.top/travel));
        root.style.setProperty('--hero-progress',progress.toFixed(4));
      }
    };

    const requestScroll=()=>{
      if(!scrollRaf) scrollRaf=requestAnimationFrame(updateScroll);
    };

    const updatePointer=()=>{
      pointerRaf=0;
      root.style.setProperty('--pointer-x',pointerX.toFixed(4));
      root.style.setProperty('--pointer-y',pointerY.toFixed(4));
      root.style.setProperty('--pointer-dx',((pointerX-.5)*2).toFixed(4));
      root.style.setProperty('--pointer-dy',((pointerY-.5)*2).toFixed(4));
    };

    const onPointer=(event:PointerEvent)=>{
      if(reduce.matches || !finePointer.matches) return;
      pointerX=Math.min(1,Math.max(0,event.clientX/window.innerWidth));
      pointerY=Math.min(1,Math.max(0,event.clientY/window.innerHeight));
      if(!pointerRaf) pointerRaf=requestAnimationFrame(updatePointer);
    };

    const observer=new IntersectionObserver((entries)=>{
      for(const entry of entries){
        const node=entry.target as HTMLElement;
        node.classList.toggle('is-inview',entry.isIntersecting);
      }
    },{rootMargin:'-8% 0px -8% 0px',threshold:[0,.12,.35,.6]});

    root.querySelectorAll<HTMLElement>('.motion-scene,[data-reveal]').forEach(node=>observer.observe(node));

    const onReduce=()=>{
      root.toggleAttribute('data-reduced-motion',reduce.matches);
      updateScroll();
    };

    root.setAttribute('data-motion-ready','');
    onReduce();
    updatePointer();
    updateScroll();

    window.addEventListener('scroll',requestScroll,{passive:true});
    window.addEventListener('resize',requestScroll,{passive:true});
    window.addEventListener('pointermove',onPointer,{passive:true});
    reduce.addEventListener('change',onReduce);

    return ()=>{
      observer.disconnect();
      cancelAnimationFrame(scrollRaf);
      cancelAnimationFrame(pointerRaf);
      window.removeEventListener('scroll',requestScroll);
      window.removeEventListener('resize',requestScroll);
      window.removeEventListener('pointermove',onPointer);
      reduce.removeEventListener('change',onReduce);
      root.removeAttribute('data-motion-ready');
    };
  },[]);

  return null;
}
