import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const PLANS = [
  {
    id: 'basic',
    name: 'Basic',
    badge: '🔑',
    tagline: 'Perfect to get started',
    monthly: 2500,
    yearly: 1800,
    listings: 1,
    features: [
      { text: '1 service listing', ok: true },
      { text: 'Browse all services', ok: true },
      { text: 'Unlimited messages', ok: true },
      { text: 'Leave & read reviews', ok: true },
      { text: 'Basic seller profile', ok: true },
      { text: 'Featured placement', ok: false },
      { text: 'Priority support', ok: false },
    ],
    btn: 'Get Basic →',
    style: 'outline',
  },
  {
    id: 'standard',
    name: 'Standard',
    badge: '⚡',
    tagline: 'Best for growing sellers',
    monthly: 9900,
    yearly: 6900,
    listings: 10,
    popular: true,
    features: [
      { text: 'Up to 10 service listings', ok: true },
      { text: 'Browse all services', ok: true },
      { text: 'Unlimited messages', ok: true },
      { text: 'Leave & read reviews', ok: true },
      { text: 'Verified seller badge', ok: true },
      { text: 'Featured placement', ok: false },
      { text: 'Priority support', ok: false },
    ],
    btn: 'Get Standard →',
    style: 'fill',
  },
  {
    id: 'premium',
    name: 'Premium',
    badge: '👑',
    tagline: 'Unlimited growth, maximum visibility',
    monthly: 24900,
    yearly: 17900,
    listings: 'Unlimited',
    features: [
      { text: 'Unlimited service listings', ok: true },
      { text: 'Browse all services', ok: true },
      { text: 'Unlimited messages', ok: true },
      { text: 'Leave & read reviews', ok: true },
      { text: 'Verified seller badge', ok: true },
      { text: 'Featured placement', ok: true },
      { text: 'Priority support', ok: true },
    ],
    btn: 'Get Premium →',
    style: 'outline',
  },
];

const COMPARE = [
  { feat: 'Service listings',    basic: '1',         standard: 'Up to 10',   premium: 'Unlimited' },
  { feat: 'Browse services',     basic: '✓',         standard: '✓',          premium: '✓' },
  { feat: 'Send messages',       basic: 'Unlimited', standard: 'Unlimited',  premium: 'Unlimited' },
  { feat: 'Reviews',             basic: '✓',         standard: '✓',          premium: '✓' },
  { feat: 'Verified badge',      basic: '—',         standard: '✓',          premium: '✓' },
  { feat: 'Featured placement',  basic: '—',         standard: '—',          premium: '✓' },
  { feat: 'Priority support',    basic: '—',         standard: '—',          premium: '✓' },
];

export default function Pricing() {
  const [yearly, setYearly] = useState(false);
  const navigate = useNavigate();
  const { user } = useAuth();
  const fmt = (n) => n.toLocaleString();

  const handlePlan = (plan) => {
    const monthlyPrice = plan.monthly;
    const yearlyTotal = plan.yearly * 12; // total annual charge
    const price = yearly ? yearlyTotal : monthlyPrice;
    const planData = { plan: plan.name, price, period: yearly ? 'yearly' : 'monthly', monthlyEquiv: yearly ? plan.yearly : plan.monthly };
    if (!user) {
      navigate('/login', { state: { from: '/checkout', planData } });
    } else {
      navigate('/checkout', { state: planData });
    }
  };

  return (
    <>
      {/* HERO */}
      <div className="pricing-hero">
        <div className="container">
          <div className="section-label">Simple pricing</div>
          <h1>Choose your plan</h1>
          <p>Start with 1 listing, scale up to 10, or go unlimited. No hidden fees, ever.</p>

          <div className="billing-toggle">
            <span className={`tog-label${!yearly ? ' active' : ''}`}>Monthly</span>
            <div className={`toggle-track${yearly ? ' yearly' : ''}`} onClick={() => setYearly(!yearly)}>
              <div className="toggle-thumb"></div>
            </div>
            <span className={`tog-label${yearly ? ' active' : ''}`}>
              Yearly <span className="save-pill">Save 30%</span>
            </span>
          </div>
        </div>
      </div>

      {/* PLANS */}
      <div className="plans-section">
        <div className="plans-grid" style={{ marginTop: -20 }}>
          {PLANS.map(plan => (
            <div key={plan.id} className={`plan-card${plan.popular ? ' popular' : ''}`}>
              {plan.popular && <div className="popular-badge">⭐ Most Popular</div>}

              <div style={{ fontSize: 32, marginBottom: 8 }}>{plan.badge}</div>
              <div className="plan-name">{plan.name}</div>
              <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 16, minHeight: 20 }}>{plan.tagline}</div>

              {/* Listing count highlight */}
              <div style={{
                background: plan.popular ? 'var(--green-light)' : '#f8fafc',
                border: `1.5px solid ${plan.popular ? 'var(--green)' : 'var(--border)'}`,
                borderRadius: 10, padding: '10px 14px', marginBottom: 18,
                display: 'flex', alignItems: 'center', gap: 10
              }}>
                <span style={{ fontSize: 20 }}>📋</span>
                <div>
                  <div style={{ fontSize: 13, color: 'var(--text-muted)', fontWeight: 500 }}>Service Listings</div>
                  <div style={{ fontSize: 18, fontWeight: 800, color: plan.popular ? 'var(--green-dark)' : '#0f1923' }}>
                    {plan.listings}
                  </div>
                </div>
              </div>

              <div className="plan-price">
                <span className="plan-price-cur">CFA</span>
                <span className="plan-price-amt">{fmt(yearly ? plan.yearly : plan.monthly)}</span>
              </div>
              <div className="plan-per">
                {yearly ? 'per month' : 'per month'}
              </div>
              <div className="plan-orig" style={{ visibility: yearly ? 'visible' : 'hidden', color: yearly ? 'var(--green-dark)' : 'inherit', fontWeight: yearly ? 600 : 400 }}>
                {yearly ? `Billed ${fmt(plan.yearly * 12)} CFA/year` : `was ${fmt(plan.monthly)} CFA`}
              </div>

              <div className="plan-divider"></div>

              <div className="plan-features">
                {plan.features.map((f, i) => (
                  <div key={i} className={`plan-feat${!f.ok ? ' dim' : ''}`}>
                    <span className={f.ok ? 'feat-check' : 'feat-check feat-x'}>{f.ok ? '✓' : '✗'}</span>
                    {f.text}
                  </div>
                ))}
              </div>

              <button
                className={`btn-plan ${plan.style === 'fill' ? 'btn-plan-fill' : 'btn-plan-outline'}`}
                onClick={() => handlePlan(plan)}
              >
                {plan.btn}
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* COMPARE TABLE */}
      <div style={{ background: '#fff', padding: '0 0 60px' }}>
        <div className="compare-wrap">
          <div className="section-label">Compare plans</div>
          <div className="section-title">Everything included</div>
          <table className="comp-table">
            <thead>
              <tr>
                <th style={{ width: '35%' }}>Feature</th>
                <th>Basic</th>
                <th className="comp-hl" style={{ color: 'var(--gd)' }}>Standard</th>
                <th>Premium</th>
              </tr>
            </thead>
            <tbody>
              {COMPARE.map((row, i) => (
                <tr key={i}>
                  <td style={{ color: '#0f1923', fontWeight: 500 }}>{row.feat}</td>
                  <td>
                    <span className={row.basic === '✓' || row.basic === 'Unlimited' ? 'check-icon' : row.basic === '—' ? 'cross-icon' : ''}>
                      {row.basic}
                    </span>
                  </td>
                  <td className="comp-hl">
                    <span className={row.standard === '✓' || row.standard === 'Unlimited' || row.standard === 'Basic' || row.standard === 'Up to 10' ? 'check-icon' : row.standard === '—' ? 'cross-icon' : ''}>
                      {row.standard}
                    </span>
                  </td>
                  <td>
                    <span className={row.premium === '✓' || row.premium === 'Unlimited' || row.premium === 'Full' ? 'check-icon' : row.premium === '—' ? 'cross-icon' : ''}>
                      {row.premium}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* FAQ */}
      <div style={{ background: 'var(--bg)', padding: '48px 0' }}>
        <div className="container" style={{ maxWidth: 720 }}>
          <div style={{ textAlign: 'center', marginBottom: 32 }}>
            <div className="section-label">Questions</div>
            <div className="section-title" style={{ fontSize: 26 }}>Pricing FAQs</div>
          </div>
          {[
            { q: 'Can I upgrade or downgrade anytime?', a: 'Yes. Upgrade instantly from Basic to Standard or Premium. Downgrades apply at the next billing cycle.' },
            { q: 'What happens if I exceed my listing limit?', a: 'You\'ll be prompted to upgrade your plan. Your existing listings stay active.' },
            { q: 'Is there a free trial?', a: 'All paid plans include a 7-day money-back guarantee. No questions asked.' },
            { q: 'What payment methods do you accept?', a: 'We accept all major credit/debit cards and mobile money (MTN, Moov) for local payments.' },
          ].map((item, i) => (
            <div key={i} className="faq-item">
              <div className="faq-q">Q: {item.q}</div>
              <div className="faq-a">{item.a}</div>
            </div>
          ))}
        </div>
      </div>

      {/* CTA */}
      <section className="cta-banner">
        <div className="container">
          <h2>Ready to start selling?</h2>
          <p>Pick a plan and list your first service in minutes. No hidden fees, ever.</p>
          <div className="cta-buttons">
            <Link to="/signup"><button className="btn-white">Get started →</button></Link>
            <Link to="/contact"><button className="btn-outline-white">Talk to us</button></Link>
          </div>
        </div>
      </section>
    </>
  );
}
