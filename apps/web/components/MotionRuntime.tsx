'use client';

import { useEffect } from 'react';

export default function MotionRuntime(){
  useEffect(()=>{
    const root=document.querySelector<HTMLElement>('[data-cinematic-root]');
    if(!root) return;

    const reduce=window.matchMedia('(prefers-reduced-motion: reduce)');
    const fine=window.matchMedia('(hover:hover) and (pointer:fine)');
    let scrollRaf=0,pointerRaf=0;
    let pointerX=.5,pointerY=.5;

    const updateScroll=()=>{
      scrollRaf=0;
      const y=window.scrollY;
      root.toggleAttribute('data-scrolled',y>48);

      const hero=root.querySelector<HTMLElement>('[data-hero-scene]');
      if(hero){
        const rect=hero.getBoundingClientRect();
        const travel=Math.max(1,rect.height*.78);
        const progress=Math.min(1,Math.max(0,-rect.top/travel));
        root.style.setProperty('--hero-progress',progress.toFixed(4));
      }

      const story=root.querySelector<HTMLElement>('[data-economics-story]');
      if(story){
        const rect=story.getBoundingClientRect();
        const travel=Math.max(1,story.offsetHeight-window.innerHeight);
        const progress=Math.min(1,Math.max(0,-rect.top/travel));
        const rawStep=Math.min(3,Math.floor(Math.min(.9999,progress)*4));
        const keys=['observe','detect','test','verify'] as const;
        const stepStart=rawStep*.25;
        const stepProgress=Math.min(1,Math.max(0,(progress-stepStart)/.25));
        story.style.setProperty('--story-progress',progress.toFixed(4));
        story.style.setProperty('--story-step-progress',stepProgress.toFixed(4));
        story.setAttribute('data-story-step',keys[rawStep]);
      }
    };

    const requestScroll=()=>{if(!scrollRaf) scrollRaf=requestAnimationFrame(updateScroll)};

    const updatePointer=()=>{
      pointerRaf=0;
      root.style.setProperty('--pointer-x',pointerX.toFixed(4));
      root.style.setProperty('--pointer-y',pointerY.toFixed(4));
      root.style.setProperty('--pointer-dx',((pointerX-.5)*2).toFixed(4));
      root.style.setProperty('--pointer-dy',((pointerY-.5)*2).toFixed(4));
    };

    const onPointer=(event:PointerEvent)=>{
      if(reduce.matches||!fine.matches) return;
      pointerX=Math.min(1,Math.max(0,event.clientX/window.innerWidth));
      pointerY=Math.min(1,Math.max(0,event.clientY/window.innerHeight));
      root.style.setProperty('--cursor-x',event.clientX+'px');
      root.style.setProperty('--cursor-y',event.clientY+'px');
      if(!pointerRaf) pointerRaf=requestAnimationFrame(updatePointer);
    };

    const observer=new IntersectionObserver((entries)=>{
      for(const entry of entries)(entry.target as HTMLElement).classList.toggle('is-inview',entry.isIntersecting);
    },{rootMargin:'-7% 0px -7% 0px',threshold:[0,.12,.35,.6]});
    root.querySelectorAll<HTMLElement>('.motion-scene,[data-reveal]').forEach(node=>observer.observe(node));

    const navLinks=Array.from(root.querySelectorAll<HTMLAnchorElement>('.site-nav nav a[href^="#"]'));
    const sectionObserver=new IntersectionObserver((entries)=>{
      const visible=entries.filter(e=>e.isIntersecting).sort((a,b)=>b.intersectionRatio-a.intersectionRatio)[0];
      if(!visible) return;
      const id=(visible.target as HTMLElement).id;
      navLinks.forEach(link=>{
        const active=link.getAttribute('href')==='#'+id;
        link.classList.toggle('active',active);
        if(active) link.setAttribute('aria-current','location'); else link.removeAttribute('aria-current');
      });
    },{rootMargin:'-28% 0px -58% 0px',threshold:[0,.18,.4,.65]});
    ['manifesto','proof','pricing'].forEach(id=>{const el=root.querySelector<HTMLElement>('#'+id);if(el)sectionObserver.observe(el)});

    const magnetic=Array.from(root.querySelectorAll<HTMLElement>('[data-magnetic]'));
    const cleanupMagnetic:Array<()=>void>=[];
    if(fine.matches&&!reduce.matches){
      magnetic.forEach(node=>{
        const move=(event:PointerEvent)=>{
          const r=node.getBoundingClientRect();
          const dx=(event.clientX-(r.left+r.width/2))*.16;
          const dy=(event.clientY-(r.top+r.height/2))*.16;
          node.style.setProperty('--mag-x',dx.toFixed(2)+'px');
          node.style.setProperty('--mag-y',dy.toFixed(2)+'px');
        };
        const leave=()=>{node.style.setProperty('--mag-x','0px');node.style.setProperty('--mag-y','0px')};
        node.addEventListener('pointermove',move);node.addEventListener('pointerleave',leave);
        cleanupMagnetic.push(()=>{node.removeEventListener('pointermove',move);node.removeEventListener('pointerleave',leave)});
      });
    }

    const onReduce=()=>{root.toggleAttribute('data-reduced-motion',reduce.matches);updateScroll()};
    root.setAttribute('data-motion-ready','');
    root.style.setProperty('--cursor-x','50vw');root.style.setProperty('--cursor-y','35vh');
    onReduce();updatePointer();updateScroll();

    window.addEventListener('scroll',requestScroll,{passive:true});
    window.addEventListener('resize',requestScroll,{passive:true});
    window.addEventListener('pointermove',onPointer,{passive:true});
    reduce.addEventListener('change',onReduce);

    return ()=>{
      observer.disconnect();sectionObserver.disconnect();cleanupMagnetic.forEach(fn=>fn());
      cancelAnimationFrame(scrollRaf);cancelAnimationFrame(pointerRaf);
      window.removeEventListener('scroll',requestScroll);window.removeEventListener('resize',requestScroll);window.removeEventListener('pointermove',onPointer);
      reduce.removeEventListener('change',onReduce);
    };
  },[]);
  return null;
}