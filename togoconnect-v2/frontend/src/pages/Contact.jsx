import { useState } from 'react';

export default function Contact() {
  const [form, setForm] = useState({ name:'', email:'', subject:'', message:'' });
  const [sent, setSent] = useState(false);

  return (
    <>
      <div className="page-hero alt-bg">
        <div className="container">
          <div className="section-label">Get in touch</div>
          <h1>We'd love to<br />hear from you.</h1>
          <p>Have a question or need support? Our team typically responds within 24 hours.</p>
        </div>
      </div>

      <section className="section section-alt" style={{ paddingTop:56 }}>
        <div className="container">
          <div className="contact-grid">
            <div>
              <div className="section-label">Contact information</div>
              <h2 className="section-title" style={{ fontSize:26, marginBottom:32 }}>Let's talk</h2>
              {[
                { icon:'📧', title:'Email us', text:'hello@togoconnect.com\nsupport@togoconnect.com' },
                { icon:'📍', title:'Our office', text:'Avenue de la Présidence\nLomé, Togo' },
                { icon:'📞', title:'Call us', text:'+228 90 00 00 00\nMon–Fri, 9am–6pm' },
                { icon:'⏱️', title:'Response time', text:'We reply within 24 hours,\nusually much faster.' },
              ].map(item => (
                <div key={item.title} className="contact-info-item">
                  <div className="contact-info-icon">{item.icon}</div>
                  <div>
                    <div className="contact-info-title">{item.title}</div>
                    <div className="contact-info-text">{item.text.split('\n').map((l,i) => <span key={i}>{l}{i===0 && <br/>}</span>)}</div>
                  </div>
                </div>
              ))}
            </div>

            <div className="contact-form-card">
              {sent ? (
                <div style={{ textAlign:'center', padding:'32px 0' }}>
                  <div style={{ fontSize:52, marginBottom:14 }}>✅</div>
                  <h3 style={{ fontSize:20, fontWeight:700, marginBottom:8 }}>Message sent!</h3>
                  <p style={{ color:'var(--tm)', lineHeight:1.7 }}>Thanks! We'll reply to <strong>{form.email}</strong> within 24 hours.</p>
                  <button className="btn-primary" style={{ marginTop:22 }} onClick={() => { setSent(false); setForm({ name:'', email:'', subject:'', message:'' }); }}>
                    Send another message
                  </button>
                </div>
              ) : (
                <>
                  <h3>Send us a message</h3>
                  <div className="form-row">
                    <div className="form-group"><label>Your name</label><input type="text" placeholder="Kossi Mensah" value={form.name} onChange={e => setForm({...form, name:e.target.value})} /></div>
                    <div className="form-group"><label>Email</label><input type="email" placeholder="you@example.com" value={form.email} onChange={e => setForm({...form, email:e.target.value})} /></div>
                  </div>
                  <div className="form-group"><label>Subject</label>
                    <select value={form.subject} onChange={e => setForm({...form, subject:e.target.value})}>
                      <option value="">Select a subject...</option>
                      <option>General inquiry</option><option>Technical support</option><option>Partnership</option><option>Other</option>
                    </select>
                  </div>
                  <div className="form-group"><label>Message</label>
                    <textarea placeholder="Tell us how we can help..." value={form.message} onChange={e => setForm({...form, message:e.target.value})}
                      style={{ width:'100%', border:'1.5px solid var(--b)', borderRadius:9, padding:'11px 13px', fontSize:14, outline:'none', minHeight:120, resize:'vertical', fontFamily:'inherit', lineHeight:1.6, background:'var(--bg)', transition:'all .15s' }}
                      onFocus={e => { e.target.style.borderColor='var(--g)'; e.target.style.background='#fff'; e.target.style.boxShadow='0 0 0 3px rgba(29,158,117,.09)'; }}
                      onBlur={e => { e.target.style.borderColor='var(--b)'; e.target.style.background='var(--bg)'; e.target.style.boxShadow='none'; }}
                    />
                  </div>
                  <button className="form-submit" onClick={() => { if(form.name && form.email && form.message) setSent(true); }}>
                    Send message →
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="faq-section">
            <div style={{ textAlign:'center', marginBottom:32 }}>
              <div className="section-label">FAQ</div>
              <h2 className="section-title" style={{ fontSize:26 }}>Common questions</h2>
            </div>
            {[
              { q:'Is TogoConnect free to use?', a:'Yes, completely free for both buyers and sellers. No commission, no subscription, no hidden fees ever.' },
              { q:'How do I become a seller?', a:'Simply sign up with a Seller account type and start posting your services. Approval is instant.' },
              { q:'Are sellers verified?', a:'Sellers are reviewed by real users. High-rated sellers earn a verified badge on their profile.' },
              { q:'How do payments work?', a:'All payments are handled directly between buyer and seller. We do not process any payments.' },
            ].map((item, i) => (
              <div key={i} className="faq-item">
                <div className="faq-q">Q: {item.q}</div>
                <div className="faq-a">{item.a}</div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
