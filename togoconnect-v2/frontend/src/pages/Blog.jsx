import { useState } from 'react';

const POSTS = [
  { title:'How to Find the Best Plumber in Lomé', date:'June 20, 2026', cat:'Tips', read:'4 min', emoji:'🔧', desc:'A complete guide to hiring trusted plumbing professionals on TogoConnect without overpaying or getting scammed.' },
  { title:'5 Things to Check Before Hiring a Tutor', date:'June 15, 2026', cat:'Education', read:'3 min', emoji:'📚', desc:'Making sure your child gets the best education support. What to look for in a great tutor for lycée level.' },
  { title:'Growing Your Business with TogoConnect', date:'June 10, 2026', cat:'Sellers', read:'5 min', emoji:'🚀', desc:'How Togolese entrepreneurs are reaching thousands of new clients and doubling their income using our platform.' },
  { title:'Wedding Photography Tips for Couples in Togo', date:'June 5, 2026', cat:'Photography', read:'6 min', emoji:'📷', desc:'What to look for when booking your wedding photographer — and the right questions to ask before signing.' },
  { title:'TogoConnect Now Available Across West Africa', date:'May 28, 2026', cat:'News', read:'2 min', emoji:'🌍', desc:'We are expanding to Ghana, Benin, Nigeria and more countries. Find services wherever you are in West Africa.' },
  { title:'Safety Tips When Hiring Local Service Providers', date:'May 20, 2026', cat:'Safety', read:'3 min', emoji:'🔒', desc:'Best practices to stay safe, avoid scams, and have a great experience when hiring on TogoConnect.' },
];

const CAT_COLORS = {
  Tips: { bg:'#E1F5EE', color:'#0F6E56' },
  Education: { bg:'#eff6ff', color:'#1d4ed8' },
  Sellers: { bg:'#fef3c7', color:'#92400e' },
  Photography: { bg:'#fdf2f8', color:'#86198f' },
  News: { bg:'#f0fdf4', color:'#166534' },
  Safety: { bg:'#fef2f2', color:'#991b1b' },
};

export default function Blog() {
  const [active, setActive] = useState('All');
  const cats = ['All', ...Object.keys(CAT_COLORS)];
  const posts = active === 'All' ? POSTS : POSTS.filter(p => p.cat === active);

  return (
    <>
      <div className="page-hero">
        <div className="container">
          <div className="section-label">Our blog</div>
          <h1>Tips, news &<br />insights</h1>
          <p>Helpful guides, platform updates, and tips for buyers and sellers across Togo and West Africa.</p>
        </div>
      </div>

      <section className="section">
        <div className="container">
          {/* Filter pills */}
          <div style={{ display:'flex', gap:8, flexWrap:'wrap', marginBottom:36 }}>
            {cats.map(c => (
              <button key={c} onClick={() => setActive(c)}
                style={{ padding:'7px 18px', borderRadius:100, border:'1.5px solid', cursor:'pointer', fontFamily:'inherit', fontSize:13, fontWeight: active===c ? 700 : 500, transition:'all .15s',
                  borderColor: active===c ? '#1D9E75' : '#e2e8f0',
                  background: active===c ? '#1D9E75' : '#fff',
                  color: active===c ? '#fff' : '#374151',
                }}>
                {c}
              </button>
            ))}
          </div>

          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(300px,1fr))', gap:24 }}>
            {posts.map((p,i) => {
              const c = CAT_COLORS[p.cat];
              return (
                <article key={i} style={{ background:'#fff', border:'1px solid #e2e8f0', borderRadius:18, overflow:'hidden', cursor:'pointer', transition:'all .25s', display:'flex', flexDirection:'column' }}
                  onMouseEnter={e => { e.currentTarget.style.transform='translateY(-6px)'; e.currentTarget.style.boxShadow='0 16px 40px rgba(0,0,0,.1)'; e.currentTarget.style.borderColor='#1D9E75'; }}
                  onMouseLeave={e => { e.currentTarget.style.transform=''; e.currentTarget.style.boxShadow=''; e.currentTarget.style.borderColor='#e2e8f0'; }}>
                  <div style={{ height:150, background:'linear-gradient(135deg,#E1F5EE,#c8f0e0)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:56, position:'relative' }}>
                    {p.emoji}
                    <span style={{ position:'absolute', top:12, left:12, fontSize:11, fontWeight:700, background: c.bg, color: c.color, padding:'4px 11px', borderRadius:100 }}>{p.cat}</span>
                  </div>
                  <div style={{ padding:'20px 22px', flex:1, display:'flex', flexDirection:'column' }}>
                    <h3 style={{ fontSize:16, fontWeight:700, color:'#0f1923', marginBottom:10, lineHeight:1.4 }}>{p.title}</h3>
                    <p style={{ fontSize:13, color:'#374151', lineHeight:1.7, flex:1, marginBottom:16 }}>{p.desc}</p>
                    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', paddingTop:12, borderTop:'1px solid #f1f5f9' }}>
                      <span style={{ fontSize:12, color:'#9ca3af' }}>{p.date}</span>
                      <span style={{ fontSize:12, color:'#1D9E75', fontWeight:600 }}>⏱ {p.read} read</span>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      </section>
    </>
  );
}
