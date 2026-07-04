export default function Careers() {
  const perks = [
    { icon:'🌍', title:'Mission-driven', desc:'Build something real for West Africa' },
    { icon:'🏠', title:'Flexible work', desc:'Remote-friendly culture' },
    { icon:'📈', title:'Grow fast', desc:'Startup pace, big impact' },
    { icon:'💚', title:'Great team', desc:'Smart, kind, passionate people' },
  ];

  const jobs = [
    { title:'Frontend Developer (React)', type:'Full-time', loc:'Lomé, Togo / Remote', dept:'Engineering', urgent:true },
    { title:'Community Manager', type:'Full-time', loc:'Lomé, Togo', dept:'Marketing', urgent:false },
    { title:'Customer Support Specialist', type:'Part-time', loc:'Remote', dept:'Support', urgent:false },
    { title:'Business Development Manager', type:'Full-time', loc:'Lomé, Togo', dept:'Sales', urgent:true },
  ];

  return (
    <>
      <div className="page-hero">
        <div className="container">
          <div className="section-label">Join the team</div>
          <h1>Careers at<br />TogoConnect</h1>
          <p>Help us build the future of local services across West Africa. We are growing fast and looking for talented people.</p>
        </div>
      </div>

      {/* Perks */}
      <section className="section section-alt">
        <div className="container">
          <div style={{ textAlign:'center', marginBottom:40 }}>
            <div className="section-label">Why join us</div>
            <h2 className="section-title">Life at TogoConnect</h2>
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(200px,1fr))', gap:18 }}>
            {perks.map((p,i) => (
              <div key={i} style={{ background:'#fff', border:'1px solid #e2e8f0', borderRadius:14, padding:'24px 20px', textAlign:'center', transition:'all .2s' }}
                onMouseEnter={e => { e.currentTarget.style.borderColor='#1D9E75'; e.currentTarget.style.transform='translateY(-4px)'; e.currentTarget.style.boxShadow='0 10px 28px rgba(29,158,117,.12)'; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor='#e2e8f0'; e.currentTarget.style.transform=''; e.currentTarget.style.boxShadow=''; }}>
                <div style={{ fontSize:36, marginBottom:12 }}>{p.icon}</div>
                <div style={{ fontSize:15, fontWeight:700, color:'#0f1923', marginBottom:5 }}>{p.title}</div>
                <div style={{ fontSize:13, color:'#6b7280' }}>{p.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Jobs */}
      <section className="section">
        <div className="container" style={{ maxWidth:740 }}>
          <div style={{ textAlign:'center', marginBottom:40 }}>
            <div className="section-label">Open positions</div>
            <h2 className="section-title">Join our mission</h2>
          </div>

          {jobs.map((j,i) => (
            <div key={i} style={{ background:'#fff', border:'1.5px solid #e2e8f0', borderRadius:14, padding:'20px 24px', marginBottom:14, display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:14, cursor:'pointer', transition:'all .2s' }}
              onMouseEnter={e => { e.currentTarget.style.borderColor='#1D9E75'; e.currentTarget.style.boxShadow='0 6px 20px rgba(29,158,117,.1)'; e.currentTarget.style.transform='translateX(4px)'; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor='#e2e8f0'; e.currentTarget.style.boxShadow=''; e.currentTarget.style.transform=''; }}>
              <div>
                <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:7 }}>
                  <span style={{ fontSize:15, fontWeight:700, color:'#0f1923' }}>{j.title}</span>
                  {j.urgent && <span style={{ fontSize:10, fontWeight:700, background:'#fef2f2', color:'#dc2626', padding:'2px 8px', borderRadius:100 }}>Urgent</span>}
                </div>
                <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
                  <span style={{ fontSize:12, background:'#E1F5EE', color:'#0F6E56', padding:'3px 10px', borderRadius:100, fontWeight:600 }}>{j.dept}</span>
                  <span style={{ fontSize:12, color:'#6b7280' }}>📍 {j.loc}</span>
                  <span style={{ fontSize:12, color:'#6b7280' }}>⏱ {j.type}</span>
                </div>
              </div>
              <button style={{ padding:'10px 20px', background:'linear-gradient(135deg,#1D9E75,#0F6E56)', color:'#fff', border:'none', borderRadius:9, fontSize:13, fontWeight:700, cursor:'pointer', fontFamily:'inherit', flexShrink:0 }}>
                Apply →
              </button>
            </div>
          ))}

          <div style={{ marginTop:36, background:'#f8fafc', border:'1px solid #e2e8f0', borderRadius:16, padding:'28px', textAlign:'center' }}>
            <div style={{ fontSize:36, marginBottom:12 }}>📧</div>
            <h3 style={{ fontSize:17, fontWeight:700, marginBottom:8 }}>Don't see your role?</h3>
            <p style={{ fontSize:14, color:'#6b7280', marginBottom:18 }}>We're always open to talented people. Send your CV directly to our team.</p>
            <a href="mailto:careers@togoconnect.com"
              style={{ display:'inline-block', padding:'11px 24px', background:'#0f1923', color:'#fff', borderRadius:9, fontSize:14, fontWeight:600, textDecoration:'none' }}>
              careers@togoconnect.com
            </a>
          </div>
        </div>
      </section>
    </>
  );
}
