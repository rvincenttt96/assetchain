import React, { useEffect, useState } from 'react';
import { INITIAL_ASSETS } from '../data';
import { Asset } from '../types';
import {
  Activity,
  ArrowLeft,
  ArrowRight,
  CheckCircle,
  Coins,
  Database,
  ExternalLink,
  Globe,
  Info,
  Layers,
  Lock,
  Network,
  ShieldCheck,
  TrendingUp,
  Wallet
} from 'lucide-react';

interface LandingPageProps {
  theme: 'dark' | 'light';
  lang: 'fa' | 'en';
  t: any;
  onExplore: (category?: string) => void;
  onSupport: () => void;
  onOpenInfo?: (asset: Asset) => void;
  isLoggedIn?: boolean;
  onLoginClick?: () => void;
  onQuickBuy?: (asset: Asset) => void;
  assets?: Asset[];
}

function AnimatedNumber({
  value,
  decimals = 0,
  suffix = ''
}: {
  value: number;
  decimals?: number;
  suffix?: string;
}) {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    if (!Number.isFinite(value)) {
      setDisplayValue(0);
      return;
    }

    const duration = 900;
    const startedAt = performance.now();
    let frame = 0;

    const tick = (now: number) => {
      const progress = Math.min(1, (now - startedAt) / duration);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplayValue(value * eased);

      if (progress < 1) {
        frame = requestAnimationFrame(tick);
      }
    };

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [value]);

  return (
    <>
      {displayValue.toLocaleString(undefined, {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals
      })}
      {suffix}
    </>
  );
}

export default function LandingPage({
  theme,
  lang,
  t,
  onExplore,
  onSupport,
  onOpenInfo,
  isLoggedIn = false,
  onLoginClick = () => {},
  onQuickBuy = () => {},
  assets = INITIAL_ASSETS
}: LandingPageProps) {
  const isRtl = lang === 'fa';
  const isDark = theme === 'dark';
  const [activeStep, setActiveStep] = useState(0);

  const featuredAssets = assets.slice(0, 5);

  const fundedSharesByAssetId: Record<string, number> = {
    KGOL: 33780,
    KAVEH: 15750,
    SHTRAN: 19450,
    SHASTA: 35300,
    DTMAD: 1781
  };

  const fundedAssets = featuredAssets
    .map(asset => ({
      asset,
      fundedShares: fundedSharesByAssetId[asset.id] ?? 0
    }))
    .filter(item => item.fundedShares > 0);

  const totalFundedShares = fundedAssets.reduce(
    (sum, item) => sum + item.fundedShares,
    0
  );

  const totalFundedUsdt = fundedAssets.reduce(
    (sum, item) => sum + item.fundedShares * item.asset.price,
    0
  );

  const pipelineSteps = [
    {
      id: 0,
      icon: <Database size={20} />,
      titleEn: 'Stock Reference',
      titleFa: 'مرجع سهم',
      metricEn: '5 instruments',
      metricFa: '۵ نماد',
      descEn:
        'Each supported company is mapped to its exchange instrument and reference page before it is shown inside RWA.',
      descFa:
        'هر شرکت پشتیبانی‌شده پیش از نمایش در RWA به نماد بورسی و صفحه مرجع رسمی خود متصل می‌شود.'
    },
    {
      id: 1,
      icon: <Coins size={20} />,
      titleEn: 'USDT Pricing',
      titleFa: 'قیمت‌گذاری USDT',
      metricEn: 'USDT only',
      metricFa: 'فقط USDT',
      descEn:
        'The backend normalizes the stored market price into USDT so the user-facing experience stays consistent across the platform.',
      descFa:
        'بک‌اند قیمت ذخیره‌شده بازار را به USDT تبدیل می‌کند تا تمام تجربه کاربر با یک واحد مالی یکپارچه باشد.'
    },
    {
      id: 2,
      icon: <Layers size={20} />,
      titleEn: 'Funded Supply',
      titleFa: 'ساپلای تأمین‌شده',
      metricEn: `${totalFundedShares.toLocaleString()} shares`,
      metricFa: `${totalFundedShares.toLocaleString()} سهم`,
      descEn:
        'Funded supply is surfaced per company so users can see the inventory available behind the RWA market experience.',
      descFa:
        'ساپلای تأمین‌شده هر شرکت به‌صورت شفاف نمایش داده می‌شود تا موجودی پشت بازار RWA برای کاربر مشخص باشد.'
    },
    {
      id: 3,
      icon: <ShieldCheck size={20} />,
      titleEn: 'Trade Validation',
      titleFa: 'اعتبارسنجی معامله',
      metricEn: 'Backend enforced',
      metricFa: 'کنترل بک‌اند',
      descEn:
        'Authentication, available USDT balance, price validity and the 3.5% trading fee are validated before an order is executed.',
      descFa:
        'ورود کاربر، موجودی USDT، اعتبار قیمت و کارمزد ۳.۵٪ پیش از اجرای سفارش در بک‌اند کنترل می‌شوند.'
    }
  ];

  const currentStep = pipelineSteps[activeStep] ?? pipelineSteps[0];

  const formatPrice = (price: number) =>
    price.toLocaleString(undefined, {
      minimumFractionDigits: 4,
      maximumFractionDigits: 6
    });

  const handleQuickBuy = (asset: Asset) => {
    if (!isLoggedIn) {
      onLoginClick();
      return;
    }

    onQuickBuy(asset);
  };

  return (
    <div
      className={`w-full overflow-hidden pb-20 ${
        isDark ? 'text-slate-100' : 'text-slate-900'
      }`}
      dir={isRtl ? 'rtl' : 'ltr'}
    >

      <section className="max-w-7xl mx-auto px-4 md:px-8 -mt-1 pt-8 md:pt-12">
        <div className="relative rounded-[30px] p-[1px] overflow-hidden bg-gradient-to-r from-blue-500/40 via-indigo-500/15 to-blue-500/40 shadow-xl shadow-blue-950/10">
          <div className="absolute -top-24 right-1/4 w-64 h-64 rounded-full bg-blue-500/15 blur-[90px] pointer-events-none" />
          <div
            className={`relative rounded-[29px] overflow-hidden border ${
              isDark ? 'border-slate-800 bg-slate-950' : 'border-white bg-white'
            }`}
          >
            <div className="absolute inset-0 pointer-events-none opacity-20">
              <img
                src="https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?auto=format&fit=crop&w=1600&q=80"
                alt=""
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover"
              />
            </div>
            <div className={`absolute inset-0 pointer-events-none ${isDark ? 'bg-gradient-to-r from-slate-950 via-slate-950/95 to-slate-950/70' : 'bg-gradient-to-r from-white via-white/95 to-white/75'}`} />

            <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 p-6 md:p-10 items-center">
              <div className="lg:col-span-9 space-y-4 text-start">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-full border border-blue-500/20 bg-blue-500/10 px-3 py-1 text-[9px] font-black uppercase tracking-[0.16em] text-blue-400">
                    Bloomberg • Odd Lots
                  </span>
                  <span className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-[9px] font-black uppercase tracking-[0.16em] text-emerald-400">
                    Featured Coverage
                  </span>
                </div>
                <h2 className={`text-2xl md:text-4xl font-black leading-tight ${isDark ? 'text-white' : 'text-slate-950'}`}>
                  How Investing in Tehran Is Like Bitcoin in 2010
                </h2>
                <p className={`max-w-3xl text-xs md:text-sm leading-6 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                  {isRtl
                    ? 'گزارش Bloomberg Odd Lots درباره بازار تهران و دشواری‌های دسترسی سرمایه‌گذاران به این بازار.'
                    : 'Bloomberg Odd Lots examines the Tehran market and the unusual access dynamics surrounding investment there.'}
                </p>
              </div>

              <div className="lg:col-span-3 flex lg:justify-end">
                <a
                  href="https://www.bloomberg.com/news/newsletters/2025-06-27/how-investing-in-tehran-is-like-bitcoin-in-2010"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group inline-flex w-full lg:w-auto items-center justify-center gap-2 rounded-2xl bg-white px-5 py-3.5 text-xs font-black text-slate-950 shadow-xl transition-all hover:-translate-y-0.5 hover:bg-blue-50"
                >
                  <span>{isRtl ? 'مطالعه در Bloomberg' : 'Read on Bloomberg'}</span>
                  <ExternalLink size={14} className="text-blue-600 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 md:px-8 mt-8 md:mt-12">
        <section id="funded-inventory" className="scroll-mt-24 space-y-6 md:space-y-8">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 text-start">
            <div>
              <div className="inline-flex items-center gap-2 text-[10px] md:text-xs font-black uppercase tracking-[0.16em] text-blue-500">
                <Layers size={14} />
                <span>{isRtl ? 'موجودی تأمین‌شده RWA' : 'RWA Funded Inventory'}</span>
              </div>
              <h2 className={`mt-2 text-2xl md:text-4xl font-black tracking-tight ${isDark ? 'text-white' : 'text-slate-950'}`}>
                {isRtl ? 'پنج سهم تأمین‌شده، آماده بررسی' : 'Five funded stocks, ready to explore.'}
              </h2>
              <p className="mt-2 max-w-2xl text-xs md:text-sm leading-6 text-slate-500">
                {isRtl
                  ? 'قیمت، ساپلای و ارزش تأمین هر سهم در یک کارت واحد نمایش داده می‌شود. خرید سریع برای کاربر واردشده مستقیماً به فرم سفارش می‌رود.'
                  : 'Price, funded supply and funded value are surfaced together. Buy opens the order flow for signed-in users and routes guests to sign in.'}
              </p>
            </div>

            <div className={`rounded-2xl border px-4 py-3 text-start ${isDark ? 'border-slate-800 bg-slate-900/50' : 'border-slate-200 bg-white'}`}>
              <p className="text-[9px] uppercase tracking-wider font-bold text-slate-500">
                {isRtl ? 'ساپلای کل تأمین‌شده' : 'Total Funded Supply'}
              </p>
              <p className={`mt-1 text-lg font-black font-mono ${isDark ? 'text-white' : 'text-slate-950'}`}>
                {totalFundedShares.toLocaleString()} {isRtl ? 'سهم' : 'shares'}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-4">
            {fundedAssets.map(({ asset, fundedShares }) => {
              const usdtValue = fundedShares * asset.price;
              const positive = asset.change >= 0;

              return (
                <article
                  key={asset.id}
                  className={`group relative overflow-hidden rounded-[26px] border p-4 flex flex-col min-h-[330px] transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl ${
                    isDark
                      ? 'border-slate-800 bg-slate-900/55 hover:border-blue-500/35 hover:shadow-blue-950/20'
                      : 'border-slate-200 bg-white hover:border-blue-300 hover:shadow-slate-300/50'
                  }`}
                >
                  <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-blue-500/70 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                  <div className="absolute -right-14 -top-14 h-32 w-32 rounded-full bg-blue-500/10 blur-2xl transition-transform duration-500 group-hover:scale-150" />

                  <div className="relative z-10 flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-black text-blue-500">{asset.id}</span>
                        <span className="inline-flex h-4 w-6 shrink-0 items-center overflow-hidden rounded-[3px] border border-white/15 shadow-[0_0_0_1px_rgba(15,23,42,0.35)]">
                          <img
                            src="/flags/ir.svg"
                            alt="Iran"
                            className="h-4 w-6 object-cover"
                            referrerPolicy="no-referrer"
                          />
                        </span>
                      </div>
                      <h3 className={`mt-3 min-h-[42px] text-sm font-black leading-5 ${isDark ? 'text-white' : 'text-slate-950'}`}>
                        {asset.enName}
                      </h3>
                    </div>

                    <span className={`shrink-0 text-[10px] font-black ${positive ? 'text-emerald-500' : 'text-rose-500'}`}>
                      {positive ? '+' : ''}{asset.change.toFixed(2)}%
                    </span>
                  </div>

                  <div className="relative z-10 mt-5 space-y-3 flex-1">
                    <div className={`rounded-2xl border p-3 ${isDark ? 'border-slate-800 bg-slate-950/55' : 'border-slate-200 bg-slate-50'}`}>
                      <p className="text-[9px] uppercase tracking-wider font-bold text-slate-500">
                        {isRtl ? 'قیمت مرجع' : 'Reference Price'}
                      </p>
                      <p className={`mt-1 text-lg font-black font-mono ${isDark ? 'text-white' : 'text-slate-950'}`}>
                        {formatPrice(asset.price)} <span className="text-[10px] text-blue-500">USDT</span>
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div className={`rounded-xl border p-2.5 ${isDark ? 'border-slate-800/80 bg-slate-950/35' : 'border-slate-200 bg-slate-50'}`}>
                        <p className="text-[8px] uppercase font-bold text-slate-500">{isRtl ? 'ساپلای' : 'Supply'}</p>
                        <p className={`mt-1 text-[11px] font-black font-mono ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
                          {fundedShares.toLocaleString()}
                        </p>
                      </div>
                      <div className={`rounded-xl border p-2.5 ${isDark ? 'border-slate-800/80 bg-slate-950/35' : 'border-slate-200 bg-slate-50'}`}>
                        <p className="text-[8px] uppercase font-bold text-slate-500">{isRtl ? 'ارزش تأمین' : 'Funded Value'}</p>
                        <p className="mt-1 text-[11px] font-black font-mono text-blue-500">
                          {usdtValue.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="relative z-10 mt-4 grid grid-cols-[42px_1fr] gap-2">
                    <button
                      type="button"
                      onClick={() => (onOpenInfo ? onOpenInfo(asset) : onExplore())}
                      aria-label={`${asset.id} details`}
                      className={`h-11 rounded-xl border flex items-center justify-center transition-all ${
                        isDark
                          ? 'border-slate-700 bg-slate-950/60 text-slate-300 hover:border-blue-500/40 hover:text-blue-400'
                          : 'border-slate-200 bg-slate-50 text-slate-600 hover:border-blue-300 hover:text-blue-600'
                      }`}
                    >
                      <Info size={15} />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleQuickBuy(asset)}
                      disabled={isLoggedIn && asset.price <= 0}
                      className={`group/buy h-11 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-2 ${
                        isLoggedIn && asset.price <= 0
                          ? 'bg-slate-700/40 text-slate-500 cursor-not-allowed'
                          : 'bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-600/15 hover:shadow-blue-600/25'
                      }`}
                    >
                      <span>Buy</span>
                      {isRtl ? (
                        <ArrowLeft size={13} className="transition-transform group-hover/buy:-translate-x-0.5" />
                      ) : (
                        <ArrowRight size={13} className="transition-transform group-hover/buy:translate-x-0.5" />
                      )}
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        </section>
      </div>


      {/* Premium Hero */}
      <section className="relative border-b border-slate-800/40 overflow-hidden">
        <div
          className="absolute inset-0 opacity-70 pointer-events-none"
          style={{
            backgroundImage: isDark
              ? 'linear-gradient(rgba(59,130,246,0.055) 1px, transparent 1px), linear-gradient(90deg, rgba(59,130,246,0.055) 1px, transparent 1px)'
              : 'linear-gradient(rgba(37,99,235,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(37,99,235,0.06) 1px, transparent 1px)',
            backgroundSize: '42px 42px',
            maskImage:
              'linear-gradient(to bottom, black 0%, black 72%, transparent 100%)'
          }}
        />
        <div className="absolute -top-44 left-[8%] h-96 w-96 rounded-full bg-blue-500/15 blur-[120px] pointer-events-none" />
        <div className="absolute top-10 right-[8%] h-80 w-80 rounded-full bg-indigo-500/10 blur-[110px] pointer-events-none" />

        <div className="relative z-10 max-w-7xl mx-auto px-4 md:px-8 pt-14 md:pt-24 pb-12 md:pb-20">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-center">
            <div className="lg:col-span-6 text-start space-y-7">
              <div className="inline-flex items-center gap-2 rounded-full border border-blue-500/20 bg-blue-500/10 px-3 py-1.5 text-[10px] md:text-xs font-black text-blue-400 uppercase tracking-[0.18em] shadow-lg shadow-blue-500/5">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-60 animate-ping" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-blue-500" />
                </span>
                <span>RWA • Funded Stock Access</span>
              </div>

              <div className="space-y-4">
                <h1
                  className={`max-w-4xl text-4xl md:text-6xl lg:text-[68px] leading-[1.02] tracking-[-0.04em] font-black ${
                    isDark ? 'text-white' : 'text-slate-950'
                  }`}
                >
                  {isRtl
                    ? 'سهام منتخب ایران، با قیمت‌گذاری شفاف USDT.'
                    : 'Selected Iranian stocks. Priced in USDT.'}
                </h1>
                
              </div>

              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={() => onExplore()}
                  className="group inline-flex items-center gap-2 rounded-2xl bg-blue-600 px-6 py-3.5 text-sm font-black text-white shadow-xl shadow-blue-600/20 transition-all hover:-translate-y-0.5 hover:bg-blue-500"
                >
                  <span>{t.homeExploreBtn ?? 'Explore Stocks'}</span>
                  {isRtl ? (
                    <ArrowLeft size={16} className="transition-transform group-hover:-translate-x-1" />
                  ) : (
                    <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => onExplore()}
                  className={`inline-flex items-center gap-2 rounded-2xl border px-6 py-3.5 text-sm font-black transition-all hover:-translate-y-0.5 ${
                    isDark
                      ? 'border-slate-700 bg-slate-900/70 text-slate-200 hover:border-blue-500/40 hover:bg-slate-900'
                      : 'border-slate-200 bg-white text-slate-700 hover:border-blue-300'
                  }`}
                >
                  <Layers size={16} className="text-blue-500" />
                  <span>Buy</span>
                </button>
              </div>

              <div className="grid grid-cols-3 gap-3 pt-3 max-w-2xl">
                {[
                  {
                    label: isRtl ? 'نماد تأمین‌شده' : 'Funded Symbols',
                    value: fundedAssets.length.toLocaleString()
                  },
                  {
                    label: isRtl ? 'ساپلای کل' : 'Funded Supply',
                    value: totalFundedShares.toLocaleString()
                  },
                  {
                    label: isRtl ? 'کارمزد معامله' : 'Trading Fee',
                    value: '3.5%'
                  }
                ].map(item => (
                  <div
                    key={item.label}
                    className={`rounded-2xl border px-3 py-3.5 backdrop-blur-md ${
                      isDark
                        ? 'border-slate-800 bg-slate-950/45'
                        : 'border-slate-200 bg-white/70'
                    }`}
                  >
                    <p className="text-[9px] md:text-[10px] uppercase tracking-wider font-bold text-slate-500">
                      {item.label}
                    </p>
                    <p className={`mt-1 text-sm md:text-lg font-black ${isDark ? 'text-white' : 'text-slate-950'}`}>
                      {item.value}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <div className="lg:col-span-6 relative">
              <div className="absolute -inset-6 rounded-[36px] bg-blue-500/10 blur-3xl pointer-events-none" />
              <div
                className={`relative rounded-[30px] border overflow-hidden shadow-2xl ${
                  isDark
                    ? 'border-slate-800 bg-slate-950/85 shadow-blue-950/30'
                    : 'border-slate-200 bg-white/95 shadow-slate-300/40'
                }`}
              >
                <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-blue-400/80 to-transparent" />
                <div className="p-5 md:p-7 border-b border-slate-800/50 flex items-center justify-between gap-4">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.18em] text-blue-500">
                      {isRtl ? 'نمای بازار تأمین‌شده' : 'Funded Market Snapshot'}
                    </p>
                    <h2 className={`mt-1 text-xl md:text-2xl font-black ${isDark ? 'text-white' : 'text-slate-950'}`}>
                      {isRtl ? 'پنج سهم، یک رابط USDT' : 'Five stocks. One USDT interface.'}
                    </h2>
                  </div>
                  <div className="h-11 w-11 rounded-2xl border border-blue-500/20 bg-blue-500/10 text-blue-500 flex items-center justify-center">
                    <Activity size={20} />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-px bg-slate-800/40">
                  <div className={`p-5 md:p-6 ${isDark ? 'bg-slate-950' : 'bg-white'}`}>
                    <p className="text-[9px] uppercase tracking-wider font-bold text-slate-500">
                      {isRtl ? 'ارزش کل تأمین' : 'Funded Value'}
                    </p>
                    <p className={`mt-2 text-2xl md:text-3xl font-black font-mono ${isDark ? 'text-white' : 'text-slate-950'}`}>
                      <AnimatedNumber value={totalFundedUsdt} decimals={2} suffix=" USDT" />
                    </p>
                  </div>
                  <div className={`p-5 md:p-6 ${isDark ? 'bg-slate-950' : 'bg-white'}`}>
                    <p className="text-[9px] uppercase tracking-wider font-bold text-slate-500">
                      {isRtl ? 'ساپلای کل' : 'Total Supply'}
                    </p>
                    <p className={`mt-2 text-2xl md:text-3xl font-black font-mono ${isDark ? 'text-white' : 'text-slate-950'}`}>
                      <AnimatedNumber value={totalFundedShares} suffix={isRtl ? ' سهم' : ' shares'} />
                    </p>
                  </div>
                </div>

                <div className="p-4 md:p-5 space-y-2.5">
                  {fundedAssets.map(({ asset, fundedShares }) => (
                    <div
                      key={asset.id}
                      className={`group flex items-center justify-between gap-3 rounded-2xl border px-4 py-3 transition-all ${
                        isDark
                          ? 'border-slate-800 bg-slate-900/45 hover:border-blue-500/35 hover:bg-slate-900/80'
                          : 'border-slate-200 bg-slate-50 hover:border-blue-300 hover:bg-white'
                      }`}
                    >
                      <div className="flex min-w-0 items-center gap-3">
                        <div className="h-9 w-9 shrink-0 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center text-[10px] font-black font-mono border border-blue-500/15">
                          {asset.id.slice(0, 2)}
                        </div>
                        <div className="min-w-0">
                          <p className={`truncate text-xs md:text-sm font-black ${isDark ? 'text-white' : 'text-slate-950'}`}>
                            {asset.enName}
                          </p>
                          <p className="mt-0.5 text-[9px] text-slate-500 font-mono">
                            {asset.id} • {fundedShares.toLocaleString()} {isRtl ? 'سهم' : 'shares'}
                          </p>
                        </div>
                      </div>
                      <div className="text-end shrink-0">
                        <p className={`text-xs font-black font-mono ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
                          {formatPrice(asset.price)} USDT
                        </p>
                        <p className={`mt-0.5 text-[9px] font-black ${asset.change >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                          {asset.change >= 0 ? '+' : ''}{asset.change.toFixed(2)}%
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="px-5 pb-5 flex items-center justify-between gap-3 text-[9px] text-slate-500">
                  <span className="flex items-center gap-1.5">
                    <Network size={12} className="text-emerald-500" />
                    {isRtl ? 'قیمت‌های رابط کاربر فقط USDT' : 'User-facing prices are USDT-only'}
                  </span>
                  <span className="font-mono">5 / 5</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 md:px-8 space-y-14 md:space-y-24 mt-14 md:mt-20">
        {/* Animated Stats */}
        <section className="relative overflow-hidden rounded-[30px] border border-blue-500/15 bg-gradient-to-br from-blue-600/10 via-transparent to-indigo-600/10 p-5 md:p-8">
          <div className="absolute -left-20 -top-20 h-52 w-52 rounded-full bg-blue-500/10 blur-3xl" />
          <div className="absolute -right-20 -bottom-20 h-52 w-52 rounded-full bg-indigo-500/10 blur-3xl" />

          <div className="relative z-10 grid grid-cols-1 md:grid-cols-3 gap-3">
            {[
              {
                label: isRtl ? 'ارزش کل تأمین' : 'Total Funded Value',
                icon: <Wallet size={18} />,
                content: <AnimatedNumber value={totalFundedUsdt} decimals={2} suffix=" USDT" />
              },
              {
                label: isRtl ? 'ساپلای کل سهام' : 'Total Funded Shares',
                icon: <Layers size={18} />,
                content: <AnimatedNumber value={totalFundedShares} suffix={isRtl ? ' سهم' : ' shares'} />
              },
              {
                label: isRtl ? 'نمادهای تأمین‌شده' : 'Funded Symbols',
                icon: <TrendingUp size={18} />,
                content: <AnimatedNumber value={fundedAssets.length} />
              }
            ].map(stat => (
              <div
                key={stat.label}
                className={`rounded-2xl border p-5 md:p-6 text-start backdrop-blur ${
                  isDark ? 'border-slate-800 bg-slate-950/55' : 'border-white bg-white/75'
                }`}
              >
                <div className="flex items-center justify-between gap-3">
                  <p className="text-[9px] md:text-[10px] font-black uppercase tracking-[0.14em] text-slate-500">
                    {stat.label}
                  </p>
                  <span className="h-9 w-9 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center">
                    {stat.icon}
                  </span>
                </div>
                <p className={`mt-5 text-2xl md:text-4xl font-black font-mono tracking-tight ${isDark ? 'text-white' : 'text-slate-950'}`}>
                  {stat.content}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* How it Works */}
        <section id="how-it-works" className="scroll-mt-24 space-y-7 md:space-y-9">
          <div className="text-center max-w-2xl mx-auto">
            <p className="text-[10px] font-black uppercase tracking-[0.16em] text-blue-500">
              {isRtl ? 'زیرساخت معامله' : 'Trading Infrastructure'}
            </p>
            <h2 className={`mt-2 text-2xl md:text-4xl font-black tracking-tight ${isDark ? 'text-white' : 'text-slate-950'}`}>
              {isRtl ? 'از مرجع سهم تا اجرای سفارش' : 'From stock reference to validated order.'}
            </h2>
            <p className="mt-3 text-xs md:text-sm leading-6 text-slate-500">
              {isRtl
                ? 'چهار لایه اصلی تجربه RWA را تشکیل می‌دهند؛ هر مرحله روی داده و کنترل واقعی سیستم تکیه دارد.'
                : 'Four layers shape the RWA flow. Each step reflects an actual data or validation layer in the product.'}
            </p>
          </div>

          <div className="relative">
            <div className="hidden md:block absolute top-8 left-[12%] right-[12%] h-px bg-gradient-to-r from-blue-500/10 via-blue-500/60 to-blue-500/10" />
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 relative z-10">
              {pipelineSteps.map(step => {
                const active = step.id === activeStep;

                return (
                  <button
                    key={step.id}
                    type="button"
                    onClick={() => setActiveStep(step.id)}
                    className={`text-start rounded-2xl border p-4 transition-all ${
                      active
                        ? 'border-blue-500/45 bg-blue-500/10 shadow-lg shadow-blue-500/10'
                        : isDark
                          ? 'border-slate-800 bg-slate-900/45 hover:border-slate-700'
                          : 'border-slate-200 bg-white hover:border-blue-300'
                    }`}
                  >
                    <div className={`h-10 w-10 rounded-xl flex items-center justify-center ${active ? 'bg-blue-600 text-white' : 'bg-blue-500/10 text-blue-500'}`}>
                      {step.icon}
                    </div>
                    <p className={`mt-4 text-xs font-black ${active ? 'text-blue-500' : isDark ? 'text-white' : 'text-slate-950'}`}>
                      {isRtl ? step.titleFa : step.titleEn}
                    </p>
                    <p className="mt-1 text-[9px] font-bold uppercase tracking-wider text-slate-500">
                      {isRtl ? step.metricFa : step.metricEn}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>

          <div className={`rounded-[26px] border p-5 md:p-7 relative overflow-hidden ${isDark ? 'border-slate-800 bg-slate-900/50' : 'border-slate-200 bg-white'}`}>
            <div className="absolute right-5 bottom-2 text-blue-500/[0.04] scale-[4] pointer-events-none">
              {currentStep.icon}
            </div>
            <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-5">
              <div className="max-w-3xl text-start">
                <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.16em] text-blue-500">
                  <CheckCircle size={13} />
                  <span>{isRtl ? 'مرحله فعال' : 'Active Layer'}</span>
                </div>
                <h3 className={`mt-2 text-lg md:text-2xl font-black ${isDark ? 'text-white' : 'text-slate-950'}`}>
                  {isRtl ? currentStep.titleFa : currentStep.titleEn}
                </h3>
                <p className="mt-2 text-xs md:text-sm leading-6 text-slate-500">
                  {isRtl ? currentStep.descFa : currentStep.descEn}
                </p>
              </div>
              <div className="shrink-0 rounded-2xl border border-blue-500/20 bg-blue-500/10 px-4 py-3 text-start">
                <p className="text-[8px] uppercase tracking-wider font-black text-slate-500">STATUS</p>
                <p className="mt-1 text-xs font-black text-blue-500">{isRtl ? currentStep.metricFa : currentStep.metricEn}</p>
              </div>
            </div>
          </div>
        </section>

        {/* Bento */}
        <section className="space-y-7 md:space-y-9">
          <div className="text-center max-w-2xl mx-auto">
            <p className="text-[10px] font-black uppercase tracking-[0.16em] text-blue-500">WHY RWA</p>
            <h2 className={`mt-2 text-2xl md:text-4xl font-black tracking-tight ${isDark ? 'text-white' : 'text-slate-950'}`}>
              {isRtl ? 'کمتر نمایش، داده مهم‌تر.' : 'Less noise. More decision-grade context.'}
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
            <div className={`md:col-span-4 min-h-[220px] rounded-[28px] border p-6 md:p-8 relative overflow-hidden ${isDark ? 'border-slate-800 bg-slate-900/55' : 'border-slate-200 bg-white'}`}>
              <div className="absolute right-0 top-0 h-48 w-48 rounded-full bg-blue-500/10 blur-3xl" />
              <div className="relative z-10 max-w-xl text-start">
                <div className="h-11 w-11 rounded-2xl bg-blue-500/10 text-blue-500 flex items-center justify-center">
                  <Coins size={21} />
                </div>
                <h3 className={`mt-5 text-xl md:text-2xl font-black ${isDark ? 'text-white' : 'text-slate-950'}`}>
                  {isRtl ? 'یک واحد قیمت‌گذاری: USDT' : 'One user-facing denomination: USDT'}
                </h3>
                <p className="mt-3 text-xs md:text-sm leading-6 text-slate-500">
                  {isRtl
                    ? 'قیمت‌ها، ارزش سبد، ارزش تأمین و سفارش‌ها در رابط کاربر با USDT نمایش داده می‌شوند.'
                    : 'Market price, funded value, portfolio value and order economics are presented in USDT across the user experience.'}
                </p>
              </div>
            </div>

            <div className={`md:col-span-2 min-h-[220px] rounded-[28px] border p-6 relative overflow-hidden ${isDark ? 'border-slate-800 bg-slate-900/55' : 'border-slate-200 bg-white'}`}>
              <div className="h-11 w-11 rounded-2xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
                <Layers size={21} />
              </div>
              <h3 className={`mt-5 text-lg font-black ${isDark ? 'text-white' : 'text-slate-950'}`}>
                {isRtl ? 'ساپلای قابل مشاهده' : 'Visible funded supply'}
              </h3>
              <p className="mt-3 text-xs leading-6 text-slate-500">
                {isRtl
                  ? 'مقدار تأمین هر نماد مستقیماً روی کارت همان سهم نمایش داده می‌شود.'
                  : 'Each stock card exposes the funded share count instead of hiding inventory behind generic metrics.'}
              </p>
            </div>

            <div className={`md:col-span-2 min-h-[220px] rounded-[28px] border p-6 relative overflow-hidden ${isDark ? 'border-slate-800 bg-slate-900/55' : 'border-slate-200 bg-white'}`}>
              <div className="h-11 w-11 rounded-2xl bg-purple-500/10 text-purple-500 flex items-center justify-center">
                <Lock size={21} />
              </div>
              <h3 className={`mt-5 text-lg font-black ${isDark ? 'text-white' : 'text-slate-950'}`}>
                {isRtl ? 'کنترل سفارش در بک‌اند' : 'Backend-enforced orders'}
              </h3>
              <p className="mt-3 text-xs leading-6 text-slate-500">
                {isRtl
                  ? 'موجودی حساب و شرایط سفارش پیش از ثبت معامله سمت سرور اعتبارسنجی می‌شوند.'
                  : 'Balance and order constraints are validated server-side before a trade is committed.'}
              </p>
            </div>

            <div className={`md:col-span-4 min-h-[220px] rounded-[28px] border p-6 md:p-8 relative overflow-hidden ${isDark ? 'border-slate-800 bg-slate-900/55' : 'border-slate-200 bg-white'}`}>
              <div className="absolute left-0 bottom-0 h-48 w-48 rounded-full bg-indigo-500/10 blur-3xl" />
              <div className="relative z-10 text-start max-w-xl">
                <div className="h-11 w-11 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center">
                  <Globe size={21} />
                </div>
                <h3 className={`mt-5 text-xl md:text-2xl font-black ${isDark ? 'text-white' : 'text-slate-950'}`}>
                  {isRtl ? 'Stock Reference برای هر سهم' : 'A Stock Reference for every supported company'}
                </h3>
                <p className="mt-3 text-xs md:text-sm leading-6 text-slate-500">
                  {isRtl
                    ? 'کاربر می‌تواند از صفحه هر سهم مستقیماً به مرجع رسمی همان نماد دسترسی داشته باشد.'
                    : 'Every supported company keeps a direct path to its official instrument reference so users can cross-check the underlying market listing.'}
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="relative overflow-hidden rounded-[32px] border border-blue-400/20 bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 p-7 md:p-12 text-white shadow-2xl shadow-blue-950/25">
          <div
            className="absolute inset-0 opacity-20"
            style={{
              backgroundImage:
                'radial-gradient(circle at 20% 20%, rgba(255,255,255,.35) 0, transparent 25%), radial-gradient(circle at 85% 70%, rgba(255,255,255,.2) 0, transparent 25%)'
            }}
          />
          <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            <div className="lg:col-span-8 text-start">
              <p className="text-[10px] font-black uppercase tracking-[0.18em] text-blue-100/80">RWA</p>
              <h2 className="mt-2 text-2xl md:text-4xl font-black tracking-tight">
                {isRtl ? 'پنج سهم را بررسی کن. با USDT تصمیم بگیر.' : 'Explore five stocks. Make the decision in USDT.'}
              </h2>
              <p className="mt-3 max-w-2xl text-xs md:text-sm leading-6 text-blue-100/85">
                {isRtl
                  ? 'قیمت مرجع، ساپلای تأمین‌شده، اطلاعات شرکت و مسیر خرید در یک تجربه واحد کنار هم قرار گرفته‌اند.'
                  : 'Reference price, funded supply, company context and the purchase flow are brought together in one focused experience.'}
              </p>
            </div>

            <div className="lg:col-span-4 flex flex-col sm:flex-row lg:flex-col gap-3 lg:items-stretch">
              <button
                type="button"
                onClick={() => onExplore()}
                className="group inline-flex items-center justify-center gap-2 rounded-2xl bg-white px-6 py-3.5 text-sm font-black text-blue-700 shadow-xl transition-all hover:-translate-y-0.5 hover:bg-blue-50"
              >
                <span>{t.homeExploreBtn ?? 'Explore Stocks'}</span>
                {isRtl ? <ArrowLeft size={15} /> : <ArrowRight size={15} className="transition-transform group-hover:translate-x-0.5" />}
              </button>
              <button
                type="button"
                onClick={onSupport}
                className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/20 bg-white/10 px-6 py-3.5 text-sm font-black text-white transition-all hover:bg-white/15"
              >
                <ShieldCheck size={15} />
                <span>{isRtl ? 'پشتیبانی' : 'Support'}</span>
              </button>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
