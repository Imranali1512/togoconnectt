const SECTIONS = [
  { title:'Information we collect', icon:'📋', content:'We collect only what is needed: your name, email, city, and role when you register. We also collect usage data such as pages visited and searches. We never collect payment information — all payments happen directly between users.' },
  { title:'How we use your information', icon:'⚙️', content:'We use your information to: manage your account, connect buyers with sellers, send important notifications, improve our platform, and protect community safety. We do not sell your personal data to any third party — ever.' },
  { title:'Information sharing', icon:'🔗', content:'Your public profile (name, city, listings, ratings) is visible to other users. Private messages are only visible to sender and recipient. We do not share your email or private data with third parties without your explicit consent, except when required by law.' },
  { title:'Data security', icon:'🔒', content:'We use industry-standard SSL encryption for all data in transit. Passwords are hashed with bcrypt and never stored in plain text. We take reasonable measures to protect your information from unauthorised access or breaches.' },
  { title:'Cookies', icon:'🍪', content:'We use only essential cookies to keep you logged in and remember your preferences. We do not use third-party advertising cookies. You can disable cookies in your browser, though this may affect some platform functionality.' },
  { title:'Your rights', icon:'✅', content:'You have the right to: access your personal data, correct any inaccurate information, delete your account and data, and opt out of non-essential communications. To exercise these rights, email us at privacy@togoconnect.com.' },
  { title:"Children's privacy", icon:'👶', content:'TogoConnect is not for users under 16. We do not knowingly collect data from children. If you believe we have collected data from a minor, please contact us immediately and we will remove it promptly.' },
  { title:'Changes to this policy', icon:'📝', content:'We may update this Privacy Policy periodically. We will notify you of significant changes via email or platform notice. Continued use of TogoConnect after changes means you accept the updated policy.' },
  { title:'Contact', icon:'📧', content:'For privacy questions or requests: privacy@togoconnect.com — or write to us at Avenue de la Présidence, Lomé, Togo.' },
];

export default function PrivacyPolicy() {
  return (
    <>
      <div className="page-hero">
        <div className="container">
          <div className="section-label">Legal</div>
          <h1>Privacy Policy</h1>
          <p>Last updated: June 26, 2026 · We take your privacy seriously and keep things simple.</p>
        </div>
      </div>

      <section className="section">
        <div className="container" style={{ maxWidth:780 }}>
          {/* Summary box */}
          <div style={{ background:'#E1F5EE', border:'1.5px solid rgba(29,158,117,.25)', borderRadius:14, padding:'20px 24px', marginBottom:40, display:'flex', gap:14, alignItems:'flex-start' }}>
            <div style={{ fontSize:28, flexShrink:0 }}>💡</div>
            <div>
              <div style={{ fontSize:14, fontWeight:700, color:'#0F6E56', marginBottom:5 }}>Quick summary</div>
              <p style={{ fontSize:14, color:'#374151', lineHeight:1.7 }}>We collect only what's needed to run the platform. We never sell your data. You can delete your account at any time. Payments happen directly between users — we never touch your money.</p>
            </div>
          </div>

          {SECTIONS.map((s,i) => (
            <div key={i} style={{ marginBottom:28, paddingBottom:28, borderBottom: i < SECTIONS.length-1 ? '1px solid #f1f5f9' : 'none' }}>
              <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:10 }}>
                <div style={{ width:36, height:36, borderRadius:10, background:'#E1F5EE', display:'flex', alignItems:'center', justifyContent:'center', fontSize:18, flexShrink:0 }}>
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
