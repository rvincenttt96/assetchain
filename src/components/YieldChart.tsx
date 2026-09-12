import React from 'react';
import { Activity, ExternalLink, LogIn, TrendingDown, TrendingUp } from 'lucide-react';
import type { Asset, PortfolioItem } from '../types';

interface YieldChartProps {
  theme: 'dark' | 'light';
  lang: 'fa' | 'en';
  isPortfolioMode?: boolean;
  isLoggedIn?: boolean;
  onLoginClick?: () => void;
  myPortfolio?: PortfolioItem[];
  assets?: Asset[];
}

const usdt = (value?: number) =>
  typeof value === 'number' && Number.isFinite(value)
    ? value.toLocaleString('en-US', { minimumFractionDigits: 4, maximumFractionDigits: 6 })
    : '—';

export default function YieldChart({
  theme,
  lang,
  isPortfolioMode = false,
  isLoggedIn = false,
  onLoginClick,
  myPortfolio = [],
  assets = []
}: YieldChartProps) {
  const isRtl = lang === 'fa';
  const visibleAssets = isPortfolioMode
    ? myPortfolio
        .map(item => ({ item, asset: assets.find(asset => asset.id === item.assetId) }))
        .filter(entry => entry.asset)
    : assets.map(asset => ({ asset, item: undefined }));

  return (
    <section
      dir={isRtl ? 'rtl' : 'ltr'}
      className={`rounded-3xl border overflow-hidden ${theme === 'dark' ? 'bg-slate-900/60 border-slate-800' : 'bg-white border-slate-200'}`}
    >
      <div className="p-5 md:p-6 border-b border-slate-800/20 flex items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Activity size={18} className="text-blue-500" />
            <h3 className={`font-black ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
              {isPortfolioMode
                ? (isRtl ? 'نمای بازار سبد شما' : 'Your Portfolio Market View')
                : (isRtl ? 'نمای بازار با قیمت USDT' : 'USDT Market Snapshot')}
            </h3>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            {isRtl ? 'تمام قیمت‌های قابل مشاهده در این بخش به USDT نمایش داده می‌شوند.' : 'All user-facing prices in this view are displayed in USDT.'}
          </p>
        </div>
        <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-blue-500/10 text-blue-500">USDT</span>
      </div>

      {isPortfolioMode && !isLoggedIn ? (
        <div className="p-8 text-center">
          <p className="text-sm text-slate-400 mb-4">
            {isRtl ? 'برای مشاهده اطلاعات سبد خود وارد حساب شوید.' : 'Sign in to view your portfolio market information.'}
          </p>
          <button type="button" onClick={onLoginClick} className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 text-white text-sm font-bold">
            <LogIn size={16} />
            {isRtl ? 'ورود' : 'Sign In'}
          </button>
        </div>
      ) : visibleAssets.length === 0 ? (
        <div className="p-8 text-center text-sm text-slate-400">
          {isPortfolioMode
            ? (isRtl ? 'هنوز سهمی در سبد شما وجود ندارد.' : 'Your portfolio has no shares yet.')
            : (isRtl ? 'هیچ نمادی با این جستجو یا فیلتر پیدا نشد.' : 'No symbols match this search or filter.')}
        </div>
      ) : (
        <div className="divide-y divide-slate-800/20">
          {visibleAssets.map(({ asset, item }) => {
            if (!asset) return null;
            const change = Number.isFinite(asset.change) ? asset.change : 0;
            const positive = change >= 0;
            return (
              <div key={asset.id} className="p-4 md:p-5">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-black text-blue-500">#{asset.id}</span>
                      {positive ? <TrendingUp size={15} className="text-emerald-500" /> : <TrendingDown size={15} className="text-red-500" />}
                    </div>
                    <p className={`font-bold mt-1 ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>{asset.enName}</p>
                    {item && <p className="text-[11px] text-slate-400 mt-1">{isRtl ? 'تعداد سهام' : 'Shares'}: {item.shares.toLocaleString()}</p>}
                  </div>
                  <div className={isRtl ? 'text-left' : 'text-right'}>
                    <p className={`font-mono font-black ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>{usdt(asset.price)} USDT</p>
                    <p className={`text-xs font-bold ${positive ? 'text-emerald-500' : 'text-red-500'}`}>{positive ? '+' : ''}{change.toFixed(2)}%</p>
                  </div>
                </div>
                <div className="mt-3 flex items-center justify-between gap-3 text-[10px] text-slate-500">
                  <span>{asset.descriptionEn || 'Selected Iranian listed company.'}</span>
                  {asset.tsetmcUrl && (
                    <a href={asset.tsetmcUrl} target="_blank" rel="noreferrer" className="shrink-0 inline-flex items-center gap-1 font-bold text-blue-500 hover:underline">
                      <ExternalLink size={12} />
                      Stock Reference
                    </a>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
