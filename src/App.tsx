import React, { useState, useEffect } from 'react';
import {
  Coins,
  Wallet,
  History,
  MessageSquare,
  LogOut,
  LogIn,
  Globe,
  Sun,
  Moon,
  TrendingUp,
  MapPin,
  CheckCircle,
  Clock,
  ArrowUpRight,
  ArrowDownRight,
  Percent,
  Copy,
  Menu,
  X,
  Info,
  Check,
  User,
  ShieldCheck,
  DollarSign,
  Search,
  LayoutDashboard,
  Eye,
  EyeOff,
  AlertCircle,
  ExternalLink
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Asset, PortfolioItem, PurchaseLot, Transaction, Theme, Language, UserActivity } from './types';
import { TRANSLATIONS } from './data';
import LandingPage from './components/LandingPage';
import AdminPanel from './components/AdminPanel';
import YieldChart from './components/YieldChart';
import {
  ApiError,
  executeBuyOrder,
  executeSellOrder,
  fetchAssetsFromBackend,
  getUserProfile,
  loginUser,
  logoutUser,
  registerUser,
  type BackendProfile
} from './lib/api';

const getFlagSrc = (flag?: string) => `/flags/${(flag || 'ir').toLowerCase()}.svg`;

const DEPOSIT_ADDRESSES = {
  trc20: 'TYoPGPhMxuWGxF59FWYmsoGUTTwCnPEcpf',
  erc20: '0x85c1B3748204Ee174e4883A78190F75419551697',
  bep20: '0x85c1B3748204Ee174e4883A78190F75419551697'
} as const;

export default function App() {
  // Theme & Language State
  const [theme, setTheme] = useState<Theme>('dark');
  const lang = 'en' as Language;

  // Authentication State
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentUser, setCurrentUser] = useState({
    username: '',
    email: '',
    usdtBalance: 0,
    role: 'USER',
    isActive: true
  });

  // Navigation State
  const [currentTab, setCurrentTab] = useState<'home' | 'market' | 'portfolio' | 'wallet' | 'history' | 'support' | 'about' | 'contact' | 'admin'>('home');
  const [marketFilter, setMarketFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Modals & Panels State
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);
  const [authMode, setAuthMode] = useState<'signIn' | 'signUp'>('signIn');
  const [authUsername, setAuthUsername] = useState<string>('');
  const [authName, setAuthName] = useState<string>('');
  const [authPassword, setAuthPassword] = useState<string>('');
  const [authError, setAuthError] = useState<string>('');
  const [isAuthLoading, setIsAuthLoading] = useState<boolean>(false);

  const [isBuyModalOpen, setIsBuyModalOpen] = useState<boolean>(false);
  const [isSellModalOpen, setIsSellModalOpen] = useState<boolean>(false);
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);

  // Asset Info Modal State
  const [isInfoModalOpen, setIsInfoModalOpen] = useState<boolean>(false);
  const [infoAsset, setInfoAsset] = useState<Asset | null>(null);

  const handleOpenAssetInfo = (asset: Asset) => {
    setInfoAsset(asset);
    setIsInfoModalOpen(true);
  };

  // Trade Inputs
  const [buyAmount, setBuyAmount] = useState<string>('');
  const [sellShares, setSellShares] = useState<string>('');

  // Notifications / Alert Feedbacks
  const [alertMessage, setAlertMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  // App Wallet Staking/Deposit State
  const [walletTab, setWalletTab] = useState<'deposit' | 'withdraw'>('deposit');
  const [depositNetwork, setDepositNetwork] = useState<'trc20' | 'erc20' | 'bep20'>('trc20');
  const [depositTxid, setDepositTxid] = useState<string>('');
  const [withdrawAddress, setWithdrawAddress] = useState<string>('');
  const [withdrawAmount, setWithdrawAmount] = useState<string>('');
  const [txidError, setTxidError] = useState<string>('');
  const [withdrawAddrError, setWithdrawAddrError] = useState<string>('');

  // Support State
  const [supportText, setSupportText] = useState<string>('');

  // User Portfolio Data (stored in state so it adapts when buying/selling)
  const [myPortfolio, setMyPortfolio] = useState<PortfolioItem[]>([]);

  // Detailed Purchase Lots for each asset to show exact buy time, price, and volume
  const [purchaseLots, setPurchaseLots] = useState<PurchaseLot[]>([]);

  const [portfolioViewMode, setPortfolioViewMode] = useState<'aggregated' | 'detailed'>('aggregated');

  // Transaction History Data
  const [transactions, setTransactions] = useState<Transaction[]>([]);

  // Live Assets Pricing state
  const [assets, setAssets] = useState<Asset[]>([]);

const platformFundedSharesByAssetId: Record<string, number> = {
  KGOL: 33780,
  KAVEH: 15750,
  SHTRAN: 19450,
  SHASTA: 35300,
  DTMAD: 1781
};

const platformFundedAssets = assets
  .map(asset => ({
    asset,
    shares: platformFundedSharesByAssetId[asset.id] ?? 0
  }))
  .filter(item => item.shares > 0);

const platformFundedShares = platformFundedAssets.reduce(
  (sum, item) => sum + item.shares,
  0
);


const platformFundedUsdt = platformFundedAssets.reduce(
  (sum, item) => sum + item.shares * item.asset.price,
  0
);

  // User Activities State
  const [activities, setActivities] = useState<UserActivity[]>([]);

  const [showPortfolioChart, setShowPortfolioChart] = useState<boolean>(true);

  // Helper to record user activities dynamically
  const recordActivity = (type: string, descriptionEn: string, descriptionFa: string) => {
    const newAct: UserActivity = {
      id: `ACT-${Math.floor(100 + Math.random() * 900)}`,
      type,
      descriptionEn,
      descriptionFa,
      date: new Date().toISOString().replace('T', ' ').substring(0, 16)
    };
    setActivities(prev => [newAct, ...prev]);
  };

  // UI state for Mobile Hamburger Menu
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState<boolean>(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState<boolean>(false);

  const t = TRANSLATIONS.en;
  const isAdmin = ['SUPER_ADMIN', 'FINANCE_ADMIN', 'ASSET_ADMIN', 'SUPPORT_ADMIN'].includes(currentUser.role);

  const applyBackendProfile = (profile: BackendProfile) => {
    setCurrentUser({
      username: profile.name,
      email: profile.email,
      usdtBalance: profile.usdtBalance,
      role: profile.role,
      isActive: profile.isActive
    });
    setMyPortfolio(profile.portfolio);
    setPurchaseLots(profile.purchaseLots);
    setTransactions(profile.transactions);
    setActivities(profile.activities);
    setIsLoggedIn(true);
  };

  // Auto Dismiss alerts
  useEffect(() => {
    if (alertMessage) {
      const timer = setTimeout(() => {
        setAlertMessage(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [alertMessage]);

  // Apply layout theme body classes
  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [theme]);

  // Load assets and restore the authenticated session
  useEffect(() => {
    let cancelled = false;

    const bootstrap = async () => {
      try {
        const backendAssets = await fetchAssetsFromBackend();

        if (!cancelled) {
          setAssets(backendAssets);
        }
      } catch (error) {
        console.error('Could not load backend assets:', error);
      }

      try {
        const profile = await getUserProfile();

        if (!cancelled) {
          applyBackendProfile(profile);
        }
      } catch (error) {
        if (error instanceof ApiError && error.status === 401) {
          return;
        }

        console.error('Could not restore session:', error);
      }
    };

    void bootstrap();

    return () => {
      cancelled = true;
    };
  }, []);

  // Optional browser-only price animation for local demo builds.
  useEffect(() => {
    if (import.meta.env.VITE_DEMO_PRICE_SIMULATION !== 'true') return;

    const interval = setInterval(() => {
      setAssets(prevAssets =>
        prevAssets.map(asset => {
          const pct = (Math.random() * 0.6 - 0.3) / 100;
          return {
            ...asset,
            price: Math.max(0.0001, Number((asset.price * (1 + pct)).toFixed(4)))
          };
        })
      );
    }, 4000);

    return () => clearInterval(interval);
  }, []);

  // Helper for triggering alert notifications
  const triggerAlert = (type: 'success' | 'error', text: string) => {
    setAlertMessage({ type, text });
  };

  // Auth Functions
  const handleAuthSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  setAuthError("");
  setIsAuthLoading(true);

  try {
    const email = authUsername.trim().toLowerCase();

    const profile =
      authMode === "signIn"
        ? await loginUser(email, authPassword)
        : await registerUser(authName.trim(), email, authPassword);

    applyBackendProfile(profile);
    setCurrentTab("portfolio");
    setIsAuthModalOpen(false);
    triggerAlert("success", `Welcome, ${profile.name}`);
  } catch (error) {
    setAuthError(
      error instanceof ApiError
        ? error.message
        : "Could not connect to the server."
    );
  } finally {
    setIsAuthLoading(false);
  }
};


  const handleLogout = async () => {
  try {
    await logoutUser();
    setIsLoggedIn(false);
    setCurrentUser({ username: '', email: '', usdtBalance: 0, role: 'USER', isActive: true });
    setMyPortfolio([]);
    setPurchaseLots([]);
    setTransactions([]);
    setActivities([]);
    setIsDropdownOpen(false);
    setCurrentTab('market');
    triggerAlert('success', lang === 'fa' ? 'با موفقیت از حساب خارج شدید.' : 'Logged out successfully.');
  } catch (error) {
    triggerAlert(
      'error',
      error instanceof ApiError ? error.message : 'Could not log out.'
    );
  }
};

  // Buy Order Exec
  const handleBuySubmit = async (e: React.FormEvent) => {
  e.preventDefault();

  if (!selectedAsset) return;
    if (selectedAsset.price <= 0) {
      alert(
        lang === "fa"
          ? "\u0645\u0639\u0627\u0645\u0644\u0647 \u0641\u0639\u0644\u0627\u064b \u063a\u06cc\u0631\u0641\u0639\u0627\u0644 \u0627\u0633\u062a \u062a\u0627 \u0642\u06cc\u0645\u062a \u0645\u0639\u062a\u0628\u0631 USDT \u062f\u0631 \u0628\u06a9\u200c\u0627\u0646\u062f \u062f\u0631 \u062f\u0633\u062a\u0631\u0633 \u0628\u0627\u0634\u062f."
          : "Trading is temporarily unavailable until a valid market conversion price is available."
      );
      return;
    }

  if (!isLoggedIn) {
    triggerAlert(
      'error',
      lang === 'fa' ? 'ابتدا وارد حساب شوید.' : 'Please sign in first!'
    );
    return;
  }

  const investAmount = Number.parseFloat(buyAmount);

  if (!Number.isFinite(investAmount) || investAmount <= 0) {
    triggerAlert('error', t.enterAmount);
    return;
  }

  const purchasedShares = Math.floor(investAmount / selectedAsset.price);
  const grossUsdt = purchasedShares * selectedAsset.price;
  const feeUsdt = grossUsdt * 0.035;
  const totalUsdt = grossUsdt + feeUsdt;

  if (purchasedShares < 1) {
    triggerAlert(
      'error',
      lang === 'fa'
        ? 'مبلغ سرمایه‌گذاری برای خرید یک سهم کافی نیست.'
        : 'The investment amount is too low to buy one share.'
    );
    return;
  }

  if (totalUsdt > currentUser.usdtBalance + 1e-9) {
    triggerAlert('error', t.insufficientBalance);
    return;
  }

  try {
    const profile = await executeBuyOrder(selectedAsset.id, purchasedShares);
    applyBackendProfile(profile);
    setIsBuyModalOpen(false);
    setBuyAmount('');
    triggerAlert('success', t.orderExecuted);
  } catch (error) {
    triggerAlert(
      'error',
      error instanceof ApiError
        ? error.message
        : 'Could not execute the buy order.'
    );
  }
};


  // Single buy flow: all purchases execute through the backend market-order endpoint.
  const handleModalSubmit = async (e: React.FormEvent) => {
    await handleBuySubmit(e);
  };

  const handleSellSubmit = async (e: React.FormEvent) => {
  e.preventDefault();

  if (!selectedAsset) return;
    if (selectedAsset.price <= 0) {
      alert(
        lang === "fa"
          ? "\u0645\u0639\u0627\u0645\u0644\u0647 \u0641\u0639\u0644\u0627\u064b \u063a\u06cc\u0631\u0641\u0639\u0627\u0644 \u0627\u0633\u062a \u062a\u0627 \u0642\u06cc\u0645\u062a \u0645\u0639\u062a\u0628\u0631 USDT \u062f\u0631 \u0628\u06a9\u200c\u0627\u0646\u062f \u062f\u0631 \u062f\u0633\u062a\u0631\u0633 \u0628\u0627\u0634\u062f."
          : "Trading is temporarily unavailable until a valid market conversion price is available."
      );
      return;
    }

  if (!isLoggedIn) {
    triggerAlert(
      'error',
      lang === 'fa' ? 'ابتدا وارد حساب شوید.' : 'Please sign in first!'
    );
    return;
  }

  const sharesToSell = Number.parseInt(sellShares, 10);
  const ownedItem = myPortfolio.find(item => item.assetId === selectedAsset.id);
  const ownedShares = ownedItem?.shares ?? 0;

  if (!Number.isFinite(sharesToSell) || sharesToSell <= 0) {
    triggerAlert('error', t.enterAmount);
    return;
  }

  if (sharesToSell > ownedShares) {
    triggerAlert('error', t.insufficientShares);
    return;
  }

  try {
    const profile = await executeSellOrder(selectedAsset.id, sharesToSell);
    applyBackendProfile(profile);
    setIsSellModalOpen(false);
    setSellShares('');
    triggerAlert('success', t.orderExecuted);
  } catch (error) {
    triggerAlert(
      'error',
      error instanceof ApiError
        ? error.message
        : 'Could not execute the sell order.'
   );
  }
};


  // Validation for TxID Hash pattern based on network
  const validateTxid = (txid: string, network: 'trc20' | 'erc20' | 'bep20') => {
    const clean = txid.trim();
    if (!clean) {
      return {
        valid: false,
        msg: lang === 'fa' ? 'لطفاً کد هش تراکنش (TxID) را وارد کنید!' : 'Please enter the transaction hash (TxID)!'
      };
    }

    if (network === 'trc20') {
      // TRC20 (TRON) TxID is 64 hexadecimal characters (optionally 0x prefix accepted)
      const trc20Regex = /^(0x)?[0-9a-fA-F]{64}$/;
      if (!trc20Regex.test(clean)) {
        return {
          valid: false,
          msg: lang === 'fa'
            ? 'فرمت هش تراکنش روی شبکه TRC20 (ترون) نامعتبر است. کد هش باید ۶۴ کاراکتر هگزادسیپمال باشد.'
            : 'Invalid TRC20 transaction hash. TRON TxID must be a 64-character hexadecimal string.'
        };
      }
    } else if (network === 'erc20') {
      // ERC20 (Ethereum) TxID starts with 0x followed by 64 hex characters (or 64 hex characters)
      const erc20Regex = /^(0x)?[0-9a-fA-F]{64}$/;
      if (!erc20Regex.test(clean)) {
        return {
          valid: false,
          msg: lang === 'fa'
            ? 'فرمت هش تراکنش روی شبکه ERC20 (اتریوم) نامعتبر است. کد هش باید با 0x شروع شده و ۶۴ کاراکتر هگزادسیپمال داشته باشد.'
            : 'Invalid ERC20 transaction hash. Ethereum TxID must start with 0x followed by 64 hex characters.'
        };
      }
    } else if (network === 'bep20') {
      // BEP20 (BSC) TxID starts with 0x followed by 64 hex characters (or 64 hex characters)
      const bep20Regex = /^(0x)?[0-9a-fA-F]{64}$/;
      if (!bep20Regex.test(clean)) {
        return {
          valid: false,
          msg: lang === 'fa'
            ? 'فرمت هش تراکنش روی شبکه BEP20 (بایننس اسمارت چین) نامعتبر است. کد هش باید با 0x شروع شده و ۶۴ کاراکتر هگزادسیپمال داشته باشد.'
            : 'Invalid BEP20 transaction hash. BSC TxID must start with 0x followed by 64 hex characters.'
        };
      }
    }

    return { valid: true, msg: '' };
  };

  // Validation for Destination Wallet Address based on network
  const validateWithdrawAddress = (address: string, network: 'trc20' | 'erc20' | 'bep20') => {
    const clean = address.trim();
    if (!clean) {
      return {
        valid: false,
        msg: lang === 'fa' ? 'لطفاً آدرس کیف پول مقصد را وارد کنید!' : 'Please enter destination wallet address!'
      };
    }

    if (network === 'trc20') {
      // TRON address starts with 'T' and is 34 characters (base58)
      const tronRegex = /^T[a-zA-HJ-NP-Z1-9]{33}$/;
      if (!tronRegex.test(clean)) {
        return {
          valid: false,
          msg: lang === 'fa'
            ? 'آدرس مقصد با الگوی شبکه TRC20 مطابقت ندارد. آدرس ترون باید با حرف T شروع شده و ۳۴ کاراکتر باشد.'
            : 'Invalid TRC20 address. TRON wallet addresses must start with "T" and be 34 characters long.'
        };
      }
    } else if (network === 'erc20' || network === 'bep20') {
      // EVM address starts with 0x followed by 40 hex characters
      const evmRegex = /^0x[0-9a-fA-F]{40}$/;
      if (!evmRegex.test(clean)) {
        const netLabel = network === 'erc20' ? 'ERC20 (اتریوم)' : 'BEP20 (بایننس اسمارت چین)';
        const netLabelEn = network === 'erc20' ? 'ERC20' : 'BEP20';
        return {
          valid: false,
          msg: lang === 'fa'
            ? `آدرس مقصد با الگوی شبکه ${netLabel} مطابقت ندارد. آدرس باید با 0x شروع شده و ۴۲ کاراکتر باشد.`
            : `Invalid ${netLabelEn} address. EVM wallet addresses must start with "0x" and be 42 characters long.`
        };
      }
    }

    return { valid: true, msg: '' };
  };

  // Submit Deposit Hash
  const handleDepositSubmit = (e: React.FormEvent) => {
  e.preventDefault();
  setTxidError('');
  triggerAlert(
    'error',
    lang === 'fa'
      ? 'واریز رمزارز در نسخه فعلی غیرفعال است.'
      : 'Crypto deposits are disabled in this version.'
  );
};

const handleWithdrawSubmit = (e: React.FormEvent) => {
  e.preventDefault();
  setWithdrawAddrError('');
  triggerAlert(
    'error',
    lang === 'fa'
      ? 'برداشت رمزارز در نسخه فعلی غیرفعال است.'
      : 'Crypto withdrawals are disabled in this version.'
  );
};


  // Support messages are handled through the official RWA support mailbox.
  const handleSupportSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const message = supportText.trim();
    if (!message) return;

    const formData = new FormData(e.currentTarget as HTMLFormElement);
    const rawSubject = String(formData.get('subject') ?? '').trim();
    const subject = encodeURIComponent(rawSubject || 'RWA Support Request');
    const body = encodeURIComponent(message);
    window.location.href = `mailto:support.rwa.stocks@gmail.com?subject=${subject}&body=${body}`;
    triggerAlert('success', 'Opening your email app for RWA Support.');
    setSupportText('');
  };

  // Calculations for active modals
  // Calculations for active modals
  const activeOwnedItem = selectedAsset ? myPortfolio.find(p => p.assetId === selectedAsset.id) : null;
  const activeMaxShares = activeOwnedItem ? activeOwnedItem.shares : 0;

  // Live total balance calculation: Free USDT + Value of all owned shares
  const totalSharesValue = myPortfolio.reduce((acc, curr) => {
    const asset = assets.find(a => a.id === curr.assetId);
    return acc + (asset ? asset.price * curr.shares : 0);
  }, 0);
  const totalBalanceCalculated = currentUser.usdtBalance + totalSharesValue;

  // Live PnL calculation based on current prices and original average prices
  const totalPnLCalculated = myPortfolio.reduce((acc, curr) => {
    const asset = assets.find(a => a.id === curr.assetId);
    return acc + (asset ? (asset.price - curr.avgPrice) * curr.shares : 0);
  }, 0);
  const totalPnLPctCalculated = totalPnLCalculated !== 0 ? (totalPnLCalculated / (totalBalanceCalculated - totalPnLCalculated)) * 100 : 0;

  // Filter & Search logic for marketplace
  const filteredAssets = assets.filter(asset => {
    const matchesCategory = marketFilter === 'all' || asset.category === marketFilter;
    const searchString = searchQuery.trim().toLowerCase();
    const matchesSearch = !searchString ||
      asset.id.toLowerCase().includes(searchString) ||
      asset.enName.toLowerCase().includes(searchString) ||
      asset.faName.includes(searchString);
    return matchesCategory && matchesSearch;
  });

  return (
    <div className={`min-h-screen relative overflow-x-hidden transition-colors duration-300 ${
      theme === 'dark' ? 'bg-[#020617] text-slate-100' : 'bg-slate-50 text-slate-900'
    }`} dir="ltr">
      <div className="site-atmosphere" aria-hidden="true">
        <div className="site-atmosphere__grid" />
        <div className="site-atmosphere__orb site-atmosphere__orb--a" />
        <div className="site-atmosphere__orb site-atmosphere__orb--b" />
        <div className="site-atmosphere__orb site-atmosphere__orb--c" />
        <div className="site-atmosphere__sheen" />
      </div>

      <div className="relative z-10 min-h-screen flex flex-col justify-between">

      {/* Alert Banner / Notification Feed */}
      {alertMessage && (
        <div className={`fixed bottom-6 right-6 left-6 md:left-auto md:w-96 z-[80] p-4 rounded-xl shadow-2xl flex items-center gap-3 animate-bounce border ${
          alertMessage.type === 'success'
            ? 'bg-emerald-950/90 text-emerald-200 border-emerald-500/50'
            : 'bg-rose-950/90 text-rose-200 border-rose-500/50'
        } backdrop-blur-md`}>
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
            alertMessage.type === 'success' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'
          }`}>
            {alertMessage.type === 'success' ? <CheckCircle size={20} /> : <Info size={20} />}
          </div>
          <div className="flex-1 text-sm font-medium">
            {alertMessage.text}
          </div>
          <button onClick={() => setAlertMessage(null)} className="text-slate-400 hover:text-white">
            <X size={16} />
          </button>
        </div>
      )}

      {/* Header / Navbar */}
      <nav className={`sticky top-0 z-40 px-4 md:px-8 h-16 flex items-center justify-between border-b transition-colors duration-300 ${
        theme === 'dark' ? 'border-slate-800/80 bg-slate-950/80' : 'border-slate-200 bg-white/90'
      } backdrop-blur-md`}>
        <div className="flex items-center gap-4 md:gap-8">
          {/* Mobile Menu Toggle (on the far left for mobile screens) */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className={`p-2 rounded-xl border lg:hidden cursor-pointer z-50 ${
              theme === 'dark' ? 'border-slate-800 bg-slate-900 text-slate-200' : 'border-slate-200 bg-slate-100 text-slate-700'
            }`}
          >
            {isMobileMenuOpen ? <X size={18} /> : <Menu size={18} />}
          </button>

          {/* Logo */}
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => setCurrentTab(isLoggedIn ? 'portfolio' : 'home')}>
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center font-bold text-white shadow-lg shadow-blue-500/30">
              <Coins size={18} />
            </div>
            <span className={`text-xl font-extrabold tracking-tight ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
              {t.appName}
            </span>
          </div>

          {/* Desktop Nav Tabs */}
          <div className="hidden lg:flex items-center gap-6 text-sm font-semibold">
            {!isLoggedIn && (
              <button
                onClick={() => setCurrentTab('home')}
                className={`pb-1 border-b-2 transition-all cursor-pointer ${
                  currentTab === 'home'
                    ? 'border-blue-500 text-blue-500 font-extrabold'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                {t.home}
              </button>
            )}
            <button
              onClick={() => setCurrentTab('market')}
              className={`pb-1 border-b-2 transition-all cursor-pointer ${
                currentTab === 'market'
                  ? 'border-blue-500 text-blue-500 font-extrabold'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              {t.assetsMarket}
            </button>

            {isLoggedIn && (
              <>
                <button
                  onClick={() => setCurrentTab('portfolio')}
                  className={`pb-1 border-b-2 transition-all cursor-pointer ${
                    currentTab === 'portfolio'
                      ? 'border-blue-500 text-blue-500 font-extrabold'
                      : 'border-transparent text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {t.portfolio}
                </button>
                <button
                  onClick={() => setCurrentTab('wallet')}
                  className={`pb-1 border-b-2 transition-all cursor-pointer ${
                    currentTab === 'wallet'
                      ? 'border-blue-500 text-blue-500 font-extrabold'
                      : 'border-transparent text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {t.wallet}
                </button>
                <button
                  onClick={() => setCurrentTab('history')}
                  className={`pb-1 border-b-2 transition-all cursor-pointer ${
                    currentTab === 'history'
                      ? 'border-blue-500 text-blue-500 font-extrabold'
                      : 'border-transparent text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {t.history}
                </button>
              </>
            )}

            {isLoggedIn && isAdmin && (
              <button
                onClick={() => setCurrentTab('admin')}
                className={`pb-1 border-b-2 transition-all cursor-pointer ${
                  currentTab === 'admin'
                    ? 'border-blue-500 text-blue-500 font-extrabold'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                Admin
              </button>
            )}

            <button
              onClick={() => setCurrentTab('about')}
              className={`pb-1 border-b-2 transition-all cursor-pointer ${
                currentTab === 'about'
                  ? 'border-blue-500 text-blue-500 font-extrabold'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              {t.aboutUs}
            </button>
            <button
              onClick={() => setCurrentTab('contact')}
              className={`pb-1 border-b-2 transition-all cursor-pointer ${
                currentTab === 'contact'
                  ? 'border-blue-500 text-blue-500 font-extrabold'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              {t.contactUs}
            </button>
          </div>
        </div>

        {/* Right Controls */}
        <div className="flex items-center gap-2 md:gap-3" dir="ltr">

          {/* Theme Switch (Hidden on mobile, accessible in drawer) */}
          <button
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className={`hidden lg:flex h-10 w-10 items-center justify-center rounded-xl border hover:opacity-80 transition-all cursor-pointer ${
              theme === 'dark' ? 'border-slate-800 bg-slate-900 text-slate-200' : 'border-slate-200 bg-slate-100 text-slate-700'
            }`}
            title={theme === 'dark' ? t.lightMode : t.darkMode}
          >
            {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
          </button>

          {/* User Section / Login / Wallet Trigger */}
          {/* User Section / Login / Wallet Trigger */}
          {isLoggedIn ? (
            <div className="relative">
              <button
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className={`h-10 flex items-center justify-center gap-2 px-4 text-xs font-black rounded-xl border hover:opacity-90 transition-all cursor-pointer ${
                  theme === 'dark' ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-slate-100 border-slate-200 text-slate-800'
                }`}
              >
                <div className="w-5 h-5 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs">
                  <User size={12} />
                </div>
                <span className="max-w-[80px] truncate">{currentUser.username}</span>
                <span className="text-[10px] opacity-60">▾</span>
              </button>

              {/* User Dropdown */}
              {isDropdownOpen && (
                <div className={`absolute right-0 mt-2 w-56 rounded-2xl border shadow-2xl z-50 overflow-hidden ${
                  theme === 'dark' ? 'bg-slate-900 border-slate-800 text-slate-200' : 'bg-white border-slate-200 text-slate-800'
                }`}>
                  <div className={`p-4 border-b ${theme === 'dark' ? 'border-slate-800' : 'border-slate-100'}`}>
                    <p className="text-xs opacity-60 truncate">{currentUser.email}</p>
                    <p className="text-sm font-bold mt-1 text-blue-500">
                      {currentUser.usdtBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USDT
                    </p>
                  </div>
                  <div className="p-2 space-y-1">
                    <button
                      onClick={() => { setCurrentTab('portfolio'); setIsDropdownOpen(false); }}
                      className={`w-full text-start px-3 py-2.5 text-xs font-semibold rounded-xl transition-all hover:bg-blue-600/10 hover:text-blue-500 ${
                        currentTab === 'portfolio' ? 'bg-blue-600/10 text-blue-500' : ''
                      }`}
                    >
                      {t.myPortfolio}
                    </button>
                    <button
                      onClick={() => { setCurrentTab('wallet'); setIsDropdownOpen(false); }}
                      className={`w-full text-start px-3 py-2.5 text-xs font-semibold rounded-xl transition-all hover:bg-blue-600/10 hover:text-blue-500 ${
                        currentTab === 'wallet' ? 'bg-blue-600/10 text-blue-500' : ''
                      }`}
                    >
                      {t.depositUsdt} / {t.withdrawUsdt}
                    </button>
                    <button
                      onClick={() => { setCurrentTab('history'); setIsDropdownOpen(false); }}
                      className={`w-full text-start px-3 py-2.5 text-xs font-semibold rounded-xl transition-all hover:bg-blue-600/10 hover:text-blue-500 ${
                        currentTab === 'history' ? 'bg-blue-600/10 text-blue-500' : ''
                      }`}
                    >
                      {t.transactionHistory}
                    </button>
                    <button
                      onClick={() => { setCurrentTab('support'); setIsDropdownOpen(false); }}
                      className={`w-full text-start px-3 py-2.5 text-xs font-semibold rounded-xl transition-all hover:bg-blue-600/10 hover:text-blue-500 ${
                        currentTab === 'support' ? 'bg-blue-600/10 text-blue-500' : ''
                      }`}
                    >
                      {t.supportCenter}
                    </button>
                    <button
                      onClick={handleLogout}
                      className="w-full text-start px-3 py-2.5 text-xs font-bold text-rose-500 rounded-xl hover:bg-rose-500/10 transition-all"
                    >
                      {t.signOut}
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="hidden sm:flex items-center gap-2">
              <button
                onClick={() => { setAuthMode('signIn'); setIsAuthModalOpen(true); }}
                className={`h-10 px-5 rounded-xl text-xs font-black transition-all border flex items-center justify-center cursor-pointer ${
                  theme === 'dark'
                    ? 'border-slate-800 bg-slate-900/60 text-slate-300 hover:bg-slate-800'
                    : 'border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100'
                }`}
              >
                {t.signIn}
              </button>
              <button
                onClick={() => { setAuthMode('signUp'); setIsAuthModalOpen(true); }}
                className="h-10 px-5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-black transition-all shadow-lg shadow-blue-500/10 flex items-center justify-center cursor-pointer"
              >
                {t.signUp}
              </button>
            </div>
          )}
        </div>
      </nav>

      {/* Mobile Drawer */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <>
            {/* Backdrop Overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMobileMenuOpen(false)}
              className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-50 lg:hidden"
            />

            {/* Sliding Drawer Panel */}
            <motion.div
              initial={{ x: lang === 'fa' ? '100%' : '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: lang === 'fa' ? '100%' : '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 220 }}
              className={`fixed top-0 bottom-0 ${
                lang === 'fa' ? 'right-0' : 'left-0'
              } w-full max-w-[320px] z-50 lg:hidden shadow-2xl flex flex-col justify-between transition-colors duration-300 ${
                theme === 'dark'
                  ? 'bg-slate-950 border-slate-900 text-slate-100'
                  : 'bg-white border-slate-200 text-slate-800'
              }`}
              dir={lang === 'fa' ? 'rtl' : 'ltr'}
            >
              <div className="flex flex-col flex-1 overflow-y-auto">
                {/* Header inside drawer */}
                <div className={`p-5 flex items-center justify-between border-b ${
                  theme === 'dark' ? 'border-slate-900/60' : 'border-slate-100'
                }`}>
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center font-bold text-white shadow-lg">
                      <Coins size={16} />
                    </div>
                    <span className="font-extrabold text-base tracking-tight">{t.appName}</span>
                  </div>
                  <button
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={`p-2 rounded-xl border cursor-pointer ${
                      theme === 'dark' ? 'border-slate-800 bg-slate-900' : 'border-slate-200 bg-slate-100'
                    }`}
                  >
                    <X size={16} />
                  </button>
                </div>

                {/* Profile / Auth section in drawer */}
                <div className={`p-5 ${
                  theme === 'dark' ? 'bg-slate-900/40 border-b border-slate-900/60' : 'bg-slate-50 border-b border-slate-100'
                }`}>
                  {isLoggedIn ? (
                    <div className="space-y-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold shadow-md shadow-blue-500/20">
                          <User size={18} />
                        </div>
                        <div className="min-w-0 flex-1">
                          <h4 className="font-bold text-sm truncate">{currentUser.username}</h4>
                          <p className="text-[10px] text-slate-400 truncate mt-0.5">{currentUser.email}</p>
                        </div>
                      </div>

                      <div className={`p-3 rounded-2xl border ${
                        theme === 'dark' ? 'bg-slate-950 border-slate-800' : 'bg-white border-slate-200'
                      }`}>
                        <span className="text-[10px] text-slate-400 block font-semibold">{t.wallet}</span>
                        <div className="flex items-center justify-between mt-1">
                          <span className="text-sm font-extrabold text-blue-500">
                            {currentUser.usdtBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USDT
                          </span>
                          <button
                            onClick={() => { setCurrentTab('wallet'); setIsMobileMenuOpen(false); }}
                            className="text-[10px] bg-blue-600 hover:bg-blue-500 text-white font-extrabold px-2 py-1 rounded-lg transition-all"
                          >
                            {lang === 'fa' ? 'واریز' : 'Deposit'}
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <p className="text-xs text-slate-400 font-bold leading-relaxed">
                        {lang === 'fa' ? 'به پلتفرم RWA خوش آمدید! برای شروع معامله و دسترسی به کیف پول خود وارد شوید.' : 'Welcome to RWA! Log in to access your account and selected Iranian shares.'}
                      </p>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          onClick={() => { setAuthMode('signIn'); setIsAuthModalOpen(true); setIsMobileMenuOpen(false); }}
                          className={`py-2.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                            theme === 'dark'
                              ? 'border-slate-800 bg-slate-900 text-slate-200'
                              : 'border-slate-200 bg-white text-slate-700'
                          }`}
                        >
                          {t.signIn}
                        </button>
                        <button
                          onClick={() => { setAuthMode('signUp'); setIsAuthModalOpen(true); setIsMobileMenuOpen(false); }}
                          className="py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-blue-500/10 cursor-pointer"
                        >
                          {t.signUp}
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Main Navigation Links */}
                <div className="p-4 space-y-1">
                  {[
                    ...(!isLoggedIn ? [{ tab: 'home', label: t.home, icon: <Coins size={16} /> }] : []),
                    { tab: 'market', label: t.assetsMarket, icon: <TrendingUp size={16} /> },
                    ...(isLoggedIn ? [
                      { tab: 'portfolio', label: t.portfolio, icon: <ShieldCheck size={16} /> },
                      { tab: 'wallet', label: t.wallet, icon: <Wallet size={16} /> },
                      { tab: 'history', label: t.history, icon: <History size={16} /> },
                      ...(isAdmin ? [{ tab: 'admin', label: 'Admin', icon: <LayoutDashboard size={16} /> }] : []),
                    ] : []),
                    { tab: 'about', label: t.aboutUs, icon: <Info size={16} /> },
                    { tab: 'contact', label: t.contactUs, icon: <MessageSquare size={16} /> },
                  ].map(item => {
                    const isActive = currentTab === item.tab;
                    return (
                      <button
                        key={item.tab}
                        onClick={() => { setCurrentTab(item.tab as any); setIsMobileMenuOpen(false); }}
                        className={`w-full flex items-center gap-3.5 px-4 py-3 rounded-2xl text-xs font-bold transition-all border cursor-pointer ${
                          isActive
                            ? 'bg-blue-600/10 border-blue-500/30 text-blue-500'
                            : theme === 'dark'
                              ? 'bg-transparent border-transparent text-slate-300 hover:bg-slate-900'
                              : 'bg-transparent border-transparent text-slate-600 hover:bg-slate-100'
                        }`}
                      >
                        <span className={isActive ? 'text-blue-500' : 'text-slate-400'}>{item.icon}</span>
                        <span>{item.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Bottom bar inside drawer */}
              <div className={`p-4 border-t space-y-4 ${
                theme === 'dark' ? 'border-slate-900 bg-slate-950' : 'border-slate-100 bg-slate-50'
              }`}>
                {/* Theme */}
                <button
                  onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                  className={`w-full flex items-center justify-center gap-2 py-2 text-xs font-bold rounded-xl border transition-all cursor-pointer ${
                    theme === 'dark' ? 'border-slate-800 bg-slate-900 text-slate-200' : 'border-slate-200 bg-white text-slate-700'
                  }`}
                >
                  {theme === 'dark' ? <Sun size={14} /> : <Moon size={14} />}
                  <span>{theme === 'dark' ? t.lightMode : t.darkMode}</span>
                </button>

                {isLoggedIn && (
                  <button
                    onClick={() => { handleLogout(); setIsMobileMenuOpen(false); }}
                    className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-rose-500/15 bg-rose-500/10 text-rose-500 font-bold text-xs hover:bg-rose-500/20 transition-all cursor-pointer"
                  >
                    <LogOut size={14} />
                    <span>{t.signOut}</span>
                  </button>
                )}

                <div className="flex justify-between items-center px-1 text-[10px] font-bold text-slate-400">
                  <span>{t.statusConnected}</span>
                  <span className="flex items-center gap-1.5">
                    <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
                    <span className="text-[10px] text-emerald-500">{lang === 'fa' ? 'برخط' : 'Live'}</span>
                  </span>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* YieldChart and Top Stats Banner Conditional Swap */}
      {currentTab !== 'home' && currentTab === 'market' && (
        <div className="w-full">
          {/* 1. Marketplace Header & Search with glassmorphism and ambient glow in full-width at the very top of the page */}
          <div className="max-w-7xl mx-auto px-4 md:px-8 pt-6">
            <div
              className={`flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 rounded-3xl border transition-all duration-300 relative overflow-hidden backdrop-blur-md shadow-sm ${
                theme === 'dark'
                  ? 'bg-slate-900/40 border-slate-800/80 hover:border-slate-700/80'
                  : 'bg-white border-slate-200 hover:border-slate-300'
              }`}
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-full blur-2xl pointer-events-none"></div>
              <div className="relative z-10">
                <h1 className="text-xl font-extrabold tracking-tight">{t.topInvestment}</h1>
                <p className="text-slate-400 text-xs mt-1">{t.tagline}</p>
              </div>

              {/* Premium, Interactive Search Bar */}
              <div className="relative w-full md:w-80 group z-10" dir={lang === 'fa' ? 'rtl' : 'ltr'}>
                <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl opacity-0 group-focus-within:opacity-20 blur-md transition-all duration-300 pointer-events-none"></div>
                <div className={`relative flex items-center h-11 rounded-xl border px-3 transition-all duration-300 ${
                  theme === 'dark'
                    ? 'bg-slate-950/80 border-slate-800 group-focus-within:border-blue-500'
                    : 'bg-white border-slate-200 group-focus-within:border-blue-500 shadow-sm'
                }`}>
                  <Search className="text-slate-400 transition-colors group-focus-within:text-blue-500 flex-shrink-0" size={18} />
                  <input
                    type="text"
                    placeholder={lang === 'fa' ? 'جستجوی هوشمند دارایی...' : 'Smart search assets...'}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className={`w-full bg-transparent border-none outline-none py-2 px-3 text-sm focus:ring-0 focus:outline-none placeholder-slate-400/80 ${
                      theme === 'dark' ? 'text-white' : 'text-slate-900'
                    }`}
                  />
                  {searchQuery ? (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="p-1 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-500/10 transition-all cursor-pointer"
                    >
                      <X size={16} />
                    </button>
                  ) : (
                    <div className={`hidden sm:flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-mono border ${
                      theme === 'dark' ? 'bg-slate-900 border-slate-800 text-slate-400' : 'bg-slate-100 border-slate-200 text-slate-500'
                    }`}>
                      <span>Ctrl</span>
                      <span>+</span>
                      <span>K</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* 2. YieldChart Price Graph directly below the search header */}
          <div className="max-w-7xl mx-auto px-4 md:px-8 pt-6">
            <YieldChart theme={theme} lang={lang} assets={assets} />
          </div>

          {/* 3. Top Stats Banner directly below the YieldChart */}
          <div className={`px-4 md:px-8 py-6 border-b border-t transition-colors duration-300 mt-6 ${
            theme === 'dark' ? 'bg-slate-950/40 border-slate-900' : 'bg-slate-100 border-slate-200'
          }`}>
            <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className={`p-5 rounded-2xl border shadow-sm transition-all hover:scale-[1.01] ${
                theme === 'dark' ? 'bg-slate-900/60 border-slate-800/80' : 'bg-white border-slate-200'
              }`}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-slate-400 text-xs font-semibold">{lang === 'fa' ? '\u0627\u0631\u0632\u0634 \u062a\u0623\u0645\u06cc\u0646' : 'Funded Value'}</span>
                  <TrendingUp size={16} className="text-emerald-500" />
                </div>
                <p className={`text-2xl md:text-3xl font-extrabold ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                  {platformFundedUsdt.toLocaleString(undefined, { maximumFractionDigits: 2 })} USDT
                </p>
                <span className="text-emerald-500 text-xs font-bold mt-1 inline-block">
                  {lang === 'fa' ? 'بر اساس Supply تأمین‌شده' : 'Based on funded supply'}
                </span>
              </div>

              <div className={`p-5 rounded-2xl border shadow-sm transition-all hover:scale-[1.01] ${
                theme === 'dark' ? 'bg-slate-900/60 border-slate-800/80' : 'bg-white border-slate-200'
              }`}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-slate-400 text-xs font-semibold">{lang === 'fa' ? '\u0646\u0645\u0627\u062f\u0647\u0627\u06cc \u062a\u0623\u0645\u06cc\u0646\u200c\u0634\u062f\u0647' : 'Funded Symbols'}</span>
                  <Percent size={16} className="text-blue-500" />
                </div>
                <p className={`text-2xl md:text-3xl font-extrabold ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                  {platformFundedAssets.length}
                </p>
                <span className="text-blue-500 text-xs font-bold mt-1 inline-block italic">
              {lang === 'fa' ? '\u0646\u0645\u0627\u062f \u062a\u0623\u0645\u06cc\u0646\u200c\u0634\u062f\u0647' : 'funded symbols'}
                </span>
              </div>

              <div className={`p-5 rounded-2xl border shadow-sm transition-all hover:scale-[1.01] ${
                theme === 'dark' ? 'bg-slate-900/60 border-slate-800/80' : 'bg-white border-slate-200'
              }`}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-slate-400 text-xs font-semibold">{lang === 'fa' ? '\u0645\u062c\u0645\u0648\u0639 \u0633\u0647\u0627\u0645 \u062a\u0623\u0645\u06cc\u0646\u200c\u0634\u062f\u0647' : 'Total Funded Shares'}</span>
                  <ShieldCheck size={16} className="text-purple-500" />
                </div>
                <p className={`text-2xl md:text-3xl font-extrabold ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
              {platformFundedShares.toLocaleString()} <span className="text-sm font-normal text-slate-500">{lang === 'fa' ? '\u0633\u0647\u0645' : 'shares'}</span>
                </p>
                <span className="text-purple-500 text-xs font-bold mt-1 inline-block">
              {lang === 'fa' ? '\u0628\u0631\u0627\u0633\u0627\u0633 \u0645\u0648\u062c\u0648\u062f\u06cc \u062a\u0623\u0645\u06cc\u0646\u200c\u0634\u062f\u0647' : 'Across 5 funded symbols'}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Standard Top Stats Banner for other tabs (not home, market, portfolio, wallet, or history) */}
      {currentTab !== 'home' && currentTab !== 'market' && currentTab !== 'portfolio' && currentTab !== 'wallet' && currentTab !== 'history' && currentTab !== 'about' && currentTab !== 'contact' && currentTab !== 'admin' && (
        <div className={`px-4 md:px-8 py-6 border-b transition-colors duration-300 ${
          theme === 'dark' ? 'bg-slate-950/40 border-slate-900' : 'bg-slate-100 border-slate-200'
        }`}>
          <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className={`p-5 rounded-2xl border shadow-sm transition-all hover:scale-[1.01] ${
              theme === 'dark' ? 'bg-slate-900/60 border-slate-800/80' : 'bg-white border-slate-200'
            }`}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-slate-400 text-xs font-semibold">{lang === 'fa' ? '\u0627\u0631\u0632\u0634 \u062a\u0623\u0645\u06cc\u0646' : 'Funded Value'}</span>
                <TrendingUp size={16} className="text-emerald-500" />
              </div>
              <p className={`text-2xl md:text-3xl font-extrabold ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                {platformFundedUsdt.toLocaleString(undefined, { maximumFractionDigits: 2 })} USDT
              </p>
              <span className="text-emerald-500 text-xs font-bold mt-1 inline-block">
                {lang === 'fa' ? 'بر اساس Supply تأمین‌شده' : 'Based on funded supply'}
              </span>
            </div>

            <div className={`p-5 rounded-2xl border shadow-sm transition-all hover:scale-[1.01] ${
              theme === 'dark' ? 'bg-slate-900/60 border-slate-800/80' : 'bg-white border-slate-200'
            }`}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-slate-400 text-xs font-semibold">{lang === 'fa' ? '\u0646\u0645\u0627\u062f\u0647\u0627\u06cc \u062a\u0623\u0645\u06cc\u0646\u200c\u0634\u062f\u0647' : 'Funded Symbols'}</span>
                <Percent size={16} className="text-blue-500" />
              </div>
              <p className={`text-2xl md:text-3xl font-extrabold ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                {platformFundedAssets.length}
              </p>
              <span className="text-blue-500 text-xs font-bold mt-1 inline-block italic">
              {lang === 'fa' ? '\u0646\u0645\u0627\u062f \u062a\u0623\u0645\u06cc\u0646\u200c\u0634\u062f\u0647' : 'funded symbols'}
              </span>
            </div>

            <div className={`p-5 rounded-2xl border shadow-sm transition-all hover:scale-[1.01] ${
              theme === 'dark' ? 'bg-slate-900/60 border-slate-800/80' : 'bg-white border-slate-200'
            }`}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-slate-400 text-xs font-semibold">{lang === 'fa' ? '\u0645\u062c\u0645\u0648\u0639 \u0633\u0647\u0627\u0645 \u062a\u0623\u0645\u06cc\u0646\u200c\u0634\u062f\u0647' : 'Total Funded Shares'}</span>
                <ShieldCheck size={16} className="text-purple-500" />
              </div>
              <p className={`text-2xl md:text-3xl font-extrabold ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
              {platformFundedShares.toLocaleString()} <span className="text-sm font-normal text-slate-500">{lang === 'fa' ? '\u0633\u0647\u0645' : 'shares'}</span>
              </p>
              <span className="text-purple-500 text-xs font-bold mt-1 inline-block">
              {lang === 'fa' ? '\u0628\u0631\u0627\u0633\u0627\u0633 \u0645\u0648\u062c\u0648\u062f\u06cc \u062a\u0623\u0645\u06cc\u0646\u200c\u0634\u062f\u0647' : 'Across 5 funded symbols'}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Main Content Area - Split into Grid on Large Screens to feel premium */}
      <div className={`${currentTab === 'home' ? 'w-full' : 'max-w-7xl mx-auto px-4 md:px-8'} py-8 w-full flex-1`}>
        {currentTab === 'home' ? (
          <LandingPage
            theme={theme}
            lang={lang}
            t={t}
isLoggedIn={isLoggedIn}
            onLoginClick={() => {
              setAuthMode('signIn');
              setIsAuthModalOpen(true);
            }}
            onQuickBuy={(asset) => {
              setSelectedAsset(asset);
              setBuyAmount('');
              setIsBuyModalOpen(true);
            }}
            assets={assets}
            onOpenInfo={handleOpenAssetInfo}
            onExplore={(category?: string) => {
              setCurrentTab('market');
              if (category) {
                setMarketFilter(category);
              }
            }}
            onSupport={() => {
              if (!isLoggedIn) {
                setIsAuthModalOpen(true);
              } else {
                setCurrentTab('support');
              }
            }}
          />
        ) : (
          <div className="space-y-8">
            {/* YieldChart has been hoisted above the stats banner, so we don't render it here anymore */}

            {/* Primary Views - Full Width Layout */}
            <div className="w-full space-y-8">

              {/* View 1: Marketplace / Asset Listings */}
              {currentTab === 'market' && (
                <section className="space-y-6">

                {/* Filter Tags */}
                <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none">
                  {['all', 'metals', 'auto', 'petro', 'bank', 'real_estate', 'commodities', 'global'].map(cat => (
                    <button
                      key={cat}
                      onClick={() => setMarketFilter(cat)}
                      className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                        marketFilter === cat
                          ? 'bg-blue-600 text-white shadow-md'
                          : theme === 'dark'
                            ? 'bg-slate-900 border border-slate-800 text-slate-300 hover:bg-slate-800'
                            : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      {cat === 'all' && t.allMarkets}
                      {cat === 'metals' && t.categoryMetals}
                      {cat === 'auto' && t.categoryAuto}
                      {cat === 'petro' && t.categoryPetro}
                      {cat === 'bank' && t.categoryBank}
                      {cat === 'real_estate' && t.categoryRealEstate}
                      {cat === 'commodities' && t.categoryCommodities}
                      {cat === 'global' && t.categoryGlobal}
                    </button>
                  ))}
                </div>

                {/* Asset Grid */}
                {filteredAssets.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {filteredAssets.map(asset => (
                      <div
                        key={asset.id}
                        className={`group rounded-3xl overflow-hidden border shadow-sm flex flex-col justify-between transition-all duration-300 hover:scale-[1.02] ${
                          theme === 'dark'
                            ? 'bg-slate-900/60 border-slate-800 hover:border-slate-700 hover:shadow-blue-900/10'
                            : 'bg-white border-slate-200 hover:border-slate-300 hover:shadow-slate-300/40'
                        }`}
                      >
                        {/* Card Cover with Gradient/Flag */}
                        <div className={`p-5 relative overflow-hidden h-36 flex flex-col justify-between ${
                          theme === 'dark' ? 'bg-slate-950/40' : 'bg-slate-100/60'
                        }`}>
                          {/* Ambient glow decoration */}
                          <div className="absolute -top-12 -right-12 w-24 h-24 rounded-full bg-blue-500/10 blur-xl"></div>

                          <div className="flex items-center justify-between z-10">
                            {/* Location Badge */}
                            <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider ${
                              theme === 'dark' ? 'bg-slate-800 text-slate-300' : 'bg-white text-slate-600 border'
                            }`}>
                              <img
                                src={getFlagSrc(asset.flag)}
                                alt=""
                                className="rounded-[2px] shadow-sm"
                                referrerPolicy="no-referrer"
                              />
                              <span>{lang === 'fa' ? asset.locationFa : asset.locationEn}</span>
                            </div>

                            {/* ID badge */}
                            <span className="text-xs font-mono font-bold text-slate-400">
                              #{asset.id}
                            </span>
                          </div>

                          <div className="z-10">
                            <h3 className={`text-lg font-bold tracking-tight ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                              {asset.enName}
                            </h3>
                            <p className="text-[10px] text-slate-400 mt-0.5 line-clamp-2">
                              {asset.descriptionEn || 'Selected Iranian listed company.'}
                            </p>
                          </div>
                        </div>

                        {/* Card Info Body */}
                        <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <p className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">{t.tokenPrice}</p>
                              <p className={`text-xl font-extrabold mt-0.5 ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                                {asset.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 })} <span className="text-xs font-semibold text-blue-500">USDT</span>
                              </p>
                            </div>
                            <div>
                              <p className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold text-end">{t.expectedYield}</p>
                              <p className={`text-lg font-extrabold mt-0.5 text-end flex items-center justify-end gap-1 ${
                                asset.change >= 0 ? 'text-emerald-500' : 'text-rose-500'
                              }`}>
                                {asset.change >= 0 ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                                <span>{asset.change >= 0 ? '+' : ''}{asset.change.toFixed(2)}%</span>
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center justify-between rounded-xl border border-slate-800/40 px-3 py-2 text-xs">
                            <span className="text-slate-400">Supply</span>
                            <span className="font-black text-blue-500">{(platformFundedSharesByAssetId[asset.id] ?? 0).toLocaleString()} shares</span>
                          </div>

                          {/* TSETMC Bourse Badge/Link if applicable */}
                          {asset.tsetmcUrl && (
                            <a
                              href={asset.tsetmcUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={(e) => e.stopPropagation()}
                              className="py-1.5 px-2 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/25 rounded-xl text-[11px] font-extrabold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                            >
                              <Globe size={13} className="text-emerald-400" />
                              <span>{`Stock Reference (${asset.id})`}</span>
                              <ExternalLink size={12} />
                            </a>
                          )}

                          {/* Order Trigger & Info Action */}
                          <div className="pt-1 grid grid-cols-1 sm:grid-cols-2 gap-2">
                            <button
                              onClick={() => handleOpenAssetInfo(asset)}
                              className={`py-3 px-3 rounded-xl text-xs font-extrabold transition-all duration-200 cursor-pointer flex items-center justify-center gap-1.5 border ${
                                theme === 'dark'
                                  ? 'bg-slate-800/80 hover:bg-slate-700/80 border-slate-700/80 text-slate-200'
                                  : 'bg-slate-100 hover:bg-slate-200 border-slate-200 text-slate-700'
                              }`}
                            >
                              <Info size={14} className="text-blue-400 shrink-0" />
                              <span>{t.assetDetailsBtn}</span>
                            </button>

                            <button
                              onClick={() => {
                                if (!isLoggedIn) {
                                  setIsAuthModalOpen(true);
                                } else {
                                  setSelectedAsset(asset);
                                  setBuyAmount('');
                                  setIsBuyModalOpen(true);
                                }
                              }}
                              className="py-3 px-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-extrabold transition-all duration-200 cursor-pointer text-center"
                            >
                              {t.buyNow}
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className={`p-12 text-center rounded-2xl border ${
                    theme === 'dark' ? 'bg-slate-900/40 border-slate-800' : 'bg-slate-100 border-slate-200'
                  }`}>
                    <p className="text-slate-400 text-sm">{lang === 'fa' ? 'هیچ دارایی پیدا نشد.' : 'No assets found matching your criteria.'}</p>
                  </div>
                )}
              </section>
            )}

            {/* View 2: My Portfolio Details */}
            {currentTab === 'portfolio' && (
              <section className="space-y-8">
                {/* Dashboard Title & Quick Description */}
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <div>
                    <h1 className="text-2xl font-extrabold tracking-tight flex items-center gap-2">
                      <LayoutDashboard size={24} className="text-blue-500" />
                      {t.myPortfolio}
                    </h1>
                    <p className="text-slate-400 text-xs mt-1">
                      {lang === 'fa'
                        ? 'نمای یکپارچه دارایی‌ها، مدیریت سفارشات محدود، سود و زیان کل و گزارش ریز تراکنش‌ها'
                        : 'Unified dashboard of your holdings, performance metrics, and account activity'}
                    </p>
                  </div>

                  {/* Chart visibility toggler */}
                  <button
                    onClick={() => setShowPortfolioChart(!showPortfolioChart)}
                    className={`px-4 py-2 text-xs font-bold rounded-xl border transition-all cursor-pointer flex items-center gap-1.5 ${
                      theme === 'dark'
                        ? 'bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800'
                        : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    {showPortfolioChart ? <EyeOff size={14} /> : <Eye size={14} />}
                    {showPortfolioChart
                      ? (lang === 'fa' ? 'پنهان‌سازی نمودار عملکرد' : 'Hide Performance Chart')
                      : (lang === 'fa' ? 'نمایش نمودار عملکرد' : 'Show Performance Chart')}
                  </button>
                </div>

                {/* ─── BENTO-STYLE KPI WIDGETS ─── */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* KPI 1: Net Worth / Portfolio Value */}
                  <div className={`p-6 rounded-3xl border shadow-md flex flex-col justify-between relative overflow-hidden ${
                    theme === 'dark' ? 'bg-slate-900/60 border-slate-800' : 'bg-white border-slate-200'
                  }`}>
                    <div className="absolute -right-6 -bottom-6 w-16 h-16 rounded-full bg-blue-500/5 blur-xl"></div>
                    <div>
                      <div className="flex justify-between items-center text-slate-400 text-xs font-semibold">
                        <span>{t.totalBalance}</span>
                        <Coins size={14} className="text-blue-500" />
                      </div>
                      <h2 className={`text-2xl font-extrabold mt-2 ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                        {totalBalanceCalculated.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} <span className="text-xs font-semibold text-blue-500">USDT</span>
                      </h2>
                    </div>
                    <div className="mt-4 pt-3 border-t border-slate-800/10 flex justify-between text-[10px] text-slate-500">
                      <span>{lang === 'fa' ? 'اعتبار نقدی:' : 'Free USDT:'} <strong className="text-slate-400 font-bold">{currentUser.usdtBalance.toLocaleString()} USDT</strong></span>
                      <span>{lang === 'fa' ? 'دارایی‌های دیجیتال:' : 'Assets Val:'} <strong className="text-slate-400 font-bold">{totalSharesValue.toLocaleString()} USDT</strong></span>
                    </div>
                  </div>

                  {/* KPI 2: Absolute & Percent Net P&L */}
                  <div className={`p-6 rounded-3xl border shadow-md flex flex-col justify-between relative overflow-hidden ${
                    theme === 'dark' ? 'bg-slate-900/60 border-slate-800' : 'bg-white border-slate-200'
                  }`}>
                    <div className="absolute -right-6 -bottom-6 w-16 h-16 rounded-full bg-emerald-500/5 blur-xl"></div>
                    <div>
                      <div className="flex justify-between items-center text-slate-400 text-xs font-semibold">
                        <span>{t.totalPnl}</span>
                        <TrendingUp size={14} className={totalPnLCalculated >= 0 ? 'text-emerald-500' : 'text-rose-500'} />
                      </div>
                      <h2 className={`text-2xl font-extrabold mt-2 flex items-center gap-1 ${
                        totalPnLCalculated >= 0 ? 'text-emerald-500' : 'text-rose-500'
                      }`}>
                        {totalPnLCalculated >= 0 ? '+' : ''}
                        {totalPnLCalculated.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        <span className="text-xs font-semibold">USDT</span>
                      </h2>
                    </div>
                    <div className="mt-4 pt-3 border-t border-slate-800/10 flex justify-between items-center text-[10px]">
                      <span className="text-slate-500">{lang === 'fa' ? 'کل سود ناخالص:' : 'Net ROI (Month):'}</span>
                      <span className={`font-extrabold px-1.5 py-0.5 rounded-md ${
                        totalPnLCalculated >= 0 ? 'bg-emerald-500/10 text-emerald-500' : 'bg-rose-500/10 text-rose-500'
                      }`}>
                        {totalPnLCalculated >= 0 ? '+' : ''}{totalPnLPctCalculated.toFixed(2)}%
                      </span>
                    </div>
                  </div>

                  {/* KPI 3: Open Positions */}
                  <div className={`p-6 rounded-3xl border shadow-md flex flex-col justify-between relative overflow-hidden ${
                    theme === 'dark' ? 'bg-slate-900/60 border-slate-800' : 'bg-white border-slate-200'
                  }`}>
                    <div className="absolute -right-6 -bottom-6 w-16 h-16 rounded-full bg-purple-500/5 blur-xl"></div>
                    <div>
                      <div className="flex justify-between items-center text-slate-400 text-xs font-semibold">
                        <span>Open Positions</span>
                        <ShieldCheck size={14} className="text-purple-500" />
                      </div>
                      <h2 className={`text-2xl font-extrabold mt-2 ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                        {myPortfolio.filter(item => item.shares > 0).length} <span className="text-xs font-semibold text-purple-500">Positions</span>
                      </h2>
                    </div>
                    <div className="mt-4 pt-3 border-t border-slate-800/10 flex justify-between text-[10px] text-slate-500">
                      <span>Total Shares:</span>
                      <strong className="text-slate-400 font-bold">
                        {myPortfolio.reduce((sum, item) => sum + item.shares, 0).toLocaleString()}
                      </strong>
                    </div>
                  </div>
                </div>

                {/* Collapsible Performance Yield Chart */}
                <AnimatePresence>
                  {showPortfolioChart && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3 }}
                      className="overflow-hidden w-full"
                    >
                      <YieldChart
                        theme={theme}
                        lang={lang}
                        isPortfolioMode={true}
                        isLoggedIn={isLoggedIn}
                        onLoginClick={() => { setAuthMode('signIn'); setIsAuthModalOpen(true); }}
                        myPortfolio={myPortfolio}
                      />
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* ─── NEW STACKED FULL-WIDTH LAYOUT ─── */}
                <div className="space-y-8">

                  {/* Panel 1: Your Active Digital Holdings (Full Width) */}
                  <div className={`p-6 rounded-3xl border shadow-lg space-y-6 ${
                    theme === 'dark' ? 'bg-slate-900/60 border-slate-800' : 'bg-white border-slate-200'
                  }`}>
                    <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 pb-2 border-b border-slate-800/10">
                      <div>
                        <h2 className="text-lg font-extrabold tracking-tight flex items-center gap-2">
                          <CheckCircle size={18} className="text-blue-500" />
                          {lang === 'fa' ? 'سبد دارایی‌های تحت مالکیت شما' : 'Your Share Holdings'}
                        </h2>
                        <p className="text-slate-400 text-[11px] mt-1">
                          {lang === 'fa' ? 'رصد ارزش لحظه‌ای، میانگین خرید و سود/زیان هر موقعیت معاملاتی' : 'Monitor holdings, average costs, and P&L for your selected Iranian shares'}
                        </p>
                      </div>

                      {/* View Switch: Aggregated vs Detailed */}
                      <div className={`flex p-1 rounded-xl shrink-0 ${
                        theme === 'dark' ? 'bg-slate-950' : 'bg-slate-100'
                      }`}>
                        <button
                          onClick={() => setPortfolioViewMode('aggregated')}
                          className={`px-3 py-1.5 text-[11px] font-bold rounded-lg transition-all cursor-pointer ${
                            portfolioViewMode === 'aggregated'
                              ? (theme === 'dark' ? 'bg-blue-600 text-white shadow-lg' : 'bg-white text-blue-600 shadow-sm')
                              : 'text-slate-400 hover:text-slate-300'
                          }`}
                        >
                          {lang === 'fa' ? 'نمای کلی دارایی‌ها' : 'Aggregated View'}
                        </button>
                        <button
                          onClick={() => setPortfolioViewMode('detailed')}
                          className={`px-3 py-1.5 text-[11px] font-bold rounded-lg transition-all cursor-pointer ${
                            portfolioViewMode === 'detailed'
                              ? (theme === 'dark' ? 'bg-blue-600 text-white shadow-lg' : 'bg-white text-blue-600 shadow-sm')
                              : 'text-slate-400 hover:text-slate-300'
                          }`}
                        >
                          {lang === 'fa' ? 'ریز معاملات و خریدها' : 'Detailed Purchases'}
                        </button>
                      </div>
                    </div>

                    {portfolioViewMode === 'aggregated' ? (
                      myPortfolio.length > 0 ? (
                        <div className={`rounded-2xl border overflow-hidden ${
                          theme === 'dark' ? 'border-slate-800 bg-slate-950/20' : 'border-slate-200 bg-white'
                        }`}>
                          <div className="overflow-x-auto">
                            <table className="w-full text-start border-collapse">
                              <thead>
                                <tr className={`border-b text-[10px] font-bold uppercase tracking-wider ${
                                  theme === 'dark' ? 'border-slate-800 text-slate-400 bg-slate-900/20' : 'border-slate-100 text-slate-500 bg-slate-50'
                                }`}>
                                  <th className="py-3 px-4 text-start">{lang === 'fa' ? 'دارایی / نماد' : 'Asset / Symbol'}</th>
                                  <th className="py-3 px-4 text-center">{lang === 'fa' ? 'موجودی (سهم)' : 'Qty Owned'}</th>
                                  <th className="py-3 px-4 text-end">{lang === 'fa' ? 'قیمت خرید / قیمت فعلی' : 'Avg Buy / Live Price'}</th>
                                  <th className="py-3 px-4 text-end">{lang === 'fa' ? 'ارزش بازار (USDT)' : 'Market Value'}</th>
                                  <th className="py-3 px-4 text-end">{lang === 'fa' ? 'سود / زیان (P&L)' : 'Unrealized P&L'}</th>
                                  <th className="py-3 px-4 text-center">{lang === 'fa' ? 'عملیات سریع' : 'Quick Actions'}</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-800/10 text-xs font-semibold">
                                {myPortfolio.map(item => {
                                  const asset = assets.find(a => a.id === item.assetId);
                                  if (!asset) return null;

                                  const currentVal = item.shares * asset.price;
                                  const costVal = item.shares * item.avgPrice;
                                  const itemPnL = currentVal - costVal;
                                  const itemPnLPct = costVal !== 0 ? (itemPnL / costVal) * 100 : 0;

                                  return (
                                    <tr key={item.assetId} className="hover:bg-slate-500/5 transition-all">
                                      <td className="py-3.5 px-4">
                                        <div className="flex items-center gap-2.5">
                                          <img
                                            src={getFlagSrc(asset.flag)}
                                            alt=""
                                            className="rounded shadow-xs shrink-0"
                                            referrerPolicy="no-referrer"
                                          />
                                          <div>
                                            <div className={`font-bold ${theme === 'dark' ? 'text-white' : 'text-slate-950'}`}>
                                              {asset.enName}
                                            </div>
                                            <div className="text-[9px] font-mono font-bold text-slate-500 mt-0.5">#{asset.id}</div>
                                          </div>
                                        </div>
                                      </td>
                                      <td className="py-3.5 px-4 text-center font-mono">
                                        <div className={`font-bold ${theme === 'dark' ? 'text-white' : 'text-slate-800'}`}>
                                          {item.shares.toLocaleString()}
                                        </div>
                                        <div className="text-[9px] text-slate-500 font-bold">{lang === 'fa' ? 'سهم' : 'Shares'}</div>
                                      </td>
                                      <td className="py-3.5 px-4 text-end font-mono">
                                        <div className={theme === 'dark' ? 'text-slate-300' : 'text-slate-700'}>{item.avgPrice.toLocaleString()} USDT</div>
                                        <div className="text-[9px] text-blue-500 font-bold mt-0.5">{asset.price.toLocaleString()} USDT</div>
                                      </td>
                                      <td className="py-3.5 px-4 text-end font-mono">
                                        <div className={`font-extrabold ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                                          {currentVal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                        </div>
                                        <span className="text-[8px] font-semibold text-slate-500">USDT</span>
                                      </td>
                                      <td className="py-3.5 px-4 text-end font-mono">
                                        <div className={`font-extrabold flex items-center justify-end gap-0.5 ${itemPnL >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                                          {itemPnL >= 0 ? '+' : ''}{itemPnL.toFixed(2)}
                                        </div>
                                        <div className={`text-[9.5px] font-bold ${itemPnL >= 0 ? 'text-emerald-500/85' : 'text-rose-500/85'}`}>
                                          {itemPnL >= 0 ? '+' : ''}{itemPnLPct.toFixed(1)}%
                                        </div>
                                      </td>
                                      <td className="py-3.5 px-4">
                                        <div className="flex gap-1.5 justify-center">
                                          <button
                                            onClick={() => handleOpenAssetInfo(asset)}
                                            title={lang === 'fa' ? 'اطلاعات و مشخصات دارایی' : 'Asset Specifications'}
                                            className="px-2 py-1 bg-slate-500/15 hover:bg-slate-500 hover:text-white text-slate-300 text-[10px] rounded-lg font-bold transition-all cursor-pointer flex items-center justify-center gap-1 border border-slate-500/20"
                                          >
                                            <Info size={11} />
                                            <span>{lang === 'fa' ? 'اطلاعات' : 'Info'}</span>
                                          </button>
                                          <button
                                            onClick={() => {
                                              setSelectedAsset(asset);
                                              setBuyAmount('');
                                              setIsBuyModalOpen(true);
                                            }}
                                            className="px-2 py-1 bg-blue-600/10 hover:bg-blue-600 hover:text-white text-blue-500 text-[10px] rounded-lg font-bold transition-all cursor-pointer"
                                          >
                                            {t.buy}
                                          </button>
                                          <button
                                            onClick={() => {
                                              setSelectedAsset(asset);
                                              setSellShares('');
                                              setIsSellModalOpen(true);
                                            }}
                                            className="px-2 py-1 bg-amber-600/10 hover:bg-amber-600 hover:text-white text-amber-500 text-[10px] rounded-lg font-bold transition-all cursor-pointer"
                                          >
                                            {t.sell}
                                          </button>
                                        </div>
                                      </td>
                                    </tr>
                                  );
                                })}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      ) : (
                        <div className={`p-10 text-center rounded-2xl border ${
                          theme === 'dark' ? 'bg-slate-900/40 border-slate-800' : 'bg-slate-50 border-slate-200'
                        }`}>
                          <p className="text-slate-400 text-xs font-semibold">
                            {lang === 'fa' ? 'هیچ دارایی در سبد شما ثبت نشده است.' : 'Your portfolio currently has no digital holdings.'}
                          </p>
                          <button
                            onClick={() => setCurrentTab('market')}
                            className="mt-4 px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white font-extrabold text-xs rounded-xl cursor-pointer transition-all"
                          >
                            {lang === 'fa' ? 'مشاهده بازار و اولین خرید' : 'Browse Asset Marketplace'}
                          </button>
                        </div>
                      )
                    ) : (
                      purchaseLots.length > 0 ? (
                        <div className={`rounded-2xl border overflow-hidden ${
                          theme === 'dark' ? 'border-slate-800 bg-slate-950/20' : 'border-slate-200 bg-white'
                        }`}>
                          <div className="overflow-x-auto">
                            <table className="w-full text-start border-collapse">
                              <thead>
                                <tr className={`border-b text-[10px] font-bold uppercase tracking-wider ${
                                  theme === 'dark' ? 'border-slate-800 text-slate-400 bg-slate-900/20' : 'border-slate-100 text-slate-500 bg-slate-50'
                                }`}>
                                  <th className="py-3 px-4 text-start">{lang === 'fa' ? 'دارایی / زمان خرید' : 'Asset / Purchase Time'}</th>
                                  <th className="py-3 px-4 text-center">{lang === 'fa' ? 'حجم خرید' : 'Buy Volume'}</th>
                                  <th className="py-3 px-4 text-end">{lang === 'fa' ? 'قیمت خرید' : 'Buy Price'}</th>
                                  <th className="py-3 px-4 text-end">{lang === 'fa' ? 'کل سرمایه (USDT)' : 'Total Invested'}</th>
                                  <th className="py-3 px-4 text-end">{lang === 'fa' ? 'ارزش فعلی / قیمت فعلی' : 'Current Value / Live'}</th>
                                  <th className="py-3 px-4 text-end">{lang === 'fa' ? 'بازدهی غیرمحقق شده' : 'Unrealized Return'}</th>
                                  <th className="py-3 px-4 text-center">{lang === 'fa' ? 'عملیات' : 'Actions'}</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-800/10 text-xs font-semibold">
                                {purchaseLots.map(lot => {
                                  const asset = assets.find(a => a.id === lot.assetId);
                                  if (!asset) return null;

                                  const purchaseCost = lot.shares * lot.price;
                                  const currentVal = lot.shares * asset.price;
                                  const lotPnL = currentVal - purchaseCost;
                                  const lotPnLPct = purchaseCost !== 0 ? (lotPnL / purchaseCost) * 100 : 0;

                                  return (
                                    <tr key={lot.id} className="hover:bg-slate-500/5 transition-all">
                                      <td className="py-3.5 px-4">
                                        <div className="flex items-center gap-2.5">
                                          <img
                                            src={getFlagSrc(asset.flag)}
                                            alt=""
                                            className="rounded shadow-xs shrink-0"
                                            referrerPolicy="no-referrer"
                                          />
                                          <div>
                                            <div className={`font-bold ${theme === 'dark' ? 'text-white' : 'text-slate-950'}`}>
                                              {asset.enName}
                                            </div>
                                            <div className="text-[9px] text-slate-500 font-bold mt-0.5">{lot.date}</div>
                                          </div>
                                        </div>
                                      </td>
                                      <td className="py-3.5 px-4 text-center font-mono">
                                        <div className={`font-bold ${theme === 'dark' ? 'text-white' : 'text-slate-800'}`}>
                                          {lot.shares.toLocaleString()}
                                        </div>
                                        <div className="text-[9px] text-slate-500 font-bold">{lang === 'fa' ? 'سهم' : 'Shares'}</div>
                                      </td>
                                      <td className="py-3.5 px-4 text-end font-mono">
                                        <div className={theme === 'dark' ? 'text-slate-300' : 'text-slate-700'}>
                                          {lot.price.toLocaleString(undefined, { minimumFractionDigits: lot.price < 1 ? 4 : 2, maximumFractionDigits: lot.price < 1 ? 4 : 2 })} USDT
                                        </div>
                                      </td>
                                      <td className="py-3.5 px-4 text-end font-mono">
                                        <div className={`font-bold ${theme === 'dark' ? 'text-slate-200' : 'text-slate-800'}`}>
                                          {purchaseCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                        </div>
                                        <span className="text-[8px] font-semibold text-slate-500">USDT</span>
                                      </td>
                                      <td className="py-3.5 px-4 text-end font-mono">
                                        <div className={`font-extrabold ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                                          {currentVal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                        </div>
                                        <div className="text-[9px] text-blue-500 font-bold mt-0.5">{asset.price.toLocaleString()} USDT</div>
                                      </td>
                                      <td className="py-3.5 px-4 text-end font-mono">
                                        <div className={`font-extrabold flex items-center justify-end gap-0.5 ${lotPnL >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                                          {lotPnL >= 0 ? '+' : ''}{lotPnL.toFixed(2)}
                                        </div>
                                        <div className={`text-[9.5px] font-bold ${lotPnL >= 0 ? 'text-emerald-500/85' : 'text-rose-500/85'}`}>
                                          {lotPnL >= 0 ? '+' : ''}{lotPnLPct.toFixed(1)}%
                                        </div>
                                      </td>
                                      <td className="py-3.5 px-4">
                                        <div className="flex gap-1.5 justify-center">
                                          <button
                                            onClick={() => {
                                              setSelectedAsset(asset);
                                              setSellShares(lot.shares.toString());
                                              setIsSellModalOpen(true);
                                            }}
                                            className="px-2 py-1 bg-amber-600/10 hover:bg-amber-600 hover:text-white text-amber-500 text-[10px] rounded-lg font-bold transition-all cursor-pointer"
                                          >
                                            {lang === 'fa' ? 'فروش این خرید' : 'Sell Lot'}
                                          </button>
                                        </div>
                                      </td>
                                    </tr>
                                  );
                                })}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      ) : (
                        <div className={`p-10 text-center rounded-2xl border ${
                          theme === 'dark' ? 'bg-slate-900/40 border-slate-800' : 'bg-slate-50 border-slate-200'
                        }`}>
                          <p className="text-slate-400 text-xs font-semibold">
                            {lang === 'fa' ? 'هیچ تراکنش خریدی ثبت نشده است.' : 'No purchase lots found.'}
                          </p>
                        </div>
                      )
                    )}
                  </div>

                  {/* Panel 2: Activity Timeline */}
                  <div className={`p-6 rounded-3xl border shadow-lg space-y-6 ${
                    theme === 'dark' ? 'bg-slate-900/60 border-slate-800' : 'bg-white border-slate-200'
                  }`}>
                    <div className="pb-4 border-b border-slate-800/10">
                      <h2 className="text-lg font-extrabold tracking-tight flex items-center gap-2">
                        <Clock size={18} className="text-blue-500" />
                        Activity Timeline
                      </h2>
                      <p className="text-slate-400 text-[11px] mt-1">
                        Review your account and trading activity in chronological order.
                      </p>
                    </div>

                    {activities.length > 0 ? (
                      <div className="space-y-4">
                        {activities.map((act) => (
                          <div
                            key={act.id}
                            className={`p-4 rounded-2xl border ${
                              theme === 'dark' ? 'bg-slate-950/40 border-slate-800/80' : 'bg-slate-50 border-slate-200'
                            }`}
                          >
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                              <p className={`text-xs font-bold ${theme === 'dark' ? 'text-slate-200' : 'text-slate-800'}`}>
                                {act.descriptionEn}
                              </p>
                              <span className="text-[10px] font-mono text-slate-500">{act.date}</span>
                            </div>
                            <span className="inline-flex mt-2 text-[9px] font-black uppercase tracking-wider text-blue-400">
                              {act.type}
                            </span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-slate-400 text-xs">No activity recorded yet.</p>
                    )}
                  </div>
                </div>
              </section>
            )}

            {/* View 3: Deposit / Withdraw Staking */}
            {currentTab === 'wallet' && (
              <section className="space-y-6">
                <div>
                  <h1 className="text-2xl font-extrabold tracking-tight">{t.wallet}</h1>
                  <p className="text-slate-400 text-xs mt-1">{lang === 'fa' ? 'شارژ حساب تتر یا برداشت سریع' : 'Deposit and withdraw USDT securely'}</p>
                </div>

                <div className={`rounded-3xl border p-6 shadow-sm space-y-6 max-w-xl mx-auto ${
                  theme === 'dark' ? 'bg-slate-900/60 border-slate-800' : 'bg-white border-slate-200'
                }`}>
                  {/* Tabs */}
                  <div className="flex border-b border-slate-800">
                    <button
                      onClick={() => setWalletTab('deposit')}
                      className={`flex-1 py-3 text-sm font-bold text-center border-b-2 transition-all ${
                        walletTab === 'deposit' ? 'border-blue-500 text-blue-500 font-extrabold' : 'border-transparent text-slate-400'
                      }`}
                    >
                      {t.depositUsdt}
                    </button>
                    <button
                      onClick={() => setWalletTab('withdraw')}
                      className={`flex-1 py-3 text-sm font-bold text-center border-b-2 transition-all ${
                        walletTab === 'withdraw' ? 'border-blue-500 text-blue-500 font-extrabold' : 'border-transparent text-slate-400'
                      }`}
                    >
                      {t.withdrawUsdt}
                    </button>
                  </div>

                  {/* Info Warning Banner */}
                  <div className={`p-4 rounded-xl flex gap-3 text-xs leading-relaxed border ${
                    theme === 'dark' ? 'bg-amber-950/20 border-amber-500/30 text-amber-300' : 'bg-amber-50 border-amber-200 text-amber-800'
                  }`}>
                    <Info size={16} className="shrink-0 text-amber-500" />
                    <span>{t.transactionWarning}</span>
                  </div>

                  {/* Network Selector */}
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-400 uppercase">{t.selectNetwork}</label>
                    <div className="grid grid-cols-3 gap-2">
                      {['trc20', 'erc20', 'bep20'].map((net) => (
                        <button
                          key={net}
                          onClick={() => {
                            setDepositNetwork(net as any);
                            setTxidError('');
                            setWithdrawAddrError('');
                          }}
                          className={`py-2.5 rounded-xl text-xs font-bold transition-all border ${
                            depositNetwork === net
                              ? 'bg-blue-600 text-white border-blue-500'
                              : theme === 'dark'
                                ? 'bg-slate-950 border-slate-800 text-slate-300 hover:bg-slate-800'
                                : 'bg-slate-100 border-slate-200 text-slate-700 hover:bg-slate-200'
                          }`}
                        >
                          {net === 'trc20' && 'TRC20'}
                          {net === 'erc20' && 'ERC20'}
                          {net === 'bep20' && 'BEP20 (BSC)'}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Deposit View */}
                  {walletTab === 'deposit' && (
                    <form onSubmit={handleDepositSubmit} className="space-y-4">
                      {/* Live Deposit Address Box */}
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-400 uppercase">{t.depositAddress}</label>
                        <div className={`p-4 rounded-xl border text-center break-all font-mono text-sm relative group ${
                          theme === 'dark' ? 'bg-slate-950 border-slate-800 text-white' : 'bg-slate-50 border-slate-200 text-slate-800'
                        }`}>
                          <span>{DEPOSIT_ADDRESSES[depositNetwork]}</span>
                        </div>
                      </div>

                      {/* TxID hash Input */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between gap-2">
                          <label className="text-xs font-bold text-slate-400 uppercase">{t.txidLabel}</label>
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20 shrink-0">
                            {depositNetwork === 'trc20' && (lang === 'fa' ? 'الگو TRC20: ۶۴ کاراکتر هگز' : 'TRC20: 64 Hex Chars')}
                            {depositNetwork === 'erc20' && (lang === 'fa' ? 'الگو ERC20: شروع با 0x + ۶۴ کاراکتر' : 'ERC20: 0x + 64 Hex Chars')}
                            {depositNetwork === 'bep20' && (lang === 'fa' ? 'الگو BEP20: شروع با 0x + ۶۴ کاراکتر' : 'BEP20: 0x + 64 Hex Chars')}
                          </span>
                        </div>

                        <div className="relative">
                          <input
                            type="text"
                            value={depositTxid}
                            onChange={(e) => {
                              setDepositTxid(e.target.value);
                              if (txidError) setTxidError('');
                            }}
                            placeholder={
                              depositNetwork === 'trc20'
                                ? (lang === 'fa' ? 'مثال: e4399e5362bf6a9a0891d8e176b97621c8b32034e3e3b0bb3ef52c5a085b3765' : 'e.g., e4399e5362bf6a9a0891d8e176b97621c8b32034e3e3b0bb3ef52c5a085b3765')
                                : (lang === 'fa' ? 'مثال: 0x7b233a18a9028882b52ec87247d51ee2d7bf8107dd64cf63b9f3ee2bdfa67a03' : 'e.g., 0x7b233a18a9028882b52ec87247d51ee2d7bf8107dd64cf63b9f3ee2bdfa67a03')
                            }
                            className={`w-full p-3 font-mono text-xs rounded-xl border focus:outline-none transition-all ${
                              txidError
                                ? 'border-red-500 bg-red-500/5 text-red-200 focus:border-red-500'
                                : depositTxid.trim() && validateTxid(depositTxid, depositNetwork).valid
                                  ? 'border-emerald-500/80 focus:border-emerald-500'
                                  : theme === 'dark' ? 'bg-slate-950 border-slate-800 text-white focus:border-blue-500' : 'bg-white border-slate-200 focus:border-blue-500'
                            }`}
                          />

                          {depositTxid.trim().length > 0 && (
                            <div className={`absolute ${lang === 'fa' ? 'left-3' : 'right-3'} top-3 flex items-center gap-1 text-[10px]`}>
                              {validateTxid(depositTxid, depositNetwork).valid ? (
                                <span className="text-emerald-500 font-bold flex items-center gap-1 bg-emerald-500/10 px-1.5 py-0.5 rounded">
                                  <Check size={12} />
                                  <span>{depositTxid.trim().length} {lang === 'fa' ? 'کاراکتر' : 'chars'}</span>
                                </span>
                              ) : (
                                <span className="text-amber-500 font-bold flex items-center gap-1 bg-amber-500/10 px-1.5 py-0.5 rounded">
                                  <AlertCircle size={12} />
                                  <span>{depositTxid.trim().length} {lang === 'fa' ? 'کاراکتر' : 'chars'}</span>
                                </span>
                              )}
                            </div>
                          )}
                        </div>

                        {txidError && (
                          <div className="flex items-start gap-1.5 p-2.5 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-[11px] leading-relaxed">
                            <AlertCircle size={14} className="shrink-0 mt-0.5" />
                            <span>{txidError}</span>
                          </div>
                        )}

                        {/* Network Rule Card */}
                        <div className={`p-3 rounded-xl border text-[11px] space-y-1 ${
                          theme === 'dark' ? 'bg-slate-950/60 border-slate-900 text-slate-400' : 'bg-slate-50 border-slate-200/80 text-slate-600'
                        }`}>
                          <div className="flex items-center justify-between font-bold text-slate-300">
                            <span>{lang === 'fa' ? 'فرمت مجاز هش برای شبکه انتخاب‌شده:' : 'Valid Hash Rule for Selected Network:'}</span>
                            <span className="text-blue-500 font-mono font-extrabold">{depositNetwork.toUpperCase()}</span>
                          </div>
                          <p className="text-[11px] leading-relaxed opacity-90">
                            {depositNetwork === 'trc20' && (
                              lang === 'fa'
                                ? 'کد هش ترون (TronScan) شامل دقیقا ۶۴ کاراکتر هگزادسیپمال است.'
                                : 'TRON TxID must be exactly 64 hex characters long.'
                            )}
                            {depositNetwork === 'erc20' && (
                              lang === 'fa'
                                ? 'کد هش اتریوم (Etherscan) شامل ۶۶ کاراکتر (با پیشوند 0x) است.'
                                : 'Ethereum TxID consists of 66 characters starting with 0x prefix.'
                            )}
                            {depositNetwork === 'bep20' && (
                              lang === 'fa'
                                ? 'کد هش بایننس اسمارت چین (BscScan) شامل ۶۶ کاراکتر (با پیشوند 0x) است.'
                                : 'BSC TxID consists of 66 characters starting with 0x prefix.'
                            )}
                          </p>
                        </div>
                      </div>

                      <button
                        type="submit"
                        className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white font-extrabold text-xs rounded-xl transition-all mt-4 cursor-pointer"
                      >
                        {t.submitDeposit}
                      </button>
                    </form>
                  )}

                  {/* Withdraw View */}
                  {walletTab === 'withdraw' && (
                    <form onSubmit={handleWithdrawSubmit} className="space-y-4">
                      {/* Destination address */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between gap-2">
                          <label className="text-xs font-bold text-slate-400 uppercase">{t.destinationAddress}</label>
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20 shrink-0">
                            {depositNetwork === 'trc20' && (lang === 'fa' ? 'الگو: شروع با T (۳۴ کاراکتر)' : 'Pattern: Starts with T (34 chars)')}
                            {(depositNetwork === 'erc20' || depositNetwork === 'bep20') && (lang === 'fa' ? 'الگو: شروع با 0x (۴۲ کاراکتر)' : 'Pattern: Starts with 0x (42 chars)')}
                          </span>
                        </div>

                        <div className="relative">
                          <input
                            type="text"
                            value={withdrawAddress}
                            onChange={(e) => {
                              setWithdrawAddress(e.target.value);
                              if (withdrawAddrError) setWithdrawAddrError('');
                            }}
                            placeholder={
                              depositNetwork === 'trc20'
                                ? (lang === 'fa' ? 'مثال: TYoPGPhMxuWGxF59FWYmsoGUTTwCnPEcpf' : 'e.g., TYoPGPhMxuWGxF59FWYmsoGUTTwCnPEcpf')
                                : (lang === 'fa' ? 'مثال: 0x85c1B3748204Ee174e4883A78190F75419551697' : 'e.g., 0x85c1B3748204Ee174e4883A78190F75419551697')
                            }
                            className={`w-full p-3 font-mono text-xs rounded-xl border focus:outline-none transition-all ${
                              withdrawAddrError
                                ? 'border-red-500 bg-red-500/5 text-red-200 focus:border-red-500'
                                : withdrawAddress.trim() && validateWithdrawAddress(withdrawAddress, depositNetwork).valid
                                  ? 'border-emerald-500/80 focus:border-emerald-500'
                                  : theme === 'dark' ? 'bg-slate-950 border-slate-800 text-white focus:border-blue-500' : 'bg-white border-slate-200 focus:border-blue-500'
                            }`}
                          />

                          {withdrawAddress.trim().length > 0 && (
                            <div className={`absolute ${lang === 'fa' ? 'left-3' : 'right-3'} top-3 flex items-center gap-1 text-[10px]`}>
                              {validateWithdrawAddress(withdrawAddress, depositNetwork).valid ? (
                                <span className="text-emerald-500 font-bold flex items-center gap-1 bg-emerald-500/10 px-1.5 py-0.5 rounded">
                                  <Check size={12} />
                                  <span>{withdrawAddress.trim().length} {lang === 'fa' ? 'کاراکتر' : 'chars'}</span>
                                </span>
                              ) : (
                                <span className="text-amber-500 font-bold flex items-center gap-1 bg-amber-500/10 px-1.5 py-0.5 rounded">
                                  <AlertCircle size={12} />
                                  <span>{withdrawAddress.trim().length} {lang === 'fa' ? 'کاراکتر' : 'chars'}</span>
                                </span>
                              )}
                            </div>
                          )}
                        </div>

                        {withdrawAddrError && (
                          <div className="flex items-start gap-1.5 p-2.5 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-[11px] leading-relaxed">
                            <AlertCircle size={14} className="shrink-0 mt-0.5" />
                            <span>{withdrawAddrError}</span>
                          </div>
                        )}
                      </div>

                      {/* Withdraw amount */}
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-400 uppercase">{t.amountUsdt}</label>
                        <input
                          type="number"
                          value={withdrawAmount}
                          onChange={(e) => setWithdrawAmount(e.target.value)}
                          placeholder={t.minAmount}
                          className={`w-full p-3 rounded-xl border focus:outline-none focus:border-blue-500 text-sm ${
                            theme === 'dark' ? 'bg-slate-950 border-slate-800 text-white' : 'bg-white border-slate-200'
                          }`}
                        />
                      </div>

                      <button
                        type="submit"
                        className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white font-extrabold text-xs rounded-xl transition-all mt-4 cursor-pointer"
                      >
                        {t.requestWithdraw}
                      </button>
                    </form>
                  )}

                </div>
              </section>
            )}

            {/* View 4: Transaction History Table */}
            {currentTab === 'history' && (
              <section className="space-y-6">
                <div>
                  <h1 className="text-2xl font-extrabold tracking-tight">{t.transactionHistory}</h1>
                  <p className="text-slate-400 text-xs mt-1">{lang === 'fa' ? 'سوابق واریز، برداشت و معاملات گذشته شما' : 'History of your deposits, withdrawals, and trades'}</p>
                </div>

                <div className={`rounded-3xl border overflow-hidden shadow-sm ${
                  theme === 'dark' ? 'bg-slate-900/60 border-slate-800' : 'bg-white border-slate-200'
                }`}>
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse text-start">
                      <thead>
                        <tr className={`border-b text-xs font-bold uppercase text-slate-400 text-start ${
                          theme === 'dark' ? 'border-slate-800 bg-slate-950/40' : 'border-slate-200 bg-slate-50'
                        }`}>
                          <th className="p-4 text-start">{t.thType}</th>
                          <th className="p-4 text-center">{t.thAmount}</th>
                          <th className="p-4 text-center">{t.thDate}</th>
                          <th className="p-4 text-end">{t.thStatus}</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800 text-xs">
                        {transactions.map(tx => (
                          <tr
                            key={tx.id}
                            className={`transition-colors hover:bg-slate-800/10 ${
                              theme === 'dark' ? 'hover:bg-slate-800/20' : 'hover:bg-slate-100/50'
                            }`}
                          >
                            <td className="p-4 font-semibold">
                              <span className="capitalize">{lang === 'fa' ? (t as Record<string, string>)['hist_' + tx.type] ?? tx.type : tx.type}</span>
                              <span className="text-[10px] text-slate-400 font-mono ms-2">({tx.asset})</span>
                            </td>
                            <td className="p-4 text-center font-mono font-bold" dir="ltr">
                              {tx.amount}
                            </td>
                            <td className="p-4 text-center text-slate-400 font-mono">
                              {tx.date}
                            </td>
                            <td className="p-4 text-end">
                              <span className={`px-2.5 py-1 rounded-md text-[10px] font-bold ${
                                tx.status === 'completed'
                                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                  : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                              }`}>
                                {lang === 'fa' ? (t as Record<string, string>)['stat_' + tx.status] ?? tx.status : tx.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </section>
            )}

            {/* View 5: Support Tickets */}
            {currentTab === 'support' && (
              <section className="space-y-6">
                <div>
                  <h1 className="text-2xl font-extrabold tracking-tight">{t.supportCenter}</h1>
                  <p className="text-slate-400 text-xs mt-1">{lang === 'fa' ? 'پاسخگویی تیکت‌های شما در کمتر از ۷۲ ساعت' : 'Get in touch with support agents'}</p>
                </div>

                <div className={`rounded-3xl border p-6 shadow-sm max-w-xl mx-auto space-y-4 ${
                  theme === 'dark' ? 'bg-slate-900/60 border-slate-800' : 'bg-white border-slate-200'
                }`}>
                  <form onSubmit={handleSupportSubmit} className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-400 uppercase">{t.describeIssue}</label>
                      <textarea
                        rows={5}
                        value={supportText}
                        onChange={(e) => setSupportText(e.target.value)}
                        placeholder={t.howCanHelp}
                        className={`w-full p-3 rounded-xl border focus:outline-none focus:border-blue-500 text-sm ${
                          theme === 'dark' ? 'bg-slate-950 border-slate-800 text-white' : 'bg-white border-slate-200'
                        }`}
                        required
                      ></textarea>
                    </div>

                    <button
                      type="submit"
                      className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white font-extrabold text-xs rounded-xl transition-all"
                    >
                      {t.submitTicket}
                    </button>
                  </form>
                </div>
              </section>
            )}



            {/* Admin Operations */}
            {currentTab === 'admin' && isLoggedIn && isAdmin && (
              <AdminPanel theme={theme} currentRole={currentUser.role} />
            )}

            {/* View 6: About Us */}
            {currentTab === 'about' && (
              <section className="space-y-6 animate-fade-in">
                <div>
                  <h1 className="text-2xl font-extrabold tracking-tight">
                    {lang === 'fa' ? 'درباره RWA' : 'About RWA'}
                  </h1>
                  <p className="text-slate-400 text-xs mt-1">
                    {lang === 'fa' ? 'نسل بعدی مالکیت دارایی‌های واقعی روی زنجیره' : 'The next generation of real-world asset ownership'}
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className={`p-6 rounded-3xl border shadow-sm space-y-3 ${
                    theme === 'dark' ? 'bg-slate-900/60 border-slate-800' : 'bg-white border-slate-200'
                  }`}>
                    <div className="w-10 h-10 bg-blue-600/10 text-blue-500 rounded-xl flex items-center justify-center font-bold">
                      <ShieldCheck size={20} />
                    </div>
                    <h3 className={`text-base font-bold ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                      {lang === 'fa' ? 'قیمت‌گذاری USDT' : 'USDT Pricing'}
                    </h3>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      {lang === 'fa'
                        ? 'قیمت‌های قابل مشاهده برای کاربر به USDT نمایش داده می‌شوند و هر سهم دارای Stock Reference است.'
                        : 'User-facing prices are displayed in USDT and each selected share includes a Stock Reference link.'}
                    </p>
                  </div>

                  <div className={`p-6 rounded-3xl border shadow-sm space-y-3 ${
                    theme === 'dark' ? 'bg-slate-900/60 border-slate-800' : 'bg-white border-slate-200'
                  }`}>
                    <div className="w-10 h-10 bg-emerald-600/10 text-emerald-500 rounded-xl flex items-center justify-center font-bold">
                      <CheckCircle size={20} />
                    </div>
                    <h3 className={`text-base font-bold ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                      {lang === 'fa' ? 'Supply شفاف' : 'Transparent Supply'}
                    </h3>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      {lang === 'fa'
                        ? 'مقدار Supply تأمین‌شده برای هر یک از پنج سهم به‌صورت شفاف در رابط کاربری نمایش داده می‌شود.'
                        : 'The funded supply for each of the five selected shares is displayed directly in the interface.'}
                    </p>
                  </div>

                  <div className={`p-6 rounded-3xl border shadow-sm space-y-3 ${
                    theme === 'dark' ? 'bg-slate-900/60 border-slate-800' : 'bg-white border-slate-200'
                  }`}>
                    <div className="w-10 h-10 bg-purple-600/10 text-purple-500 rounded-xl flex items-center justify-center font-bold">
                      <Coins size={20} />
                    </div>
                    <h3 className={`text-base font-bold ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                      {lang === 'fa' ? 'سرمایه‌گذاری خرد شده' : 'Fractionalized & Inclusive'}
                    </h3>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      {lang === 'fa'
                        ? 'پنج سهم منتخب را همراه با معرفی شرکت، Supply و قیمت USDT بررسی کنید.'
                        : 'Review five selected Iranian shares with company information, funded supply, and USDT pricing.'}
                    </p>
                  </div>
                </div>

                <div className={`p-6 rounded-3xl border space-y-4 ${
                  theme === 'dark' ? 'bg-slate-900/40 border-slate-800' : 'bg-slate-100/50 border-slate-200'
                }`}>
                  <h3 className={`text-lg font-bold ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                    {lang === 'fa' ? 'ماموریت RWA' : 'The RWA Mission'}
                  </h3>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    {lang === 'fa'
                      ? 'هدف ما ایجاد بستری امن و عادلانه برای دسترسی همگانی به دارایی‌های باثبات جهانی است. ما با ادغام فناوری پیشرفته بلاکچین و قوانین شفاف مالی، بستری ایجاد کرده‌ایم تا نقدینگی و امنیت در بالاترین سطح ممکن در اختیار سرمایه‌گذاران خرد قرار گیرد.'
                      : 'Our mission is to provide a focused interface for selected Iranian shares with funded supply, USDT pricing, company information, and backend-validated trading.'}
                  </p>
                </div>
              </section>
            )}

            {/* View 7: Contact Us */}
            {currentTab === 'contact' && (
              <section className="space-y-6">
                <div>
                  <h1 className="text-2xl font-extrabold tracking-tight">
                    {lang === 'fa' ? 'ارتباط با ما' : 'Contact Us'}
                  </h1>
                  <p className="text-slate-400 text-xs mt-1">
                    {lang === 'fa' ? 'پاسخگویی سریع و پشتیبانی ۲۴ ساعته در تمامی روزهای هفته' : '24/7 global coverage and secure ticket submission'}
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Contact Form */}
                  <div className={`p-6 rounded-3xl border shadow-sm space-y-4 ${
                    theme === 'dark' ? 'bg-slate-900/60 border-slate-800' : 'bg-white border-slate-200'
                  }`}>
                    <h3 className={`text-base font-bold ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                      {lang === 'fa' ? 'ارسال پیام مستقیم' : 'Send a message'}
                    </h3>
                    <form onSubmit={handleSupportSubmit} className="space-y-4">
                      <div className="space-y-1">
                        <label className="text-xs font-semibold text-slate-400">{lang === 'fa' ? 'موضوع پیام' : 'Subject'}</label>
                        <input
                          type="text"
                          placeholder={lang === 'fa' ? 'مثال: سوال در مورد واریز تتر' : 'e.g. Deposit validation question'}
                          className={`w-full p-3 rounded-xl border focus:outline-none focus:border-blue-500 text-xs ${
                            theme === 'dark' ? 'bg-slate-950 border-slate-800 text-white' : 'bg-white border-slate-200'
                          }`}
                          required
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-semibold text-slate-400">{t.describeIssue}</label>
                        <textarea
                          rows={4}
                          value={supportText}
                          onChange={(e) => setSupportText(e.target.value)}
                          placeholder={t.howCanHelp}
                          className={`w-full p-3 rounded-xl border focus:outline-none focus:border-blue-500 text-xs ${
                            theme === 'dark' ? 'bg-slate-950 border-slate-800 text-white' : 'bg-white border-slate-200'
                          }`}
                          required
                        ></textarea>
                      </div>

                      <button
                        type="submit"
                        className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white font-extrabold text-xs rounded-xl transition-all cursor-pointer"
                      >
                        {lang === 'fa' ? 'ثبت و ارسال پیام' : 'Send Message'}
                      </button>
                    </form>
                  </div>

                  {/* Official Support */}
                  <div className="space-y-6">
                    <div className={`p-6 rounded-3xl border shadow-sm space-y-5 ${
                      theme === 'dark' ? 'bg-slate-900/60 border-slate-800' : 'bg-white border-slate-200'
                    }`}>
                      <div className="flex items-center gap-3">
                        <span className="text-3xl" role="img" aria-label="Iran">🇮🇷</span>
                        <div>
                          <h3 className={`text-base font-bold ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>RWA Support</h3>
                          <p className="text-xs text-slate-400 mt-0.5">Official email support for account and platform requests.</p>
                        </div>
                      </div>

                      <a
                        href="mailto:support.rwa.stocks@gmail.com"
                        className="flex items-center gap-2 rounded-2xl border border-blue-500/20 bg-blue-500/10 px-4 py-3 text-sm font-bold text-blue-400 hover:bg-blue-500/15 transition-all"
                      >
                        <MessageSquare size={16} />
                        support.rwa.stocks@gmail.com
                      </a>

                      <div className="grid grid-cols-2 gap-3 text-xs">
                        <div className={`rounded-2xl border p-4 ${theme === 'dark' ? 'border-slate-800 bg-slate-950/40' : 'border-slate-200 bg-slate-50'}`}>
                          <p className="text-slate-500">Platform</p>
                          <p className="font-black mt-1">RWA</p>
                        </div>
                        <div className={`rounded-2xl border p-4 ${theme === 'dark' ? 'border-slate-800 bg-slate-950/40' : 'border-slate-200 bg-slate-50'}`}>
                          <p className="text-slate-500">Primary Market</p>
                          <p className="font-black mt-1">Iran 🇮🇷</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </section>
            )}

          </div>
      </div>
      )}
      </div>

      {/* Auth Modal (Sign In / Sign Up) */}
      {isAuthModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/65 backdrop-blur-sm flex items-center justify-center p-4">
          <div className={`w-full max-w-md rounded-3xl border p-6 md:p-8 space-y-6 relative shadow-2xl transition-all ${
            theme === 'dark' ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'
          }`}>
            {/* Close */}
            <button
              onClick={() => setIsAuthModalOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white"
            >
              <X size={18} />
            </button>

            <div>
              <h2 className="text-xl font-bold tracking-tight">
                {authMode === 'signIn' ? t.signIn : t.signUp}
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                {lang === 'fa' ? 'سرمایه‌گذاری روی دارایی‌های دنیای واقعی با امنیت بالا' : 'Access high-yield secured asset tokens'}
              </p>
            </div>

            {authError && (
              <div className="p-3 bg-rose-950/20 border border-rose-500/30 rounded-xl text-xs text-rose-400 font-semibold text-center">
                {authError}
              </div>
            )}

            <form onSubmit={handleAuthSubmit} className="space-y-4">
                {authMode === 'signUp' && (
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-400 uppercase">
                      {lang === 'fa' ? 'نام کامل' : 'Full name'}
                    </label>
                    <input
                      type="text"
                      value={authName}
                      onChange={(e) => setAuthName(e.target.value)}
                      autoComplete="name"
                      minLength={2}
                      className={`w-full p-3 rounded-xl border focus:outline-none focus:border-blue-500 text-sm ${
                        theme === 'dark'
                          ? 'bg-slate-950 border-slate-800 text-white'
                          : 'bg-white border-slate-200 text-slate-900'
                      }`}
                      required
                    />
                  </div>
                )}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-400 uppercase">{lang === 'fa' ? 'ایمیل' : 'Email'}</label>
                <input
                  type="email"
                  value={authUsername}
                  onChange={(e) => setAuthUsername(e.target.value)}
                  autoComplete="email"
                  className={`w-full p-3 rounded-xl border focus:outline-none focus:border-blue-500 text-sm ${
                    theme === 'dark' ? 'bg-slate-950 border-slate-800 text-white' : 'bg-white border-slate-200'
                  }`}
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-400 uppercase">{t.password}</label>
                <input
                  type="password"
                  value={authPassword}
                  onChange={(e) => setAuthPassword(e.target.value)}
                  autoComplete={authMode === 'signIn' ? 'current-password' : 'new-password'}
                  minLength={8}
                  className={`w-full p-3 rounded-xl border focus:outline-none focus:border-blue-500 text-sm ${
                    theme === 'dark' ? 'bg-slate-950 border-slate-800 text-white' : 'bg-white border-slate-200'
                  }`}
                  required
                />
              </div>

              <button
                type="submit"
                  disabled={isAuthLoading}
                className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white font-extrabold text-sm rounded-xl transition-all shadow-md mt-2"
              >
                {isAuthLoading ? (lang === 'fa' ? 'در حال پردازش...' : 'Processing...') : (authMode === 'signIn' ? t.signIn : t.signUp)}
              </button>
            </form>

            <div className="text-center">
              <button
                onClick={() => {
                  setAuthMode(authMode === 'signIn' ? 'signUp' : 'signIn');
                  setAuthError('');
                }}
                className="text-xs text-slate-400 hover:text-white underline cursor-pointer"
              >
                {authMode === 'signIn' ? t.noAccount : t.hasAccount}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Buy Order Confirmation Modal */}
      {isBuyModalOpen && selectedAsset && (
        <div className="fixed inset-0 z-50 bg-black/65 backdrop-blur-sm flex items-center justify-center p-4">
          <div className={`w-full max-w-md rounded-3xl border p-6 space-y-6 relative shadow-2xl ${
            theme === 'dark' ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'
          }`}>
            <button
              onClick={() => setIsBuyModalOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white"
            >
              <X size={18} />
            </button>

            <div>
              <h2 className="text-lg font-bold tracking-tight">Buy {selectedAsset.id}</h2>
              <p className="text-xs text-slate-400 mt-0.5">Market buy settled in USDT</p>
            </div>

            <div className={`p-4 rounded-xl flex items-center justify-between ${
              theme === 'dark' ? 'bg-slate-950/60' : 'bg-slate-50'
            }`}>
              <div className="flex items-center gap-3">
                <img
                  src={getFlagSrc(selectedAsset.flag)}
                  alt="Iran"
                  className="rounded-sm"
                  referrerPolicy="no-referrer"
                />
                <div>
                  <span className="text-xs text-slate-400 font-bold uppercase font-mono">#{selectedAsset.id}</span>
                  <p className="text-sm font-bold">{selectedAsset.enName}</p>
                </div>
              </div>
              <div className="text-end">
                <span className="text-xs text-slate-400">{t.tokenPrice}</span>
                <p className="text-sm font-black text-blue-500">
                  {selectedAsset.price.toLocaleString(undefined, { minimumFractionDigits: 4, maximumFractionDigits: 6 })} USDT
                </p>
              </div>
            </div>

            <form onSubmit={handleModalSubmit} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-400 uppercase">{t.amountToInvest}</label>
                <div className="relative">
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={buyAmount}
                    onChange={(e) => setBuyAmount(e.target.value)}
                    placeholder="Enter USDT Amount"
                    className={`w-full p-3 pr-16 rounded-xl border focus:outline-none focus:border-blue-500 text-sm ${
                      theme === 'dark' ? 'bg-slate-950 border-slate-800 text-white' : 'bg-white border-slate-200'
                    }`}
                    required
                  />
                  <span className="absolute right-3 top-3 text-xs font-bold text-blue-500">USDT</span>
                </div>
                <p className="text-[10px] text-slate-400 mt-1">
                  Available Balance: {currentUser.usdtBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USDT
                </p>
              </div>

              {(() => {
                const val = parseFloat(buyAmount) || 0;
                const shares = selectedAsset.price > 0 ? Math.floor(val / selectedAsset.price) : 0;
                const gross = shares * selectedAsset.price;
                const fee = gross * 0.035;
                const total = gross + fee;
                const insufficient = total > currentUser.usdtBalance + 1e-9;

                return (
                  <div className={`p-4 rounded-xl text-xs space-y-2 font-medium ${
                    theme === 'dark' ? 'bg-slate-950/40' : 'bg-slate-50'
                  }`}>
                    <div className="flex justify-between">
                      <span className="text-slate-400">{t.estShares}</span>
                      <span className="font-bold">{shares.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">{t.fee}</span>
                      <span className="font-bold">{fee.toFixed(2)} USDT</span>
                    </div>
                    {insufficient && <p className="text-rose-400 font-bold text-[10px]">{t.insufficientBalance}</p>}
                    <hr className="border-slate-800/80 my-2" />
                    <div className="flex justify-between text-sm font-extrabold">
                      <span className="text-slate-400">{t.totalToPay}</span>
                      <span className="text-blue-500">{total.toFixed(2)} USDT</span>
                    </div>
                  </div>
                );
              })()}

              <button
                type="submit"
                className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white font-extrabold text-sm rounded-xl transition-all shadow-md"
              >
                Buy
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Sell Order Confirmation Modal */}
      {/* Sell Order Confirmation Modal */}
      {isSellModalOpen && selectedAsset && (
        <div className="fixed inset-0 z-50 bg-black/65 backdrop-blur-sm flex items-center justify-center p-4">
          <div className={`w-full max-w-md rounded-3xl border p-6 space-y-6 relative shadow-2xl ${
            theme === 'dark' ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'
          }`}>
            <button
              onClick={() => setIsSellModalOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white"
            >
              <X size={18} />
            </button>

            <div>
              <h2 className="text-lg font-bold tracking-tight">{t.confirmSell}</h2>
              <p className="text-xs text-slate-400 mt-0.5">{lang === 'fa' ? 'سفارش فروش سهم دارایی Iran Market' : 'Sell selected Iranian share'}</p>
            </div>

            <div className={`p-4 rounded-xl flex items-center justify-between ${
              theme === 'dark' ? 'bg-slate-950/60' : 'bg-slate-50'
            }`}>
              <div>
                <span className="text-xs text-slate-400 font-bold uppercase font-mono">#{selectedAsset.id}</span>
                <p className="text-sm font-bold">{selectedAsset.enName}</p>
              </div>
              <div className="text-end">
                <span className="text-xs text-slate-400">{t.tokenPrice}</span>
                <p className="text-sm font-black text-amber-500">{selectedAsset.price} USDT</p>
              </div>
            </div>

            <form onSubmit={handleSellSubmit} className="space-y-4">
              <div className="space-y-1">
                <div className="flex justify-between items-center">
                  <label className="text-xs font-bold text-slate-400 uppercase">{t.sharesToSell}</label>
                  <span className="text-[10px] text-slate-400 font-bold">
                    {t.ownedShares.replace('{num}', activeMaxShares.toLocaleString())}
                  </span>
                </div>
                <div className="relative">
                  <input
                    type="number"
                    value={sellShares}
                    onChange={(e) => setSellShares(e.target.value)}
                    placeholder="Enter Shares count"
                    className={`w-full p-3 pr-16 rounded-xl border focus:outline-none focus:border-blue-500 text-sm ${
                      theme === 'dark' ? 'bg-slate-950 border-slate-800 text-white' : 'bg-white border-slate-200'
                    }`}
                    required
                  />
                  <span className="absolute right-3 top-3 text-xs font-bold text-slate-500">
                    {lang === 'fa' ? 'سهم' : 'Shares'}
                  </span>
                </div>
              </div>

              {/* Real-time Sell details breakdown */}
              {(() => {
                const sharesCount = parseInt(sellShares) || 0;
                const gross = sharesCount * selectedAsset.price;
                const fee = gross * 0.035;
                const net = gross - fee;

                return (
                  <div className={`p-4 rounded-xl text-xs space-y-2 font-medium ${
                    theme === 'dark' ? 'bg-slate-950/40' : 'bg-slate-50'
                  }`}>
                    <div className="flex justify-between">
                      <span className="text-slate-400">{t.grossValue}</span>
                      <span className={`font-bold ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>{gross.toFixed(2)} USDT</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">{t.fee}</span>
                      <span className={`font-bold ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>{fee.toFixed(2)} USDT</span>
                    </div>
                    <hr className="border-slate-800/80 my-2" />
                    <div className="flex justify-between text-sm font-extrabold">
                      <span className="text-slate-400">{t.netReceive}</span>
                      <span className="text-emerald-500">{net.toFixed(2)} USDT</span>
                    </div>
                  </div>
                );
              })()}

              <button
                type="submit"
                className="w-full py-3 bg-amber-600 hover:bg-amber-500 text-white font-extrabold text-sm rounded-xl transition-all shadow-md mt-2"
              >
                {t.confirmSell}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Asset Specifications & Info Modal */}
      {isInfoModalOpen && infoAsset && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
          <div className={`w-full max-w-2xl rounded-3xl border p-6 md:p-8 space-y-6 relative shadow-2xl my-8 ${
            theme === 'dark' ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'
          }`}>
            {/* Close Button */}
            <button
              onClick={() => setIsInfoModalOpen(false)}
              className="absolute top-5 right-5 text-slate-400 hover:text-white p-1.5 rounded-full hover:bg-slate-800/60 transition-all cursor-pointer"
            >
              <X size={20} />
            </button>

            {/* Header Banner */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-800/20">
              <div className="flex items-center gap-3">
                <img
                  src={getFlagSrc(infoAsset.flag)}
                  alt=""
                  className="rounded shadow-sm shrink-0"
                  referrerPolicy="no-referrer"
                />
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold text-blue-500 bg-blue-500/10 px-2 py-0.5 rounded border border-blue-500/20">
                      #{infoAsset.id}
                    </span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                      theme === 'dark' ? 'bg-slate-800 text-slate-300' : 'bg-slate-100 text-slate-600'
                    }`}>
                      {infoAsset.category === 'metals' && t.categoryMetals}
                      {infoAsset.category === 'pharma' && t.categoryAuto}
                      {infoAsset.category === 'petro' && t.categoryPetro}
                      {infoAsset.category === 'investment' && t.categoryBank}
                    </span>
                  </div>
                  <h2 className="text-xl md:text-2xl font-black tracking-tight mt-1">
                    {infoAsset.enName}
                  </h2>
                  <p className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                    <MapPin size={13} className="text-slate-500" />
                    <span>{lang === 'fa' ? infoAsset.locationFa : infoAsset.locationEn}</span>
                  </p>
                </div>
              </div>

              {/* Live Price Badge */}
              <div className="text-start sm:text-end bg-blue-500/10 border border-blue-500/20 p-3 rounded-2xl shrink-0">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">{t.tokenPrice}</span>
                <p className="text-lg font-black text-blue-500 font-mono">
                  {infoAsset.price.toLocaleString(undefined, { minimumFractionDigits: 2 })} USDT
                </p>
                <span className={`text-xs font-bold flex items-center sm:justify-end gap-1 mt-0.5 ${
                  infoAsset.change >= 0 ? 'text-emerald-500' : 'text-rose-500'
                }`}>
                  {infoAsset.change >= 0 ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                  <span>{infoAsset.change >= 0 ? '+' : ''}{infoAsset.change}%</span>
                </span>
              </div>
            </div>

            {/* Main Info Sections */}
            <div className="space-y-4">

              {/* Section 1: Asset Description */}
              <div className={`p-4 md:p-5 rounded-2xl border space-y-2 ${
                theme === 'dark' ? 'bg-slate-950/60 border-slate-800/80' : 'bg-slate-50 border-slate-200'
              }`}>
                <h3 className="text-xs font-bold text-blue-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Info size={16} />
                  <span>{t.assetOverview}</span>
                </h3>
                <p className="text-xs md:text-sm leading-relaxed text-slate-300">
                  {infoAsset.descriptionEn || 'Selected Iranian listed company.'}
                </p>
              </div>

              {/* Section 2: Physical Backing & Custody */}
              <div className={`p-4 md:p-5 rounded-2xl border space-y-3 ${
                theme === 'dark' ? 'bg-slate-950/60 border-slate-800/80' : 'bg-slate-50 border-slate-200'
              }`}>
                <h3 className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                  <ShieldCheck size={16} />
                  <span>{t.physicalBacking}</span>
                </h3>
                <p className="text-xs md:text-sm leading-relaxed text-slate-300">
                  {lang === 'fa' ? 'قیمت قابل مشاهده در RWA به USDT نمایش داده می‌شود. برای مشاهده مرجع سهم پایه از Stock Reference استفاده کنید.' : 'RWA displays the user-facing price in USDT. Use Stock Reference to review the underlying listed share.'}
                </p>

                <div className="pt-2 border-t border-slate-800/40 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold block uppercase">{t.custodianTitle}</span>
                    <span className="font-semibold text-slate-200 mt-0.5 block">
                      {lang === 'fa' ? 'پردازش قیمت در بک‌اند RWA' : 'RWA backend price processing'}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold block uppercase">{t.payoutSchedule}</span>
                    <span className="font-semibold text-slate-200 mt-0.5 block">
                      USDT
                    </span>
                  </div>
                </div>
              </div>

              {/* Section 2.5: TSETMC Bourse Direct Link (For Bourse Stock Assets) */}
              {(infoAsset.tsetmcUrl || infoAsset.flag === 'ir') && (
                <div className={`p-4 md:p-5 rounded-2xl border space-y-3 transition-all ${
                  theme === 'dark'
                    ? 'bg-gradient-to-r from-blue-950/40 via-slate-900 to-emerald-950/30 border-blue-500/30 shadow-lg shadow-blue-950/20'
                    : 'bg-gradient-to-r from-blue-50/90 via-white to-emerald-50/80 border-blue-300 shadow-sm'
                }`}>
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-start sm:items-center gap-3">
                      <div className="w-10 h-10 rounded-2xl bg-blue-500/15 border border-blue-500/30 flex items-center justify-center shrink-0 mt-0.5 sm:mt-0">
                        <Globe size={20} className="text-blue-400" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="text-xs font-black text-blue-400 uppercase tracking-wider">
                            {t.tsetmcSectionTitle}
                          </h3>
                          {infoAsset.bourseSymbol && (
                            <span className="text-[11px] font-black px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-500/30">
                              Symbol: {infoAsset.id}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-300/90 leading-relaxed mt-1">
                          {t.tsetmcDesc}
                        </p>
                      </div>
                    </div>

                    <a
                      href={infoAsset.tsetmcUrl || `https://www.google.com/search?q=${encodeURIComponent(infoAsset.enName + ' ' + infoAsset.id + ' stock reference')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="py-2.5 px-4 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black rounded-xl transition-all shadow-md shadow-emerald-600/25 flex items-center justify-center gap-2 shrink-0 cursor-pointer w-full sm:w-auto"
                    >
                      <span>{t.tsetmcBtn}</span>
                      <ExternalLink size={14} />
                    </a>
                  </div>
                </div>
              )}

              {/* Section 3: Token Specs & Risk */}
              <div className={`p-4 md:p-5 rounded-2xl border space-y-3 ${
                theme === 'dark' ? 'bg-slate-950/60 border-slate-800/80' : 'bg-slate-50 border-slate-200'
              }`}>
                <h3 className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Coins size={16} />
                  <span>{t.smartContractInfo}</span>
                </h3>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                  <div className={`p-3 rounded-xl border ${theme === 'dark' ? 'bg-slate-900/50 border-slate-800' : 'bg-white border-slate-200'}`}>
                    <span className="text-[10px] text-slate-400 font-bold block">{t.riskLevelTitle}</span>
                    <span className={`inline-block mt-1 px-2 py-0.5 rounded text-[10px] font-extrabold ${
                      infoAsset.riskLevel === 'Low' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                    }`}>
                      {infoAsset.riskLevel || 'Low'}
                    </span>
                  </div>

                  <div className={`p-3 rounded-xl border ${theme === 'dark' ? 'bg-slate-900/50 border-slate-800' : 'bg-white border-slate-200'}`}>
                    <span className="text-[10px] text-slate-400 font-bold block">{lang === 'fa' ? 'واحد قیمت' : 'Price Unit'}</span>
                    <span className="font-mono text-xs font-bold text-slate-200 block mt-1">USDT</span>
                  </div>

                  <div className={`p-3 rounded-xl border ${theme === 'dark' ? 'bg-slate-900/50 border-slate-800' : 'bg-white border-slate-200'}`}>
                    <span className="text-[10px] text-slate-400 font-bold block">{lang === 'fa' ? '\u06a9\u0627\u0631\u0645\u0632\u062f \u0645\u0639\u0627\u0645\u0644\u0647' : 'Trading Fee'}</span>
                    <span className="font-mono text-xs font-bold text-slate-200 block mt-1">3.5%</span>
                  </div>
                </div>

                <div className="flex items-center justify-between rounded-xl border border-slate-800/40 px-3 py-2 text-xs">
                  <span className="text-slate-400">Supply</span>
                  <span className="font-black text-blue-400">{(platformFundedSharesByAssetId[infoAsset.id] ?? 0).toLocaleString()} shares</span>
                </div>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex flex-col sm:flex-row items-center gap-3 pt-4 border-t border-slate-800/20">
              <button
                onClick={() => setIsInfoModalOpen(false)}
                className={`w-full sm:w-1/3 py-3 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                  theme === 'dark' ? 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700' : 'bg-slate-100 border-slate-200 text-slate-700 hover:bg-slate-200'
                }`}
              >
                {t.closeModal}
              </button>

              <button
                onClick={() => {
                  setIsInfoModalOpen(false);
                  if (!isLoggedIn) {
                    setIsAuthModalOpen(true);
                  } else {
                    setSelectedAsset(infoAsset);
                    setBuyAmount('');
                    setIsBuyModalOpen(true);
                  }
                }}
                className="w-full sm:w-2/3 py-3 bg-blue-600 hover:bg-blue-500 text-white font-extrabold text-xs rounded-xl transition-all cursor-pointer shadow-lg shadow-blue-600/20 text-center flex items-center justify-center gap-2"
              >
                <span>{t.proceedToBuy}</span>
                <ArrowUpRight size={16} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className={`border-t transition-colors duration-300 ${
        theme === 'dark' ? 'bg-slate-950 border-slate-900 text-slate-400' : 'bg-white border-slate-200 text-slate-500'
      }`}>
        {/* Main Footer Content */}
        {/* Main Footer Content */}
        <div className="max-w-7xl mx-auto px-4 md:px-8 py-8 md:py-16">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-12">

            {/* Column 1: Brand & Identity */}
            <div className="space-y-3.5 text-start">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 md:w-8 md:h-8 bg-blue-600 rounded-lg flex items-center justify-center font-bold text-white shadow-lg shadow-blue-500/25">
                  <Coins size={14} />
                </div>
                <span className={`text-base md:text-lg font-extrabold tracking-tight ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                  {t.appName}
                </span>
              </div>
              <p className="text-[11px] md:text-xs leading-relaxed opacity-85">
                {lang === 'fa' ? '\u0627\u0637\u0644\u0627\u0639\u0627\u062a \u067e\u0646\u062c \u0633\u0647\u0645 \u0645\u0646\u062a\u062e\u0628 \u0628\u0627 \u062f\u0627\u062f\u0647\u200c\u0647\u0627\u06cc \u0628\u0627\u0632\u0627\u0631 TSETMC \u0646\u0645\u0627\u06cc\u0634 \u062f\u0627\u062f\u0647 \u0645\u06cc\u200c\u0634\u0648\u062f.' : 'RWA presents five selected Iranian shares with market information sourced from TSETMC.'}
              </p>

              {/* Market Status Feed */}
              <div className="space-y-2 pt-1">
                <div className={`p-2.5 md:p-3 rounded-xl md:rounded-2xl border text-[10px] md:text-[11px] font-bold flex items-center justify-between ${
                  theme === 'dark' ? 'bg-slate-900/40 border-slate-900/60' : 'bg-slate-50 border-slate-100'
                }`}>
                  <span className="flex items-center gap-1">
                    <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span>
                    <span>{t.marketStatus}</span>
                  </span>
                  <span className="text-blue-500 font-mono">{t.vol24h}</span>
                </div>
              </div>
            </div>

            {/* Column 2: Market Categories */}
            <div className="space-y-3 md:space-y-4 text-start">
              <h4 className={`text-[10px] md:text-xs font-black uppercase tracking-wider ${theme === 'dark' ? 'text-slate-200' : 'text-slate-900'}`}>
                {lang === 'fa' ? 'بازارهای سرمایه‌گذاری Iran Market' : 'Market Sectors'}
              </h4>
              <ul className="space-y-2 text-[11px] md:text-xs">
                {[
        { id: 'metals', en: 'Metals & Mining', fa: '\u0641\u0644\u0632\u0627\u062a \u0648 \u0645\u0639\u0627\u062f\u0646' },
        { id: 'pharma', en: 'Pharmaceutical', fa: '\u062f\u0627\u0631\u0648\u06cc\u06cc' },
        { id: 'investment', en: 'Investment', fa: '\u0633\u0631\u0645\u0627\u06cc\u0647\u200c\u06af\u0630\u0627\u0631\u06cc' },
        { id: 'petro', en: 'Refining & Petro', fa: '\u067e\u0627\u0644\u0627\u06cc\u0634\u06cc \u0648 \u067e\u062a\u0631\u0648\u0634\u06cc\u0645\u06cc' },
                ].map(cat => (
                  <li key={cat.id}>
                    <button
                      onClick={() => {
                        setMarketFilter(cat.id);
                        setCurrentTab('market');
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      }}
                      className="hover:text-blue-500 transition-colors flex items-center gap-1.5 cursor-pointer text-start"
                    >
                      <span className="opacity-40">#</span>
                      <span>{lang === 'fa' ? cat.fa : cat.en}</span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>

            {/* Column 3: Navigation & Platform */}
            <div className="space-y-3 md:space-y-4 text-start">
              <h4 className={`text-[10px] md:text-xs font-black uppercase tracking-wider ${theme === 'dark' ? 'text-slate-200' : 'text-slate-900'}`}>
                {lang === 'fa' ? 'ناوبری و پلتفرم' : 'Platform Navigation'}
              </h4>
              <ul className="space-y-2 text-[11px] md:text-xs">
                {[
                  { tab: 'home', label: t.home },
                  { tab: 'market', label: t.assetsMarket },
                  { tab: 'portfolio', label: t.portfolio, authRequired: true },
                  { tab: 'wallet', label: t.wallet, authRequired: true },
                  { tab: 'history', label: t.history, authRequired: true },
                  { tab: 'about', label: t.aboutUs },
                  { tab: 'contact', label: t.contactUs },
                ].map(item => {
                  if (item.authRequired && !isLoggedIn) return null;
                  return (
                    <li key={item.tab}>
                      <button
                        onClick={() => {
                          setCurrentTab(item.tab as any);
                          window.scrollTo({ top: 0, behavior: 'smooth' });
                        }}
                        className="hover:text-blue-500 transition-colors cursor-pointer text-start"
                      >
                        {item.label}
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>

            {/* Column 4: Location & Support Details */}
            <div className="space-y-3 md:space-y-4 text-start">
              <h4 className={`text-[10px] md:text-xs font-black uppercase tracking-wider ${theme === 'dark' ? 'text-slate-200' : 'text-slate-900'}`}>
                {lang === 'fa' ? 'اطلاعات پشتیبانی و دفتر مرکزی' : 'Support'}
              </h4>
              <div className="space-y-2.5 md:space-y-3.5 text-[11px] md:text-xs">
                <div className="flex items-start gap-2">
                  <MapPin size={14} className="text-blue-500 shrink-0 mt-0.5" />
                  <p className="leading-relaxed">
                    {lang === 'fa'
                      ? 'دفتر مرکزی: دبی، امارات، منطقه سیلیکون اوآسیس، برج فناوری'
                      : 'Primary market: Iran 🇮🇷'}
                  </p>
                </div>
                <div className="flex items-start gap-2">
                  <ShieldCheck size={14} className="text-blue-500 shrink-0 mt-0.5" />
                  <p className="leading-relaxed">
                    {lang === 'fa'
                      ? 'امانت‌داری فیزیکی: زوریخ، سوئیس، صندوق امانات بانک کانتونال'
                      : 'Pricing Unit: USDT'}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <MessageSquare size={14} className="text-blue-500 shrink-0" />
                  <a href="mailto:support.rwa.stocks@gmail.com" className="font-mono font-bold hover:text-blue-500 transition-colors text-start">
                    support.rwa.stocks@gmail.com
                  </a>
                </div>
                <div className="flex items-center gap-2">
                  <Globe size={14} className="text-blue-500 shrink-0" />
                  <p className="font-bold text-start">English-only interface</p>
                </div>
              </div>
            </div>

          </div>

          {/* Separation Border */}
          <hr className={`my-8 md:my-12 ${theme === 'dark' ? 'border-slate-900' : 'border-slate-100'}`} />

          {/* Legal Disclaimer Box */}
          <div className={`p-4 md:p-5 rounded-xl md:rounded-2xl border text-[10px] md:text-[11px] leading-relaxed mb-8 md:mb-12 text-start ${
            theme === 'dark'
              ? 'bg-slate-900/20 border-slate-900/60 text-slate-500'
              : 'bg-slate-50 border-slate-100 text-slate-400'
          }`}>
            <p className="font-bold mb-1 uppercase text-[9px] md:text-[10px] text-blue-500 tracking-wider">
              {lang === 'fa' ? 'سلب مسئولیت و شفافیت قانونی' : 'REGULATORY NOTICE & RISK DISCLOSURE'}
            </p>
            <p>
              {lang === 'fa' ? '\u0633\u0644\u0628 \u0645\u0633\u0626\u0648\u0644\u06cc\u062a: \u0645\u0639\u0627\u0645\u0644\u0647 \u0633\u0647\u0627\u0645 \u0628\u0627 \u0631\u06cc\u0633\u06a9 \u0646\u0648\u0633\u0627\u0646 \u0642\u06cc\u0645\u062a \u0647\u0645\u0631\u0627\u0647 \u0627\u0633\u062a. \u0627\u0637\u0644\u0627\u0639\u0627\u062a \u0628\u0627\u0632\u0627\u0631 \u0627\u0632 TSETMC \u062f\u0631\u06cc\u0627\u0641\u062a \u0645\u06cc\u200c\u0634\u0648\u062f \u0648 \u0627\u06cc\u0646 \u067e\u0644\u062a\u0641\u0631\u0645 \u0645\u0634\u0627\u0648\u0631\u0647 \u0645\u0627\u0644\u06cc \u0627\u0631\u0627\u0626\u0647 \u0646\u0645\u06cc\u200c\u062f\u0647\u062f.' : 'Disclaimer: Share prices can fluctuate and investing involves market risk. Market information is sourced from TSETMC. RWA does not provide financial advice.'}
            </p>
          </div>

          {/* Bottom Row */}
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 md:gap-6 text-[10px] md:text-[11px]">
            <div className="flex items-center gap-2 font-bold text-center md:text-start">
              <span>© 2026 {t.appName}. {t.rightsReserved}</span>
            </div>

            {/* Quick Links / Status indicators */}
            <div className="flex flex-wrap items-center justify-center md:justify-end gap-3 md:gap-6">
              <a href="#" className="hover:text-blue-500 transition-colors">{t.termsAndConditions}</a>
              <span className="opacity-40">•</span>
              <button onClick={() => { setCurrentTab('support'); window.scrollTo({ top: 0, behavior: 'smooth' }); }} className="hover:text-blue-500 transition-colors cursor-pointer">
                {t.onlineSupport}
              </button>
              <span className="opacity-40">•</span>
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span>
                <span className="text-emerald-500 font-bold">{lang === 'fa' ? 'شبکه اصلی فعال' : 'Mainnet Connected'}</span>
              </div>
            </div>
          </div>

        </div>
      </footer>

      </div>
    </div>
  );
}
