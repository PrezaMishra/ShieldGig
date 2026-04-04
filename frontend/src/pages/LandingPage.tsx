import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Shield, Zap, CloudRain, Brain, Fingerprint,
  ArrowRight, ChevronRight, Activity, Eye, Users, TrendingUp,
  CheckCircle2, Smartphone, MapPin, Clock
} from 'lucide-react';

const features = [
  {
    icon: CloudRain,
    title: 'Parametric Triggers',
    description: 'Real-time weather, AQI, and traffic data automatically detects disruptions in your zone.',
    color: 'from-blue-500/20 to-blue-500/5',
    borderColor: 'border-blue-500/20',
    iconColor: 'text-blue-400',
    tag: 'AUTOMATED',
  },
  {
    icon: Brain,
    title: 'AI Income Prediction',
    description: 'Machine learning models estimate your expected earnings and calculate precise loss amounts.',
    color: 'from-purple-500/20 to-purple-500/5',
    borderColor: 'border-purple-500/20',
    iconColor: 'text-purple-400',
    tag: 'AI-POWERED',
  },
  {
    icon: Zap,
    title: 'Instant Payouts',
    description: 'Zero paperwork, zero phone calls. Compensation credited within 30 seconds of trigger verification.',
    color: 'from-emerald-500/20 to-emerald-500/5',
    borderColor: 'border-emerald-500/20',
    iconColor: 'text-emerald-400',
    tag: 'ZERO-TOUCH',
  },
  {
    icon: Fingerprint,
    title: 'Fraud Defense',
    description: 'Multi-signal behavioral intelligence detects fraud rings without penalizing honest riders.',
    color: 'from-amber-500/20 to-amber-500/5',
    borderColor: 'border-amber-500/20',
    iconColor: 'text-amber-400',
    tag: 'TRUST SCORE',
  },
];

const steps = [
  { num: '01', title: 'Select Plan', desc: 'Choose AI-priced coverage based on your zone and earnings', icon: Smartphone },
  { num: '02', title: 'Auto-Monitor', desc: 'System watches weather, AQI, and traffic 24/7 in your area', icon: Activity },
  { num: '03', title: 'Detect & Calculate', desc: 'AI detects disruption and calculates your exact income loss', icon: Eye },
  { num: '04', title: 'Instant Payout', desc: 'Compensation auto-credited — no claim filing needed', icon: Zap },
];

const stats = [
  { value: '10,000+', label: 'Riders Protected', icon: Users },
  { value: '< 30s', label: 'Payout Speed', icon: Clock },
  { value: '₹46L+', label: 'Total Payouts', icon: TrendingUp },
  { value: '99.2%', label: 'Accuracy Rate', icon: CheckCircle2 },
];

const LandingPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="bg-mesh min-h-screen overflow-x-hidden">
      {/* Background orbs */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-40 -left-40 h-[500px] w-[500px] rounded-full bg-emerald-500/8 blur-3xl animate-float" />
        <div className="absolute top-1/3 -right-32 h-80 w-80 rounded-full bg-indigo-500/10 blur-3xl animate-float-delayed" />
        <div className="absolute bottom-0 left-1/3 h-96 w-96 rounded-full bg-sky-500/5 blur-3xl animate-float" />
      </div>

      {/* ── Navbar ── */}
      <nav className="relative z-50 w-full">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
          <div className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/15 border border-emerald-500/25">
              <Shield className="h-5 w-5 text-emerald-400" strokeWidth={1.5} />
            </div>
            <span className="text-xl font-bold text-white tracking-tight">
              Shield<span className="text-gradient-green">Gig</span>
            </span>
          </div>
          <div className="flex items-center gap-3">
            <button
              id="nav-login-btn"
              onClick={() => navigate('/login')}
              className="rounded-xl border border-white/10 bg-white/5 px-5 py-2.5 text-sm font-semibold text-slate-300 hover:bg-white/10 hover:text-white transition-all"
            >
              Sign In
            </button>
            <button
              id="nav-register-btn"
              onClick={() => navigate('/register')}
              className="rounded-xl px-5 py-2.5 text-sm font-bold text-slate-950 transition-all hover:shadow-lg hover:shadow-emerald-500/25"
              style={{ background: 'linear-gradient(135deg, #10b981, #059669)' }}
            >
              Get Protected
            </button>
          </div>
        </div>
      </nav>

      {/* ── Hero Section ── */}
      <section className="relative z-10 mx-auto max-w-6xl px-6 pt-16 pb-20 md:pt-24 md:pb-28">
        <div className="flex flex-col items-center text-center">
          {/* Pill badge */}
          <div className="animate-slide-up mb-8 flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-4 py-1.5">
            <div className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-xs font-bold uppercase tracking-widest text-emerald-400">
              AI-Powered Parametric Insurance
            </span>
          </div>

          {/* Shield icon */}
          <div className="animate-slide-up relative mb-8">
            <div className="flex h-24 w-24 items-center justify-center rounded-3xl bg-gradient-to-br from-emerald-500/20 to-emerald-500/5 border border-emerald-500/25 shadow-lg shadow-emerald-500/10">
              <Shield className="h-12 w-12 text-emerald-400" strokeWidth={1.5} />
            </div>
            <div className="absolute -top-2 -right-2 flex h-8 w-8 items-center justify-center rounded-full bg-emerald-500 shadow-lg shadow-emerald-500/30">
              <Zap className="h-4 w-4 text-white" fill="white" />
            </div>
            <div className="absolute inset-0 rounded-3xl border-2 border-emerald-500/20 animate-ping-slow" />
          </div>

          {/* Headline */}
          <h1 className="animate-slide-up-delay-1 text-4xl font-black tracking-tight text-white leading-tight md:text-6xl max-w-3xl">
            Income Protection for{' '}
            <span className="text-gradient-green">Gig Workers</span>
          </h1>

          <p className="animate-slide-up-delay-2 mt-6 max-w-2xl text-lg text-slate-400 leading-relaxed md:text-xl">
            We don't process claims — we <span className="text-white font-semibold">predict loss and pay instantly</span>.
            AI-powered parametric insurance that automatically compensates delivery riders when disruptions hit.
          </p>

          {/* CTA Buttons */}
          <div className="animate-slide-up-delay-3 mt-10 flex flex-col sm:flex-row gap-4">
            <button
              id="hero-register-btn"
              onClick={() => navigate('/register')}
              className="group flex items-center justify-center gap-2 rounded-2xl px-8 py-4 text-base font-bold text-slate-950 transition-all hover:shadow-xl hover:shadow-emerald-500/25 hover:-translate-y-0.5"
              style={{ background: 'linear-gradient(135deg, #10b981, #059669)', boxShadow: '0 4px 24px rgba(16, 185, 129, 0.3)' }}
            >
              Start Protection Now
              <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
            </button>
            <button
              id="hero-login-btn"
              onClick={() => navigate('/login')}
              className="flex items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-8 py-4 text-base font-semibold text-slate-300 hover:bg-white/10 hover:text-white transition-all backdrop-blur-sm"
            >
              Already a rider? Sign In
            </button>
          </div>

          {/* Trust indicators */}
          <div className="animate-slide-up-delay-3 mt-12 flex flex-wrap justify-center gap-x-8 gap-y-3">
            {['Zepto', 'Blinkit', 'Swiggy', 'Zomato', 'Dunzo'].map((p) => (
              <span key={p} className="text-sm font-medium text-slate-600">
                {p}
              </span>
            ))}
          </div>
          <p className="mt-2 text-xs text-slate-700">Works with all major delivery platforms</p>
        </div>
      </section>

      {/* ── Stats Bar ── */}
      <section className="relative z-10 border-y border-white/5 bg-white/[0.02] backdrop-blur-sm">
        <div className="mx-auto max-w-6xl grid grid-cols-2 md:grid-cols-4 divide-x divide-white/5">
          {stats.map(({ value, label, icon: Icon }) => (
            <div key={label} className="flex flex-col items-center py-8 px-4">
              <Icon className="h-5 w-5 text-emerald-500/60 mb-2" strokeWidth={1.5} />
              <p className="text-2xl font-black text-white md:text-3xl">{value}</p>
              <p className="mt-1 text-xs text-slate-500 font-medium">{label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Features Grid ── */}
      <section className="relative z-10 mx-auto max-w-6xl px-6 py-20 md:py-28">
        <div className="text-center mb-14">
          <span className="text-xs font-bold uppercase tracking-widest text-emerald-400/70">Core Capabilities</span>
          <h2 className="mt-3 text-3xl font-black text-white md:text-4xl">What Makes ShieldGig Unique</h2>
          <p className="mt-4 text-slate-500 max-w-xl mx-auto">Four pillars of innovation that no other insurance platform offers for gig workers.</p>
        </div>

        <div className="grid gap-5 md:grid-cols-2">
          {features.map(({ icon: Icon, title, description, color, borderColor, iconColor, tag }) => (
            <div
              key={title}
              className={`group rounded-3xl border ${borderColor} bg-gradient-to-br ${color} p-7 transition-all hover:scale-[1.02] hover:shadow-xl`}
            >
              <div className="flex items-start justify-between mb-4">
                <div className={`flex h-12 w-12 items-center justify-center rounded-2xl border ${borderColor} bg-white/5`}>
                  <Icon className={`h-6 w-6 ${iconColor}`} strokeWidth={1.5} />
                </div>
                <span className={`rounded-full border ${borderColor} bg-white/5 px-3 py-1 text-[10px] font-bold uppercase tracking-widest ${iconColor}`}>
                  {tag}
                </span>
              </div>
              <h3 className="text-xl font-bold text-white mb-2">{title}</h3>
              <p className="text-sm text-slate-400 leading-relaxed">{description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── How It Works ── */}
      <section className="relative z-10 mx-auto max-w-6xl px-6 pb-20 md:pb-28">
        <div className="text-center mb-14">
          <span className="text-xs font-bold uppercase tracking-widest text-sky-400/70">System Workflow</span>
          <h2 className="mt-3 text-3xl font-black text-white md:text-4xl">How It Works</h2>
          <p className="mt-4 text-slate-500 max-w-xl mx-auto">From sign-up to payout in four automated steps. No claim forms, no delays.</p>
        </div>

        <div className="grid gap-5 md:grid-cols-4">
          {steps.map(({ num, title, desc, icon: Icon }, i) => (
            <div key={num} className="relative group">
              <div className="glass-card-dark rounded-2xl p-6 h-full transition-all hover:scale-[1.03]">
                <div className="flex items-center gap-3 mb-4">
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-500/15 border border-indigo-500/25 text-sm font-black text-indigo-300">
                    {num}
                  </span>
                  <Icon className="h-5 w-5 text-slate-500" strokeWidth={1.5} />
                </div>
                <h4 className="text-base font-bold text-white mb-2">{title}</h4>
                <p className="text-xs text-slate-500 leading-relaxed">{desc}</p>
              </div>
              {/* Connector arrow */}
              {i < steps.length - 1 && (
                <div className="hidden md:flex absolute -right-3.5 top-1/2 -translate-y-1/2 z-10">
                  <ChevronRight className="h-5 w-5 text-slate-700" />
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* ── Adversarial Defense Banner ── */}
      <section className="relative z-10 mx-auto max-w-6xl px-6 pb-20 md:pb-28">
        <div
          className="relative overflow-hidden rounded-3xl p-8 md:p-12"
          style={{ background: 'linear-gradient(135deg, #1e2a6e 0%, #0f1855 60%, #0a1040 100%)', border: '1px solid rgba(99,102,241,0.3)' }}
        >
          <div className="absolute inset-0 opacity-15" style={{ background: 'radial-gradient(circle at 80% 20%, #6366f1, transparent 50%)' }} />
          <div className="relative flex flex-col md:flex-row md:items-center gap-8">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-4">
                <Fingerprint className="h-5 w-5 text-indigo-300" />
                <span className="text-xs font-bold uppercase tracking-widest text-indigo-300/70">Anti-Fraud Intelligence</span>
              </div>
              <h3 className="text-2xl font-black text-white mb-3 md:text-3xl">
                Trust Score System
              </h3>
              <p className="text-sm text-indigo-200/60 leading-relaxed mb-5 max-w-lg">
                ShieldGig doesn't rely on a single signal like GPS. We build trust using behavioral patterns, device fingerprints, and cross-rider analysis — ensuring fair payouts without penalizing honest riders.
              </p>
              <div className="flex flex-wrap gap-2">
                {['Behavioral Analysis', 'Device Fingerprinting', 'Cross-Rider Clustering', 'GPS Spoof Detection'].map((t) => (
                  <span key={t} className="rounded-full border border-indigo-500/30 bg-indigo-500/10 px-3 py-1 text-[10px] font-bold text-indigo-300 uppercase tracking-wide">
                    {t}
                  </span>
                ))}
              </div>
            </div>

            {/* Trust score visual */}
            <div className="flex flex-col items-center">
              <div className="relative flex h-36 w-36 items-center justify-center">
                <svg className="absolute inset-0 h-full w-full -rotate-90" viewBox="0 0 140 140">
                  <circle cx="70" cy="70" r="58" fill="none" stroke="rgba(99,102,241,0.15)" strokeWidth="8" />
                  <circle
                    cx="70" cy="70" r="58" fill="none" stroke="url(#trustGrad)" strokeWidth="8"
                    strokeLinecap="round" strokeDasharray={`${85 * 3.64} 364.4`}
                  />
                  <defs>
                    <linearGradient id="trustGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#10b981" />
                      <stop offset="100%" stopColor="#6366f1" />
                    </linearGradient>
                  </defs>
                </svg>
                <div className="text-center">
                  <p className="text-4xl font-black text-white">85</p>
                  <p className="text-[10px] text-indigo-300/60 uppercase tracking-widest">Trust Score</p>
                </div>
              </div>
              <div className="mt-3 rounded-full bg-emerald-500/15 border border-emerald-500/30 px-4 py-1.5 text-xs font-bold text-emerald-400">
                ✓ Instant Payout Tier
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Risk Assessment Preview ── */}
      <section className="relative z-10 mx-auto max-w-6xl px-6 pb-20 md:pb-28">
        <div className="text-center mb-14">
          <span className="text-xs font-bold uppercase tracking-widest text-amber-400/70">AI Risk Engine</span>
          <h2 className="mt-3 text-3xl font-black text-white md:text-4xl">Zone Risk Assessment</h2>
          <p className="mt-4 text-slate-500 max-w-xl mx-auto">Hyper-local risk analysis powered by real-time data from IoT sensors, weather stations, and traffic systems.</p>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {[
            { zone: 'Koramangala', risk: 'High', score: 82, color: 'text-red-400', bg: 'bg-red-500/10 border-red-500/20', bar: 'bg-red-500' },
            { zone: 'Indiranagar', risk: 'Medium', score: 55, color: 'text-amber-400', bg: 'bg-amber-500/10 border-amber-500/20', bar: 'bg-amber-500' },
            { zone: 'HSR Layout', risk: 'Medium', score: 60, color: 'text-amber-400', bg: 'bg-amber-500/10 border-amber-500/20', bar: 'bg-amber-500' },
          ].map(({ zone, risk, score, color, bg, bar }) => (
            <div key={zone} className="glass-card-dark rounded-2xl p-6 hover:scale-[1.02] transition-all">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-slate-500" />
                  <p className="text-sm font-bold text-white">{zone}</p>
                </div>
                <span className={`rounded-full border px-3 py-1 text-[10px] font-bold uppercase ${bg} ${color}`}>
                  {risk}
                </span>
              </div>
              <div className="mb-2">
                <div className="flex justify-between mb-1">
                  <span className="text-xs text-slate-500">Risk Score</span>
                  <span className={`text-xs font-bold ${color}`}>{score}/100</span>
                </div>
                <div className="h-2 w-full rounded-full bg-slate-800">
                  <div className={`h-full rounded-full ${bar} transition-all`} style={{ width: `${score}%` }} />
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Bottom CTA ── */}
      <section className="relative z-10 border-t border-white/5 bg-white/[0.02] backdrop-blur-sm">
        <div className="mx-auto max-w-3xl text-center px-6 py-20 md:py-28">
          <h2 className="text-3xl font-black text-white md:text-4xl mb-4">
            Start protecting your income today
          </h2>
          <p className="text-slate-500 mb-8 max-w-lg mx-auto">
            Join thousands of delivery riders who never worry about disruption-driven income loss again.
          </p>
          <button
            id="bottom-cta-btn"
            onClick={() => navigate('/register')}
            className="group inline-flex items-center gap-2 rounded-2xl px-10 py-4 text-base font-bold text-slate-950 transition-all hover:shadow-xl hover:shadow-emerald-500/25 hover:-translate-y-0.5"
            style={{ background: 'linear-gradient(135deg, #10b981, #059669)', boxShadow: '0 4px 24px rgba(16, 185, 129, 0.3)' }}
          >
            Get Protected — It's Quick
            <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
          </button>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="relative z-10 border-t border-white/5">
        <div className="mx-auto max-w-6xl px-6 py-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Shield className="h-4 w-4 text-emerald-500/60" />
            <span className="text-sm text-slate-600">ShieldGig © 2026. AI-Powered Income Protection.</span>
          </div>
          <div className="flex gap-6 text-xs text-slate-700">
            <span>Privacy Policy</span>
            <span>Terms of Service</span>
            <span>Contact</span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
