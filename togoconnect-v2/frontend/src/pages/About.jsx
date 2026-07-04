import { Link } from 'react-router-dom';

const TEAM = [
  { name: 'Kossi Agbéko', role: 'Co-founder & CEO', initials: 'KA' },
  { name: 'Afi Mensah', role: 'Head of Operations', initials: 'AM' },
  { name: 'Yao Dzidzor', role: 'Lead Developer', initials: 'YD' },
  { name: 'Sika Komla', role: 'Community Manager', initials: 'SK' },
];

const VALUES = [
  { icon: '🤝', title: 'Trust first', desc: 'Every seller is reviewed by real community members. Transparency is our core.' },
  { icon: '🚀', title: 'Built for Togo', desc: 'We understand the local market, culture, and needs of Togolese communities.' },
  { icon: '💚', title: 'Zero hidden fees', desc: 'No commissions, no booking fees. Direct connections, always free.' },
  { icon: '⚡', title: 'Fast connections', desc: 'From search to first message in under 60 seconds — super smooth experience.' },
  { icon: '🌍', title: 'Community powered', desc: 'Reviews and ratings built by real users. The community keeps quality high.' },
  { icon: '📱', title: 'Always accessible', desc: 'Works on any device and connection speed. Built for real Togo.' },
];

export default function About() {
  return (
    <>
      <div className="page-hero">
        <div className="container">
          <div className="section-label">Our story</div>
          <h1>Built for Togo,<br />by Togolese.</h1>
          <p>Making it easy for anyone in Togo to find trusted local services and for skilled professionals to grow their business.</p>
        </div>
      </div>

      <section className="section">
        <div className="container">
          <div className="about-mission">
            <div>
              <div className="section-label">Our mission</div>
              <h2 className="section-title">Connecting communities across Togo</h2>
              <p className="section-sub" style={{ marginBottom:18 }}>We believe finding a trustworthy professional should be simple, transparent, and free. No agencies, no middlemen — just direct human connections.</p>
              <p style={{ fontSize:15, color:'var(--tm)', lineHeight:1.75 }}>Every day, thousands of Togolese use our platform to find plumbers, tutors, photographers and more — while skilled professionals grow their client base and earn a sustainable income.</p>
              <div style={{ display:'flex', gap:28, marginTop:32, paddingTop:24, borderTop:'1px solid var(--b)' }}>
                {[{n:'500+',l:'Sellers'},{n:'2K+',l:'Clients'},{n:'4.8★',l:'Rating'}].map(s => (
                  <div key={s.l}>
                    <div style={{ fontSize:24, fontWeight:800, letterSpacing:'-.02em' }}>{s.n}</div>
                    <div style={{ fontSize:13, color:'var(--tm)' }}>{s.l}</div>
                  </div>
                ))}
              </div>
            </div>
            <div className="about-illo">🌍</div>
          </div>
        </div>
      </section>

      <section className="section section-alt">
        <div className="container">
          <div style={{ textAlign:'center', marginBottom:44 }}>
            <div className="section-label">What we stand for</div>
            <h2 className="section-title">Our values</h2>
          </div>
          <div className="values-grid">
            {VALUES.map(v => (
              <div key={v.title} className="value-card">
                <div className="value-icon">{v.icon}</div>
                <h3>{v.title}</h3>
                <p>{v.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div style={{ textAlign:'center', marginBottom:44 }}>
            <div className="section-label">The people</div>
            <h2 className="section-title">Meet the team</h2>
          </div>
          <div className="team-grid">
            {TEAM.map(t => (
              <div key={t.name} className="team-card">
                <div className="team-avatar">{t.initials}</div>
                <div className="team-name">{t.name}</div>
                <div className="team-role">{t.role}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="cta-banner">
        <div className="container">
          <h2>Join our community</h2>
          <p>Whether you need a service or offer one, TogoConnect is the place to be.</p>
          <div className="cta-buttons">
            <Link to="/signup"><button className="btn-white">Get started free →</button></Link>
            <Link to="/contact"><button className="btn-outline-white">Contact us</button></Link>
          </div>
        </div>
      </section>
    </>
  );
}
