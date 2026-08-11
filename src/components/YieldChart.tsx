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

const rial = (value?: number) =>
  typeof value === 'number' && Number.isFinite(value)
    ? value.toLocaleString('en-US')
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
        .map(item => ({
          item,
          asset: assets.find(asset => asset.id === item.assetId)
        }))
        .filter(entry => entry.asset)
    : assets.map(asset => ({ asset, item: undefined }));

  return (
    <section
      dir={isRtl ? 'rtl' : 'ltr'}
      className={`rounded-3xl border overflow-hidden ${
        theme === 'dark'
          ? 'bg-slate-900/60 border-slate-800'
          : 'bg-white border-slate-200'
      }`}
    >
      <div className="p-5 md:p-6 border-b border-slate-800/20 flex items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Activity size={18} className="text-blue-500" />
            <h3 className={`font-black ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
              {isPortfolioMode
                ? isRtl ? 'نمای بازار سبد شما' : 'Your Portfolio Market View'
                : isRtl ? 'نمای لحظه‌ای بازار TSETMC' : 'TSETMC Market Snapshot'}
            </h3>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            {isRtl
              ? 'اطلاعات بازار از داده‌های ذخیره‌شده TSETMC نمایش داده می‌شود.'
              : 'Market information is displayed from the latest stored TSETMC data.'}
          </p>
        </div>

        <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-blue-500/10 text-blue-500">
          TSETMC
        </span>
      </div>

      {isPortfolioMode && !isLoggedIn ? (
        <div className="p-8 text-center">
          <p className="text-sm text-slate-400 mb-4">
            {isRtl
              ? 'برای مشاهده اطلاعات سبد خود وارد حساب شوید.'
              : 'Sign in to view your portfolio market information.'}
          </p>
          <button
            type="button"
            onClick={onLoginClick}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 text-white text-sm font-bold"
          >
            <LogIn size={16} />
            {isRtl ? 'ورود' : 'Sign In'}
          </button>
        </div>
      ) : visibleAssets.length === 0 ? (
        <div className="p-8 text-center text-sm text-slate-400">
          {isPortfolioMode
            ? isRtl ? 'هنوز سهمی در سبد شما وجود ندارد.' : 'Your portfolio has no shares yet.'
            : isRtl ? 'داده بازار در حال بارگذاری است.' : 'Market data is loading.'}
        </div>
      ) : (
        <div className="divide-y divide-slate-800/20">
          {visibleAssets.map(({ asset, item }) => {
            if (!asset) return null;

            const change = Number.isFinite(asset.change) ? asset.change : 0;
            const positive = change >= 0;

            const low = asset.dayLowRial ?? 0;
            const high = asset.dayHighRial ?? 0;
            const last = asset.lastPriceRial ?? 0;
            const range = high > low ? high - low : 0;
            const position =
              range > 0
                ? Math.max(0, Math.min(100, ((last - low) / range) * 100))
                : 0;

            return (
              <div key={asset.id} className="p-4 md:p-5">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-black text-blue-500">
                        #{asset.bourseSymbol || asset.id}
                      </span>
                      {positive
                        ? <TrendingUp size={15} className="text-emerald-500" />
                        : <TrendingDown size={15} className="text-red-500" />}
                    </div>

                    <p className={`font-bold mt-1 ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                      {isRtl ? asset.faName : asset.enName}
                    </p>

                    {item && (
                      <p className="text-[11px] text-slate-400 mt-1">
                        {isRtl ? 'تعداد سهام' : 'Shares'}: {item.shares.toLocaleString()}
                      </p>
                    )}
                  </div>

                  <div className={isRtl ? 'text-left' : 'text-right'}>
                    <p className={`font-mono font-black ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                      {rial(asset.lastPriceRial)} {isRtl ? 'ریال' : 'IRR'}
                    </p>
                    <p className={`text-xs font-bold ${positive ? 'text-emerald-500' : 'text-red-500'}`}>
                      {positive ? '+' : ''}{change.toFixed(2)}%
                    </p>
                  </div>
                </div>

                <div className="mt-4">
                  <div className="h-1.5 rounded-full bg-slate-500/15 overflow-hidden">
                    <div
                      className="h-full bg-blue-500 rounded-full"
                      style={{ width: `${position}%` }}
                    />
                  </div>
                  <div className="flex justify-between mt-1.5 text-[10px] text-slate-500 font-mono">
                    <span>{rial(asset.dayLowRial)}</span>
                    <span>{isRtl ? 'بازه روز' : 'Day range'}</span>
                    <span>{rial(asset.dayHighRial)}</span>
                  </div>
                </div>

                {asset.tsetmcUrl && (
                  <a
                    href={asset.tsetmcUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 mt-3 text-[11px] font-bold text-blue-500 hover:underline"
                  >
                    <ExternalLink size={12} />
                    {isRtl ? 'مشاهده در TSETMC' : 'Open in TSETMC'}
                  </a>
                )}
              </div>
            );
          })}
        </div>
      )}

      <div className="px-5 py-3 bg-slate-500/5 text-[10px] text-slate-500">
        {isRtl
          ? 'نمودار تاریخی پس از ذخیره‌سازی تاریخچه واقعی بازار فعال خواهد شد؛ داده ساختگی نمایش داده نمی‌شود.'
          : 'Historical charts will be enabled after real market history is stored; no synthetic price history is displayed.'}
      </div>
    </section>
  );
}
