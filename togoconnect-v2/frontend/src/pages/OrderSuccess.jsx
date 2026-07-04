import { useLocation, Link } from 'react-router-dom';

export default function OrderSuccess() {
  const { state } = useLocation();
  const { plan = 'Seller Pro', price = 9900, period = 'monthly' } = state || {};
  const fmt = (n) => n.toLocaleString();

  return (
    <div className="success-page">
      <div className="success-card">
        <div className="success-icon-wrap">✅</div>
        <h2>You're all set!</h2>
        <p>
          Welcome to TogoConnect <strong>{plan}</strong>. Your account has been upgraded and is ready to use right now.
        </p>

        <div className="active-plan-chip">
          <span>⭐</span>
          <span>{plan} — Active</span>
        </div>

        {/* Receipt */}
        <div style={{ background: 'var(--bg)', border: '1px solid var(--b)', borderRadius: 10, padding: '16px 20px', marginBottom: 24, textAlign: 'left' }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '.07em', marginBottom: 12 }}>Receipt</div>
          {[
            { label: 'Plan', value: `TogoConnect ${plan}` },
            { label: 'Billing', value: period === 'yearly' ? 'Annual' : 'Monthly' },
            { label: 'Amount paid', value: `${fmt(price)} CFA` },
            { label: 'Status', value: '✅ Paid' },
          ].map(r => (
            <div key={r.label} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: '#374151', marginBottom: 8 }}>
              <span style={{ color: '#6b7280' }}>{r.label}</span>
              <span style={{ fontWeight: 600 }}>{r.value}</span>
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link to="/dashboard">
            <button className="btn-plan btn-plan-fill" style={{ padding: '11px 24px' }}>Go to dashboard →</button>
          </Link>
          <Link to="/services">
            <button className="btn-plan btn-plan-outline" style={{ padding: '11px 24px' }}>Browse services</button>
          </Link>
        </div>

        <p style={{ fontSize: 12, color: '#9ca3af', marginTop: 16 }}>📧 Receipt sent to your email</p>
      </div>
    </div>
  );
}
