import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const [form, setForm] = useState({ email:'', password:'' });
  const [errors, setErrors] = useState({});
  const [apiError, setApiError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPw, setShowPw] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const planData = location.state?.planData;
  // If user came from checkout (plan purchase), keep that redirect
  // Otherwise always go to dashboard (not checkout directly after normal login)
  const from = (location.state?.from && location.state?.from !== '/checkout') 
    ? location.state.from 
    : planData ? '/checkout' : '/dashboard';

  const set = (k, v) => {
    setForm(f => ({ ...f, [k]: v }));
    if (errors[k]) setErrors(e => ({ ...e, [k]: '' }));
    setApiError('');
  };

  const validate = () => {
    const e = {
      email: !form.email ? 'Email is required' : !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email) ? 'Enter a valid email' : '',
      password: !form.password ? 'Password is required' : '',
    };
    setErrors(e);
    return !Object.values(e).some(Boolean);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    setApiError('');
    try {
      const { data } = await axios.post('/api/auth/login', {
        email: form.email.toLowerCase().trim(),
        password: form.password,
      });
      login(data);
      navigate(from, { replace: true, state: planData ? { plan: planData.plan, price: planData.price, period: planData.period } : undefined });
    } catch (err) {
      const msg = err.response?.data?.message || 'Login failed. Please try again.';
      setApiError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        {/* Logo */}
        <Link to="/" style={{ display:'flex', alignItems:'center', gap:8, marginBottom:24, width:'fit-content' }}>
          <div className="logo-icon" style={{ width:32, height:32, borderRadius:9, fontSize:14 }}>T</div>
          <span style={{ fontWeight:800, fontSize:16, color:'#0f1923', letterSpacing:'-.01em' }}>TogoConnect</span>
        </Link>

        <h2>Welcome back</h2>
        <p className="subtitle">Log in to your TogoConnect account</p>

        {/* Redirect message */}
        {location.state?.from && (
          <div style={{ background:'#fefce8', border:'1px solid #fde047', borderRadius:8, padding:'10px 14px', fontSize:13, color:'#713f12', marginBottom:16 }}>
            🔐 Please log in to continue
          </div>
        )}

        {apiError && (
          <div className="error-msg">
            {apiError}
            {apiError.toLowerCase().includes('invalid') && (
              <div style={{ marginTop:4 }}>
                <Link to="/signup" style={{ color:'#dc2626', fontWeight:700 }}>Don't have an account? Sign up →</Link>
              </div>
            )}
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate>
          {/* Email */}
          <div className="form-group">
            <label>Email address</label>
            <input
              type="email"
              placeholder="you@example.com"
              value={form.email}
              onChange={e => set('email', e.target.value)}
              autoComplete="email"
              style={errors.email ? { borderColor:'#ef4444' } : {}}
            />
            {errors.email && <div className="field-error">{errors.email}</div>}
          </div>

          {/* Password */}
          <div className="form-group">
            <div style={{ display:'flex', justifyContent:'space-between', marginBottom:6 }}>
              <label style={{ margin:0 }}>Password</label>
              <Link to="/forgot-password" style={{ fontSize:12, color:'#1D9E75', fontWeight:600 }}>Forgot password?</Link>
            </div>
            <div style={{ position:'relative' }}>
              <input
                type={showPw ? 'text' : 'password'}
                placeholder="Your password"
                value={form.password}
                onChange={e => set('password', e.target.value)}
                autoComplete="current-password"
                style={{ ...(errors.password ? { borderColor:'#ef4444' } : {}), paddingRight:44 }}
              />
              <button
                type="button"
                onClick={() => setShowPw(!showPw)}
                style={{ position:'absolute', right:12, top:'50%', transform:'translateY(-50%)', background:'none', border:'none', fontSize:16, cursor:'pointer', color:'#6b7280' }}>
                {showPw ? '🙈' : '👁️'}
              </button>
            </div>
            {errors.password && <div className="field-error">{errors.password}</div>}
          </div>

          <button type="submit" className="form-submit" disabled={loading}>
            {loading ? (
              <span style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:8 }}>
                <span style={{ width:16, height:16, border:'2px solid rgba(255,255,255,.4)', borderTopColor:'#fff', borderRadius:'50%', animation:'spin .7s linear infinite', display:'inline-block' }}></span>
                Logging in...
              </span>
            ) : 'Log in to my account'}
          </button>
        </form>

        {/* Social login icons */}
        <div style={{ marginTop:20, paddingTop:16, borderTop:'1px solid #f3f4f6', textAlign:'center' }}>
          <div style={{ fontSize:12, color:'#9ca3af', marginBottom:10 }}>Or sign in with</div>
          <div style={{ display:'flex', justifyContent:'center', gap:12 }}>
            {[
              { name:'Google', bg:'#fff', border:'#e5e7eb',
                svg:<svg width="18" height="18" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg> },
              { name:'Facebook', bg:'#1877f2', border:'#1877f2',
                svg:<svg width="18" height="18" viewBox="0 0 24 24" fill="#fff"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg> },
              { name:'LinkedIn', bg:'#0a66c2', border:'#0a66c2',
                svg:<svg width="18" height="18" viewBox="0 0 24 24" fill="#fff"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg> },
            ].map(p => (
              <button key={p.name} type="button" title={`Sign in with ${p.name}`}
                onClick={() => alert(`${p.name} login requires credentials. Contact your developer.`)}
                style={{ width:40, height:40, borderRadius:'50%', border:`1.5px solid ${p.border}`, background:p.bg, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', padding:0, transition:'transform .15s' }}
                onMouseEnter={e=>e.currentTarget.style.transform='scale(1.1)'}
                onMouseLeave={e=>e.currentTarget.style.transform='scale(1)'}>
                {p.svg}
              </button>
            ))}
          </div>
        </div>

        <p className="auth-switch">Don't have an account? <Link to="/signup">Sign up free</Link></p>

        <div style={{ display:'flex', alignItems:'center', gap:12, margin:'18px 0 0' }}>
          <div style={{ flex:1, height:1, background:'#e2e8f0' }}></div>
          <span style={{ fontSize:12, color:'#9ca3af' }}>Secure login</span>
          <div style={{ flex:1, height:1, background:'#e2e8f0' }}></div>
        </div>
        <div style={{ display:'flex', justifyContent:'center', gap:16, marginTop:12 }}>
          {['🔒 SSL', '✅ Safe', '🔐 Private'].map(t => (
            <span key={t} style={{ fontSize:11, color:'#6b7280', fontWeight:500 }}>{t}</span>
          ))}
        </div>
      </div>
    </div>
  );
}
