import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, Phone, ArrowRight, Zap } from 'lucide-react';
import { workerAPI } from '../api';

const Login: React.FC = () => {
  const [phone, setPhone] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone.trim()) return;

    setError('');
    setLoading(true);
    try {
      const res = await workerAPI.getWorker(phone.trim());
      if (res.data) {
        localStorage.setItem('shieldgig_worker', JSON.stringify(res.data));
        navigate('/dashboard');
      }
    } catch {
      setError('Account not found. Please register first or check your phone number.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-mesh flex min-h-screen items-center justify-center p-4">
      {/* Background decorative orbs */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-40 -left-40 h-80 w-80 rounded-full bg-emerald-500/10 blur-3xl" />
        <div className="absolute -bottom-40 -right-40 h-80 w-80 rounded-full bg-sky-500/10 blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-96 w-96 rounded-full bg-emerald-500/5 blur-3xl" />
      </div>

      <div className="relative w-full max-w-md animate-slide-up">
        {/* Card */}
        <div className="glass-card-dark rounded-3xl p-8 shadow-2xl">
          {/* Logo area */}
          <div className="flex flex-col items-center mb-8">
            <div className="relative mb-5">
              <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500/20 to-emerald-500/5 border border-emerald-500/20">
                <Shield className="h-10 w-10 text-emerald-400" strokeWidth={1.5} />
              </div>
              <div className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500">
                <Zap className="h-3 w-3 text-white" fill="white" />
              </div>
            </div>

            <h1 className="text-3xl font-bold tracking-tight text-white">
              Shield<span className="text-gradient-green">Gig</span>
            </h1>
            <p className="mt-2 text-sm text-slate-400 text-center">
              AI-powered income protection for gig workers
            </p>

            {/* Feature pills */}
            <div className="mt-4 flex flex-wrap justify-center gap-2">
              {['Zero-Touch Claims', 'Dynamic Pricing', 'Instant Payouts'].map((f) => (
                <span key={f} className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-wide text-emerald-400">
                  {f}
                </span>
              ))}
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-slate-300 mb-1">
                Phone Number
              </label>
              <div className="relative">
                <Phone className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                <input
                  id="phone"
                  name="phone"
                  type="tel"
                  required
                  className="input-field pl-11"
                  placeholder="Enter your 10-digit number"
                  value={phone}
                  onChange={(e) => {
                    setPhone(e.target.value);
                    if (error) setError('');
                  }}
                />
              </div>
            </div>

            {error && (
              <div className="animate-fade-in rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">
                {error}
              </div>
            )}

            <button
              type="submit"
              id="login-btn"
              disabled={loading || !phone.trim()}
              className="btn-primary"
            >
              {loading ? (
                <>
                  <span className="spinner" />
                  Logging in...
                </>
              ) : (
                <>
                  Sign In
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="mt-6 flex items-center gap-4">
            <div className="h-px flex-1 bg-slate-800" />
            <span className="text-xs text-slate-600">OR</span>
            <div className="h-px flex-1 bg-slate-800" />
          </div>

          <p className="mt-5 text-center text-sm text-slate-500">
            New to ShieldGig?{' '}
            <button
              id="go-register-btn"
              onClick={() => navigate('/register')}
              className="font-semibold text-sky-400 hover:text-sky-300 transition-colors underline-offset-2 hover:underline"
            >
              Create your account →
            </button>
          </p>
        </div>

        {/* Footer note */}
        <p className="mt-6 text-center text-xs text-slate-600">
          Trusted by 10,000+ gig workers across India
        </p>
      </div>
    </div>
  );
};

export default Login;
