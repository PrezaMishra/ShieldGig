import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, User, Phone, Truck, MapPin, ArrowRight, ChevronLeft, IndianRupee } from 'lucide-react';
import { workerAPI } from '../api';

const platforms = ['Zepto', 'Blinkit', 'Swiggy Instamart', 'Dunzo', 'Zomato'];
const locations = [
  'Bengaluru - Indiranagar',
  'Bengaluru - Koramangala',
  'Bengaluru - HSR Layout',
  'Mumbai - Andheri',
  'Delhi - Lajpat Nagar',
  'Hyderabad - Banjara Hills',
];

const Register: React.FC = () => {
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    platform: 'Zepto',
    location: 'Bengaluru - Indiranagar',
    daily_income: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.phone.trim()) return;
    const income = parseFloat(formData.daily_income);
    if (isNaN(income) || income <= 0) {
      setError('Please enter a valid daily income amount.');
      return;
    }

    setError('');
    setLoading(true);
    try {
      const payload = { ...formData, daily_income: income };
      const res = await workerAPI.register(payload);
      localStorage.setItem('shieldgig_worker', JSON.stringify(res.data));
      navigate('/dashboard');
    } catch {
      setError('Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const update = (key: keyof typeof formData) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      setFormData(prev => ({ ...prev, [key]: e.target.value }));
      if (error) setError('');
    };

  return (
    <div className="bg-mesh flex min-h-screen items-center justify-center p-4">
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 h-80 w-80 rounded-full bg-sky-500/10 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 h-80 w-80 rounded-full bg-emerald-500/10 blur-3xl" />
      </div>

      <div className="relative w-full max-w-md animate-slide-up">
        <button
          id="back-to-login-btn"
          onClick={() => navigate('/')}
          className="mb-4 flex items-center gap-2 text-sm text-slate-500 hover:text-slate-300 transition-colors"
        >
          <ChevronLeft className="h-4 w-4" />
          Back to Sign In
        </button>

        <div className="glass-card-dark rounded-3xl p-8 shadow-2xl">
          <div className="flex flex-col items-center mb-7">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-500/20 to-sky-500/5 border border-sky-500/20 mb-4">
              <Shield className="h-8 w-8 text-sky-400" strokeWidth={1.5} />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-white">Create Account</h1>
            <p className="mt-1 text-sm text-slate-400 text-center">
              Join 10,000+ gig workers protected by ShieldGig
            </p>
          </div>

          <form onSubmit={handleRegister} className="space-y-4">
            {/* Full Name */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Full Name</label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                <input
                  type="text" required
                  className="input-field-sky pl-11"
                  placeholder="Your full name"
                  value={formData.name}
                  onChange={update('name')}
                />
              </div>
            </div>

            {/* Phone */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Phone Number</label>
              <div className="relative">
                <Phone className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                <input
                  type="tel" required
                  className="input-field-sky pl-11"
                  placeholder="10-digit mobile number"
                  value={formData.phone}
                  onChange={update('phone')}
                />
              </div>
            </div>

            {/* Daily Income — the key new field */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">
                Average Daily Income
              </label>
              <div className="relative">
                <IndianRupee className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                <input
                  type="number" required min="1" step="1"
                  className="input-field-sky pl-11"
                  placeholder="e.g. 800 — your typical daily earnings"
                  value={formData.daily_income}
                  onChange={update('daily_income')}
                />
              </div>
              <p className="mt-1.5 text-xs text-slate-600">
                Your coverage payout will match this amount per disruption day.
              </p>
            </div>

            {/* Platform */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Primary Platform</label>
              <div className="relative">
                <Truck className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500 pointer-events-none z-10" />
                <select
                  className="select-field pl-11 appearance-none"
                  value={formData.platform}
                  onChange={update('platform')}
                >
                  {platforms.map(p => (
                    <option key={p} value={p} className="bg-slate-800">{p}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Location */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Assigned Dark Store Zone</label>
              <div className="relative">
                <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500 pointer-events-none z-10" />
                <select
                  className="select-field pl-11 appearance-none"
                  value={formData.location}
                  onChange={update('location')}
                >
                  {locations.map(l => (
                    <option key={l} value={l} className="bg-slate-800">{l}</option>
                  ))}
                </select>
              </div>
            </div>

            {error && (
              <div className="animate-fade-in rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">
                {error}
              </div>
            )}

            <div className="pt-1">
              <button
                id="register-submit-btn"
                type="submit"
                disabled={loading || !formData.name.trim() || !formData.phone.trim() || !formData.daily_income}
                className="btn-secondary"
              >
                {loading ? (
                  <><span className="spinner" style={{ borderTopColor: '#0f172a' }} /> Registering...</>
                ) : (
                  <>Register & Continue <ArrowRight className="h-4 w-4" /></>
                )}
              </button>
            </div>
          </form>

          <p className="mt-5 text-center text-xs text-slate-600 leading-relaxed">
            By registering you agree to ShieldGig's terms. Your data is never shared with third parties.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;
