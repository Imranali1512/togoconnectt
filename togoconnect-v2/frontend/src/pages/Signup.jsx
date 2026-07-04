import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { LOCATIONS, COUNTRIES } from '../data/locations';

const rules = {
  name: v => !v.trim() ? 'Full name is required' : v.trim().length < 2 ? 'At least 2 characters' : '',
  email: v => !v ? 'Email is required' : !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) ? 'Enter a valid email' : '',
  password: v => !v ? 'Password is required' : v.length < 6 ? 'At least 6 characters' : '',
  confirm: (v, pw) => !v ? 'Please confirm your password' : v !== pw ? 'Passwords do not match' : '',
};

export default function Signup() {
  const [form, setForm] = useState({ name:'', email:'', password:'', confirm:'', role:'buyer', country:'Togo', city:'Lomé' });
  const [errors, setErrors] = useState({});
  const [apiError, setApiError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPw, setShowPw] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const cities = LOCATIONS[form.country] || [];

  const set = (k, v) => {
    if (k === 'country') {
      const firstCity = LOCATIONS[v]?.[0] || '';
      setForm(f => ({ ...f, country: v, city: firstCity }));
    } else {
      setForm(f => ({ ...f, [k]: v }));
    }
    if (errors[k]) setErrors(e => ({ ...e, [k]: '' }));
    setApiError('');
  };

  const validate = () => {
    const e = {
      name: rules.name(form.name),
      email: rules.email(form.email),
      password: rules.password(form.password),
      confirm: rules.confirm(form.confirm, form.password),
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
      const { data } = await axios.post('/api/auth/register', {
        name: form.name.trim(),
        email: form.email.toLowerCase().trim(),
        password: form.password,
        role: form.role,
        city: `${form.city}, ${form.country}`,
      });
      login(data);
      navigate('/dashboard');
    } catch (err) {
      const msg = err.response?.data?.message || 'Registration failed. Please try again.';
      // Show email errors both in field AND as api error
      if (msg.toLowerCase().includes('email') || msg.toLowerCase().includes('already')) {
        setErrors(e => ({ ...e, email: msg }));
        setApiError(msg);
      } else {
        setApiError(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  const strength = (pw) => {
    if (!pw) return 0;
    let s = 0;
    if (pw.length >= 6) s++;
    if (pw.length >= 10) s++;
    if (/[A-Z]/.test(pw)) s++;
    if (/[0-9]/.test(pw)) s++;
    if (/[^A-Za-z0-9]/.test(pw)) s++;
    return Math.min(s, 4);
  };
  const strengthLabel = ['', 'Weak', 'Fair', 'Good', 'Strong'];
  const strengthColor = ['', '#ef4444', '#f59e0b', '#3b82f6', '#1D9E75'];
  const pw_strength = strength(form.password);

  return (
    <div className="auth-page">
      <div className="auth-card" style={{ maxWidth:480 }}>
        <Link to="/" style={{ display:'flex', alignItems:'center', gap:8, marginBottom:24, width:'fit-content' }}>
          <div className="logo-icon" style={{ width:32, height:32, borderRadius:9, fontSize:14 }}>T</div>
          <span style={{ fontWeight:800, fontSize:16, color:'#0f1923' }}>TogoConnect</span>
        </Link>

        <h2>Create your account</h2>
        <p className="subtitle">Join thousands of buyers and sellers across West Africa</p>

        {apiError && <div className="error-msg">{apiError}</div>}

        <form onSubmit={handleSubmit} noValidate>
          <div className="form-group">
            <label>Full name</label>
            <input type="text" placeholder="e.g. Kossi Mensah" value={form.name}
              onChange={e => set('name', e.target.value)}
              style={errors.name ? { borderColor:'#ef4444' } : {}} />
            {errors.name && <div className="field-error">{errors.name}</div>}
          </div>

          <div className="form-group">
            <label>Email address</label>
            <input type="email" placeholder="you@example.com" value={form.email}
              onChange={e => set('email', e.target.value)}
              style={errors.email ? { borderColor:'#ef4444' } : {}} />
            {errors.email && <div className="field-error">{errors.email}</div>}
          </div>

          <div className="form-group">
            <label>Password</label>
            <div style={{ position:'relative' }}>
              <input type={showPw ? 'text' : 'password'} placeholder="Min. 6 characters"
                value={form.password} onChange={e => set('password', e.target.value)}
                style={{ ...(errors.password ? { borderColor:'#ef4444' } : {}), paddingRight:44 }} />
              <button type="button" onClick={() => setShowPw(!showPw)}
                style={{ position:'absolute', right:12, top:'50%', transform:'translateY(-50%)', background:'none', border:'none', fontSize:16, cursor:'pointer', color:'#6b7280' }}>
                {showPw ? '🙈' : '👁️'}
              </button>
            </div>
            {form.password && (
              <div style={{ marginTop:6 }}>
                <div style={{ display:'flex', gap:3, marginBottom:4 }}>
                  {[1,2,3,4].map(i => (
                    <div key={i} style={{ flex:1, height:3, borderRadius:2, background: i <= pw_strength ? strengthColor[pw_strength] : '#e2e8f0', transition:'background .2s' }}></div>
                  ))}
                </div>
                <div style={{ fontSize:11, color: strengthColor[pw_strength], fontWeight:600 }}>{strengthLabel[pw_strength]} password</div>
              </div>
            )}
            {errors.password && <div className="field-error">{errors.password}</div>}
          </div>

          <div className="form-group">
            <label>Confirm password</label>
            <input type={showPw ? 'text' : 'password'} placeholder="Repeat your password"
              value={form.confirm} onChange={e => set('confirm', e.target.value)}
              style={errors.confirm ? { borderColor:'#ef4444' } : {}} />
            {errors.confirm && <div className="field-error">{errors.confirm}</div>}
            {form.confirm && form.confirm === form.password && !errors.confirm && (
              <div style={{ fontSize:11, color:'#1D9E75', fontWeight:600, marginTop:4 }}>✓ Passwords match</div>
            )}
          </div>

          <div className="form-group">
            <label>I want to</label>
            <select value={form.role} onChange={e => set('role', e.target.value)}>
              <option value="buyer">Find services (Buyer)</option>
              <option value="seller">Offer my services (Seller)</option>
              <option value="both">Both buy and sell</option>
            </select>
          </div>

          {/* Country + City */}
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
            <div className="form-group">
              <label>Country</label>
              <select value={form.country} onChange={e => set('country', e.target.value)}>
                {COUNTRIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label>City</label>
              <select value={form.city} onChange={e => set('city', e.target.value)}>
                {cities.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>

          <p style={{ fontSize:12, color:'#6b7280', marginBottom:14, lineHeight:1.6 }}>
            By creating an account, you agree to our{' '}
            <a href="#" style={{ color:'#1D9E75', fontWeight:600 }}>Terms of Service</a> and{' '}
            <a href="#" style={{ color:'#1D9E75', fontWeight:600 }}>Privacy Policy</a>.
          </p>

          <button type="submit" className="form-submit" disabled={loading}>
            {loading ? (
              <span style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:8 }}>
                <span style={{ width:16, height:16, border:'2px solid rgba(255,255,255,.4)', borderTopColor:'#fff', borderRadius:'50%', animation:'spin .7s linear infinite', display:'inline-block' }}></span>
                Creating account...
              </span>
            ) : "Create account — it's free"}
          </button>
        </form>

        <p className="auth-switch">Already have an account? <Link to="/login">Log in</Link></p>

        <div style={{ display:'flex', justifyContent:'center', gap:16, marginTop:16 }}>
          {['🔒 SSL Encrypted', '✅ Verified', '🔐 Private'].map(t => (
            <span key={t} style={{ fontSize:11, color:'#9ca3af', fontWeight:500 }}>{t}</span>
          ))}
        </div>
      </div>
    </div>
  );
}
