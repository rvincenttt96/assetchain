import React, { useState, useEffect } from 'react';
import YieldChart from './YieldChart';
import { INITIAL_ASSETS } from '../data';
import { Asset } from '../types';
import {
  ShieldCheck,
  Coins,
  TrendingUp,
  ArrowUpRight,
  CheckCircle,
  Wallet,
  ArrowRight,
  ArrowLeft,
  Building,
  Anchor,
  Globe2,
  Lock,
  ChevronRight,
  ChevronLeft,
  Cpu,
  Database,
  Layers,
  Activity,
  FileText,
  Network,
  Fingerprint,
  Info,
  ExternalLink,
  Globe
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
  myPortfolio?: any[];
  assets?: Asset[];
  portfolioBalanceUsdt?: number;
  portfolioPnlUsdt?: number;
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
  myPortfolio = [],
  assets = INITIAL_ASSETS,
  portfolioBalanceUsdt = 0,
  portfolioPnlUsdt = 0
}: LandingPageProps) {
  const isRtl = lang === 'fa';
  const [activeStep, setActiveStep] = useState<number>(0);

  // Auto rotate the steps every 5 seconds for interactive display, unless clicked
  const [autoRotate, setAutoRotate] = useState<boolean>(true);

  useEffect(() => {
    if (!autoRotate) return;
    const interval = setInterval(() => {
      setActiveStep((prev) => (prev + 1) % 4);
    }, 6000);
    return () => clearInterval(interval);
  }, [autoRotate]);

  const pipelineSteps = [
    {
      id: 0,
      icon: <Database size={22} />,
      titleEn: '1. TSETMC Feed',
      titleFa: '\u06f1. \u062f\u0631\u06cc\u0627\u0641\u062a TSETMC',
      subtitleEn: 'Official Market Source',
      subtitleFa: '\u0645\u0646\u0628\u0639 \u062f\u0627\u062f\u0647 \u0628\u0627\u0632\u0627\u0631',
      descEn: 'Market information for the five selected Iranian shares is obtained from TSETMC and stored by the backend.',
      descFa: '\u0627\u0637\u0644\u0627\u0639\u0627\u062a \u0628\u0627\u0632\u0627\u0631 \u067e\u0646\u062c \u0633\u0647\u0645 \u0645\u0646\u062a\u062e\u0628 \u0627\u0632 TSETMC \u062f\u0631\u06cc\u0627\u0641\u062a \u0648 \u062f\u0631 \u0628\u06a9\u200c\u0627\u0646\u062f \u0630\u062e\u06cc\u0631\u0647 \u0645\u06cc\u200c\u0634\u0648\u062f.',
      metricEn: 'TSETMC Source',
      metricFa: '\u0645\u0646\u0628\u0639 TSETMC',
      badgeColor: 'bg-amber-500/15 text-amber-500 border-amber-500/20',
      glowColor: 'shadow-amber-500/20',
      details: {
        partnerEn: 'TSETMC',
        partnerFa: 'TSETMC',
        locationEn: 'Iran Stock Market',
        locationFa: '\u0628\u0627\u0632\u0627\u0631 \u0633\u0647\u0627\u0645 \u0627\u06cc\u0631\u0627\u0646',
        insuredValueEn: 'Five selected instruments',
        insuredValueFa: '\u067e\u0646\u062c \u0646\u0645\u0627\u062f \u0645\u0646\u062a\u062e\u0628',
        registryEn: 'Official instrument pages',
        registryFa: '\u0635\u0641\u062d\u0647 \u0631\u0633\u0645\u06cc \u0647\u0631 \u0646\u0645\u0627\u062f'
      }
    },
    {
      id: 1,
      icon: <FileText size={22} />,
      titleEn: '2. Instrument Mapping',
      titleFa: '\u06f2. \u0634\u0646\u0627\u0633\u0627\u06cc\u06cc \u0646\u0645\u0627\u062f',
      subtitleEn: 'Validated Instrument Codes',
      subtitleFa: '\u062a\u0637\u0628\u06cc\u0642 \u06a9\u062f \u0646\u0645\u0627\u062f',
      descEn: 'Each AssetChain share is mapped to its TSETMC instrument code, exchange symbol, company name, and market sector.',
      descFa: '\u0647\u0631 \u0633\u0647\u0645 \u0628\u0647 \u06a9\u062f \u0627\u0628\u0632\u0627\u0631\u060c \u0646\u0645\u0627\u062f \u0628\u0648\u0631\u0633\u06cc\u060c \u0646\u0627\u0645 \u0634\u0631\u06a9\u062a \u0648 \u06af\u0631\u0648\u0647 \u0628\u0627\u0632\u0627\u0631 \u062e\u0648\u062f \u062f\u0631 TSETMC \u0645\u062a\u0635\u0644 \u0627\u0633\u062a.',
      metricEn: '5 Instruments',
      metricFa: '\u06f5 \u0646\u0645\u0627\u062f',
      badgeColor: 'bg-blue-500/15 text-blue-500 border-blue-500/20',
      glowColor: 'shadow-blue-500/20',
      details: {
        partnerEn: 'AssetChain Backend',
        partnerFa: '\u0628\u06a9\u200c\u0627\u0646\u062f AssetChain',
        locationEn: 'Instrument Registry',
        locationFa: '\u0641\u0647\u0631\u0633\u062a \u0646\u0645\u0627\u062f\u0647\u0627',
        insuredValueEn: 'KGOL, DTMAD, SHTRAN, SHASTA, KAVEH',
        insuredValueFa: '\u06a9\u06af\u0644\u060c \u062f\u062a\u0645\u0627\u062f\u060c \u0634\u062a\u0631\u0627\u0646\u060c \u0634\u0633\u062a\u0627\u060c \u06a9\u0627\u0648\u0647',
        registryEn: 'Instrument codes validated',
        registryFa: '\u06a9\u062f\u0647\u0627\u06cc \u0646\u0645\u0627\u062f \u062b\u0628\u062a \u0634\u062f\u0647'
      }
    },
    {
      id: 2,
      icon: <Activity size={22} />,
      titleEn: '3. Market Processing',
      titleFa: '\u06f3. \u067e\u0631\u062f\u0627\u0632\u0634 \u0628\u0627\u0632\u0627\u0631',
      subtitleEn: 'Stored Market Fields',
      subtitleFa: '\u0630\u062e\u06cc\u0631\u0647 \u062f\u0627\u062f\u0647 \u0628\u0627\u0632\u0627\u0631',
      descEn: 'Last, closing, yesterday, daily low/high and volume fields are stored without generating synthetic prices.',
      descFa: '\u0642\u06cc\u0645\u062a \u0622\u062e\u0631\u06cc\u0646 \u0645\u0639\u0627\u0645\u0644\u0647\u060c \u067e\u0627\u06cc\u0627\u0646\u06cc\u060c \u062f\u06cc\u0631\u0648\u0632\u060c \u062d\u062f\u0627\u0642\u0644\u060c \u062d\u062f\u0627\u06a9\u062b\u0631 \u0648 \u062d\u062c\u0645 \u0628\u0627\u0632\u0627\u0631 \u0628\u062f\u0648\u0646 \u062a\u0648\u0644\u06cc\u062f \u0642\u06cc\u0645\u062a \u0633\u0627\u062e\u062a\u06af\u06cc \u0630\u062e\u06cc\u0631\u0647 \u0645\u06cc\u200c\u0634\u0648\u062f.',
      metricEn: 'No Synthetic Prices',
      metricFa: '\u0628\u062f\u0648\u0646 \u0642\u06cc\u0645\u062a \u0633\u0627\u062e\u062a\u06af\u06cc',
      badgeColor: 'bg-emerald-500/15 text-emerald-500 border-emerald-500/20',
      glowColor: 'shadow-emerald-500/20',
      details: {
        partnerEn: 'Market Data Service',
        partnerFa: '\u0633\u0631\u0648\u06cc\u0633 \u062f\u0627\u062f\u0647 \u0628\u0627\u0632\u0627\u0631',
        locationEn: 'Backend Database',
        locationFa: '\u067e\u0627\u06cc\u06af\u0627\u0647 \u062f\u0627\u062f\u0647 \u0628\u06a9\u200c\u0627\u0646\u062f',
        insuredValueEn: 'Price and volume fields',
        insuredValueFa: '\u0641\u06cc\u0644\u062f\u0647\u0627\u06cc \u0642\u06cc\u0645\u062a \u0648 \u062d\u062c\u0645',
        registryEn: 'Latest stored snapshot',
        registryFa: '\u0622\u062e\u0631\u06cc\u0646 \u0627\u0633\u0646\u067e\u200c\u0634\u0627\u062a \u0630\u062e\u06cc\u0631\u0647\u200c\u0634\u062f\u0647'
      }
    },
    {
      id: 3,
      icon: <ExternalLink size={22} />,
      titleEn: '4. Market Display',
      titleFa: '\u06f4. \u0646\u0645\u0627\u06cc\u0634 \u0628\u0627\u0632\u0627\u0631',
      subtitleEn: 'TSETMC-Linked Shares',
      subtitleFa: '\u0646\u0645\u0627\u06cc\u0634 \u0633\u0647\u0627\u0645',
      descEn: 'AssetChain displays the stored TSETMC market information and provides the official TSETMC page for each selected share.',
      descFa: 'AssetChain \u062f\u0627\u062f\u0647 \u0630\u062e\u06cc\u0631\u0647\u200c\u0634\u062f\u0647 TSETMC \u0648 \u0644\u06cc\u0646\u06a9 \u0631\u0633\u0645\u06cc \u0647\u0631 \u0633\u0647\u0645 \u0631\u0627 \u0646\u0645\u0627\u06cc\u0634 \u0645\u06cc\u200c\u062f\u0647\u062f.',
      metricEn: 'Official Links',
      metricFa: '\u0644\u06cc\u0646\u06a9 \u0631\u0633\u0645\u06cc',
      badgeColor: 'bg-purple-500/15 text-purple-500 border-purple-500/20',
      glowColor: 'shadow-purple-500/20',
      details: {
        partnerEn: 'AssetChain Frontend',
        partnerFa: '\u0641\u0631\u0627\u0646\u062a\u200c\u0627\u0646\u062f AssetChain',
        locationEn: 'Market Interface',
        locationFa: '\u0631\u0627\u0628\u0637 \u0628\u0627\u0632\u0627\u0631',
        insuredValueEn: 'Prices normalized to USDT',
        insuredValueFa: '\u0642\u06cc\u0645\u062a TSETMC \u0628\u0647 \u0631\u06cc\u0627\u0644',
        registryEn: 'Direct official page access',
        registryFa: '\u062f\u0633\u062a\u0631\u0633\u06cc \u0645\u0633\u062a\u0642\u06cc\u0645 \u0628\u0647 \u0635\u0641\u062d\u0647 \u0631\u0633\u0645\u06cc'
      }
    }
  ];

  const featuredAssets: Asset[] = assets.slice(0, 5);

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

  const currentActiveStepData = pipelineSteps[activeStep];


  return (
    <div className="w-full pb-16 animate-fade-in">

      {/* Bloomberg News */}
      <section className={`relative w-full border-b overflow-hidden shadow-lg ${theme === 'dark' ? 'bg-slate-950 border-slate-900/50' : 'bg-slate-50 border-slate-100'}`}>
        <div className="absolute inset-0">
          <img
            src="https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?auto=format&fit=crop&w=1600&q=80"
            alt=""
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover brightness-[0.58]"
          />
          <div className={`absolute inset-0 ${theme === 'dark' ? 'bg-gradient-to-r from-slate-950 via-slate-950/90 to-slate-950/35' : 'bg-gradient-to-r from-white via-white/90 to-white/35'}`} />
        </div>
        <div className="max-w-7xl mx-auto px-4 md:px-8 py-10 md:py-16 relative z-10">
          <div className="max-w-4xl space-y-4 text-start">
            <div className="flex items-center gap-2 text-[10px] md:text-xs font-black uppercase tracking-widest">
              <span className="text-blue-500">Bloomberg • Odd Lots</span>
              <span className="opacity-30">|</span>
              <span className="text-emerald-500">News</span>
            </div>
            <h2 className={`text-2xl md:text-4xl font-black leading-tight ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
              How Investing in Tehran Is Like Bitcoin in 2010
            </h2>
            <p className={`text-xs md:text-sm leading-relaxed max-w-3xl ${theme === 'dark' ? 'text-slate-300' : 'text-slate-600'}`}>
              {isRtl ? 'گزارش Bloomberg Odd Lots درباره سرمایه‌گذاری در تهران و شرایط دسترسی به این بازار.' : 'Bloomberg Odd Lots looks at investing in Tehran and the unusual access dynamics around the market.'}
            </p>
            <a
              href="https://www.bloomberg.com/news/newsletters/2025-06-27/how-investing-in-tehran-is-like-bitcoin-in-2010"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-5 md:px-7 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-black transition-all"
            >
              <span>{isRtl ? 'مطالعه در Bloomberg' : 'Read on Bloomberg'}</span>
              <ExternalLink size={14} />
            </a>
          </div>
        </div>
      </section>

      {/* Inner page content wrapping the rest of the sections */}
      <div className="max-w-7xl mx-auto px-4 md:px-8 space-y-12 md:space-y-24 mt-8 md:mt-16">

      {/* Actual Funded Inventory Row */}
      <section className="space-y-4 md:space-y-6">
        <div>
          <p className="text-[10px] md:text-xs font-black text-blue-500 uppercase tracking-widest">
            {isRtl ? '\u0645\u0648\u062c\u0648\u062f\u06cc \u0648 \u062a\u0623\u0645\u06cc\u0646 \u0648\u0627\u0642\u0639\u06cc AssetChain' : 'AssetChain Funded Inventory'}
          </p>
          <h2 className={`text-xl md:text-3xl font-black mt-1 ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
            {isRtl ? '\u0633\u0647\u0627\u0645 \u062a\u0623\u0645\u06cc\u0646\u200c\u0634\u062f\u0647' : 'Funded Iranian Shares'}
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 md:gap-4">
          {fundedAssets.map(({ asset, fundedShares }) => {
            const usdtValue = fundedShares * asset.price;

            return (
              <div
                key={asset.id}
                className={`rounded-2xl border p-4 ${
                  theme === 'dark'
                    ? 'bg-slate-900/60 border-slate-800'
                    : 'bg-white border-slate-200'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-xs font-black font-mono text-blue-500">
                      {asset.id}
                    </p>
                    <h3 className={`text-sm font-bold mt-1 ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                      {asset.enName}
                    </h3>
                  </div>

                  <span className={`text-[10px] font-bold ${
                    asset.change >= 0 ? 'text-emerald-500' : 'text-red-500'
                  }`}>
                    {asset.change >= 0 ? '+' : ''}{asset.change.toFixed(2)}%
                  </span>
                </div>

                <div className="mt-4 space-y-2 text-[10px]">
                  <div className="flex justify-between gap-2">
                    <span className="text-slate-400">
                      {isRtl ? '\u062a\u0639\u062f\u0627\u062f \u062a\u0623\u0645\u06cc\u0646' : 'Funded Shares'}
                    </span>
                    <strong>
                      {fundedShares.toLocaleString()} {isRtl ? '\u0633\u0647\u0645' : 'shares'}
                    </strong>
                  </div>

                  <div className="flex justify-between gap-2">
                    <span className="text-slate-400">
                      {isRtl ? '\u0642\u06cc\u0645\u062a \u0645\u0631\u062c\u0639' : 'Reference Price'}
                    </span>
                    <strong className="font-mono">
                      {asset.price.toLocaleString(undefined, { minimumFractionDigits: 4, maximumFractionDigits: 6 })} USDT
                    </strong>
                  </div>

                  <div className="pt-2 border-t border-slate-800/40">
                    <p className="text-slate-400">
                      {isRtl ? '\u0627\u0631\u0632\u0634 \u062a\u0623\u0645\u06cc\u0646' : 'Funded Value'}
                    </p>
                    <p className="font-bold font-mono text-blue-500 mt-0.5">
                      {usdtValue.toLocaleString(undefined, { maximumFractionDigits: 2 })} USDT
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Actual Funded Statistics */}
      <section className={`rounded-2xl md:rounded-3xl border p-5 md:p-10 ${
        theme === 'dark'
          ? 'bg-slate-900/30 border-slate-800'
          : 'bg-white border-slate-200'
      }`}>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8 text-center">

          <div>
            <p className="text-slate-400 text-[10px] md:text-xs font-bold uppercase tracking-wider">
              {isRtl ? '\u0627\u0631\u0632\u0634 \u06a9\u0644 \u062a\u0623\u0645\u06cc\u0646' : 'Total Funded Value'}
            </p>
            <p className={`text-2xl md:text-4xl font-black mt-2 ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
              {totalFundedUsdt.toLocaleString(undefined, { maximumFractionDigits: 2 })} USDT
            </p>
          </div>

          <div>
            <p className="text-slate-400 text-[10px] md:text-xs font-bold uppercase tracking-wider">
              {isRtl ? '\u0645\u062c\u0645\u0648\u0639 \u0633\u0647\u0627\u0645 \u062a\u0623\u0645\u06cc\u0646\u200c\u0634\u062f\u0647' : 'Total Funded Shares'}
            </p>
            <p className={`text-2xl md:text-4xl font-black mt-2 ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
              {totalFundedShares.toLocaleString()}
            </p>
            <span className="text-blue-500 text-[10px] md:text-xs font-bold">
              {isRtl ? '\u0633\u0647\u0645' : 'shares'}
            </span>
          </div>

          <div>
            <p className="text-slate-400 text-[10px] md:text-xs font-bold uppercase tracking-wider">
              {isRtl ? '\u0646\u0645\u0627\u062f\u0647\u0627\u06cc \u062a\u0623\u0645\u06cc\u0646\u200c\u0634\u062f\u0647' : 'Funded Symbols'}
            </p>
            <p className={`text-2xl md:text-4xl font-black mt-2 ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
              {fundedAssets.length}
            </p>
            <span className="text-purple-500 text-[10px] md:text-xs font-bold">
              KGOL • KAVEH • SHTRAN • SHASTA • DTMAD
            </span>
          </div>

        </div>
      </section>
      {/* 1. Hero Section & Interactive Principles Blueprint */}
      <section className="relative pt-4 md:pt-12 pb-6 md:pb-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 md:gap-12 items-start">

          {/* Hero Left (Text content & core metrics) */}
          <div className="lg:col-span-5 space-y-4 md:space-y-6 text-start self-center">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] md:text-xs font-bold bg-blue-500/10 text-blue-500 border border-blue-500/20">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse"></span>
              <span>{isRtl ? 'پلتفرم اثبات‌شده دارایی‌های واقعی (Market)' : 'TSETMC Market Data Infrastructure'}</span>
            </div>

            <h1 className={`text-2xl md:text-5xl lg:text-[46px] font-black tracking-tight leading-tight md:leading-[1.15] ${
              theme === 'dark' ? 'text-white' : 'text-slate-900'
            }`}>
              {t.homeHeroTitle}
            </h1>

            <p className="text-slate-400 text-xs md:text-sm leading-relaxed max-w-xl">
              {t.homeHeroSubtitle}
            </p>

            <div className="flex flex-wrap gap-2.5 md:gap-4 pt-1 md:pt-2">
              <button
                onClick={() => onExplore()}
                className="px-5 md:px-8 py-3 md:py-4 bg-blue-600 hover:bg-blue-500 text-white rounded-xl md:rounded-2xl text-xs md:text-sm font-extrabold transition-all shadow-lg shadow-blue-500/20 hover:scale-[1.02] flex items-center gap-1.5 md:gap-2 cursor-pointer"
              >
                <span>{t.homeExploreBtn}</span>
                {isRtl ? <ArrowLeft size={14} /> : <ArrowRight size={14} />}
              </button>

              <button
                onClick={onSupport}
                className={`px-4 md:px-6 py-3 md:py-4 rounded-xl md:rounded-2xl text-xs md:text-sm font-extrabold transition-all border cursor-pointer hover:scale-[1.02] ${
                  theme === 'dark'
                    ? 'border-slate-800 bg-slate-900/60 text-slate-200 hover:bg-slate-800'
                    : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-100'
                }`}
              >
                {t.homeLearnMoreBtn}
              </button>
            </div>

            {/* Quick trust badges */}
            <div className="grid grid-cols-3 gap-2 md:gap-4 pt-4 md:pt-6 border-t border-slate-800/20 text-[10px] md:text-xs">
              <div className="space-y-1">
                <span className="text-[9px] md:text-[10px] text-slate-500 block uppercase font-bold">{isRtl ? 'پشتیبان دارایی' : 'Data Source'}</span>
                <span className={`font-black ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                  {isRtl ? '۱۰۰٪ فیزیکی' : 'TSETMC'}
                </span>
              </div>
              <div className="space-y-1">
                <span className="text-[9px] md:text-[10px] text-slate-500 block uppercase font-bold">{isRtl ? 'دوره تسویه' : 'Market Coverage'}</span>
                <span className="text-blue-500 font-black">
                  {isRtl ? 'آنی ۲۴/۷' : '5 Shares'}
                </span>
              </div>
              <div className="space-y-1">
                <span className="text-[9px] md:text-[10px] text-slate-500 block uppercase font-bold">{isRtl ? 'نظارت قانونی' : 'Official Links'}</span>
                <span className="text-emerald-500 font-black">
                  {isRtl ? 'حسابرسی SGS' : 'Included'}
                </span>
              </div>
            </div>
          </div>

          {/* Hero Right - TSETMC Market Data Flow */}
          <div className="lg:col-span-7 space-y-4 md:space-y-6">

            {/* Visual Panel Header */}
            <div className={`p-4 md:p-6 rounded-2xl md:rounded-3xl border ${
              theme === 'dark'
                ? 'bg-slate-900/45 border-slate-800/80 text-white'
                : 'bg-slate-50 border-slate-200 text-slate-900'
            }`}>

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 md:mb-6">
                <div>
                  <h3 className="text-xs md:text-sm font-black tracking-tight flex items-center gap-1.5 md:gap-2">
                    <Activity size={14} className="text-emerald-500 animate-pulse" />
                    <span>{isRtl ? 'اصول سرمایه‌گذاری و فرآیند توکنایزاسیون' : 'TSETMC Market Data Flow'}</span>
                  </h3>
                  <p className="text-[10px] md:text-[11px] text-slate-400 mt-0.5">
                    {isRtl
                      ? 'مراحل گام‌به‌گام فیزیکی تا دیجیتالی دارایی‌های ثبت شده را بررسی کنید'
                      : 'Selected Iranian shares are presented with market information sourced from TSETMC.'}
                  </p>
                </div>

                {/* Mode Indicator */}
                <span className="px-2 py-0.5 md:px-2.5 md:py-1 rounded-full text-[8px] md:text-[9px] font-mono font-bold bg-blue-500/10 text-blue-400 border border-blue-500/15 uppercase self-start sm:self-auto">
                  {isRtl ? 'وضعیت شفاف درون‌زنجیره‌ای' : 'Stored Market Data'}
                </span>
              </div>

              {/* Graphical Pipeline Flowchart Nodes */}
              <div className="relative grid grid-cols-4 gap-1.5 md:gap-2 mb-6 md:mb-8">

                {/* Connecting animated vector pipeline background */}
                <div className="absolute top-[21px] md:top-[26px] left-[12%] right-[12%] h-[2px] bg-slate-800/80 -z-0">
                  <div className="h-full bg-gradient-to-r from-amber-500 via-blue-500 to-purple-500 animate-pulse transition-all duration-1000" style={{
                    width: `${((activeStep + 1) / 4) * 100}%`
                  }}></div>
                </div>

                {pipelineSteps.map((step, idx) => {
                  const isActive = activeStep === step.id;
                  const isCompleted = activeStep >= step.id;

                  return (
                    <button
                      key={step.id}
                      onClick={() => {
                        setActiveStep(step.id);
                        setAutoRotate(false); // Stop auto rotate on manual click
                      }}
                      className="flex flex-col items-center text-center focus:outline-none group relative z-10 cursor-pointer"
                    >
                      {/* Node Circle */}
                      <div className={`w-10 h-10 md:w-12 md:h-12 rounded-xl md:rounded-2xl flex items-center justify-center border transition-all duration-300 ${
                        isActive
                          ? `${step.badgeColor} scale-105 md:scale-110 shadow-lg ${step.glowColor}`
                          : isCompleted
                            ? 'bg-blue-600/15 border-blue-500 text-blue-500 shadow-md'
                            : theme === 'dark'
                              ? 'bg-slate-950 border-slate-800 text-slate-500 hover:border-slate-700'
                              : 'bg-white border-slate-200 text-slate-400 hover:border-slate-300'
                      }`}>
                        {step.icon}

                        {/* Status Dot */}
                        {isActive && (
                          <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-500 rounded-full border border-slate-900 animate-ping"></span>
                        )}
                      </div>

                      {/* Small Label */}
                      <span className={`text-[9px] md:text-[10px] font-bold mt-1.5 md:mt-2.5 transition-colors duration-300 ${
                        isActive
                          ? 'text-blue-500'
                          : theme === 'dark' ? 'text-slate-400 group-hover:text-slate-200' : 'text-slate-600 group-hover:text-slate-850'
                      }`}>
                        {isRtl ? step.titleFa.split(' ')[1] : step.titleEn.split(' ')[1]}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Dynamic Interactive Card - Displaying specific step details & audit proof */}
              <div className={`p-4 md:p-5 rounded-xl md:rounded-2xl border transition-all duration-500 relative overflow-hidden ${
                theme === 'dark'
                  ? 'bg-slate-950/90 border-slate-800 text-slate-100'
                  : 'bg-white border-slate-200 text-slate-850'
              }`}>
                {/* Decorative watermarked background icon */}
                <div className="absolute right-4 bottom-4 text-slate-800/10 -z-0 pointer-events-none scale-[2.5] md:scale-[3]">
                  {currentActiveStepData.icon}
                </div>

                <div className="relative z-10 space-y-3 md:space-y-4">
                  {/* Step Title & Status Badge */}
                  <div className="flex justify-between items-start gap-2">
                    <div className="space-y-0.5">
                      <span className="text-[9px] md:text-[10px] font-mono font-bold uppercase tracking-wider text-blue-500">
                        {isRtl ? 'گام پردازشی دارایی' : 'MARKET DATA STEP'}
                      </span>
                      <h4 className="text-sm md:text-base font-black leading-tight">
                        {isRtl ? currentActiveStepData.titleFa : currentActiveStepData.titleEn}
                      </h4>
                    </div>
                    <span className={`px-2 py-0.5 md:px-2.5 md:py-1 rounded-lg text-[8px] md:text-[9px] font-bold border shrink-0 ${currentActiveStepData.badgeColor}`}>
                      {isRtl ? currentActiveStepData.metricFa : currentActiveStepData.metricEn}
                    </span>
                  </div>

                  {/* Step Description */}
                  <p className="text-[11px] md:text-xs text-slate-400 leading-relaxed">
                    {isRtl ? currentActiveStepData.descFa : currentActiveStepData.descEn}
                  </p>

                  {/* Key Proof metrics Table (The visual proof of reserve aspect) */}
                  <div className={`grid grid-cols-2 gap-2 md:gap-3 p-3 rounded-xl text-[10px] md:text-[11px] border ${
                    theme === 'dark' ? 'bg-slate-900/50 border-slate-800/60' : 'bg-slate-50 border-slate-100'
                  }`}>
                    <div>
                      <span className="text-slate-500 block">{isRtl ? 'ناظر و متولی قانون:' : 'Entity / Partner:'}</span>
                      <span className="font-extrabold text-slate-350 md:text-slate-300">
                        {isRtl ? currentActiveStepData.details.partnerFa : currentActiveStepData.details.partnerEn}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-500 block">{isRtl ? 'آدرس فیزیکی ذخیره:' : 'Physical Location:'}</span>
                      <span className="font-extrabold text-slate-350 md:text-slate-300">
                        {isRtl ? currentActiveStepData.details.locationFa : currentActiveStepData.details.locationEn}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-500 block">{isRtl ? 'ارزش بیمه ذخایر:' : 'Insurance Guarantee:'}</span>
                      <span className="font-extrabold text-emerald-500">
                        {isRtl ? currentActiveStepData.details.insuredValueFa : currentActiveStepData.details.insuredValueEn}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-500 block">{isRtl ? 'وضعیت تایید فنی:' : 'Official Links Status:'}</span>
                      <span className="font-extrabold text-blue-500">
                        {isRtl ? currentActiveStepData.details.registryFa : currentActiveStepData.details.registryEn}
                      </span>
                    </div>
                  </div>

                  {/* Market Data Source Status Line */}
                  <div className="flex items-center justify-between text-[9px] md:text-[10px] text-slate-500 pt-0.5">
                    <span className="flex items-center gap-1 md:gap-1.5">
                      <Network size={11} className="text-emerald-500 animate-pulse" />
                      <span>{isRtl ? 'کد رهگیری رمزنگاری شده:' : 'Source / Coverage:'}</span>
                    </span>
                    <span className="font-mono text-slate-400 hover:text-slate-200 transition-colors cursor-pointer select-all">
                      TSETMC / 5 instruments
                    </span>
                  </div>

                </div>
              </div>

            </div>
          </div>

        </div>
      </section>

      {/* 0. Portfolio Dashboard Section (placed under Hero and Statistics) */}
      <section id="landing-portfolio-dashboard" className="relative pt-2 md:pt-8" dir={isRtl ? 'rtl' : 'ltr'}>
        <div className="space-y-4 md:space-y-6">
          {/* Section Heading */}
          <div className="text-start space-y-1.5 md:space-y-2">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] md:text-xs font-bold bg-blue-500/10 text-blue-500 border border-blue-500/20">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse"></span>
              <span>{isRtl ? 'بخش کاربری • مدیریت یکپارچه سود انباشته' : 'User Station • Unified Asset & Yield Hub'}</span>
            </div>
            <h2 className={`text-xl md:text-4xl font-black tracking-tight ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
              {isRtl ? 'میزان سوددهی و سبد دارایی‌های شما' : 'Your Personal Assets & Yield Performance'}
            </h2>
            <p className={`text-[11px] md:text-sm max-w-3xl leading-relaxed ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}>
              {isRtl
                ? 'روند زنده رشد سرمایه، ارزش دلاری دارایی‌ها و میزان بازدهی کل (APY) ذخایر وثیقه شده فیزیکی شما.'
                : 'Monitor selected Iranian shares using stored TSETMC market data.'}
            </p>
          </div>

          {/* Grid Layout containing Chart and Portfolio Card details */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 md:gap-8 items-start">

            {/* Interactive Performance Chart (8 columns on large screens) */}
            <div className="lg:col-span-8 w-full">
              <YieldChart
                theme={theme}
                lang={lang}
                isPortfolioMode={true}
                isLoggedIn={isLoggedIn}
                onLoginClick={onLoginClick}
                myPortfolio={myPortfolio}
                assets={assets}
              />
            </div>

            {/* Asset Allocation Details & Value Summary (4 columns on large screens) */}
            <div className="lg:col-span-4 w-full h-full flex flex-col justify-between space-y-4 md:space-y-6">

              {/* Value Summary Box */}
              <div className={`p-4 md:p-6 rounded-2xl md:rounded-3xl border shadow-sm transition-all relative overflow-hidden ${
                theme === 'dark'
                  ? 'bg-gradient-to-br from-slate-900/80 to-slate-950 border-slate-800/80'
                  : 'bg-gradient-to-br from-white to-slate-50 border-slate-200'
              }`}>
                <span className="text-[9px] md:text-[10px] uppercase font-bold tracking-widest text-slate-400 block mb-1">
                  {isRtl ? 'مجموع ارزش دارایی‌ها و تراز حساب' : 'Total Asset Valuation & Balance'}
                </span>

                {/* Balance display */}
                <div className="space-y-1">
                  <h3 className={`text-xl md:text-3xl font-black font-mono tracking-tight ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                    {isLoggedIn ? `${portfolioBalanceUsdt.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USDT` : '?'}
                  </h3>
                  <p className="text-[9px] md:text-[10px] text-slate-400">
                    {isLoggedIn
                      ? (isRtl
                          ? '\u0634\u0627\u0645\u0644 \u0645\u0648\u062c\u0648\u062f\u06cc USDT \u0648 \u0627\u0631\u0632\u0634 \u0641\u0639\u0644\u06cc \u0633\u0628\u062f'
                          : 'Includes wallet USDT + current portfolio value')
                      : (isRtl
                          ? '\u0628\u0631\u0627\u06cc \u0645\u0634\u0627\u0647\u062f\u0647 \u0645\u0648\u062c\u0648\u062f\u06cc \u0648 \u0633\u0628\u062f \u0634\u062e\u0635\u06cc \u0648\u0627\u0631\u062f \u062d\u0633\u0627\u0628 \u0634\u0648\u06cc\u062f'
                          : 'Sign in to view your personal balance and portfolio')}
                  </p>
                </div>

                {/* Return metrics */}
                <div className="mt-4 md:mt-6 pt-3 md:pt-4 border-t border-slate-800/20 flex items-center justify-between">
                  <div>
                    <p className="text-[8px] md:text-[9px] text-slate-400 font-bold uppercase">{isRtl ? '\u0633\u0648\u062f \u0648 \u0632\u06cc\u0627\u0646 \u0633\u0628\u062f' : 'Portfolio PnL'}</p>
                    <p className="text-xs md:text-sm font-extrabold text-emerald-500 font-mono">
                      {isLoggedIn ? `${portfolioPnlUsdt >= 0 ? '+' : ''}${portfolioPnlUsdt.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USDT` : '?'}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-[8px] md:text-[9px] text-slate-400 font-bold uppercase">{isRtl ? '\u062a\u0639\u062f\u0627\u062f \u062f\u0627\u0631\u0627\u06cc\u06cc\u200c\u0647\u0627\u06cc \u0633\u0628\u062f' : 'Portfolio Assets'}</p>
                    <p className="text-xs md:text-sm font-extrabold text-blue-500 font-mono">
                      {isLoggedIn ? myPortfolio.length.toLocaleString() : '?'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Assets List cards inside the hub */}
              <div className="space-y-2.5">
                <span className="text-[9px] md:text-[10px] uppercase font-black tracking-widest text-slate-400 block px-1">
                  {isRtl ? 'توزیع دارایی‌های سبد شما' : 'Your Holdings Distribution'}
                </span>

                {/* If Logged in, show actual assets, else show stunning premium placeholders */}
                {isLoggedIn && myPortfolio && myPortfolio.length > 0 ? (
                  myPortfolio.map((item: any) => {
                    const asset = assets.find(a => a.id === item.assetId);
                    if (!asset) return null;
                    const val = item.shares * asset.price;
                    return (
                      <div
                        key={item.assetId}
                        className={`p-3 md:p-3.5 rounded-xl md:rounded-2xl border flex items-center justify-between transition-all ${
                          theme === 'dark'
                            ? 'bg-slate-900/40 border-slate-800/60 hover:border-slate-700/60'
                            : 'bg-white border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        <div className="flex items-center gap-2 md:gap-3">
                          <span className="text-[10px] md:text-xs font-black text-blue-500 font-mono">#{asset.id}</span>
                          <div>
                            <h4 className={`text-[11px] md:text-xs font-bold ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                              {asset.enName}
                            </h4>
                            <p className="text-[8px] md:text-[9px] text-slate-400 mt-0.5">
                              {item.shares.toLocaleString()} {isRtl ? 'سهم توکنایز شده' : 'Shares'}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className={`text-[11px] md:text-xs font-black font-mono ${theme === 'dark' ? 'text-slate-200' : 'text-slate-800'}`}>
                            {val.toLocaleString(undefined, { maximumFractionDigits: 2 })} USDT
                          </p>
                          <p className="text-[8px] md:text-[9px] text-emerald-500 font-bold mt-0.5">
                            {asset.change >= 0 ? '+' : ''}{asset.change}%
                          </p>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  featuredAssets.slice(0, 3).map(asset => (
                    <div
                      key={asset.id}
                      className={`p-3 md:p-3.5 rounded-xl md:rounded-2xl border flex items-center justify-between ${
                        theme === 'dark' ? 'bg-slate-900/40 border-slate-800/60' : 'bg-white border-slate-200'
                      }`}
                    >
                      <div className="flex items-center gap-2 md:gap-3">
                        <span className="text-[10px] md:text-xs font-black text-blue-500 font-mono">
                          #{asset.id}
                        </span>
                        <div>
                          <h4 className={`text-[11px] md:text-xs font-bold ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                            {asset.enName}
                          </h4>
                          <p className="text-[8px] md:text-[9px] text-slate-400 mt-0.5">
                            {isRtl ? '\u062f\u0627\u062f\u0647 \u0628\u0627\u0632\u0627\u0631 TSETMC' : 'TSETMC market data'}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={`text-[11px] md:text-xs font-black font-mono ${theme === 'dark' ? 'text-slate-200' : 'text-slate-800'}`}>
                          {asset.price.toLocaleString(undefined, { minimumFractionDigits: 4, maximumFractionDigits: 6 })} USDT
                        </p>
                        <p className={`text-[8px] md:text-[9px] font-bold mt-0.5 ${asset.change >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                          {asset.change >= 0 ? '+' : ''}{asset.change.toFixed(2)}%
                        </p>
                      </div>
                    </div>
                  ))
                )}

              </div>

            </div>

          </div>
        </div>
      </section>

      {/* 3. Why AssetChain Bento Highlights */}
      <section className="space-y-6 md:space-y-12">
        <div className="text-center space-y-2 md:space-y-3">
          <h2 className={`text-xl md:text-3xl font-extrabold tracking-tight ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
            {t.homeFeatureTitle}
          </h2>
          <p className="text-slate-400 text-xs md:text-sm max-w-lg mx-auto leading-relaxed">
            {t.homeFeatureSubtitle}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-8">
          {/* Card 1 */}
          <div className={`p-5 md:p-6 rounded-2xl md:rounded-3xl border space-y-3 md:space-y-4 shadow-sm transition-all duration-300 hover:scale-[1.01] ${
            theme === 'dark' ? 'bg-slate-900/50 border-slate-800' : 'bg-white border-slate-200'
          }`}>
            <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl md:rounded-2xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
              <ShieldCheck size={20} />
            </div>
            <h3 className={`text-base md:text-lg font-bold ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
              {t.homeFeature1Title}
            </h3>
            <p className="text-slate-400 text-[11px] md:text-xs leading-relaxed">
              {t.homeFeature1Desc}
            </p>
          </div>

          {/* Card 2 */}
          <div className={`p-5 md:p-6 rounded-2xl md:rounded-3xl border space-y-3 md:space-y-4 shadow-sm transition-all duration-300 hover:scale-[1.01] ${
            theme === 'dark' ? 'bg-slate-900/50 border-slate-800' : 'bg-white border-slate-200'
          }`}>
            <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl md:rounded-2xl bg-blue-500/10 text-blue-500 flex items-center justify-center">
              <Coins size={20} />
            </div>
            <h3 className={`text-base md:text-lg font-bold ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
              {t.homeFeature2Title}
            </h3>
            <p className="text-slate-400 text-[11px] md:text-xs leading-relaxed">
              {t.homeFeature2Desc}
            </p>
          </div>

          {/* Card 3 */}
          <div className={`p-5 md:p-6 rounded-2xl md:rounded-3xl border space-y-3 md:space-y-4 shadow-sm transition-all duration-300 hover:scale-[1.01] ${
            theme === 'dark' ? 'bg-slate-900/50 border-slate-800' : 'bg-white border-slate-200'
          }`}>
            <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl md:rounded-2xl bg-purple-500/10 text-purple-500 flex items-center justify-center">
              <Lock size={20} />
            </div>
            <h3 className={`text-base md:text-lg font-bold ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
              {t.homeFeature3Title}
            </h3>
            <p className="text-slate-400 text-[11px] md:text-xs leading-relaxed">
              {t.homeFeature3Desc}
            </p>
          </div>

          {/* Card 4 */}
          <div className={`p-5 md:p-6 rounded-2xl md:rounded-3xl border space-y-3 md:space-y-4 shadow-sm transition-all duration-300 hover:scale-[1.01] ${
            theme === 'dark' ? 'bg-slate-900/50 border-slate-800' : 'bg-white border-slate-200'
          }`}>
            <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl md:rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center">
              <TrendingUp size={20} />
            </div>
            <h3 className={`text-base md:text-lg font-bold ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
              {t.homeFeature4Title}
            </h3>
            <p className="text-slate-400 text-[11px] md:text-xs leading-relaxed">
              {t.homeFeature4Desc}
            </p>
          </div>
        </div>
      </section>

      {/* 4. Featured Assets Marketplace Showcase */}
      <section className="space-y-6 md:space-y-12">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-3">
          <div className="text-start space-y-1.5">
            <h2 className={`text-xl md:text-3xl font-extrabold tracking-tight ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
              {isRtl ? 'فرصت‌های داغ بازار دارایی‌ها' : 'Featured Investment Opportunities'}
            </h2>
            <p className="text-slate-400 text-xs md:text-sm max-w-md leading-relaxed">
              {isRtl ? 'برخی از محبوب‌ترین توکن‌های با پشتوانه واقعی دنیای فیزیکی که کاربران در حال حاضر معامله می‌کنند.' : 'Explore selected Iranian shares and their official TSETMC instrument pages.'}
            </p>
          </div>
          <button
            onClick={() => onExplore()}
            className="px-4 py-2 bg-blue-600/10 hover:bg-blue-600/25 text-blue-500 rounded-lg text-[11px] md:text-xs font-extrabold transition-all shrink-0 flex items-center gap-1 cursor-pointer align-middle self-start md:self-auto"
          >
            <span>{isRtl ? 'مشاهده همه بازارها' : 'View All Markets'}</span>
            <ChevronRight size={12} className={isRtl ? 'rotate-180' : ''} />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-8">
          {featuredAssets.map(asset => (
            <div
              key={asset.id}
              className={`rounded-2xl md:rounded-3xl border overflow-hidden shadow-sm flex flex-col justify-between transition-all duration-300 hover:scale-[1.01] ${
                theme === 'dark' ? 'bg-slate-900/60 border-slate-800' : 'bg-white border-slate-200'
              }`}
            >
              {/* Cover */}
              <div className={`p-4 md:p-5 relative overflow-hidden h-24 md:h-28 flex flex-col justify-between ${
                theme === 'dark' ? 'bg-slate-950/40' : 'bg-slate-100/60'
              }`}>
                <div className="flex items-center justify-between z-10">
                  <div className={`flex items-center gap-1.5 px-2 py-0.5 rounded-lg text-[8px] md:text-[9px] font-bold uppercase ${
                    theme === 'dark' ? 'bg-slate-800 text-slate-300' : 'bg-white text-slate-600 border'
                  }`}>
                    <img
                      src={`https://flagcdn.com/16x12/${asset.flag}.png`}
                      alt={asset.flag}
                      className="rounded-[2px]"
                      referrerPolicy="no-referrer"
                    />
                    <span>{asset.locationEn}</span>
                  </div>
                  <span className="text-[9px] md:text-[10px] font-mono font-bold text-slate-500">#{asset.id}</span>
                </div>

                <h3 className={`text-sm md:text-base font-bold tracking-tight z-10 ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                  {asset.enName}
                </h3>
              </div>

              {/* Specs */}
              <div className="p-4 md:p-5 space-y-3.5">
                <div className="grid grid-cols-2 gap-2 text-[11px] md:text-xs">
                  <div>
                    <span className="text-slate-400 text-[9px] md:text-[10px] block font-bold uppercase">{t.tokenPrice}</span>
                    <span className={`text-sm md:text-base font-black ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>{asset.price.toLocaleString(undefined, { minimumFractionDigits: 4, maximumFractionDigits: 6 })} USDT</span>
                  </div>
                  <div className="text-end">
                    <span className="text-slate-400 text-[9px] md:text-[10px] block font-bold uppercase">{t.expectedYield}</span>
                    <span className="text-emerald-500 text-xs md:text-sm font-black flex items-center justify-end gap-0.5">
                      <ArrowUpRight size={12} />
                      <span>+{asset.change}%</span>
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between rounded-xl border border-slate-800/40 px-3 py-2 text-[10px] md:text-xs">
                  <span className="text-slate-400">Supply</span>
                  <span className="font-black text-blue-500">{(fundedSharesByAssetId[asset.id] ?? 0).toLocaleString()} shares</span>
                </div>

                {asset.tsetmcUrl && (
                  <a
                    href={asset.tsetmcUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="py-1.5 px-2 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/25 rounded-lg text-[11px] font-extrabold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Globe size={13} className="text-emerald-400 shrink-0" />
                    <span className="truncate">{`Stock Reference (${asset.id})`}</span>
                    <ExternalLink size={12} className="shrink-0" />
                  </a>
                )}

                <div className="grid grid-cols-2 gap-2 mt-1">
                  <button
                    onClick={() => onOpenInfo ? onOpenInfo(asset) : onExplore()}
                    className={`py-2 px-3 rounded-lg md:rounded-xl text-xs font-bold transition-all border flex items-center justify-center gap-1.5 cursor-pointer ${
                      theme === 'dark'
                        ? 'bg-slate-800/80 border-slate-700/80 text-slate-200 hover:bg-slate-700'
                        : 'bg-slate-100 border-slate-200 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    <Info size={13} className="text-blue-400 shrink-0" />
                    <span className="truncate">{t.assetDetailsBtn}</span>
                  </button>

                  <button
                    onClick={() => onExplore()}
                    className="py-2 px-3 bg-blue-600 hover:bg-blue-500 text-white rounded-lg md:rounded-xl text-xs font-bold transition-all cursor-pointer truncate"
                  >
                    {t.buyNow}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 6. CTA Footer Card */}
      <section className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-2xl md:rounded-3xl p-6 md:p-12 relative overflow-hidden text-white text-center shadow-xl">
        <div className="absolute -bottom-10 -right-10 w-48 h-48 bg-white/10 rounded-full"></div>
        <div className="absolute -top-10 -left-10 w-40 h-40 bg-blue-400/20 rounded-full blur-xl"></div>

        <div className="relative z-10 max-w-xl mx-auto space-y-4 md:space-y-6">
          <h2 className="text-xl md:text-3xl font-black tracking-tight leading-tight">
            {isRtl ? 'آماده سرمایه‌گذاری هستید؟' : 'Explore the Selected Iranian Shares'}
          </h2>
          <p className="text-blue-100 text-[11px] md:text-sm leading-relaxed opacity-90">
            {isRtl
              ? 'همین حالا وارد پنل بازارها شوید و از طلا تا املاک لوکس جمیرا را به شکل توکن‌های خرد شده خریداری کنید.'
              : 'Review selected Iranian shares with market information sourced from TSETMC.'}
          </p>
          <div className="flex justify-center pt-1">
            <button
              onClick={() => onExplore()}
              className="px-6 md:px-8 py-2.5 md:py-3.5 bg-white text-blue-600 rounded-lg md:rounded-xl text-xs font-black hover:bg-slate-50 transition-all shadow-lg hover:scale-[1.02] flex items-center gap-1 cursor-pointer"
            >
              <span>{t.homeExploreBtn}</span>
              {isRtl ? <ArrowLeft size={12} /> : <ArrowRight size={12} />}
            </button>
          </div>
        </div>
      </section>

      {/* 5. How It Works Section (moved here to be full width at the bottom) */}
      <section className="space-y-6 md:space-y-12 pt-4 md:pt-8">
        <div className="text-center space-y-2 md:space-y-3">
          <h2 className={`text-xl md:text-3xl font-extrabold tracking-tight ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
            {t.homeHowItWorksTitle}
          </h2>
          <p className="text-slate-400 text-xs md:text-sm max-w-md mx-auto leading-relaxed">
            {isRtl ? 'در کمتر از چند دقیقه مالک دارایی‌های فیزیکی بیمه‌شده در سراسر جهان شوید.' : 'Review selected Iranian shares and their market information in a few simple steps.'}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
          <div className="text-center space-y-2 md:space-y-3 p-2 md:p-4">
            <div className="w-12 h-12 md:w-16 md:h-16 rounded-full bg-blue-500/10 text-blue-500 flex items-center justify-center mx-auto text-base md:text-xl font-black">
              ۱
            </div>
            <h3 className={`text-sm md:text-base font-bold ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
              {t.homeHowStep1}
            </h3>
            <p className="text-slate-400 text-[11px] md:text-xs leading-relaxed">
              {t.homeHowStep1Desc}
            </p>
          </div>

          <div className="text-center space-y-2 md:space-y-3 p-2 md:p-4">
            <div className="w-12 h-12 md:w-16 md:h-16 rounded-full bg-blue-500/10 text-blue-500 flex items-center justify-center mx-auto text-base md:text-xl font-black">
              ۲
            </div>
            <h3 className={`text-sm md:text-base font-bold ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
              {t.homeHowStep2}
            </h3>
            <p className="text-slate-400 text-[11px] md:text-xs leading-relaxed">
              {t.homeHowStep2Desc}
            </p>
          </div>

          <div className="text-center space-y-2 md:space-y-3 p-2 md:p-4">
            <div className="w-12 h-12 md:w-16 md:h-16 rounded-full bg-blue-500/10 text-blue-500 flex items-center justify-center mx-auto text-base md:text-xl font-black">
              ۳
            </div>
            <h3 className={`text-sm md:text-base font-bold ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
              {t.homeHowStep3}
            </h3>
            <p className="text-slate-400 text-[11px] md:text-xs leading-relaxed">
              {t.homeHowStep3Desc}
            </p>
          </div>
        </div>
      </section>
    </div>
    </div>
  );
}
