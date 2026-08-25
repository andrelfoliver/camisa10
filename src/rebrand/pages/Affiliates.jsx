import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, Award, DollarSign, Gift, Calendar, Rocket, 
  CheckCircle2, AlertCircle, FileText, Lock, LogIn, ChevronRight, BarChart3, Shield
} from 'lucide-react';
import { useRebrandAuth } from '../../context/RebrandAuthContext';
import { useLanguage } from '../../context/LanguageContext';

const Section = ({ icon: Icon, title, children, id }) => (
  <section id={id} style={{ marginBottom: '3rem' }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
      <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: 'rgba(214, 255, 0, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#121416' }}>
        <Icon size={18} />
      </div>
      <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#121416', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{title}</h2>
    </div>
    {children}
  </section>
);

const RebrandAffiliatesPage = () => {
  const { user } = useRebrandAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    social: '',
    story: '',
    payment: 'E-Transfer',
    followers_insta: '',
    followers_tiktok: '',
    followers_x: '',
    followers_facebook: ''
  });
  const [status, setStatus] = useState('idle'); // idle, submitting, success, error

  useEffect(() => {
    if (user) {
      setFormData(prev => ({
        ...prev,
        name: user.user_metadata?.full_name || '',
        email: user.email || ''
      }));
    }
  }, [user]);

  useEffect(() => {
    if (window.location.hash === '#apply') {
      setTimeout(() => {
        scrollToForm();
      }, 500);
    } else {
      window.scrollTo(0, 0);
    }
  }, []);

  const scrollToForm = () => {
    document.getElementById('apply').scrollIntoView({ behavior: 'smooth' });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus('submitting');
    try {
      const res = await fetch('/api/register-affiliate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      const result = await res.json();
      if (result.success) {
        setStatus('success');
        setFormData({ 
          name: '', email: '', social: '', story: '', payment: 'E-Transfer',
          followers_insta: '', followers_tiktok: '', followers_x: '', followers_facebook: ''
        });
      } else {
        setStatus('error');
      }
    } catch (err) {
      console.error(err);
      setStatus('error');
    }
  };

  return (
    <div style={{ background: '#ffffff', minHeight: '80vh', padding: '3rem 2rem' }} className="rebrand-scope">
      <div className="container" style={{ maxWidth: '900px', margin: '0 auto' }}>
        
        {/* Back Link */}
        <div style={{ marginBottom: '2rem' }}>
          <Link to="/rebrand" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', color: 'var(--rebrand-text-muted)', textDecoration: 'none', fontWeight: 700, fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            <ArrowLeft size={14} /> {t('rb_checkout_back')}
          </Link>
        </div>

        {/* Hero Header */}
        <div style={{ borderBottom: '1px solid var(--rebrand-border)', paddingBottom: '2.5rem', marginBottom: '3rem' }}>
          <span style={{ fontSize: '0.85rem', color: 'var(--rebrand-text-muted)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '2px', display: 'block', marginBottom: '0.5rem' }}>
            🤝 iFooty Partnership Program
          </span>
          <h1 style={{ fontSize: '2.8rem', fontWeight: 900, color: '#121416', lineHeight: '1.1', margin: '0 0 1rem 0' }}>
            {t('rb_affiliates_title')}
          </h1>
          <p style={{ fontSize: '1.1rem', color: 'var(--rebrand-text-muted)', maxWidth: '600px', margin: 0, lineHeight: '1.5' }}>
            {t('rb_affiliates_subtitle')}
          </p>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginBottom: '3rem' }}>
          <button 
            onClick={scrollToForm} 
            style={{ 
              padding: '0.9rem 2rem', 
              background: '#000', 
              color: '#fff', 
              border: 'none', 
              borderRadius: '6px', 
              fontWeight: 800, 
              cursor: 'pointer', 
              fontSize: '0.95rem',
              display: 'flex', 
              alignItems: 'center', 
              gap: '0.5rem',
              textTransform: 'uppercase',
              letterSpacing: '0.5px'
            }}
          >
            Apply Now <ChevronRight size={16} />
          </button>
          <button 
            onClick={() => document.getElementById('tiers').scrollIntoView({ behavior: 'smooth' })} 
            style={{ 
              padding: '0.9rem 2rem', 
              background: 'transparent', 
              color: '#121416', 
              border: '1px solid #d1d5db', 
              borderRadius: '6px', 
              fontWeight: 700, 
              cursor: 'pointer', 
              fontSize: '0.95rem'
            }}
          >
            Commission Tiers
          </button>
        </div>

        {/* OVERVIEW */}
        <Section icon={Rocket} title="Program Overview" id="overview">
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', 
            gap: '1.5rem', 
            padding: '1.5rem', 
            border: '1px solid #e5e7eb', 
            borderRadius: '10px',
            marginBottom: '1.5rem'
          }}>
            <div>
              <div style={{ fontSize: '0.75rem', color: 'var(--rebrand-text-muted)', marginBottom: '0.4rem', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 700 }}>Program Model</div>
              <div style={{ fontWeight: 800, color: '#121416', fontSize: '0.95rem' }}>Sales Commission + Bonuses</div>
            </div>
            <div>
              <div style={{ fontSize: '0.75rem', color: 'var(--rebrand-text-muted)', marginBottom: '0.4rem', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 700 }}>Cookie Tracking</div>
              <div style={{ fontWeight: 800, color: '#121416', fontSize: '0.95rem' }}>30 Days Lifetime</div>
            </div>
            <div>
              <div style={{ fontSize: '0.75rem', color: 'var(--rebrand-text-muted)', marginBottom: '0.4rem', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 700 }}>Payment Method</div>
              <div style={{ fontWeight: 800, color: '#121416', fontSize: '0.95rem' }}>E-Transfer / PIX / Wise</div>
            </div>
            <div>
              <div style={{ fontSize: '0.75rem', color: 'var(--rebrand-text-muted)', marginBottom: '0.4rem', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 700 }}>Min. Payout</div>
              <div style={{ fontWeight: 800, color: '#121416', fontSize: '0.95rem' }}>CA$ 50</div>
            </div>
          </div>
        </Section>

        {/* COMMISSION TIERS */}
        <Section icon={DollarSign} title="Progressive Commission Tiers" id="tiers">
          <p style={{ marginBottom: '1.5rem', color: '#4b5563', lineHeight: 1.6 }}>
            The more you share and promote, the larger your payout tier. We offer progressive commission structures that track with your sales count.
          </p>
          <div style={{ border: '1px solid #e5e7eb', borderRadius: '12px', overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ background: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
                  <th style={{ padding: '1rem 1.25rem', fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', color: '#374151' }}>Tier</th>
                  <th style={{ padding: '1rem 1.25rem', fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', color: '#374151' }}>Sales / Month</th>
                  <th style={{ padding: '1rem 1.25rem', fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', color: '#374151' }}>Commission</th>
                  <th style={{ padding: '1rem 1.25rem', fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', color: '#374151' }}>Estimated Earnings*</th>
                </tr>
              </thead>
              <tbody>
                <tr style={{ borderBottom: '1px solid #e5e7eb' }}>
                  <td style={{ padding: '1rem 1.25rem', fontWeight: 700, color: '#4b5563' }}>🥉 Bronze</td>
                  <td style={{ padding: '1rem 1.25rem', color: '#4b5563' }}>1 - 10</td>
                  <td style={{ padding: '1rem 1.25rem', fontWeight: 800, color: '#121416' }}>8%</td>
                  <td style={{ padding: '1rem 1.25rem', color: '#4b5563' }}>CA$ 4.80 - 48.00</td>
                </tr>
                <tr style={{ borderBottom: '1px solid #e5e7eb' }}>
                  <td style={{ padding: '1rem 1.25rem', fontWeight: 700, color: '#4b5563' }}>🥈 Silver</td>
                  <td style={{ padding: '1rem 1.25rem', color: '#4b5563' }}>11 - 25</td>
                  <td style={{ padding: '1rem 1.25rem', fontWeight: 800, color: '#121416' }}>10%</td>
                  <td style={{ padding: '1rem 1.25rem', color: '#4b5563' }}>CA$ 66.00 - 150.00</td>
                </tr>
                <tr style={{ borderBottom: '1px solid #e5e7eb' }}>
                  <td style={{ padding: '1rem 1.25rem', fontWeight: 700, color: '#4b5563' }}>🥇 Gold</td>
                  <td style={{ padding: '1rem 1.25rem', color: '#4b5563' }}>26 - 50</td>
                  <td style={{ padding: '1rem 1.25rem', fontWeight: 800, color: '#121416' }}>12%</td>
                  <td style={{ padding: '1rem 1.25rem', color: '#4b5563' }}>CA$ 187.00 - 360.00</td>
                </tr>
                <tr style={{ borderBottom: 'none' }}>
                  <td style={{ padding: '1rem 1.25rem', fontWeight: 700, color: '#4b5563' }}>💎 Diamond</td>
                  <td style={{ padding: '1rem 1.25rem', color: '#4b5563' }}>51+</td>
                  <td style={{ padding: '1rem 1.25rem', fontWeight: 800, color: '#121416' }}>15%</td>
                  <td style={{ padding: '1rem 1.25rem', color: '#4b5563' }}>CA$ 459.00+</td>
                </tr>
              </tbody>
            </table>
            <div style={{ padding: '0.75rem 1.25rem', background: '#f9fafb', fontSize: '0.75rem', color: 'var(--rebrand-text-muted)', borderTop: '1px solid #e5e7eb' }}>
              *Estimate calculations are based on an average checkout order of CA$ 60.
            </div>
          </div>
        </Section>

        {/* BONUSES & INCENTIVES */}
        <Section icon={Gift} title="Bonuses & Incentives" id="bonuses">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem' }}>
            <div style={{ padding: '1.5rem', border: '1px solid #e5e7eb', borderRadius: '10px' }}>
              <h4 style={{ color: '#121416', fontWeight: 800, fontSize: '0.95rem', textTransform: 'uppercase', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Award size={18} /> Monthly Targets
              </h4>
              <ul style={{ padding: 0, margin: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.6rem', fontSize: '0.9rem', color: '#4b5563' }}>
                <li style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>CA$ 2,000 in sales:</span> <strong style={{ color: '#121416' }}>+CA$ 100</strong>
                </li>
                <li style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>CA$ 4,000 in sales:</span> <strong style={{ color: '#121416' }}>+CA$ 250</strong>
                </li>
                <li style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>CA$ 6,000 in sales:</span> <strong style={{ color: '#121416' }}>+CA$ 500</strong>
                </li>
                <li style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>CA$ 10,000 in sales:</span> <strong style={{ color: '#121416' }}>+CA$ 1,000</strong>
                </li>
              </ul>
            </div>

            <div style={{ padding: '1.5rem', border: '1px solid #e5e7eb', borderRadius: '10px' }}>
              <h4 style={{ color: '#121416', fontWeight: 800, fontSize: '0.95rem', textTransform: 'uppercase', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Calendar size={18} /> Performance Bonuses
              </h4>
              <ul style={{ padding: 0, margin: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.6rem', fontSize: '0.9rem', color: '#4b5563' }}>
                <li style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>First Sale:</span> <strong style={{ color: '#121416' }}>+CA$ 5</strong>
                </li>
                <li style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>5 First Sales:</span> <strong style={{ color: '#121416' }}>+CA$ 15 total</strong>
                </li>
                <li style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>10 First Sales:</span> <strong style={{ color: '#121416' }}>+CA$ 30 total</strong>
                </li>
              </ul>
            </div>
          </div>
        </Section>

        {/* RULES */}
        <Section icon={Shield} title="Compliance & Best Practices" id="rules">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem' }}>
            <div style={{ padding: '1.5rem', border: '1px solid #d1fae5', background: '#ecfdf5', borderRadius: '10px' }}>
              <h4 style={{ color: '#065f46', fontWeight: 800, fontSize: '0.95rem', textTransform: 'uppercase', marginBottom: '1rem' }}>✅ What you CAN do</h4>
              <ul style={{ padding: 0, margin: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.6rem', fontSize: '0.85rem', color: '#065f46' }}>
                <li>• Unboxing and review videos.</li>
                <li>• Organic social posts (Instagram, TikTok).</li>
                <li>• Share with your custom email lists.</li>
                <li>• Run paid ads targeting your custom link.</li>
              </ul>
            </div>
            <div style={{ padding: '1.5rem', border: '1px solid #fee2e2', background: '#fef2f2', borderRadius: '10px' }}>
              <h4 style={{ color: '#991b1b', fontWeight: 800, fontSize: '0.95rem', textTransform: 'uppercase', marginBottom: '1rem' }}>❌ Prohibited Actions</h4>
              <ul style={{ padding: 0, margin: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.6rem', fontSize: '0.85rem', color: '#991b1b' }}>
                <li>• Spamming in public groups or forums.</li>
                <li>• Purchasing through your own referral link.</li>
                <li>• Using bots or click fraud schemes.</li>
                <li>• Running ads on search engines for "iFooty".</li>
              </ul>
            </div>
          </div>
        </Section>

        {/* APPLICATION FORM */}
        <Section icon={FileText} title="Affiliate Application Form" id="apply">
          <div style={{ border: '1px solid #e5e7eb', borderRadius: '12px', padding: '2rem' }}>
            {status === 'success' ? (
              <div style={{ textAlign: 'center', padding: '2rem 1rem' }}>
                <div style={{ width: '64px', height: '64px', borderRadius: '100px', background: '#ecfdf5', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#10b981', margin: '0 auto 1.5rem' }}>
                  <CheckCircle2 size={32} />
                </div>
                <h3 style={{ color: '#121416', fontSize: '1.5rem', marginBottom: '1rem', fontWeight: 800 }}>Application Submitted!</h3>
                <p style={{ color: '#4b5563', lineHeight: 1.6 }}>
                  Thank you for your interest! We have received your application. We will analyze your profile and get in contact via WhatsApp or Email within <strong>24 hours</strong>.
                </p>
                <button 
                  onClick={() => setStatus('idle')} 
                  style={{ 
                    marginTop: '2rem', 
                    background: '#000', 
                    color: '#fff', 
                    border: 'none', 
                    padding: '0.8rem 2rem', 
                    borderRadius: '6px', 
                    fontWeight: 700, 
                    cursor: 'pointer' 
                  }}
                >
                  New Application
                </button>
              </div>
            ) : !user ? (
              <div style={{ textAlign: 'center', padding: '3rem 1rem' }}>
                <div style={{ width: '64px', height: '64px', borderRadius: '100px', background: '#f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#121416', margin: '0 auto 1.5rem' }}>
                  <Lock size={32} />
                </div>
                <h3 style={{ color: '#121416', fontSize: '1.5rem', marginBottom: '1rem', fontWeight: 800 }}>Authentication Required</h3>
                <p style={{ color: '#4b5563', lineHeight: 1.6, maxWidth: '400px', margin: '0 auto 2rem' }}>
                  To apply for the affiliate program and ensure your referrals are tracked correctly, please sign in to your iFooty account.
                </p>
                <button 
                  onClick={() => {
                    sessionStorage.setItem('ifooty_redirect_after_login', '/affiliates#apply');
                    navigate('/auth');
                  }} 
                  style={{ 
                    padding: '0.9rem 2.5rem', 
                    background: '#000', 
                    color: '#fff', 
                    border: 'none', 
                    borderRadius: '6px', 
                    fontWeight: 800, 
                    fontSize: '1rem', 
                    display: 'inline-flex', 
                    alignItems: 'center', 
                    gap: '0.5rem', 
                    cursor: 'pointer' 
                  }}
                >
                  <LogIn size={18} /> Sign In to Continue
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                <div style={{ gridColumn: '1 / -1' }}>
                  <p style={{ color: '#4b5563', fontSize: '0.95rem', margin: 0 }}>
                    Please fill out the form details below. Our team reviews all applications manually.
                  </p>
                </div>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', gridColumn: '1 / -1' }}>
                  <label style={{ fontSize: '0.85rem', color: '#121416', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Full Name *</label>
                  <input 
                    required
                    type="text" 
                    value={formData.name}
                    onChange={e => setFormData({...formData, name: e.target.value})}
                    placeholder="Your Name"
                    style={{ background: '#ffffff', border: '1px solid #d1d5db', borderRadius: '6px', padding: '0.75rem', color: '#121416', outline: 'none' }}
                  />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <label style={{ fontSize: '0.85rem', color: '#121416', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Email Address *</label>
                  <input 
                    required
                    type="email" 
                    value={formData.email}
                    onChange={e => setFormData({...formData, email: e.target.value})}
                    placeholder="you@example.com"
                    style={{ background: '#ffffff', border: '1px solid #d1d5db', borderRadius: '6px', padding: '0.75rem', color: '#121416', outline: 'none' }}
                  />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <label style={{ fontSize: '0.85rem', color: '#121416', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Social Accounts (Instagram/TikTok/YouTube) *</label>
                  <input 
                    required
                    type="text" 
                    value={formData.social}
                    onChange={e => setFormData({...formData, social: e.target.value})}
                    placeholder="Handle, URL or Account name"
                    style={{ background: '#ffffff', border: '1px solid #d1d5db', borderRadius: '6px', padding: '0.75rem', color: '#121416', outline: 'none' }}
                  />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', gridColumn: '1 / -1' }}>
                  <label style={{ fontSize: '0.85rem', color: '#121416', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Preferred Payout Method</label>
                  <select 
                    value={formData.payment}
                    onChange={e => setFormData({...formData, payment: e.target.value})}
                    style={{ background: '#ffffff', border: '1px solid #d1d5db', borderRadius: '6px', padding: '0.75rem', color: '#121416', outline: 'none' }}
                  >
                    <option value="E-Transfer">E-Transfer (Canada)</option>
                    <option value="PIX">PIX (Brazil)</option>
                    <option value="Wise">Wise (International)</option>
                  </select>
                </div>

                {/* Follower numbers block */}
                <div style={{ gridColumn: '1 / -1', background: '#f9fafb', padding: '1.5rem', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
                  <label style={{ fontSize: '0.85rem', color: '#121416', fontWeight: 800, marginBottom: '1.25rem', display: 'block', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Follower Counts</label>
                  
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '1rem' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                      <label style={{ fontSize: '0.75rem', color: 'var(--rebrand-text-muted)', fontWeight: 700 }}>Instagram</label>
                      <input 
                        type="number" 
                        value={formData.followers_insta}
                        onChange={e => setFormData({...formData, followers_insta: e.target.value})}
                        placeholder="0"
                        style={{ background: '#ffffff', border: '1px solid #d1d5db', borderRadius: '6px', padding: '0.5rem', color: '#121416', outline: 'none', width: '100%', boxSizing: 'border-box' }}
                      />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                      <label style={{ fontSize: '0.75rem', color: 'var(--rebrand-text-muted)', fontWeight: 700 }}>TikTok</label>
                      <input 
                        type="number" 
                        value={formData.followers_tiktok}
                        onChange={e => setFormData({...formData, followers_tiktok: e.target.value})}
                        placeholder="0"
                        style={{ background: '#ffffff', border: '1px solid #d1d5db', borderRadius: '6px', padding: '0.5rem', color: '#121416', outline: 'none', width: '100%', boxSizing: 'border-box' }}
                      />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                      <label style={{ fontSize: '0.75rem', color: 'var(--rebrand-text-muted)', fontWeight: 700 }}>X (Twitter)</label>
                      <input 
                        type="number" 
                        value={formData.followers_x}
                        onChange={e => setFormData({...formData, followers_x: e.target.value})}
                        placeholder="0"
                        style={{ background: '#ffffff', border: '1px solid #d1d5db', borderRadius: '6px', padding: '0.5rem', color: '#121416', outline: 'none', width: '100%', boxSizing: 'border-box' }}
                      />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                      <label style={{ fontSize: '0.75rem', color: 'var(--rebrand-text-muted)', fontWeight: 700 }}>Facebook</label>
                      <input 
                        type="number" 
                        value={formData.followers_facebook}
                        onChange={e => setFormData({...formData, followers_facebook: e.target.value})}
                        placeholder="0"
                        style={{ background: '#ffffff', border: '1px solid #d1d5db', borderRadius: '6px', padding: '0.5rem', color: '#121416', outline: 'none', width: '100%', boxSizing: 'border-box' }}
                      />
                    </div>
                  </div>

                  <div style={{ marginTop: '1.25rem', paddingTop: '1rem', borderTop: '1px solid #e5e7eb', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.85rem', color: '#121416', fontWeight: 700 }}>TOTAL ACCUMULATED FOLLOWERS:</span>
                    <span style={{ fontSize: '1.1rem', color: '#121416', fontWeight: 900 }}>
                      {(Number(formData.followers_insta || 0) + Number(formData.followers_tiktok || 0) + Number(formData.followers_x || 0) + Number(formData.followers_facebook || 0)).toLocaleString()}
                    </span>
                  </div>
                </div>

                <div style={{ gridColumn: '1 / -1', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <label style={{ fontSize: '0.85rem', color: '#121416', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>How do you plan to promote iFooty? *</label>
                  <textarea 
                    required
                    value={formData.story}
                    onChange={e => setFormData({...formData, story: e.target.value})}
                    placeholder="Describe your promotion channels, strategy or audience details..."
                    style={{ background: '#ffffff', border: '1px solid #d1d5db', borderRadius: '6px', padding: '0.75rem', color: '#121416', outline: 'none', minHeight: '120px', resize: 'vertical' }}
                  />
                </div>

                {status === 'error' && (
                  <div style={{ gridColumn: '1 / -1', color: '#dc2626', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <AlertCircle size={16} /> An error occurred while submitting your application. Please try again.
                  </div>
                )}

                <div style={{ gridColumn: '1 / -1', marginTop: '1rem' }}>
                  <button 
                    disabled={status === 'submitting'}
                    style={{ 
                      width: '100%', 
                      padding: '1rem', 
                      background: '#000', 
                      color: '#fff', 
                      border: 'none', 
                      borderRadius: '6px', 
                      fontWeight: 800, 
                      fontSize: '1.05rem', 
                      cursor: status === 'submitting' ? 'wait' : 'pointer', 
                      opacity: status === 'submitting' ? 0.7 : 1,
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px'
                    }}
                  >
                    {status === 'submitting' ? 'Submitting...' : 'Submit Application'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </Section>

      </div>
    </div>
  );
};

export default RebrandAffiliatesPage;
