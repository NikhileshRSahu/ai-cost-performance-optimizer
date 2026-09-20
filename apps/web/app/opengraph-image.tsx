import { ImageResponse } from 'next/og';

export const alt = 'Evalomics — Analyze. Optimize. Prove.';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default function Image() {
  return new ImageResponse(
    <div style={{height:'100%',width:'100%',display:'flex',flexDirection:'column',justifyContent:'space-between',background:'#0b0b0c',color:'white',padding:'72px',fontFamily:'Arial'}}>
      <div style={{display:'flex',alignItems:'center',gap:'18px',fontSize:28,fontWeight:700}}>
        <div style={{width:28,height:28,borderRadius:7,background:'#ff7a1a'}}/>Evalomics
      </div>
      <div style={{display:'flex',flexDirection:'column',gap:'24px'}}>
        <div style={{display:'flex',flexDirection:'column',fontSize:82,lineHeight:.95,fontWeight:700,letterSpacing:'-4px'}}><span>Find AI waste.</span><span>Prove what improved.</span></div>
        <div style={{fontSize:28,color:'#a1a1aa'}}>Observed → Potential → Tested → Verified</div>
      </div>
      <div style={{fontSize:22,color:'#d4d4d8'}}>Analyze. Optimize. Prove.</div>
    </div>,
    size
  );
}
