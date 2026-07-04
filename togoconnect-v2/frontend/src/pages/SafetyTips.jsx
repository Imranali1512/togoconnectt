export default function SafetyTips() {
  const tips = [
    { icon:'👀', color:'#E1F5EE', accent:'#1D9E75', title:'Always check reviews first', desc:'Before contacting any seller, read their reviews carefully. Look for patterns — consistent praise or complaints across multiple reviews are usually reliable.' },
    { icon:'💬', color:'#eff6ff', accent:'#2563eb', title:'Agree everything in writing', desc:'Discuss full scope, timeline, and total price before work begins. Use the TogoConnect message system so everything is documented.' },
    { icon:'📍', color:'#fef3c7', accent:'#d97706', title:'Meet in a safe location first', desc:'For in-person services, consider meeting in a public place first to verify the provider matches their profile before welcoming them to your home.' },
    { icon:'💰', color:'#fdf4ff', accent:'#9333ea', title:'Never pay 100% upfront', desc:'For larger jobs, agree on a reasonable deposit (30–50%) and pay the balance only after satisfactory completion of work.' },
    { icon:'📸', color:'#fff7ed', accent:'#ea580c', title:'Screenshot your agreement', desc:'Take screenshots of your message thread before work starts. This is your record of what was agreed if any dispute arises later.' },
    { icon:'🚨', color:'#fef2f2', accent:'#dc2626', title:'Report suspicious behaviour', desc:'If a seller asks for unusual payment methods, pressures you, or behaves suspiciously — report them using the flag button on their profile immediately.' },
    { icon:'🔒', color:'#f0fdf4', accent:'#16a34a', title:'Protect your personal data', desc:'Never share your national ID, bank account details, or passwords with any seller. TogoConnect will never ask you for these details.' },
    { icon:'⭐', color:'#fefce8', accent:'#ca8a04', title:'Leave honest reviews', desc:'After every job — good or bad — leave an honest review. This is how our community stays safe and trustworthy for everyone.' },
  ];

  return (
    <>
      <div className="page-hero">
        <div className="container">
          <div className="section-label">Stay protected</div>
          <h1>Safety tips for<br />buyers & sellers</h1>
          <p>TogoConnect is committed to keeping our community safe. Follow these guidelines for every transaction.</p>
        </div>
      </div>

      <section className="section">
        <div className="container">
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(280px,1fr))', gap:20 }}>
            {tips.map((t,i) => (
              <div key={i} style={{ background:'#fff', border:'1.5px solid #e9eef5', borderRadius:16, padding:'26px 22px', transition:'all .22s', cursor:'default' }}
                onMouseEnter={e => { e.currentTarget.style.borderColor=t.accent; e.currentTarget.style.transform='translateY(-4px)'; e.currentTarget.style.boxShadow=`0 12px 32px ${t.accent}20`; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor='#e9eef5'; e.currentTarget.style.transform=''; e.currentTarget.style.boxShadow=''; }}>
                <div style={{ width:52, height:52, borderRadius:14, background:t.color, border:`1.5px solid ${t.accent}25`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:24, marginBottom:16 }}>
                  {t.icon}
                </div>
                <h3 style={{ fontSize:15, fontWeight:700, color:'#0f1923', marginBottom:9 }}>{t.title}</h3>
                <p style={{ fontSize:13, color:'#374151', lineHeight:1.72 }}>{t.desc}</p>
              </div>
            ))}
          </div>

          <div style={{ marginTop:40, background:'#fef2f2', border:'1.5px solid #fecaca', borderRadius:16, padding:'24px 28px', display:'flex', gap:18, alignItems:'flex-start' }}>
            <div style={{ fontSize:32, flexShrink:0 }}>🚨</div>
            <div>
              <h3 style={{ fontSize:15, fontWeight:700, color:'#991b1b', marginBottom:7 }}>Emergency contact</h3>
              <p style={{ fontSize:14, color:'#7f1d1d', lineHeight:1.7 }}>If you believe you have been a victim of fraud or feel unsafe, contact our safety team immediately at <strong>safety@togoconnect.com</strong> or report through the platform.</p>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
