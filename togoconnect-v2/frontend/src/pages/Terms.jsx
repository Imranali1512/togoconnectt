const SECTIONS = [
  { icon:'📜', title:'Acceptance of terms', content:'By accessing or using TogoConnect, you agree to be bound by these Terms. If you do not agree, please do not use our platform. These terms apply to all users — buyers, sellers, and visitors.' },
  { icon:'🏪', title:'Platform description', content:'TogoConnect is an online marketplace connecting buyers seeking local services with sellers offering those services. We facilitate connections but are not a party to any transaction. TogoConnect does not employ sellers and does not guarantee the quality of any service.' },
  { icon:'👤', title:'User accounts', content:'You must provide accurate information when creating an account. You are responsible for maintaining account security. One person may hold only one account. We reserve the right to suspend accounts that violate these terms.' },
  { icon:'🛍️', title:'Buyer responsibilities', content:'Buyers are responsible for verifying seller credentials before hiring, communicating expectations clearly, and making payment arrangements directly with sellers. TogoConnect is not liable for the quality or delivery of any service.' },
  { icon:'🏪', title:'Seller responsibilities', content:'Sellers must provide accurate service descriptions, deliver work as agreed, maintain professional communication, and comply with all applicable local laws. Sellers may not misrepresent their qualifications or use the platform for illegal activities.' },
  { icon:'🚫', title:'Prohibited conduct', content:'Prohibited activities include: creating false profiles, posting fake reviews, spamming users, sharing others\' personal data, using the platform for illegal activities, or attempting to bypass our systems. Violations may result in immediate termination.' },
  { icon:'💳', title:'Payments and fees', content:'TogoConnect does not process payments between users. All financial transactions are conducted directly between buyers and sellers. Paid subscription plans are billed as described on our Pricing page and can be cancelled at any time.' },
  { icon:'📸', title:'Content and listings', content:'You are responsible for all content you post. Content must be accurate, lawful, and not infringe third-party rights. We reserve the right to remove any content that violates these terms without prior notice.' },
  { icon:'⚠️', title:'Limitation of liability', content:'TogoConnect is provided "as is" without warranties. We are not liable for: disputes between users, quality of services, loss of data, or any indirect damages arising from use of the platform.' },
  { icon:'🔄', title:'Changes to terms', content:'We may modify these Terms at any time. We will notify users of material changes via email or platform notification. Continued use after changes constitutes acceptance of the new terms.' },
  { icon:'⚖️', title:'Governing law', content:'These Terms are governed by the laws of the Republic of Togo. Disputes shall be resolved in the courts of Lomé, Togo.' },
  { icon:'📧', title:'Contact', content:'For questions about these Terms: legal@togoconnect.com — Avenue de la Présidence, Lomé, Togo.' },
];

export default function Terms() {
  return (
    <>
      <div className="page-hero">
        <div className="container">
          <div className="section-label">Legal</div>
          <h1>Terms &<br />Conditions</h1>
          <p>Last updated: June 26, 2026 · Please read these terms carefully before using TogoConnect.</p>
        </div>
      </div>

      <section className="section">
        <div className="container" style={{ maxWidth:780 }}>
          <div style={{ background:'#fefce8', border:'1.5px solid #fde047', borderRadius:14, padding:'20px 24px', marginBottom:40, display:'flex', gap:14, alignItems:'flex-start' }}>
            <div style={{ fontSize:28, flexShrink:0 }}>⚠️</div>
            <div>
              <div style={{ fontSize:14, fontWeight:700, color:'#713f12', marginBottom:5 }}>Important notice</div>
              <p style={{ fontSize:14, color:'#713f12', lineHeight:1.7 }}>By using TogoConnect you agree to these terms. TogoConnect is a marketplace — we connect buyers and sellers but are not responsible for individual transactions between users.</p>
            </div>
          </div>

          {SECTIONS.map((s,i) => (
            <div key={i} style={{ marginBottom:28, paddingBottom:28, borderBottom: i < SECTIONS.length-1 ? '1px solid #f1f5f9' : 'none' }}>
              <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:10 }}>
                <div style={{ width:36, height:36, borderRadius:10, background:'#f8fafc', border:'1px solid #e2e8f0', display:'flex', alignItems:'center', justifyContent:'center', fontSize:18, flexShrink:0 }}>
                  {s.icon}
                </div>
                <h3 style={{ fontSize:17, fontWeight:700, color:'#0f1923' }}>{i+1}. {s.title}</h3>
              </div>
              <p style={{ fontSize:15, color:'#374151', lineHeight:1.8, paddingLeft:46 }}>{s.content}</p>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}
