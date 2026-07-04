import { Link } from 'react-router-dom';

const STEPS = [
  { n:'01', icon:'🔍', title:'Search for a service', desc:'Browse by category, city, price, or rating. Use the search bar to find exactly what you need — whether you are in Lomé, Accra, or Lagos.', color:'#E1F5EE', accent:'#1D9E75' },
  { n:'02', icon:'👤', title:'View seller profiles', desc:'Every seller has a public profile with ratings, reviews, work samples, and pricing. Read what past buyers say before making any decisions.', color:'#eff6ff', accent:'#2563eb' },
  { n:'03', icon:'💬', title:'Message directly', desc:'No middlemen. Message the seller directly to discuss scope of work, negotiate pricing, and agree on a timeline that suits both parties.', color:'#fef3c7', accent:'#d97706' },
  { n:'04', icon:'🤝', title:'Agree and get it done', desc:'Once you agree on price and details, the seller gets to work. All payment and logistics are handled directly between buyer and seller.', color:'#fdf4ff', accent:'#9333ea' },
  { n:'05', icon:'⭐', title:'Leave a review', desc:'After the job is done, leave an honest review. This helps other buyers make good decisions and rewards great sellers with more visibility.', color:'#fff7ed', accent:'#ea580c' },
];

export default function HowItWorks() {
  return (
    <>
      <div className="page-hero">
        <div className="container">
          <div className="section-label">Simple process</div>
          <h1>How TogoConnect<br />works</h1>
          <p>Find and hire trusted local professionals in 5 easy steps — completely free, no hidden fees ever.</p>
        </div>
      </div>

      <section className="section">
        <div className="container" style={{ maxWidth:800 }}>
          <div style={{ display:'flex', flexDirection:'column', gap:0 }}>
            {STEPS.map((s, i) => (
              <div key={i} style={{ display:'grid', gridTemplateColumns:'120px 1fr', gap:0, position:'relative' }}>
                {/* Left — number + connector */}
                <div style={{ display:'flex', flexDirection:'column', alignItems:'center', paddingTop:8 }}>
                  <div style={{ width:64, height:64, borderRadius:18, background:s.color, border:`2px solid ${s.accent}30`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:28, flexShrink:0, position:'relative', zIndex:1, boxShadow:`0 4px 16px ${s.accent}20` }}>
                    {s.icon}
                  </div>
                  {i < STEPS.length-1 && (
                    <div style={{ width:2, flex:1, minHeight:40, background:`linear-gradient(180deg,${s.accent}40,${STEPS[i+1].accent}40)`, margin:'6px 0', borderRadius:2 }}></div>
                  )}
                </div>

                {/* Right — content */}
                <div style={{ paddingLeft:24, paddingBottom: i < STEPS.length-1 ? 40 : 0, paddingTop:8 }}>
                  <div style={{ fontSize:11, fontWeight:800, color:s.accent, letterSpacing:'.1em', textTransform:'uppercase', marginBottom:6 }}>Step {s.n}</div>
                  <h3 style={{ fontSize:19, fontWeight:700, color:'#0f1923', marginBottom:10, lineHeight:1.3 }}>{s.title}</h3>
                  <p style={{ fontSize:15, color:'#374151', lineHeight:1.8, maxWidth:540 }}>{s.desc}</p>
                </div>
              </div>
            ))}
          </div>

          {/* CTA */}
          <div style={{ marginTop:52, background:'linear-gradient(135deg,#0F6E56,#1D9E75)', borderRadius:20, padding:'40px 36px', textAlign:'center', color:'#fff', position:'relative', overflow:'hidden' }}>
            <div style={{ position:'absolute', top:-40, right:-40, width:180, height:180, background:'rgba(255,255,255,.05)', borderRadius:'50%' }}></div>
            <div style={{ fontSize:36, marginBottom:14, position:'relative' }}>🚀</div>
            <h3 style={{ fontFamily:"'Playfair Display',serif", fontSize:24, fontWeight:700, marginBottom:10, position:'relative' }}>Ready to get started?</h3>
            <p style={{ fontSize:15, opacity:.82, marginBottom:26, position:'relative' }}>Browse hundreds of trusted services or sign up as a seller — completely free.</p>
            <div style={{ display:'flex', gap:12, justifyContent:'center', flexWrap:'wrap', position:'relative' }}>
              <Link to="/services"><button style={{ padding:'12px 26px', background:'#fff', color:'#0F6E56', border:'none', borderRadius:10, fontSize:14, fontWeight:700, cursor:'pointer', fontFamily:'inherit', boxShadow:'0 4px 14px rgba(0,0,0,.15)' }}>Browse services →</button></Link>
              <Link to="/signup"><button style={{ padding:'12px 26px', background:'rgba(255,255,255,.14)', color:'#fff', border:'1.5px solid rgba(255,255,255,.3)', borderRadius:10, fontSize:14, fontWeight:600, cursor:'pointer', fontFamily:'inherit' }}>Join for free</button></Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
