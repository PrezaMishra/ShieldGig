import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Shield, ShieldCheck, Bell, CloudRain, Wind, Thermometer,
  IndianRupee, CheckCircle2, AlertTriangle, CloudLightning, MapPin,
  Phone, MessageCircle, Database, ChevronRight,
  Wallet, HelpCircle, Activity, Zap, Eye,
  Droplets, FileText, ArrowUpRight, Pencil, Check, X
} from 'lucide-react';
import { policyAPI, claimAPI, adminAPI, workerAPI } from '../api';

// ─── Types ────────────────────────────────────────────────────────────────────
interface Worker {
  id: number;
  name: string;
  phone: string;
  platform: string;
  location: string;
  daily_income: number;
}
interface Quote {
  weekly_premium_inr: number;
  max_daily_payout_inr: number;
  plan_name: string;
  rationale: string;
}
interface Policy {
  id: number;
  plan_name: string;
  start_date: string;
  end_date: string;
  premium_amount: number;
  coverage_daily: number;
  is_active: boolean;
}
interface Claim {
  id: number;
  event_type: string;
  trigger_date: string;
  payout_amount: number;
  status: string;
}

type Tab = 'safety' | 'coverage' | 'wallet' | 'help';

// ─── Simulated live environment (rotates for demo realism) ────────────────────
const MOCK_TRIGGERS = [
  { type: 'Heavy Rain', value: '12mm', icon: CloudRain, color: '#60a5fa', aqi: '142 (Poor)', visibility: '1.2 km', active: true },
  { type: 'Heatwave', value: '42°C', icon: Thermometer, color: '#f97316', aqi: '89 (Moderate)', visibility: '4.8 km', active: true },
  { type: 'High Wind', value: '38 km/h', icon: Wind, color: '#a78bfa', aqi: '55 (Good)', visibility: '6.1 km', active: true },
];
const currentTrigger = MOCK_TRIGGERS[Math.floor(Date.now() / 3600000) % MOCK_TRIGGERS.length];

// ─── Bottom Navigation ─────────────────────────────────────────────────────────
const BottomNav: React.FC<{ active: Tab; onChange: (t: Tab) => void }> = ({ active, onChange }) => {
  const tabs: { id: Tab; label: string; icon: React.FC<any> }[] = [
    { id: 'safety',   label: 'Safety Net', icon: Shield },
    { id: 'coverage', label: 'Coverage',   icon: ShieldCheck },
    { id: 'wallet',   label: 'Wallet',     icon: Wallet },
    { id: 'help',     label: 'Help',       icon: HelpCircle },
  ];
  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 flex justify-center">
      <div
        className="w-full max-w-lg border-t border-slate-800 bg-slate-950/95 backdrop-blur-xl"
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      >
        <div className="flex">
          {tabs.map(({ id, label, icon: Icon }) => {
            const on = active === id;
            return (
              <button
                key={id}
                id={`tab-${id}`}
                onClick={() => onChange(id)}
                className="flex flex-1 flex-col items-center gap-1 pt-3 pb-3 transition-all"
              >
                <div className={`flex h-7 w-7 items-center justify-center rounded-xl transition-all ${on ? 'bg-emerald-500/20' : ''}`}>
                  <Icon
                    className={`h-4.5 w-4.5 transition-colors ${on ? 'text-emerald-400' : 'text-slate-600'}`}
                    strokeWidth={on ? 2 : 1.5}
                  />
                </div>
                <span className={`text-[10px] font-semibold transition-colors ${on ? 'text-emerald-400' : 'text-slate-600'}`}>
                  {label}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

// ─── Safety Net Tab ────────────────────────────────────────────────────────────
const SafetyNetTab: React.FC<{
  worker: Worker; quote: Quote | null; activePolicy: Policy | null;
  claims: Claim[]; onPurchase: () => void; purchasing: boolean;
  onTrigger: () => void; simulating: boolean;
  simResult: any; onGoToCoverage: () => void;
}> = ({ quote, activePolicy, claims, onPurchase, purchasing, onTrigger, simulating, simResult }) => {
  const TriggerIcon = currentTrigger.icon;
  const mostRecentClaim = claims[0];
  const minutesAgo = mostRecentClaim
    ? Math.max(1, Math.floor((Date.now() - new Date(mostRecentClaim.trigger_date).getTime()) / 60000))
    : null;

  return (
    <div className="space-y-4">
      {/* Active Status Banner */}
      <div className={`flex items-center justify-between rounded-2xl px-5 py-3.5 ${
        activePolicy
          ? 'bg-gradient-to-r from-emerald-500/20 to-emerald-500/10 border border-emerald-500/30'
          : 'bg-rose-500/10 border border-rose-500/20'
      }`}>
        <div className="flex items-center gap-2.5">
          <div className={`h-2.5 w-2.5 rounded-full ${activePolicy ? 'bg-emerald-400 animate-pulse' : 'bg-rose-400'}`} />
          <span className={`text-sm font-bold ${activePolicy ? 'text-emerald-300' : 'text-rose-300'}`}>
            {activePolicy ? 'Active: Shielded' : 'Unprotected'}
          </span>
        </div>
        <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded-full ${
          activePolicy
            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
            : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
        }`}>
          {activePolicy ? 'REAL-TIME' : 'GET COVERED'}
        </span>
      </div>

      {/* Environmental Trigger Card */}
      <div
        className="relative overflow-hidden rounded-3xl p-5"
        style={{ background: 'linear-gradient(135deg, #1e2a6e 0%, #0f1855 60%, #0a1040 100%)', border: '1px solid rgba(99,102,241,0.3)' }}
      >
        <div className="absolute top-0 right-0 h-48 w-48 rounded-full opacity-10 blur-2xl" style={{ background: currentTrigger.color, transform: 'translate(30%, -30%)' }} />
        <div className="relative">
          <p className="text-[10px] font-bold uppercase tracking-widest text-indigo-300/70 mb-2">
            Environmental Trigger
          </p>
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-2xl font-black text-white leading-tight">
                {currentTrigger.type}<br />
                <span style={{ color: currentTrigger.color }}>({currentTrigger.value})</span>
              </h2>
              <div className={`mt-3 inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold ${
                currentTrigger.active ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' : 'bg-slate-500/20 text-slate-400'
              }`}>
                <div className={`h-1.5 w-1.5 rounded-full ${currentTrigger.active ? 'bg-emerald-400 animate-pulse' : 'bg-slate-500'}`} />
                Trigger Status: {currentTrigger.active ? 'ACTIVE' : 'INACTIVE'}
              </div>
            </div>
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-white/10 bg-white/10">
              <TriggerIcon className="h-7 w-7" style={{ color: currentTrigger.color }} strokeWidth={1.5} />
            </div>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-3">
            <div className="rounded-xl bg-white/5 border border-white/5 px-3 py-2.5">
              <p className="text-[10px] text-indigo-300/60 uppercase tracking-wide">AQI Level</p>
              <p className="text-sm font-bold text-white mt-0.5">{currentTrigger.aqi}</p>
            </div>
            <div className="rounded-xl bg-white/5 border border-white/5 px-3 py-2.5">
              <p className="text-[10px] text-indigo-300/60 uppercase tracking-wide">Visibility</p>
              <p className="text-sm font-bold text-white mt-0.5">{currentTrigger.visibility}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Payout or Purchase CTA */}
      {activePolicy ? (
        mostRecentClaim ? (
          <div className="glass-card-dark rounded-2xl p-5">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-semibold text-slate-300">Recent Payout</p>
              <span className="rounded-full bg-emerald-500/15 border border-emerald-500/30 px-2.5 py-1 text-[10px] font-bold text-emerald-400">
                VERIFIED
              </span>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500/10 border border-emerald-500/20">
                <IndianRupee className="h-6 w-6 text-emerald-400" />
              </div>
              <div>
                <p className="text-3xl font-black text-emerald-400">₹{mostRecentClaim.payout_amount}</p>
                <p className="text-xs text-slate-500 mt-0.5">
                  {mostRecentClaim.event_type} &nbsp;·&nbsp;
                  {minutesAgo && minutesAgo < 60 ? `${minutesAgo}m ago` : new Date(mostRecentClaim.trigger_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="glass-card-dark rounded-2xl p-5 text-center">
            <CheckCircle2 className="h-8 w-8 text-emerald-400 mx-auto mb-2" />
            <p className="text-sm font-semibold text-slate-300">Policy Active — No events yet</p>
            <p className="text-xs text-slate-600 mt-1">Payouts fire automatically when a trigger hits your zone</p>
          </div>
        )
      ) : (
        /* Purchase CTA */
        quote && (
          <div className="glass-card-dark rounded-2xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-500 uppercase tracking-wide">AI Weekly Quote</p>
                <p className="text-3xl font-black text-gradient-green mt-1">₹{quote.weekly_premium_inr}</p>
                <p className="text-xs text-slate-500">Covers ₹{quote.max_daily_payout_inr}/day disruptions</p>
              </div>
              <div className="text-right">
                <p className="text-[10px] text-slate-600">Daily Cover</p>
                <p className="text-lg font-black text-emerald-400">₹{quote.max_daily_payout_inr}</p>
              </div>
            </div>
            <button id="purchase-policy-btn" onClick={onPurchase} disabled={purchasing} className="btn-primary">
              {purchasing ? <><span className="spinner" /> Processing...</> : <><ShieldCheck className="h-5 w-5" /> Protect My Income Now</>}
            </button>
          </div>
        )
      )}

      {/* Protection Metrics */}
      {activePolicy && (
        <div className="glass-card-dark rounded-2xl p-5">
          <p className="text-sm font-semibold text-slate-300 mb-3">Protection Metrics</p>
          <div className="grid grid-cols-2 gap-3">
            <div className="stat-card">
              <div className="flex items-center gap-2 mb-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-sky-500/10 border border-sky-500/20">
                  <ShieldCheck className="h-4 w-4 text-sky-400" />
                </div>
                <p className="text-[10px] uppercase tracking-wide text-slate-500">Health Cover</p>
              </div>
              <p className="text-xl font-black text-white">₹5,00,000</p>
            </div>
            <div className="stat-card">
              <div className="flex items-center gap-2 mb-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500/10 border border-amber-500/20">
                  <AlertTriangle className="h-4 w-4 text-amber-400" />
                </div>
                <p className="text-[10px] uppercase tracking-wide text-slate-500">Accident Cover</p>
              </div>
              <p className="text-xl font-black text-white">₹10,00,000</p>
            </div>
          </div>
        </div>
      )}

      {/* Shield Events / Claims */}
      {claims.length > 0 && (
        <div className="glass-card-dark rounded-2xl p-5">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-semibold text-slate-300">Shield Events</p>
            <button className="text-xs text-emerald-400 font-semibold">VIEW ALL</button>
          </div>
          <div className="space-y-2.5">
            {claims.slice(0, 3).map((c, i) => {
              const icons = [CloudRain, Thermometer, Wind, CloudLightning];
              const colors = ['text-blue-400', 'text-orange-400', 'text-purple-400', 'text-yellow-400'];
              const Icon = icons[i % icons.length];
              return (
                <div key={c.id} className="flex items-center gap-3 rounded-xl border border-white/5 bg-white/3 px-3 py-3">
                  <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/5`}>
                    <Icon className={`h-4.5 w-4.5 ${colors[i % colors.length]}`} strokeWidth={1.5} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-white truncate">{c.event_type}</p>
                    <p className="text-xs text-slate-500">
                      {new Date(c.trigger_date).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-black text-emerald-400">+₹{c.payout_amount}</p>
                    <span className="text-[9px] uppercase font-bold text-emerald-500 bg-emerald-500/10 px-1.5 py-0.5 rounded-full">{c.status}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Admin Trigger Block */}
      <div className="relative overflow-hidden rounded-3xl border border-red-900/50 bg-gradient-to-br from-red-950/40 to-slate-900/80 p-5">
        <div className="absolute top-0 left-0 w-full h-0.5 bg-gradient-to-r from-red-500 via-orange-500 to-amber-500" />
        <div className="flex items-center gap-2 mb-1">
          <AlertTriangle className="h-4 w-4 text-red-400" />
          <p className="text-xs font-bold text-red-400 uppercase tracking-widest">Admin Demo Zone</p>
        </div>
        <p className="text-xs text-slate-600 mb-3 leading-relaxed">
          Simulate a real-world parametric trigger — all workers with active policies in your zone receive instant auto-payouts.
        </p>
        <button id="trigger-weather-btn" onClick={onTrigger} disabled={simulating} className="btn-danger text-sm py-3">
          {simulating ? <><span className="spinner" style={{ borderTopColor: 'white' }} /> Triggering...</> : <><Zap className="h-4 w-4" fill="currentColor" /> TRIGGER EXTREME WEATHER</>}
        </button>
        {simResult && (
          <div className="mt-3 rounded-xl border border-red-500/20 bg-black/40 p-3 font-mono animate-fade-in">
            <div className="flex items-center gap-2 mb-1.5">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[10px] text-emerald-400 font-bold uppercase">Processed</span>
            </div>
            <p className="text-xs text-slate-300">{simResult.message}</p>
            {simResult.total_claims_generated > 0 && (
              <div className="mt-2 pt-2 border-t border-white/5 grid grid-cols-2 gap-2">
                <div>
                  <p className="text-[9px] text-slate-600">Claims</p>
                  <p className="text-base font-black text-white">{simResult.total_claims_generated}</p>
                </div>
                <div>
                  <p className="text-[9px] text-slate-600">Paid Out</p>
                  <p className="text-base font-black text-emerald-400">₹{simResult.total_payouts_inr}</p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

// ─── Coverage Tab ──────────────────────────────────────────────────────────────
const CoverageTab: React.FC<{
  worker: Worker; quote: Quote | null; activePolicy: Policy | null;
  onIncomeUpdate: (newIncome: number) => Promise<void>;
}> = ({ worker, quote, activePolicy, onIncomeUpdate }) => {
  const [editing, setEditing] = useState(false);
  const [inputVal, setInputVal] = useState(String(worker.daily_income));
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');

  // Keep input in sync if worker prop updates
  useEffect(() => { setInputVal(String(worker.daily_income)); }, [worker.daily_income]);

  const handleSave = async () => {
    const val = parseFloat(inputVal);
    if (isNaN(val) || val <= 0) { setSaveError('Enter a valid amount'); return; }
    setSaving(true); setSaveError('');
    try {
      await onIncomeUpdate(val);
      setEditing(false);
    } catch { setSaveError('Failed to save. Try again.'); }
    finally { setSaving(false); }
  };

  const handleCancel = () => { setEditing(false); setInputVal(String(worker.daily_income)); setSaveError(''); };

  const daily = activePolicy ? activePolicy.coverage_daily : worker.daily_income;
  const premium = activePolicy ? activePolicy.premium_amount : (quote?.weekly_premium_inr ?? '—');
  const lightPayout = Math.round(daily * 0.5);
  const heavyPayout = daily;
  const aqiLightPayout = Math.round(daily * 0.4);
  const aqiHeavyPayout = daily;

  const thresholds = [
    {
      category: 'Rain Thresholds',
      icon: Droplets,
      iconColor: 'text-blue-400',
      iconBg: 'bg-blue-500/10 border-blue-500/20',
      items: [
        { label: 'Light Rain Support', value: '>10mm', badge: 'POSSIBLY PAID', badgeColor: 'bg-amber-500/15 text-amber-400 border-amber-500/30', payout: `₹${lightPayout}`, desc: 'Slippery roads reduce delivery speed and safety.' },
        { label: 'Heavy Rain Support', value: '>20mm', badge: 'DEFINITELY PAID', badgeColor: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30', payout: `₹${heavyPayout}`, desc: 'Severe flooding makes delivery unsafe or impossible.' },
      ]
    },
    {
      category: 'AQI Thresholds',
      icon: Eye,
      iconColor: 'text-amber-400',
      iconBg: 'bg-amber-500/10 border-amber-500/20',
      items: [
        { label: 'Poor Air Quality', value: '>300 AQI', badge: 'POSSIBLY PAID', badgeColor: 'bg-amber-500/15 text-amber-400 border-amber-500/30', payout: `₹${aqiLightPayout}`, desc: 'Health risk for outdoor workers without protection.' },
        { label: 'Hazardous Air', value: '>400 AQI', badge: 'DEFINITELY PAID', badgeColor: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30', payout: `₹${aqiHeavyPayout}`, desc: 'Extreme health danger — payouts are fully automatic.' },
      ]
    },
    {
      category: 'Wind & Extreme Heat',
      icon: Wind,
      iconColor: 'text-purple-400',
      iconBg: 'bg-purple-500/10 border-purple-500/20',
      items: [
        { label: 'High Wind Warning', value: '>35 km/h', badge: 'AUTO PAID', badgeColor: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30', payout: `₹${Math.round(daily * 0.6)}`, desc: 'Strong winds create accident risk for 2-wheelers.' },
        { label: 'Heatwave Alert', value: '>42°C', badge: 'AUTO PAID', badgeColor: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30', payout: `₹${daily}`, desc: 'Dangerous heat stress — full daily cover activated.' },
      ]
    },
  ];

  return (
    <div className="space-y-5">
      {/* Headline */}
      <div
        className="relative overflow-hidden rounded-3xl p-5"
        style={{ background: 'linear-gradient(135deg, #1e2a6e 0%, #0f1855 100%)', border: '1px solid rgba(99,102,241,0.3)' }}
      >
        <div className="flex items-center gap-3 mb-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-indigo-500/20 border border-indigo-500/30">
            <Activity className="h-5 w-5 text-indigo-300" />
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-widest text-indigo-300/60">Automated</p>
            <p className="text-sm font-bold text-white">Sentinel Engine</p>
          </div>
        </div>
        <p className="text-xs text-indigo-200/70 leading-relaxed">
          ShieldGig continuously monitors hyper-local weather & AQI data from certified sensors in your zone. When thresholds are crossed, payouts fire <span className="text-indigo-300 font-semibold">automatically — no claim needed</span>.
        </p>
        <div className="mt-3 flex gap-2">
          <span className="rounded-full bg-emerald-500/15 border border-emerald-500/30 px-2.5 py-1 text-[10px] font-bold text-emerald-400">Zero-Touch</span>
          <span className="rounded-full bg-indigo-500/15 border border-indigo-500/30 px-2.5 py-1 text-[10px] font-bold text-indigo-300">Instant Payout</span>
          <span className="rounded-full bg-sky-500/15 border border-sky-500/30 px-2.5 py-1 text-[10px] font-bold text-sky-300">AI-Powered</span>
        </div>
      </div>

      {/* Your income — editable */}
      <div className="glass-card-dark rounded-2xl px-5 py-4">
        <div className="flex items-center justify-between mb-1">
          <p className="text-xs text-slate-500 uppercase tracking-wide">Your Daily Income</p>
          {!editing && (
            <button
              id="edit-income-btn"
              onClick={() => setEditing(true)}
              className="flex items-center gap-1 rounded-lg border border-slate-700/50 bg-slate-800/60 px-2.5 py-1 text-xs text-slate-400 hover:text-emerald-400 hover:border-emerald-500/30 transition-all"
            >
              <Pencil className="h-3 w-3" /> Edit
            </button>
          )}
        </div>

        {editing ? (
          <div className="mt-2 space-y-2">
            <div className="relative">
              <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                id="income-input"
                type="number"
                min="1"
                step="1"
                autoFocus
                className="input-field pl-9 text-lg font-bold"
                value={inputVal}
                onChange={e => { setInputVal(e.target.value); setSaveError(''); }}
                onKeyDown={e => { if (e.key === 'Enter') handleSave(); if (e.key === 'Escape') handleCancel(); }}
              />
            </div>
            {saveError && <p className="text-xs text-red-400">{saveError}</p>}
            <div className="flex gap-2">
              <button
                id="save-income-btn"
                onClick={handleSave}
                disabled={saving}
                className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-emerald-500 py-2.5 text-sm font-bold text-slate-950 hover:bg-emerald-400 disabled:opacity-50 transition-all"
              >
                {saving ? <span className="spinner" /> : <Check className="h-4 w-4" />}
                {saving ? 'Saving...' : 'Save'}
              </button>
              <button
                onClick={handleCancel}
                className="flex items-center justify-center gap-1.5 rounded-xl border border-slate-700 bg-slate-800 px-4 py-2.5 text-sm text-slate-400 hover:text-slate-200 transition-all"
              >
                <X className="h-4 w-4" /> Cancel
              </button>
            </div>
          </div>
        ) : (
          <div className="flex items-end justify-between mt-1">
            <div>
              <p className="text-2xl font-black text-white">₹{daily}<span className="text-sm font-normal text-slate-500">/day</span></p>
              <p className="text-xs text-slate-600 mt-0.5">Tap Edit to update anytime</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-slate-500">{activePolicy ? 'Active Premium' : 'Weekly Premium'}</p>
              <p className="text-xl font-black text-emerald-400">₹{premium}</p>
            </div>
          </div>
        )}
      </div>

      {/* Threshold sections */}
      {thresholds.map(section => {
        const Icon = section.icon;
        return (
          <div key={section.category} className="glass-card-dark rounded-2xl p-5 space-y-3">
            <div className="flex items-center gap-2 mb-1">
              <div className={`flex h-8 w-8 items-center justify-center rounded-xl border ${section.iconBg}`}>
                <Icon className={`h-4 w-4 ${section.iconColor}`} strokeWidth={1.5} />
              </div>
              <p className="text-sm font-bold text-white">{section.category}</p>
            </div>
            {section.items.map(item => (
              <div key={item.label} className="rounded-xl border border-white/5 bg-white/3 p-4">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex-1">
                    <p className="text-xs font-semibold text-slate-300">{item.label}</p>
                    <p className="text-lg font-black text-white mt-0.5">{item.value}</p>
                  </div>
                  <span className={`shrink-0 rounded-full border px-2 py-0.5 text-[9px] font-bold uppercase ${item.badgeColor}`}>
                    {item.badge}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <p className="text-xs text-slate-600 leading-relaxed flex-1 pr-4">{item.desc}</p>
                  <p className="text-base font-black text-emerald-400 shrink-0">{item.payout}</p>
                </div>
              </div>
            ))}
          </div>
        );
      })}

      {/* Hyper-local accuracy */}
      <div className="glass-card-dark rounded-2xl p-5">
        <div className="flex items-center gap-2 mb-3">
          <MapPin className="h-4 w-4 text-emerald-400" />
          <p className="text-sm font-bold text-white">Hyper-local Accuracy</p>
        </div>
        <p className="text-xs text-slate-500 leading-relaxed mb-3">
          ShieldGig uses IoT sensors within 500m of your dark store, not city-level averages. Your zone: <span className="text-slate-300 font-semibold">{worker.location}</span>.
        </p>
        <div
          className="h-28 w-full rounded-xl flex items-center justify-center text-slate-600 text-xs"
          style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e3a5f 50%, #0f2a4a 100%)', border: '1px solid rgba(255,255,255,0.06)' }}
        >
          <div className="text-center">
            <MapPin className="h-8 w-8 text-emerald-500/40 mx-auto mb-1" strokeWidth={1} />
            <p className="text-emerald-400/60 text-xs">Monitoring active · {worker.location}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

// ─── Wallet Tab ────────────────────────────────────────────────────────────────
const WalletTab: React.FC<{ claims: Claim[]; worker: Worker }> = ({ claims }) => {
  const total = claims.reduce((s, c) => s + c.payout_amount, 0);
  const thisMonth = claims.filter(c => {
    const d = new Date(c.trigger_date);
    const now = new Date();
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  }).reduce((s, c) => s + c.payout_amount, 0);

  const eventIcons = [CloudRain, Thermometer, Wind, CloudLightning, Droplets];
  const eventColors = ['text-blue-400 bg-blue-500/10 border-blue-500/20', 'text-orange-400 bg-orange-500/10 border-orange-500/20', 'text-purple-400 bg-purple-500/10 border-purple-500/20', 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20', 'text-sky-400 bg-sky-500/10 border-sky-500/20'];

  return (
    <div className="space-y-4">
      {/* Total Balance Hero */}
      <div
        className="relative overflow-hidden rounded-3xl p-6 text-center"
        style={{ background: 'linear-gradient(135deg, #1e2a6e 0%, #0f1855 60%, #0a1040 100%)', border: '1px solid rgba(99,102,241,0.3)' }}
      >
        <div className="absolute inset-0 opacity-20" style={{ background: 'radial-gradient(circle at 50% 0%, #6366f1, transparent 70%)' }} />
        <div className="relative">
          <p className="text-xs uppercase tracking-widest text-indigo-300/60 mb-2">Total Received</p>
          <p className="text-5xl font-black text-white">
            ₹{total.toLocaleString('en-IN')}
          </p>
          <div className="mt-1 flex items-center justify-center gap-1 text-emerald-400">
            <ArrowUpRight className="h-4 w-4" />
            <span className="text-sm font-semibold">Auto-credited via ShieldGig</span>
          </div>

          <div className="mt-5 grid grid-cols-2 gap-3">
            <div className="rounded-2xl bg-white/5 border border-white/5 py-3 px-4">
              <p className="text-[10px] text-indigo-200/50 uppercase tracking-wide">This Month</p>
              <p className="text-xl font-black text-white mt-0.5">₹{thisMonth.toLocaleString('en-IN')}</p>
            </div>
            <div className="rounded-2xl bg-white/5 border border-white/5 py-3 px-4">
              <p className="text-[10px] text-indigo-200/50 uppercase tracking-wide">Events Paid</p>
              <p className="text-xl font-black text-white mt-0.5">{String(claims.length).padStart(2, '0')}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Status strip */}
      {total > 0 && (
        <div className="flex items-center gap-2.5 rounded-2xl border border-emerald-500/20 bg-emerald-500/8 px-4 py-3">
          <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0" />
          <p className="text-sm text-emerald-300 font-medium">Credits are auto-approved &amp; deposited instantly.</p>
        </div>
      )}

      {/* Payout History */}
      <div className="glass-card-dark rounded-2xl p-5">
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm font-bold text-white">Recent Payouts</p>
          <span className="text-xs text-slate-600">{claims.length} total</span>
        </div>

        {claims.length === 0 ? (
          <div className="flex flex-col items-center py-10 text-center">
            <Wallet className="h-12 w-12 text-slate-700 mb-3" strokeWidth={1} />
            <p className="text-slate-500 font-medium text-sm">No payouts yet</p>
            <p className="text-xs text-slate-700 mt-1">Get covered and payouts appear here automatically when a weather trigger fires in your zone.</p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {claims.map((c, i) => {
              const Icon = eventIcons[i % eventIcons.length];
              const colorClass = eventColors[i % eventColors.length];
              return (
                <div key={c.id} className="flex items-center gap-3 rounded-xl border border-white/5 bg-white/3 px-4 py-3.5 hover:bg-white/5 transition-colors">
                  <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border ${colorClass}`}>
                    <Icon className="h-5 w-5" strokeWidth={1.5} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-white truncate">{c.event_type}</p>
                    <p className="text-xs text-slate-500">
                      {new Date(c.trigger_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-base font-black text-emerald-400">+₹{c.payout_amount}</p>
                    <span className="text-[9px] font-bold uppercase text-emerald-500 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">
                      {c.status}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

// ─── Help Tab ──────────────────────────────────────────────────────────────────
const HelpTab: React.FC<{ worker: Worker }> = ({ worker }) => {
  const faqItems = [
    { q: 'Automated Monitoring', a: 'Our AI scans certified weather stations every 60 seconds within 500m of your dark store. Coverage requires an active policy.' },
    { q: 'Instant Claims', a: 'When a threshold is crossed, the payout is auto-approved — no paperwork, no phone calls, no waiting.' },
    { q: 'Instant Payout', a: 'Credits arrive in your registered UPI account within 30 seconds of trigger verification.' },
  ];
  const sources = [
    { name: 'Wunderground API', status: 'Connected' },
    { name: 'IMD Weather Bureau', status: 'Connected' },
    { name: 'CPCB AQI Network', status: 'Connected' },
    { name: 'Forest Electronics IoT', status: 'Connected' },
  ];

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="glass-card-dark rounded-2xl p-5">
        <div className="flex items-center gap-2 mb-1">
          <Shield className="h-4 w-4 text-emerald-400" />
          <p className="text-[10px] uppercase tracking-widest text-slate-500">Sentinel Support</p>
        </div>
        <h2 className="text-xl font-bold text-white">How can we help you today?</h2>
      </div>

      {/* Contact options */}
      <div className="glass-card-dark rounded-2xl p-5 space-y-3">
        <a
          href="tel:18002586789"
          className="flex items-center gap-4 rounded-xl border border-white/5 bg-white/3 px-4 py-4 hover:bg-white/6 transition-colors"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/15 border border-emerald-500/20">
            <Phone className="h-5 w-5 text-emerald-400" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold text-white">Call Support</p>
            <p className="text-xs text-slate-500">1800-258-6789 · Free · 24/7</p>
          </div>
          <ChevronRight className="h-4 w-4 text-slate-600" />
        </a>

        <a
          href="https://wa.me/918888000000"
          target="_blank"
          rel="noreferrer"
          className="flex items-center gap-4 rounded-xl border border-white/5 bg-white/3 px-4 py-4 hover:bg-white/6 transition-colors"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-green-500/15 border border-green-500/20">
            <MessageCircle className="h-5 w-5 text-green-400" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold text-white">WhatsApp Help</p>
            <p className="text-xs text-slate-500">Usually replies within 5 minutes</p>
          </div>
          <ChevronRight className="h-4 w-4 text-slate-600" />
        </a>
      </div>

      {/* Featured article */}
      <div
        className="relative overflow-hidden rounded-2xl p-5"
        style={{ background: 'linear-gradient(135deg, #1e2a6e 0%, #0f1855 100%)', border: '1px solid rgba(99,102,241,0.3)' }}
      >
        <div className="flex items-start gap-3 mb-3">
          <span className="rounded-full bg-emerald-500/20 border border-emerald-500/30 px-2 py-0.5 text-[9px] font-bold text-emerald-400 uppercase">FEATURED ARTICLE</span>
        </div>
        <p className="text-base font-bold text-white leading-tight mb-2">
          Monsoon Safety Guide &amp; Extreme Weather Protocols
        </p>
        <p className="text-xs text-indigo-200/60 leading-relaxed mb-3">
          Understand how ShieldGig monitors the monsoon season and what to do when your zone triggers go active.
        </p>
        <button className="rounded-xl bg-white/10 border border-white/10 px-4 py-2 text-xs font-semibold text-white hover:bg-white/15 transition-colors">
          View Article →
        </button>
      </div>

      {/* FAQ: How ShieldGig Protects You */}
      <div className="glass-card-dark rounded-2xl p-5">
        <div className="flex items-center gap-2 mb-4">
          <FileText className="h-4 w-4 text-sky-400" />
          <p className="text-sm font-bold text-white">How ShieldGig Protects You</p>
        </div>
        <div className="space-y-3">
          {faqItems.map((item, i) => (
            <div key={i} className="rounded-xl border border-white/5 bg-white/3 p-4">
              <div className="flex items-start gap-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-indigo-500/20 text-[11px] font-bold text-indigo-300">
                  {i + 1}
                </span>
                <div>
                  <p className="text-sm font-semibold text-white">{item.q}</p>
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed">{item.a}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* API Data Sources */}
      <div className="glass-card-dark rounded-2xl p-5">
        <div className="flex items-center gap-2 mb-4">
          <Database className="h-4 w-4 text-purple-400" />
          <p className="text-sm font-bold text-white">Live Data Sources</p>
        </div>
        <div className="space-y-2.5">
          {sources.map(src => (
            <div key={src.name} className="flex items-center justify-between rounded-xl border border-white/5 bg-white/3 px-4 py-3">
              <div className="flex items-center gap-2.5">
                <div className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                <p className="text-sm text-slate-300 font-medium">{src.name}</p>
              </div>
              <span className="text-[10px] font-bold text-emerald-400 uppercase">{src.status}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Account info */}
      <div className="glass-card-dark rounded-2xl px-5 py-4">
        <p className="text-xs text-slate-600 text-center">
          Logged in as <span className="text-slate-400 font-medium">{worker.name}</span> · {worker.phone}
        </p>
      </div>
    </div>
  );
};


// ─── Main Dashboard ────────────────────────────────────────────────────────────
const Dashboard: React.FC = () => {
  const [worker, setWorker] = useState<Worker | null>(null);
  const [quote, setQuote] = useState<Quote | null>(null);
  const [activePolicy, setActivePolicy] = useState<Policy | null>(null);
  const [claims, setClaims] = useState<Claim[]>([]);
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState(false);
  const [simulating, setSimulating] = useState(false);
  const [simResult, setSimResult] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<Tab>('safety');

  const navigate = useNavigate();

  const loadData = useCallback(async (w: Worker) => {
    try {
      const quoteRes = await policyAPI.calculatePremium(w.location, w.daily_income ?? 900);
      setQuote(quoteRes.data);
      try {
        const polRes = await policyAPI.getActivePolicy(w.id);
        setActivePolicy(polRes.data);
      } catch { setActivePolicy(null); }
      const claimsRes = await claimAPI.getClaims(w.id);
      // Sort newest first
      const sorted = (claimsRes.data as Claim[]).sort(
        (a, b) => new Date(b.trigger_date).getTime() - new Date(a.trigger_date).getTime()
      );
      setClaims(sorted);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => {
    const wStr = localStorage.getItem('shieldgig_worker');
    if (!wStr) { navigate('/'); return; }
    const w: Worker = JSON.parse(wStr);
    setWorker(w);
    loadData(w);
  }, [navigate, loadData]);

  const handlePurchase = async () => {
    if (!worker || !quote) return;
    setPurchasing(true);
    try {
      await policyAPI.createPolicy({ worker_id: worker.id, plan_name: quote.plan_name, premium_amount: quote.weekly_premium_inr, coverage_daily: quote.max_daily_payout_inr });
      await loadData(worker);
    } catch { alert('Failed to purchase policy.'); }
    finally { setPurchasing(false); }
  };

  const handleTrigger = async () => {
    if (!worker) return;
    setSimulating(true); setSimResult(null);
    try {
      const res = await adminAPI.triggerEvent({ location: worker.location, event_type: currentTrigger.type });
      setSimResult(res.data);
      await loadData(worker);
    } catch { alert('Simulation failed. Is backend running?'); }
    finally { setSimulating(false); }
  };

  // ── Income update: persists to backend, updates localStorage & re-fetches quote ──
  const handleIncomeUpdate = async (newIncome: number) => {
    if (!worker) return;
    try {
      const res = await workerAPI.updateIncome(worker.id, newIncome);
      const updatedWorker: Worker = res.data;
      setWorker(updatedWorker);
      localStorage.setItem('shieldgig_worker', JSON.stringify(updatedWorker));
      // Re-fetch quote with new income — modifies premium & coverage amounts live
      await loadData(updatedWorker);
    } catch (err) {
      console.error(err);
      throw err;
    }
  };

  if (loading) {
    return (
      <div className="bg-mesh flex min-h-screen flex-col items-center justify-center gap-4">
        <div className="relative">
          <div className="h-16 w-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
            <Shield className="h-8 w-8 text-emerald-400" strokeWidth={1.5} />
          </div>
          <div className="absolute inset-0 rounded-2xl border-2 border-emerald-500/30 animate-ping" />
        </div>
        <div className="text-center">
          <p className="text-slate-300 font-semibold">Loading your Shield...</p>
          <p className="text-slate-600 text-sm mt-1">Fetching AI risk assessment</p>
        </div>
      </div>
    );
  }

  if (!worker) return null;

  return (
    <div className="bg-mesh min-h-screen">
      {/* Background orbs */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-40 -left-40 h-96 w-96 rounded-full bg-emerald-500/8 blur-3xl" />
        <div className="absolute top-1/3 -right-20 h-64 w-64 rounded-full bg-indigo-500/8 blur-3xl" />
      </div>

      {/* ── Top bar ── */}
      <div className="sticky top-0 z-40 flex justify-center">
        <div className="w-full max-w-lg border-b border-white/5 bg-slate-950/90 backdrop-blur-xl px-4 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Shield className="h-6 w-6 text-emerald-400" strokeWidth={1.5} />
            <span className="text-base font-bold text-white">ShieldGig</span>
          </div>
          <div className="flex items-center gap-2">
            <button className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/5 bg-white/5 text-slate-400 hover:text-slate-200 transition-colors">
              <Bell className="h-4.5 w-4.5" />
            </button>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-indigo-500/30 bg-indigo-500/20 text-sm font-bold text-indigo-300">
              {worker.name.split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase()}
            </div>
          </div>
        </div>
      </div>

      {/* ── Page content ── */}
      <div className="relative mx-auto max-w-lg px-4 pt-5 pb-28 space-y-0">
        {activeTab === 'safety' && (
          <SafetyNetTab
            worker={worker} quote={quote} activePolicy={activePolicy}
            claims={claims} onPurchase={handlePurchase} purchasing={purchasing}
            onTrigger={handleTrigger} simulating={simulating} simResult={simResult}
            onGoToCoverage={() => setActiveTab('coverage')}
          />
        )}
        {activeTab === 'coverage' && (
          <CoverageTab worker={worker} quote={quote} activePolicy={activePolicy} onIncomeUpdate={handleIncomeUpdate} />
        )}
        {activeTab === 'wallet'   && <WalletTab claims={claims} worker={worker} />}
        {activeTab === 'help'     && <HelpTab worker={worker} />}
      </div>

      {/* ── Bottom nav ── */}
      <BottomNav active={activeTab} onChange={setActiveTab} />
    </div>
  );
};

export default Dashboard;
