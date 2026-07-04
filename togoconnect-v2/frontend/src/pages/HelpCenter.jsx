import { useState } from 'react';
import { Link } from 'react-router-dom';

const FAQS = [
  { cat:'Account', icon:'👤', q:'How do I create an account?', a:'Click "Sign up free" in the navbar. Fill in your name, email, password and city. Your account is ready instantly — no approval needed.' },
  { cat:'Account', icon:'👤', q:'Can the same email be used for multiple accounts?', a:'No. Each email can only be linked to one TogoConnect account. This protects our community and prevents duplicate or fake accounts.' },
  { cat:'Account', icon:'👤', q:'How do I reset my password?', a:'Click "Forgot password?" on the login page and enter your email. You will receive a reset link within a few minutes.' },
  { cat:'Buyers', icon:'🛍️', q:'Is it free to search and contact sellers?', a:'Yes, completely free. Browsing, searching, and messaging sellers costs nothing. There are no booking fees or commissions — ever.' },
  { cat:'Buyers', icon:'🛍️', q:'How do I know if a seller is trustworthy?', a:'Check their rating, number of reviews, and read what past buyers say. Sellers with a verified badge have been consistently well-reviewed.' },
  { cat:'Buyers', icon:'🛍️', q:'What if the seller does not deliver as agreed?', a:'We recommend documenting your agreement through messages. If there is a dispute, contact our support team with your message history as evidence.' },
  { cat:'Sellers', icon:'🏪', q:'How do I post a listing?', a:'Log in to your account (with a Seller or Both role), go to your Dashboard, and click "Post a listing". Fill in the details, set your price, and publish.' },
  { cat:'Sellers', icon:'🏪', q:'How do I get more clients on TogoConnect?', a:'Complete your profile fully, add clear photos of past work, respond to messages quickly, and encourage satisfied clients to leave detailed reviews.' },
  { cat:'Payments', icon:'💳', q:'How do payments work on TogoConnect?', a:'Payments are handled directly between buyer and seller. TogoConnect does not process payments. You can agree on cash, mobile money (MTN, Moov), or bank transfer.' },
  { cat:'Payments', icon:'💳', q:'What is the Seller Pro plan for?', a:'The free plan allows buying. Paid plans unlock posting listings, verified badges, and analytics dashboards for professional sellers.' },
];

export default function HelpCenter() {
  const [open, setOpen] = useState(null);
  const [cat, setCat] = useState('All');
  const cats = [
    { id:'All', label:'All questions', icon:'❓' },
    { id:'Account', label:'Account', icon:'👤' },
    { id:'Buyers', label:'Buyers', icon:'🛍️' },
    { id:'Sellers', label:'Sellers', icon:'🏪' },
    { id:'Payments', label:'Payments', icon:'💳' },
  ];
  const filtered = cat === 'All' ? FAQS : FAQS.filter(f => f.cat === cat);

  return (
    <>
      <div className="page-hero">
        <div className="container">
          <div className="section-label">Help center</div>
          <h1>How can we<br />help you?</h1>
          <p>Find quick answers to common questions about using TogoConnect as a buyer or seller.</p>
        </div>
      </div>

      <section className="section">
        <div className="container" style={{ maxWidth:760 }}>

          {/* Category tabs */}
          <div style={{ display:'flex', gap:10, flexWrap:'wrap', marginBottom:36 }}>
            {cats.map(c => (
              <button key={c.id} onClick={() => { setCat(c.id); setOpen(null); }}
                style={{ display:'flex', alignItems:'center', gap:7, padding:'9px 18px', borderRadius:10, border:'1.5px solid', cursor:'pointer', fontFamily:'inherit', fontSize:13, fontWeight: cat===c.id ? 700 : 500, transition:'all .15s',
                  borderColor: cat===c.id ? '#1D9E75' : '#e2e8f0',
                  background: cat===c.id ? '#E1F5EE' : '#fff',
                  color: cat===c.id ? '#0F6E56' : '#374151',
                }}>
                {c.icon} {c.label}
              </button>
            ))}
          </div>

          {/* FAQ accordion */}
          <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
            {filtered.map((f,i) => (
              <div key={i} style={{ border:'1.5px solid', borderRadius:12, overflow:'hidden', transition:'border-color .15s', borderColor: open===i ? '#1D9E75' : '#e2e8f0' }}>
                <button onClick={() => setOpen(open===i ? null : i)}
                  style={{ width:'100%', padding:'16px 20px', display:'flex', justifyContent:'space-between', alignItems:'center', background: open===i ? '#f0fdf9' : '#fff', border:'none', cursor:'pointer', fontFamily:'inherit', textAlign:'left', gap:12 }}>
                  <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                    <span style={{ fontSize:16 }}>{f.icon}</span>
                    <span style={{ fontSize:14, fontWeight:600, color:'#0f1923' }}>{f.q}</span>
                  </div>
                  <div style={{ width:28, height:28, borderRadius:8, background: open===i ? '#1D9E75' : '#f1f5f9', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, transition:'all .2s' }}>
                    <span style={{ color: open===i ? '#fff' : '#374151', fontSize:16, fontWeight:700, lineHeight:1, transform: open===i ? 'rotate(45deg)' : 'none', display:'inline-block', transition:'transform .2s' }}>+</span>
                  </div>
                </button>
                {open===i && (
                  <div style={{ padding:'0 20px 18px 52px', fontSize:14, color:'#374151', lineHeight:1.78, background:'#f0fdf9', borderTop:'1px solid #E1F5EE' }}>
                    {f.a}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Still need help */}
          <div style={{ marginTop:44, background:'linear-gradient(135deg,#0f1923,#1a2940)', borderRadius:18, padding:'36px 32px', display:'grid', gridTemplateColumns:'1fr auto', gap:24, alignItems:'center' }}>
            <div>
              <div style={{ fontSize:11, fontWeight:700, letterSpacing:'.08em', textTransform:'uppercase', color:'#5DCAA5', marginBottom:8 }}>Still need help?</div>
              <h3 style={{ fontFamily:"'Playfair Display',serif", fontSize:20, fontWeight:700, color:'#fff', marginBottom:8 }}>Our team is here for you</h3>
              <p style={{ fontSize:14, color:'#94a3b8', lineHeight:1.7 }}>Can't find your answer? Contact our support team and we'll get back to you within a few hours.</p>
            </div>
            <Link to="/contact">
              <button style={{ padding:'12px 22px', background:'linear-gradient(135deg,#1D9E75,#0F6E56)', color:'#fff', border:'none', borderRadius:10, fontSize:14, fontWeight:700, cursor:'pointer', fontFamily:'inherit', whiteSpace:'nowrap', boxShadow:'0 4px 14px rgba(29,158,117,.3)' }}>
                Contact us →
              </button>
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
