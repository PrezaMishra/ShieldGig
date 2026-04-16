import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Shield, ShieldCheck, Bell, CloudRain, Wind, Thermometer,
  IndianRupee, CheckCircle2, AlertTriangle, CloudLightning, MapPin,
  Phone, MessageCircle, Database, ChevronRight,
  Wallet, HelpCircle, Activity, Zap, Eye,
  Droplets, FileText, ArrowUpRight, Pencil, Check, X,
  LogOut, Fingerprint, Flame, Gauge, Clock, ChevronDown
} from 'lucide-react';
import { policyAPI, claimAPI, adminAPI, workerAPI, trustAPI, riskAPI } from '../api';

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
interface TrustData {
  composite_score: number;
  tier: string;
  tier_label: string;
  tier_description: string;
  breakdown: { behavioral_consistency: number; device_authenticity: number; claim_accuracy: number; peer_comparison: number };
}
interface RiskData {
  location: string;
  risk_level: string;
  risk_score: number;
  factors: { name: string; severity: string; score: number; detail: string }[];
  active_triggers: string[];
}

type Tab = 'safety' | 'coverage' | 'wallet' | 'help' | 'admin';

// ─── Event Type Options for Simulation ────────────────────────────────────────
const EVENT_TYPES = [
  { type: 'Heavy Rain', value: '>50mm/hr', icon: CloudRain, color: '#60a5fa', severity: 'Severe', tempRange: '22-26°C', humidity: '94%', windSpeed: '28 km/h', aqi: '142 (Poor)', visibility: '1.2 km' },
  { type: 'Extreme Heat', value: '>45°C', icon: Thermometer, color: '#f97316', severity: 'Extreme', tempRange: '45-48°C', humidity: '18%', windSpeed: '8 km/h', aqi: '180 (Unhealthy)', visibility: '4.8 km' },
  { type: 'AQI Crisis', value: '>300 AQI', icon: Gauge, color: '#ef4444', severity: 'Hazardous', tempRange: '30-34°C', humidity: '45%', windSpeed: '5 km/h', aqi: '342 (Hazardous)', visibility: '0.8 km' },
  { type: 'Flash Flooding', value: 'Roads submerged', icon: Droplets, color: '#06b6d4', severity: 'Critical', tempRange: '24-28°C', humidity: '98%', windSpeed: '35 km/h', aqi: '160 (Unhealthy)', visibility: '0.5 km' },
  { type: 'Cyclone Warning', value: 'Cat 2+', icon: Wind, color: '#a78bfa', severity: 'Extreme', tempRange: '26-30°C', humidity: '92%', windSpeed: '95 km/h', aqi: '200 (Very Unhealthy)', visibility: '0.3 km' },
];

// ─── Simulated live environment (rotates for demo realism) ────────────────────
const MOCK_TRIGGERS = [
  { type: 'Heavy Rain', value: '12mm', icon: CloudRain, color: '#60a5fa', aqi: '142 (Poor)', visibility: '1.2 km', active: true },
  { type: 'Heatwave', value: '42°C', icon: Thermometer, color: '#f97316', aqi: '89 (Moderate)', visibility: '4.8 km', active: true },
  { type: 'High Wind', value: '38 km/h', icon: Wind, color: '#a78bfa', aqi: '55 (Good)', visibility: '6.1 km', active: true },
];
const currentTrigger = MOCK_TRIGGERS[Math.floor(Date.now() / 3600000) % MOCK_TRIGGERS.length];

// ─── Toast Notification Component ─────────────────────────────────────────────
const ToastNotification: React.FC<{
  show: boolean;
  amount: number;
  eventType: string;
  trustScore: number;
  onClose: () => void;
}> = ({ show, amount, eventType, trustScore, onClose }) => {
  useEffect(() => {
    if (show) {
      const timer = setTimeout(onClose, 6000);
      return () => clearTimeout(timer);
    }
  }, [show, onClose]);

  if (!show) return null;

  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[100] w-full max-w-md px-4 animate-slide-down">
      <div className="relative overflow-hidden rounded-2xl border border-emerald-500/40 bg-slate-950/95 backdrop-blur-xl p-4 shadow-2xl shadow-emerald-500/10">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-400 via-emerald-500 to-teal-500" />
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-400 via-emerald-500 to-teal-500 animate-toast-progress" />
        <button onClick={onClose} className="absolute top-3 right-3 text-slate-500 hover:text-slate-300 transition-colors">
          <X className="h-4 w-4" />
        </button>
        <div className="flex items-start gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-500/20 border border-emerald-500/30">
            <IndianRupee className="h-5 w-5 text-emerald-400" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <p className="text-sm font-bold text-emerald-400">Payout Credited! 🎉</p>
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-ping" />
            </div>
            <p className="text-2xl font-black text-white mt-0.5">₹{amount}</p>
            <p className="text-xs text-slate-500 mt-1">
              {eventType} detected · Trust Score {trustScore} · <span className="text-emerald-400 font-semibold">Auto-approved in &lt;30s</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

// ─── Live Weather Widget ──────────────────────────────────────────────────────
const LiveWeatherWidget: React.FC<{ location: string }> = ({ location }) => {
  const [weather, setWeather] = useState({
    temp: 31, rainfall: 2.4, aqi: 128, humidity: 72, windSpeed: 12,
    condition: 'Partly Cloudy', updatedSecondsAgo: 0,
  });

  useEffect(() => {
    const interval = setInterval(() => {
      setWeather(prev => ({
        temp: +(prev.temp + (Math.random() - 0.5) * 0.6).toFixed(1),
        rainfall: +Math.max(0, prev.rainfall + (Math.random() - 0.4) * 0.8).toFixed(1),
        aqi: Math.max(50, Math.min(300, Math.round(prev.aqi + (Math.random() - 0.5) * 8))),
        humidity: Math.max(40, Math.min(99, Math.round(prev.humidity + (Math.random() - 0.5) * 3))),
        windSpeed: +Math.max(2, prev.windSpeed + (Math.random() - 0.5) * 2).toFixed(1),
        condition: prev.rainfall > 5 ? '🌧️ Raining' : prev.temp > 38 ? '☀️ Extreme Heat' : prev.aqi > 200 ? '🫁 Poor Air' : '⛅ Partly Cloudy',
        updatedSecondsAgo: 0,
      }));
    }, 4000);
    const tickInterval = setInterval(() => {
      setWeather(prev => ({ ...prev, updatedSecondsAgo: prev.updatedSecondsAgo + 1 }));
    }, 1000);
    return () => { clearInterval(interval); clearInterval(tickInterval); };
  }, []);

  const aqiColor = weather.aqi > 200 ? 'text-red-400' : weather.aqi > 150 ? 'text-orange-400' : weather.aqi > 100 ? 'text-amber-400' : 'text-emerald-400';
  const aqiLabel = weather.aqi > 200 ? 'Very Unhealthy' : weather.aqi > 150 ? 'Unhealthy' : weather.aqi > 100 ? 'Moderate' : 'Good';

  return (
    <div className="relative overflow-hidden rounded-2xl border border-sky-500/20 bg-gradient-to-br from-sky-950/50 to-slate-900/80 p-4">
      <div className="absolute top-0 left-0 w-full h-0.5 bg-gradient-to-r from-sky-400 via-blue-500 to-indigo-500" />
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <CloudRain className="h-4 w-4 text-sky-400" />
          <p className="text-xs font-bold text-sky-300 uppercase tracking-widest">Live Conditions</p>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-[10px] text-slate-500">{weather.updatedSecondsAgo}s ago</span>
        </div>
      </div>
      <div className="flex items-center justify-between mb-3">
        <div>
          <p className="text-2xl font-black text-white">{weather.temp}°C</p>
          <p className="text-xs text-slate-400">{weather.condition}</p>
        </div>
        <div className="text-right">
          <p className="text-xs text-slate-500">{location.split(',')[0]}</p>
          <p className={`text-sm font-bold ${aqiColor}`}>AQI {weather.aqi}</p>
          <p className={`text-[10px] ${aqiColor}`}>{aqiLabel}</p>
        </div>
      </div>
      <div className="grid grid-cols-3 gap-2">
        <div className="rounded-lg bg-white/5 border border-white/5 px-2 py-2 text-center">
          <Droplets className="h-3.5 w-3.5 text-blue-400 mx-auto mb-1" />
          <p className="text-xs font-bold text-white">{weather.rainfall}mm</p>
          <p className="text-[9px] text-slate-500">Rainfall</p>
        </div>
        <div className="rounded-lg bg-white/5 border border-white/5 px-2 py-2 text-center">
          <Wind className="h-3.5 w-3.5 text-purple-400 mx-auto mb-1" />
          <p className="text-xs font-bold text-white">{weather.windSpeed} km/h</p>
          <p className="text-[9px] text-slate-500">Wind</p>
        </div>
        <div className="rounded-lg bg-white/5 border border-white/5 px-2 py-2 text-center">
          <Gauge className="h-3.5 w-3.5 text-cyan-400 mx-auto mb-1" />
          <p className="text-xs font-bold text-white">{weather.humidity}%</p>
          <p className="text-[9px] text-slate-500">Humidity</p>
        </div>
      </div>
    </div>
  );
};

// ─── Bottom Navigation ─────────────────────────────────────────────────────────
const BottomNav: React.FC<{ active: Tab; onChange: (t: Tab) => void }> = ({ active, onChange }) => {
  const tabs: { id: Tab; label: string; icon: React.FC<any> }[] = [
    { id: 'safety',   label: 'Safety Net', icon: Shield },
    { id: 'coverage', label: 'Coverage',   icon: ShieldCheck },
    { id: 'wallet',   label: 'Wallet',     icon: Wallet },
    { id: 'help',     label: 'Help',       icon: HelpCircle },
    { id: 'admin', label: 'Admin', icon: Database },
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
  trustData: TrustData | null; riskData: RiskData | null;
  selectedEventType: number; onEventTypeChange: (idx: number) => void;
}> = ({ worker, quote, activePolicy, claims, onPurchase, purchasing, onTrigger, simulating, simResult, trustData, riskData, selectedEventType, onEventTypeChange }) => {
  const [showEventDropdown, setShowEventDropdown] = useState(false);
  const selectedEvent = EVENT_TYPES[selectedEventType];
  const SelectedIcon = selectedEvent.icon;
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
        <p className="text-emerald-400 text-sm">
            AI Trust Score: {trustData?.composite_score}
        </p>
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

      {/* Trust Score Card */}
      {trustData && (
        <div className="glass-card-dark rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Fingerprint className="h-4 w-4 text-indigo-400" />
              <p className="text-sm font-bold text-white">Trust Score</p>
            </div>
            <span className={`rounded-full border px-3 py-1 text-[10px] font-bold uppercase ${
              trustData.tier === 'instant_payout'
                ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                : trustData.tier === 'partial_review'
                ? 'bg-amber-500/15 text-amber-400 border-amber-500/30'
                : 'bg-red-500/15 text-red-400 border-red-500/30'
            }`}>
              {trustData.tier_label}
            </span>
          </div>
          <div className="flex items-center gap-5">
            {/* Score ring */}
            <div className="relative flex h-20 w-20 shrink-0 items-center justify-center">
              <svg className="absolute inset-0 h-full w-full -rotate-90" viewBox="0 0 80 80">
                <circle cx="40" cy="40" r="34" fill="none" stroke="rgba(99,102,241,0.15)" strokeWidth="5" />
                <circle cx="40" cy="40" r="34" fill="none" stroke={trustData.composite_score >= 80 ? '#10b981' : trustData.composite_score >= 50 ? '#f59e0b' : '#ef4444'} strokeWidth="5" strokeLinecap="round" strokeDasharray={`${trustData.composite_score * 2.136} 213.6`} />
              </svg>
              <span className="text-xl font-black text-white">{trustData.composite_score}</span>
            </div>
            <div className="flex-1 space-y-1.5">
              {Object.entries(trustData.breakdown).map(([key, val]) => (
                <div key={key} className="flex items-center gap-2">
                  <span className="text-[10px] text-slate-500 w-24 truncate capitalize">{key.replace('_', ' ')}</span>
                  <div className="flex-1 h-1.5 rounded-full bg-slate-800">
                    <div className="h-full rounded-full bg-indigo-500/70" style={{ width: `${val}%` }} />
                  </div>
                  <span className="text-[10px] font-bold text-slate-400 w-8 text-right">{val}</span>
                </div>
              ))}
            </div>
          </div>
          <p className="mt-3 text-xs text-slate-600 leading-relaxed">{trustData.tier_description}</p>
        </div>
      )}

      {/* AI Risk Assessment Card */}
      {riskData && (
        <div className="glass-card-dark rounded-2xl p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-amber-400" />
              <p className="text-sm font-bold text-white">Zone Risk Assessment</p>
            </div>
            <span className={`rounded-full border px-3 py-1 text-[10px] font-bold uppercase ${
              riskData.risk_level === 'High' ? 'bg-red-500/15 text-red-400 border-red-500/30'
              : riskData.risk_level === 'Medium' ? 'bg-amber-500/15 text-amber-400 border-amber-500/30'
              : 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
            }`}>
              {riskData.risk_level} Risk
            </span>
          </div>
          <div className="mb-3">
            <div className="flex justify-between mb-1">
              <span className="text-xs text-slate-500">{worker.location}</span>
              <span className="text-xs font-bold text-white">{riskData.risk_score}/100</span>
            </div>
            <div className="h-2 w-full rounded-full bg-slate-800">
              <div className={`h-full rounded-full transition-all ${
                riskData.risk_level === 'High' ? 'bg-red-500' : riskData.risk_level === 'Medium' ? 'bg-amber-500' : 'bg-emerald-500'
              }`} style={{ width: `${riskData.risk_score}%` }} />
            </div>
          </div>
          <div className="space-y-1.5">
            {riskData.factors.slice(0, 3).map(f => (
              <div key={f.name} className="flex items-center justify-between rounded-lg bg-white/3 px-3 py-2">
                <span className="text-xs text-slate-400">{f.name}</span>
                <span className={`text-xs font-bold ${
                  f.severity === 'High' ? 'text-red-400' : f.severity === 'Medium' ? 'text-amber-400' : 'text-emerald-400'
                }`}>{f.severity}</span>
              </div>
            ))}
          </div>
          {riskData.active_triggers.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {riskData.active_triggers.map(t => (
                <span key={t} className="rounded-full bg-red-500/10 border border-red-500/20 px-2.5 py-0.5 text-[9px] font-bold text-red-400 uppercase">
                  ⚠ {t}
                </span>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Live Weather Widget */}
      <LiveWeatherWidget location={worker.location} />

      {/* Recent Events Timeline */}
      {claims.length > 0 && (
        <div className="glass-card-dark rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <Clock className="h-4 w-4 text-sky-400" />
            <p className="text-sm font-bold text-white">Event Timeline</p>
            <span className="ml-auto rounded-full bg-sky-500/15 border border-sky-500/30 px-2 py-0.5 text-[9px] font-bold text-sky-400">
              {claims.length} EVENT{claims.length !== 1 ? 'S' : ''}
            </span>
          </div>
          <div className="relative">
            {/* Timeline line */}
            <div className="absolute left-[15px] top-2 bottom-2 w-px bg-gradient-to-b from-emerald-500/40 via-indigo-500/30 to-transparent" />
            <div className="space-y-3">
              {claims.slice(0, 5).map((c, i) => {
                const eventIcons: Record<string, typeof CloudRain> = { 'Heavy Rain': CloudRain, 'Extreme Heat': Thermometer, 'AQI Crisis': Gauge, 'Flash Flooding': Droplets, 'Cyclone Warning': Wind, 'Heatwave': Thermometer, 'High Wind': Wind };
                const eventColors: Record<string, string> = { 'Heavy Rain': '#60a5fa', 'Extreme Heat': '#f97316', 'AQI Crisis': '#ef4444', 'Flash Flooding': '#06b6d4', 'Cyclone Warning': '#a78bfa', 'Heatwave': '#f97316', 'High Wind': '#a78bfa' };
                const Icon = eventIcons[c.event_type] || CloudLightning;
                const clr = eventColors[c.event_type] || '#a78bfa';
                const timeStr = new Date(c.trigger_date).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
                const dateStr = new Date(c.trigger_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
                const minsAgo = Math.max(1, Math.floor((Date.now() - new Date(c.trigger_date).getTime()) / 60000));
                return (
                  <div key={c.id} className="flex items-start gap-3 pl-0">
                    <div className="relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-white/10 bg-slate-900" style={{ boxShadow: `0 0 12px ${clr}33` }}>
                      <Icon className="h-3.5 w-3.5" style={{ color: clr }} />
                    </div>
                    <div className="flex-1 min-w-0 rounded-xl border border-white/5 bg-white/3 px-3 py-2.5">
                      <div className="flex items-center justify-between">
                        <p className="text-xs font-semibold text-white">{c.event_type}</p>
                        <span className={`text-[9px] uppercase font-bold px-1.5 py-0.5 rounded-full ${
                          c.status === 'paid' ? 'bg-emerald-500/15 text-emerald-400' : c.status === 'partial-paid' ? 'bg-amber-500/15 text-amber-400' : 'bg-red-500/15 text-red-400'
                        }`}>{c.status}</span>
                      </div>
                      <div className="flex items-center justify-between mt-1">
                        <span className="text-[10px] text-slate-500">{minsAgo < 60 ? `${minsAgo}m ago` : `${dateStr} ${timeStr}`}</span>
                        <span className="text-sm font-black text-emerald-400">+₹{c.payout_amount}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Admin Trigger Block */}
      <div className="relative overflow-hidden rounded-3xl border border-red-900/50 bg-gradient-to-br from-red-950/40 to-slate-900/80 p-5">
        <div className="absolute top-0 left-0 w-full h-0.5 bg-gradient-to-r from-red-500 via-orange-500 to-amber-500" />
        <div className="flex items-center gap-2 mb-1">
          <AlertTriangle className="h-4 w-4 text-red-400" />
          <p className="text-xs font-bold text-red-400 uppercase tracking-widest">Parametric Trigger Simulator</p>
        </div>
        <p className="text-xs text-slate-600 mb-3 leading-relaxed">
          Select a disruption type and simulate a real-world parametric trigger — all workers with active policies receive instant auto-payouts.
        </p>

        {/* Event Type Selector */}
        <div className="relative mb-3">
          <button
            onClick={() => setShowEventDropdown(!showEventDropdown)}
            className="w-full flex items-center justify-between rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-left hover:bg-white/8 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 bg-white/5">
                <SelectedIcon className="h-4.5 w-4.5" style={{ color: selectedEvent.color }} />
              </div>
              <div>
                <p className="text-sm font-semibold text-white">{selectedEvent.type}</p>
                <p className="text-[10px] text-slate-500">Threshold: {selectedEvent.value} · Severity: {selectedEvent.severity}</p>
              </div>
            </div>
            <ChevronDown className={`h-4 w-4 text-slate-500 transition-transform ${showEventDropdown ? 'rotate-180' : ''}`} />
          </button>
          {showEventDropdown && (
            <div className="absolute top-full left-0 right-0 mt-1 rounded-xl border border-white/10 bg-slate-900/98 backdrop-blur-xl shadow-2xl z-20 overflow-hidden">
              {EVENT_TYPES.map((evt, idx) => {
                const EvtIcon = evt.icon;
                return (
                  <button
                    key={evt.type}
                    onClick={() => { onEventTypeChange(idx); setShowEventDropdown(false); }}
                    className={`w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-white/5 transition-colors border-b border-white/5 last:border-0 ${
                      idx === selectedEventType ? 'bg-white/8' : ''
                    }`}
                  >
                    <EvtIcon className="h-4 w-4 shrink-0" style={{ color: evt.color }} />
                    <div className="flex-1">
                      <p className="text-xs font-semibold text-white">{evt.type}</p>
                      <p className="text-[10px] text-slate-500">{evt.value} · {evt.severity}</p>
                    </div>
                    {idx === selectedEventType && <Check className="h-4 w-4 text-emerald-400 shrink-0" />}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Simulated Conditions Preview */}
        <div className="grid grid-cols-4 gap-1.5 mb-3">
          <div className="rounded-lg bg-black/30 border border-white/5 p-2 text-center">
            <p className="text-[9px] text-slate-600">Temp</p>
            <p className="text-xs font-bold text-white">{selectedEvent.tempRange}</p>
          </div>
          <div className="rounded-lg bg-black/30 border border-white/5 p-2 text-center">
            <p className="text-[9px] text-slate-600">Humidity</p>
            <p className="text-xs font-bold text-white">{selectedEvent.humidity}</p>
          </div>
          <div className="rounded-lg bg-black/30 border border-white/5 p-2 text-center">
            <p className="text-[9px] text-slate-600">Wind</p>
            <p className="text-xs font-bold text-white">{selectedEvent.windSpeed}</p>
          </div>
          <div className="rounded-lg bg-black/30 border border-white/5 p-2 text-center">
            <p className="text-[9px] text-slate-600">AQI</p>
            <p className="text-xs font-bold" style={{ color: selectedEvent.color }}>{selectedEvent.aqi.split(' ')[0]}</p>
          </div>
        </div>

        <button id="trigger-weather-btn" onClick={onTrigger} disabled={simulating} className="btn-danger text-sm py-3">
          {simulating ? <><span className="spinner" style={{ borderTopColor: 'white' }} /> Detecting &amp; Processing...</> : <><Zap className="h-4 w-4" fill="currentColor" /> TRIGGER: {selectedEvent.type.toUpperCase()}</>}
        </button>
        {simResult && (
          <div className="mt-3 rounded-xl border border-emerald-500/20 bg-black/40 p-3 font-mono animate-fade-in">
            <div className="flex items-center gap-2 mb-1.5">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[10px] text-emerald-400 font-bold uppercase">✓ Auto-Processed in &lt;30s</span>
            </div>
            <p className="text-xs text-slate-300">{simResult.message}</p>
            {simResult.total_claims_generated > 0 && (
              <div className="mt-2 pt-2 border-t border-white/5 grid grid-cols-3 gap-2">
                <div>
                  <p className="text-[9px] text-slate-600">Claims</p>
                  <p className="text-base font-black text-white">{simResult.total_claims_generated}</p>
                </div>
                <div>
                  <p className="text-[9px] text-slate-600">Paid Out</p>
                  <p className="text-base font-black text-emerald-400">₹{simResult.total_payouts_inr}</p>
                </div>
                <div>
                  <p className="text-[9px] text-slate-600">Event</p>
                  <p className="text-xs font-bold" style={{ color: selectedEvent.color }}>{selectedEvent.type}</p>
                </div>
              </div>
            )}
            {simResult.trust_score_breakdown && simResult.trust_score_breakdown.length > 0 && (
              <div className="mt-2 pt-2 border-t border-white/5">
                <p className="text-[9px] text-slate-600 mb-1">Trust Score Decision</p>
                {simResult.trust_score_breakdown.map((d: any) => (
                  <div key={d.worker_id} className="flex items-center gap-2 text-xs">
                    <span className="text-slate-500">Score: {d.trust_score}</span>
                    <span className="text-slate-600">→</span>
                    <span className={d.status === 'paid' ? 'text-emerald-400 font-bold' : d.status === 'partial-paid' ? 'text-amber-400 font-bold' : 'text-red-400 font-bold'}>
                      {d.status === 'paid' ? '✓ Full Payout' : d.status === 'partial-paid' ? '⚠ Partial (60%)' : '✗ Flagged'}
                    </span>
                    <span className="text-emerald-400 font-bold ml-auto">₹{d.payout}</span>
                  </div>
                ))}
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
              <p className="text-xl font-black text-emerald-400">₹{quote?.weekly_premium_inr}</p>
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
  const defenseLayerIcons = [Eye, Fingerprint, MapPin, Activity, Database];
  const defenseLayerColors = ['text-blue-400 bg-blue-500/10 border-blue-500/20', 'text-purple-400 bg-purple-500/10 border-purple-500/20', 'text-amber-400 bg-amber-500/10 border-amber-500/20', 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20', 'text-sky-400 bg-sky-500/10 border-sky-500/20'];

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

      {/* Fraud Detection Intelligence */}
      <div
        className="relative overflow-hidden rounded-3xl p-5"
        style={{ background: 'linear-gradient(135deg, #1e2a6e 0%, #0f1855 60%, #0a1040 100%)', border: '1px solid rgba(99,102,241,0.3)' }}
      >
        <div className="absolute top-0 left-0 w-full h-0.5 bg-gradient-to-r from-indigo-500 via-purple-500 to-emerald-500" />
        <div className="flex items-center gap-2 mb-3">
          <Fingerprint className="h-4 w-4 text-indigo-300" />
          <p className="text-xs font-bold text-indigo-300 uppercase tracking-widest">Fraud Detection Intelligence</p>
        </div>
        <div className="grid grid-cols-3 gap-2 mb-4">
          <div className="rounded-xl bg-white/5 border border-white/5 py-2.5 px-3 text-center">
            <p className="text-lg font-black text-white">10,247</p>
            <p className="text-[9px] text-indigo-300/50 uppercase">Riders Monitored</p>
          </div>
          <div className="rounded-xl bg-white/5 border border-white/5 py-2.5 px-3 text-center">
            <p className="text-lg font-black text-emerald-400">3</p>
            <p className="text-[9px] text-indigo-300/50 uppercase">Rings Neutralized</p>
          </div>
          <div className="rounded-xl bg-white/5 border border-white/5 py-2.5 px-3 text-center">
            <p className="text-lg font-black text-emerald-400">0.8%</p>
            <p className="text-[9px] text-indigo-300/50 uppercase">False Positive</p>
          </div>
        </div>
        <p className="text-xs text-indigo-200/50 font-semibold mb-2">Defense Layers</p>
        <div className="space-y-1.5">
          {[
            'Behavioral Analysis',
            'Geo-Spatial Verification',
            'Device Fingerprinting',
            'Cross-Rider Clustering',
            'External Data Correlation',
          ].map((layer, i) => {
            const Icon = defenseLayerIcons[i];
            return (
              <div key={layer} className="flex items-center gap-2.5 rounded-lg bg-white/3 border border-white/5 px-3 py-2">
                <div className={`flex h-6 w-6 items-center justify-center rounded-lg border ${defenseLayerColors[i]}`}>
                  <Icon className="h-3 w-3" strokeWidth={1.5} />
                </div>
                <span className="text-xs text-slate-300 font-medium flex-1">{layer}</span>
                <div className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-[9px] font-bold text-emerald-400">ACTIVE</span>
              </div>
            );
          })}
        </div>
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
  const [loading, setLoading] = useState(false);
  const [purchasing, setPurchasing] = useState(false);
  const [simulating, setSimulating] = useState(false);
  const [simResult, setSimResult] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<Tab>('safety');
  const [trustData, setTrustData] = useState<TrustData | null>(null);
  const [riskData, setRiskData] = useState<RiskData | null>(null);
  const [selectedEventType, setSelectedEventType] = useState(0);
  const [toast, setToast] = useState<{ show: boolean; amount: number; eventType: string; trustScore: number }>({ show: false, amount: 0, eventType: '', trustScore: 0 });
  const [wallet, setWallet] = useState(0);
  const [status, setStatus] = useState("");
  
useEffect(() => {
    const dummyWorker = {
      id: 1,
      name: "Rider",
      phone: "9999999999",
      platform: "Swiggy",
      location: "Bangalore",
      daily_income: 1000
    };

    setWorker(dummyWorker as any);

    setQuote({
      weekly_premium_inr: 70,
      max_daily_payout_inr: 500,
      plan_name: "Basic",
      rationale: "AI based"
    });

    setActivePolicy({
      id: 1,
      plan_name: "Basic",
      start_date: "",
      end_date: "",
      premium_amount: 70,
      coverage_daily: 500,
      is_active: true
    });

    setClaims([]);

    setTrustData({
      composite_score: 80,
      tier: "instant_payout",
      tier_label: "Trusted",
      tier_description: "High trust user",
      breakdown: {
        behavioral_consistency: 90,
        device_authenticity: 85,
        claim_accuracy: 88,
        peer_comparison: 80
      }
    });

    setRiskData({
      location: "Bangalore",
      risk_level: "high",
      risk_score: 90,
      factors: [],
      active_triggers: ["Heavy Rain"]
    });

  }, []);
  
  
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
      // Fetch trust score & risk assessment
      try { const tRes = await trustAPI.getTrustScore(w.id); setTrustData(tRes.data); } catch { /* ok */ }
      try { const rRes = await riskAPI.getRiskAssessment(w.location); setRiskData(rRes.data); } catch { /* ok */ }
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => {
  // backend disabled for phase 3 demo
}, []);
  
  useEffect(() => {
  if (!riskData) return;

  let dynamicPremium = 70;

  if (riskData.risk_level === "High") dynamicPremium = 90;
  else if (riskData.risk_level === "Low") dynamicPremium = 60;

  setQuote({
    weekly_premium_inr: dynamicPremium,
    max_daily_payout_inr: 500,
    plan_name: "Dynamic Plan",
    rationale: "AI-based dynamic pricing"
  });

}, [riskData]);

  const handlePurchase = async () => {
    if (!worker || !quote) return;
    setPurchasing(true);
    try {
      await policyAPI.createPolicy({ worker_id: worker.id, plan_name: quote.plan_name, premium_amount: quote.weekly_premium_inr, coverage_daily: quote.max_daily_payout_inr });
      await loadData(worker);
    } catch { alert('Failed to purchase policy.'); }
    finally { setPurchasing(false); }
  };

  // ── Income update: persists to backend, updates localStorage & re-fetches quote ──
  const handleTrigger = async () => {
   console.log("Trigger fired");

   if (!worker) return;
    
   if ((trustData?.composite_score || 0) < 50) {
      setStatus("Fraud ❌");

      alert("Low trust score — claim rejected");

      return;
    }
    //Reject Case 
   if (worker?.location !== "Bangalore") {
  setStatus("Fraud ❌");

  const newClaim = {
    id: Date.now(),
    event: selectedEventType === 0 ? "Heatwave" : "Rain",
    amount: 0,
    status: "Rejected",
    date: new Date().toLocaleString()
  };

  setClaims(prev => [newClaim as any, ...(prev || [])]);

  alert("Claim rejected due to location mismatch");

  return;
}

// ✅ APPROVED CASE
setStatus("Approved ✅");

    const payout = selectedEventType === 0 ? 450 : 300;
    
    const newClaim = {
      id: Date.now(),
      event_type: selectedEventType === 0 ? "Heatwave" : "Rain",
      payout_amount: payout,
      status: "Approved",
      trigger_date: new Date().toISOString()
    };

    setClaims(prev => [newClaim as any, ...(prev || [])]);

    const options = {
      key: "YOUR_TEST_KEY_ID", // paste your Razorpay key
      amount: payout * 100, // in paise
      currency: "INR",
      name: "ShieldGig",
      description: "Instant Payout",
      handler: function (response: any) {

    // ✅ AFTER PAYMENT SUCCESS
      setWallet(prev => prev + payout);

      setToast({
        show: true,
        amount: payout,
        eventType: selectedEventType === 0 ? "Heatwave" : "Rain",
        trustScore: trustData?.composite_score || 80
    });

    alert("Payment Successful via Razorpay!");
  },
  prefill: {
    name: worker.name,
    contact: worker.phone
  },
  theme: {
    color: "#22c55e"
  }
};

alert("Opening UPI Payment...");

setTimeout(() => {
  alert("Payment Successful ✅");

  setWallet(prev => prev + payout);

  setToast({
    show: true,
    amount: payout,
    eventType: selectedEventType === 0 ? "Heatwave" : "Rain",
    trustScore: trustData?.composite_score || 80
  });

}, 1500);

};
  
  const handleIncomeUpdate = async () => {
    console.log("Income updated");
};

  //if (loading) {
    //return (
      //<div className="bg-mesh flex min-h-screen flex-col items-center justify-center gap-4">
        //<div className="relative">
          //<div className="h-16 w-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
            //<Shield className="h-8 w-8 text-emerald-400" strokeWidth={1.5} />
          //</div>
          //<div className="absolute inset-0 rounded-2xl border-2 border-emerald-500/30 animate-ping" />
        //</div>
        //<div className="text-center">
          //<p className="text-slate-300 font-semibold">Loading your Shield...</p>
          //<p className="text-slate-600 text-sm mt-1">Fetching AI risk assessment</p>
        //</div>
      //</div>
    //);
  //}

  if (!worker) return null;

  return (
    <div className="bg-mesh min-h-screen">
      {/* Toast Notification */}
      <ToastNotification
        show={toast.show}
        amount={toast.amount}
        eventType={toast.eventType}
        trustScore={toast.trustScore}
        onClose={() => setToast(prev => ({ ...prev, show: false }))}
      />
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
            <button
              id="logout-btn"
              onClick={() => { localStorage.removeItem('shieldgig_worker'); navigate('/'); }}
              className="flex h-9 w-9 items-center justify-center rounded-xl border border-red-500/20 bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors"
              title="Sign out"
            >
              <LogOut className="h-4 w-4" />
            </button>
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
            trustData={trustData} riskData={riskData}
            selectedEventType={selectedEventType} onEventTypeChange={setSelectedEventType}
          />
        )}
        {activeTab === 'coverage' && (
          <CoverageTab worker={worker} quote={quote} activePolicy={activePolicy} onIncomeUpdate={handleIncomeUpdate} />
        )}
        {activeTab === 'wallet'   && <WalletTab claims={claims} worker={worker} />}
        {activeTab === 'help'     && <HelpTab worker={worker} />}

        {activeTab === 'admin' && (
          <div className="p-4 space-y-4">
           <h2 className="text-white text-lg font-bold">Admin Dashboard</h2>

           <p className="text-slate-300">
             Total Claims: {claims.length}
           </p>

           <p className="text-slate-300">
             Approved Claims: {claims.filter(c => c.status === "Approved").length}
           </p>

           <p className="text-slate-300">
             Rejected Claims: {claims.filter(c => c.status === "Rejected").length}
           </p>

           <p className="text-slate-300">
              Total Payout: ₹{claims
               .filter(c => c.status === "Approved")
               .reduce((sum, c) => sum + (c.payout_amount || 0), 0)}
            </p>

            <p className="text-emerald-400">
              Next Week Prediction: High Rainfall → More Claims 📈
           </p>
         </div>
)}
      </div>

      {/* ── Bottom nav ── */}
      <BottomNav active={activeTab} onChange={setActiveTab} />
    </div>
  );
};

export default Dashboard;
