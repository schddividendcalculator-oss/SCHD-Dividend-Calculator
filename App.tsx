import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { DIVIDEND_HISTORY, FAQ_DATA } from './constants';
import type { DividendData } from './types';
import NumberTicker from './NumberTicker';

// --- Helper Components defined outside App to prevent re-creation on render ---

interface CardProps {
  children: React.ReactNode;
  className?: string;
}

const Card: React.FC<CardProps> = ({ children, className = '' }) => (
  <div className={`bg-white rounded-xl shadow-md p-6 md:p-8 ${className}`}>
    {children}
  </div>
);

interface StatCardProps {
  title: string;
  value: string;
  icon: React.ReactNode;
  color?: 'primary' | 'accent';
}

const StatCard: React.FC<StatCardProps> = ({ title, value, icon, color = 'primary' }) => (
  <div className="bg-white rounded-xl shadow-md p-4 flex items-center">
    <div className={`p-3 rounded-lg mr-4 ${color === 'primary' ? 'bg-primary/10 text-primary' : 'bg-accent/10 text-accent'}`}>
      {icon}
    </div>
    <div>
      <p className="text-sm text-light-text font-medium">{title}</p>
      <p className="text-xl font-bold text-dark-text">{value}</p>
    </div>
  </div>
);

interface FaqItemProps {
  question: string;
  answer: React.ReactNode;
  isOpen: boolean;
  onToggle: () => void;
}

const FaqItem: React.FC<FaqItemProps> = ({ question, answer, isOpen, onToggle }) => {
  return (
    <div className="border-b border-gray-200 py-4">
      <button
        onClick={onToggle}
        className="w-full flex justify-between items-center text-left text-lg font-semibold text-dark-text hover:text-primary transition-colors"
        aria-expanded={isOpen}
      >
        <span>{question}</span>
        <span className={`transform transition-transform duration-300 ${isOpen ? 'rotate-180' : 'rotate-0'}`}>
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </span>
      </button>
      <div className={`overflow-hidden transition-all duration-300 ease-in-out ${isOpen ? 'max-h-96 mt-4' : 'max-h-0'}`}>
        <p className="text-light-text text-base">{answer}</p>
      </div>
    </div>
  );
};

interface SectionProps {
  id: string;
  title: string;
  children: React.ReactNode;
}

const Section: React.FC<SectionProps> = ({ id, title, children }) => (
  <section id={id} className="py-12 sm:py-16 md:py-20">
    <div className="container mx-auto px-4 w-[95%] lg:w-[85%] max-w-7xl">
      <h2 className="text-3xl sm:text-4xl font-bold text-center text-dark-text mb-4">{title}</h2>
      <div className="w-24 h-1 bg-primary mx-auto mb-10"></div>
      {children}
    </div>
  </section>
);


const ScrollToTopButton: React.FC = () => {
    const [isVisible, setIsVisible] = useState(false);

    const toggleVisibility = useCallback(() => {
        if (window.pageYOffset > window.innerHeight * 0.4) {
            setIsVisible(true);
        } else {
            setIsVisible(false);
        }
    }, []);

    const scrollToTop = () => {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    };
    
    useEffect(() => {
        window.addEventListener('scroll', toggleVisibility);
        return () => window.removeEventListener('scroll', toggleVisibility);
    }, [toggleVisibility]);

    return (
        <button
            onClick={scrollToTop}
            className={`fixed bottom-8 right-8 bg-primary text-white p-3 rounded-full shadow-lg hover:bg-secondary transition-all duration-300 z-50 ${isVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-90'}`}
            aria-label="Go to top"
        >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
            </svg>
        </button>
    );
};

// --- API Fetching Logic & Constants ---
const CACHE_KEY_PRICE = 'schd_price';
const CACHE_KEY_TIMESTAMP = 'schd_price_timestamp';
const CACHE_DURATION_TRADING_MIN = 15; // Cache for 15 minutes during trading hours
const CACHE_DURATION_CLOSED_HRS = 24 * 60; // Cache for 24 hours when market is closed

/**
 * Checks if the US stock market is likely open.
 * Mon-Fri, 9:30 AM to 4:00 PM ET.
 */
const isMarketOpen = (): boolean => {
    try {
        const now = new Date();
        const etDate = new Date(now.toLocaleString('en-US', { timeZone: 'America/New_York' }));
        
        const day = etDate.getDay(); // 0 = Sunday, 6 = Saturday
        const hour = etDate.getHours();
        const minute = etDate.getMinutes();

        // Check for weekday
        if (day === 0 || day === 6) {
            return false;
        }

        // Check for trading hours (9:30 AM to 4:00 PM ET)
        const timeInMinutes = hour * 60 + minute;
        const marketOpen = 9 * 60 + 30;
        const marketClose = 16 * 60;

        return timeInMinutes >= marketOpen && timeInMinutes < marketClose;
    } catch (e) {
        console.error("Error checking market hours:", e);
        // Fail open to allow fetching if time conversion fails
        return true; 
    }
};

// --- Main App Component ---

type Period = 'daily' | 'monthly' | 'quarterly' | 'annually';
type YieldMethod = 'forward' | 'ttm';

const App: React.FC = () => {
  const [investment, setInvestment] = useState<number>(10000);
  const [sharePrice, setSharePrice] = useState<number>(78.50); // Initial placeholder
  const [dividendYield, setDividendYield] = useState<number>(3.48);
  const [yieldMethod, setYieldMethod] = useState<YieldMethod>('forward');
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [activePeriod, setActivePeriod] = useState<Period>('annually');
  const [isPriceLoading, setIsPriceLoading] = useState<boolean>(true);
  const [priceError, setPriceError] = useState<string | null>(null);
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(null);

  // Memoize a list of dividends that have already been paid out.
  const pastDividends = useMemo(() => {
    const today = new Date();
    // The history is sorted with the newest first, so we filter out future dates.
    return DIVIDEND_HISTORY.filter(d => new Date(d.date) <= today);
  }, []);

  useEffect(() => {
    const fetchSharePrice = async () => {
      setIsPriceLoading(true);
      setPriceError(null);
      try {
        const response = await fetch('/.netlify/functions/get-schd-price');
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Could not fetch latest price.');
        }
        const data = await response.json();
        if (data.price) {
          setSharePrice(data.price);
          localStorage.setItem(CACHE_KEY_PRICE, data.price.toString());
          localStorage.setItem(CACHE_KEY_TIMESTAMP, Date.now().toString());
        } else {
          throw new Error('Invalid price data received.');
        }
      } catch (error: any) {
        console.error('Failed to fetch share price:', error);
        setPriceError('Could not fetch live price.');
        setSharePrice(27); // Default to $27 on error
      } finally {
        setIsPriceLoading(false);
      }
    };

    const managePriceFetch = () => {
        const cachedPrice = localStorage.getItem(CACHE_KEY_PRICE);
        const cachedTimestamp = localStorage.getItem(CACHE_KEY_TIMESTAMP);

        if (cachedPrice && cachedTimestamp) {
            const price = parseFloat(cachedPrice);
            const timestamp = parseInt(cachedTimestamp, 10);
            const now = Date.now();
            const ageInMinutes = (now - timestamp) / (1000 * 60);

            const marketOpen = isMarketOpen();
            const cacheDuration = marketOpen ? CACHE_DURATION_TRADING_MIN : CACHE_DURATION_CLOSED_HRS;

            if (ageInMinutes < cacheDuration) {
                setSharePrice(price);
                setIsPriceLoading(false);
                return;
            }
        }
        fetchSharePrice();
    };
    
    managePriceFetch();
  }, []);

  // Effect to automatically update the dividend yield whenever the share price or method changes.
  useEffect(() => {
    if (sharePrice > 0) {
      let annualDividendPerShare: number;

      if (yieldMethod === 'forward') {
        // Forward yield uses the most recent dividend payment to project the year ahead.
        // It's correct to use the first item from the full history, even if it's a future placeholder.
        if (DIVIDEND_HISTORY.length > 0) {
            annualDividendPerShare = DIVIDEND_HISTORY[0].dividend * 4;
        } else {
            annualDividendPerShare = 0;
        }
      } else { // 'ttm'
        // TTM yield sums the last four ACTUAL paid dividends.
        // We use the `pastDividends` array to ensure we only count historical data.
        if (pastDividends.length >= 4) {
          annualDividendPerShare = pastDividends.slice(0, 4).reduce((acc, curr) => acc + curr.dividend, 0);
        } else {
          annualDividendPerShare = 0; // Not enough data for TTM
        }
      }

      if (annualDividendPerShare > 0) {
        const newYield = (annualDividendPerShare / sharePrice) * 100;
        setDividendYield(newYield);
      } else {
        setDividendYield(0);
      }
    }
  }, [sharePrice, yieldMethod, pastDividends]);

  useEffect(() => {
    const body = document.body;
    if (isMenuOpen) {
      body.style.overflow = 'hidden';
    } else {
      body.style.overflow = 'auto';
    }
    return () => {
      body.style.overflow = 'auto';
    };
  }, [isMenuOpen]);

  const calculateDividends = useCallback(() => {
    if (investment <= 0 || sharePrice <= 0 || dividendYield <= 0) {
      return { annually: 0, quarterly: 0, monthly: 0, daily: 0 };
    }
    const yearly = investment * (dividendYield / 100);
    return {
      annually: yearly,
      quarterly: yearly / 4,
      monthly: yearly / 12,
      daily: yearly / 365,
    };
  }, [investment, dividendYield, sharePrice]);

  const dividends = calculateDividends();

  const formatCurrency = (value: number) => {
    return value.toLocaleString('en-US', { style: 'currency', currency: 'USD' });
  };
  
  const chartData = DIVIDEND_HISTORY.map(d => ({
    ...d,
    date: new Date(d.date).toLocaleDateString('en-US', { year: 'numeric', month: 'short' })
  })).reverse();
  
  const dividendGrowth = useMemo(() => {
      // Uses pastDividends to compare the last 4 paid dividends with the 4 before that.
      if (pastDividends.length < 8) return 'N/A';
      const lastYearDividend = pastDividends.slice(0, 4).reduce((acc, curr) => acc + curr.dividend, 0);
      const prevYearDividend = pastDividends.slice(4, 8).reduce((acc, curr) => acc + curr.dividend, 0);
      if (prevYearDividend === 0) return 'N/A';
      return ((lastYearDividend - prevYearDividend) / prevYearDividend * 100).toFixed(2);
  }, [pastDividends]);

  const annualDividendDisplay = useMemo(() => {
    if (yieldMethod === 'forward') {
        if (DIVIDEND_HISTORY.length > 0) {
            const forwardDividend = (DIVIDEND_HISTORY[0].dividend * 4).toFixed(2);
            return { value: `$${forwardDividend}`, label: 'Forward Annual Dividend' };
        }
        return { value: 'N/A', label: 'Forward Annual Dividend' };
    } else { // ttm
        if (pastDividends.length < 4) return { value: 'N/A', label: 'TTM Annual Dividend' };
        const ttmDividend = pastDividends.slice(0, 4).reduce((acc, curr) => acc + curr.dividend, 0).toFixed(2);
        return { value: `$${ttmDividend}`, label: 'TTM Annual Dividend' };
    }
  }, [yieldMethod, pastDividends]);
  
  const handleNavClick = (event: React.MouseEvent<HTMLAnchorElement>, targetId: string) => {
    event.preventDefault();
    if (isMenuOpen) {
      setIsMenuOpen(false);
    }
    const element = document.getElementById(targetId);
    if (element) {
      const header = document.querySelector('header');
      const headerHeight = header ? header.offsetHeight : 0;
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - headerHeight;

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth',
      });
    }
  };
  
  const renderInfoBox = () => {
    if (isPriceLoading) {
      return (
        <div className="bg-accent/10 border-l-4 border-accent text-accent-dark p-4 rounded-r-lg animate-pulse">
          <div className="flex items-center">
            <div className="py-1"><svg className="fill-current h-6 w-6 text-accent mr-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M2.93 17.07A10 10 0 1 1 17.07 2.93 10 10 0 0 1 2.93 17.07zM9 11v4h2v-4h-2zm0-4h2v2h-2V7z"/></svg></div>
            <p className="font-semibold">Fetching live share price...</p>
          </div>
        </div>
      );
    }

    if (priceError) {
      return (
        <div className="bg-red-100 border-l-4 border-red-500 text-red-800 p-4 rounded-r-lg">
          <div className="flex">
            <div className="py-1">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-6 w-6 mr-4">
                <path fillRule="evenodd" d="M8.485 2.495c.646-1.133 2.384-1.133 3.03 0l6.28 11.02A1.75 1.75 0 0116.03 16H3.97a1.75 1.75 0 01-1.515-2.485l6.28-11.02zM10 5a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 5zm0 9a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
              </svg>
            </div>
            <div>
              <p className="font-bold">{priceError}</p>
              <p className="text-sm">Using a default price. Please verify data on <a href="https://finance.yahoo.com/quote/SCHD" target="_blank" rel="noopener noreferrer" className="font-semibold underline hover:text-red-900">Yahoo Finance</a> and update manually.</p>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="bg-accent/10 border-l-4 border-accent text-accent-dark p-4 rounded-r-lg">
        <div className="flex">
          <div className="py-1"><svg className="fill-current h-6 w-6 text-accent mr-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M2.93 17.07A10 10 0 1 1 17.07 2.93 10 10 0 0 1 2.93 17.07zM9 11v4h2v-4h-2zm0-4h2v2h-2V7z"/></svg></div>
          <div>
            <p className="font-semibold">The share price is updated live.</p>
            <p className="text-sm">
              The <span className="font-bold">dividend yield</span> is calculated automatically. Verify data on <a href="https://finance.yahoo.com/quote/SCHD" target="_blank" rel="noopener noreferrer" className="font-semibold underline hover:text-accent">Yahoo Finance</a>.
            </p>
          </div>
        </div>
      </div>
    );
  };


  const navLinks = [
    { id: 'calculator', name: 'Calculator' },
    { id: 'about', name: 'About' },
    { id: 'stats', name: 'Stats' },
    { id: 'faq', name: 'FAQ' },
  ];

  const periodTabs: { id: Period, name: string }[] = [
    { id: 'daily', name: 'Daily' },
    { id: 'monthly', name: 'Monthly' },
    { id: 'quarterly', name: 'Quarterly' },
    { id: 'annually', name: 'Annually' },
  ];

  return (
    <div className="bg-light-bg min-h-screen">
      {/* Mobile Menu */}
      <div 
        className={`fixed inset-0 bg-black bg-opacity-50 z-50 transition-opacity duration-300 md:hidden ${isMenuOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={() => setIsMenuOpen(false)}
        aria-hidden={!isMenuOpen}
      />
      <div
        className={`fixed top-0 right-0 h-full w-3/4 max-w-xs bg-white shadow-xl z-50 transform transition-transform duration-300 ease-in-out md:hidden ${isMenuOpen ? 'translate-x-0' : 'translate-x-full'}`}
        role="dialog"
        aria-modal="true"
      >
        <div className="p-6">
            <div className="flex justify-between items-center mb-8">
                <span className="text-lg font-bold text-primary">Menu</span>
                <button
                    onClick={() => setIsMenuOpen(false)}
                    className="text-dark-text hover:text-primary"
                    aria-label="Close menu"
                >
                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
            </div>
            <nav className="flex flex-col space-y-4">
                {navLinks.map(link => (
                    <a 
                        key={link.id} 
                        href={`#${link.id}`} 
                        onClick={(e) => handleNavClick(e, link.id)} 
                        className="text-lg text-light-text font-medium hover:text-primary transition py-2"
                    >
                        {link.name}
                    </a>
                ))}
            </nav>
        </div>
      </div>

      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-40">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center w-[95%] lg:w-[85%] max-w-7xl">
          <div className="flex items-center space-x-2 sm:space-x-3">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-primary" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zM8.5 15.5H7v-5h1.5v5zm3.5 0H10.5v-7H12v7zm3.5 0H14v-9h1.5v9z"/>
            </svg>
            <h1 className="text-lg sm:text-2xl font-bold text-dark-text">SCHD Dividend Calculator</h1>
          </div>
           <nav className="hidden md:flex space-x-6">
              {navLinks.map(link => (
                <a key={link.id} href={`#${link.id}`} onClick={(e) => handleNavClick(e, link.id)} className="text-light-text font-medium hover:text-primary transition cursor-pointer">{link.name}</a>
              ))}
           </nav>
           <div className="md:hidden">
            <button onClick={() => setIsMenuOpen(true)} className="text-dark-text focus:outline-none" aria-label="Open menu">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
            </button>
           </div>
        </div>
      </header>
      
      <main>
        {/* Calculator Section */}
        <section id="calculator" className="pt-12 pb-12 sm:pt-16 sm:pb-16 md:pt-24 md:pb-20 bg-white">
          <div className="container mx-auto px-4 grid md:grid-cols-2 gap-8 md:gap-12 items-center w-[95%] lg:w-[85%] max-w-7xl">
            {/* Input Form */}
            <div className="space-y-6">
              <h2 className="text-3xl sm:text-4xl font-bold text-dark-text leading-tight">Estimate Your SCHD Dividend Income</h2>
              <p className="text-lg text-light-text">Enter your investment details to see your potential passive income from SCHD dividends.</p>
              
              <div className="space-y-4">
                <div>
                  <label htmlFor="investment" className="block text-sm font-medium text-gray-700">Investment Amount ($)</label>
                  <input type="number" id="investment" value={investment} onChange={e => setInvestment(Number(e.target.value))} className="mt-1 block w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-primary focus:border-primary text-lg"/>
                </div>
                <div>
                  <label htmlFor="sharePrice" className="block text-sm font-medium text-gray-700">SCHD Share Price ($)</label>
                  <div className="relative mt-1">
                      <input 
                          type="number" 
                          id="sharePrice" 
                          value={sharePrice} 
                          onChange={e => setSharePrice(Number(e.target.value))} 
                          className="block w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-primary focus:border-primary text-lg pr-12"
                          disabled={isPriceLoading}
                          aria-describedby="price-status"
                      />
                      {isPriceLoading && (
                          <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none" aria-label="Loading price">
                              <svg className="animate-spin h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                              </svg>
                          </div>
                      )}
                  </div>
                  <div id="price-status" className="mt-1 text-sm">
                      {!isPriceLoading && !priceError && <p className="text-gray-500">Live price updated automatically.</p>}
                  </div>
                </div>
                <div>
                  <label htmlFor="yield" className="block text-sm font-medium text-gray-700">Dividend Yield %</label>
                  <input
                    type="number"
                    id="yield"
                    value={dividendYield.toFixed(2)}
                    readOnly
                    className="mt-1 block w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-primary focus:border-primary text-lg bg-gray-100 text-gray-600 cursor-not-allowed"
                    aria-describedby="yield-info"
                  />
                  <div className="mt-2 flex items-center rounded-lg p-1 bg-gray-200/75 text-sm font-medium">
                      <button
                          onClick={() => setYieldMethod('forward')}
                          className={`w-full text-center rounded-md py-1.5 transition-all duration-300 ${yieldMethod === 'forward' ? 'bg-white text-primary shadow' : 'text-gray-500 hover:bg-gray-300/50'}`}
                      >
                          Forward
                      </button>
                      <button
                          onClick={() => setYieldMethod('ttm')}
                          className={`w-full text-center rounded-md py-1.5 transition-all duration-300 ${yieldMethod === 'ttm' ? 'bg-white text-primary shadow' : 'text-gray-500 hover:bg-gray-300/50'}`}
                      >
                          TTM
                      </button>
                  </div>
                  <p id="yield-info" className="mt-2 text-sm text-gray-500">
                    {yieldMethod === 'forward'
                      ? 'Forward yield is based on the latest quarterly dividend.'
                      : 'TTM yield is based on the last four quarterly dividends.'}
                  </p>
                </div>
              </div>
              <div className="mt-6">
                {renderInfoBox()}
              </div>
            </div>

            {/* Result Display */}
            <Card className="bg-gradient-to-br from-accent-dark to-accent text-white flex flex-col justify-center">
                <p className="text-center text-lg opacity-90 mb-4">Based on your {formatCurrency(investment)} investment:</p>
                <div className="bg-white/20 p-1 rounded-full flex items-center mb-6">
                    {periodTabs.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActivePeriod(tab.id)}
                            className={`w-full text-center rounded-full py-2 text-sm font-semibold transition-all duration-300 ${activePeriod === tab.id ? 'bg-white text-accent-dark shadow-md' : 'text-white/80 hover:bg-white/30'}`}
                        >
                            {tab.name}
                        </button>
                    ))}
                </div>
                <div className="text-center">
                    <p className="text-base sm:text-lg opacity-90">Estimated {periodTabs.find(t => t.id === activePeriod)?.name} Income</p>
                    <p className="text-4xl sm:text-5xl font-extrabold my-2 tracking-tight">
                        <NumberTicker 
                            value={dividends[activePeriod]}
                            prefix="$"
                            duration={1000}
                            decimalPlaces={2}
                        />
                    </p>
                </div>
            </Card>
          </div>
        </section>

        {/* About Section */}
        <Section id="about" title="What is the SCHD Dividend Calculator?">
          <div className="max-w-3xl mx-auto text-center text-lg text-light-text space-y-4">
              <p>The SCHD Dividend Calculator is a specialized tool designed to help investors estimate their potential income from the Schwab U.S. Dividend Equity ETF™ (SCHD). Dividend Data, Calculation Logic and Inspiration sourced from <a href="https://schddividend.com/" target="_blank" rel="noopener noreferrer" className="text-accent hover:underline font-semibold">schddividend.com</a>, this calculator provides a user-friendly interface to project earnings based on your investment amount and up-to-date market data.</p>
              <p>Our goal is to offer a clear and intuitive way to visualize dividend returns, analyze historical payout trends, and better understand the potential of SCHD as a cornerstone for an income-focused portfolio.</p>
          </div>
        </Section>
        
        {/* Dividend Stats Section */}
        <Section id="stats" title="Dividend Statistics & History">
          <div className="grid md:grid-cols-3 gap-4 md:gap-6 mb-12">
            <StatCard color="primary" title="Current Dividend Yield" value={`${dividendYield.toFixed(2)}%`} icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>}/>
            <StatCard color="accent" title={annualDividendDisplay.label} value={annualDividendDisplay.value} icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 1v22M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" /></svg>}/>
            <StatCard color="primary" title="1-Year Dividend Growth" value={dividendGrowth !== 'N/A' ? `${dividendGrowth}%` : 'N/A'} icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" /></svg>} />
          </div>
          <Card>
            <h3 className="text-xl font-bold mb-1">Dividend Payout History</h3>
            <p className="text-light-text mb-6">Quarterly dividend per share paid to SCHD investors.</p>
            <div className="grid lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 h-72 sm:h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="date" tick={{fontSize: 12}} />
                    <YAxis tickFormatter={(value) => `$${value}`} tick={{fontSize: 12}} />
                    <Tooltip
                      formatter={(value: number) => [formatCurrency(value), 'Dividend']}
                      cursor={{fill: 'rgba(22, 163, 74, 0.1)'}}
                      contentStyle={{
                        backgroundColor: '#fff',
                        border: '1px solid #ddd',
                        borderRadius: '0.5rem'
                      }}
                    />
                    <Legend />
                    <Bar dataKey="dividend" fill="#16a34a" name="Dividend per Share" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="overflow-auto h-72 sm:h-80">
                <table className="w-full text-left">
                  <thead className="bg-gray-50 sticky top-0">
                    <tr>
                      <th className="p-3 text-sm font-semibold tracking-wide">Date</th>
                      <th className="p-3 text-sm font-semibold tracking-wide text-right">Dividend ($)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {DIVIDEND_HISTORY.map((item, index) => (
                      <tr key={index} className="hover:bg-gray-50">
                        <td className="p-3 text-sm text-gray-700">{item.date}</td>
                        <td className="p-3 text-sm text-gray-700 text-right font-medium">{item.dividend.toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </Card>
        </Section>
        
        {/* Features & How-to Section */}
        <Section id="features" title="Features & How To Use">
          <div className="grid md:grid-cols-2 gap-8 md:gap-12">
            <Card>
              <h3 className="text-xl font-bold mb-4">Calculator Features</h3>
              <ul className="space-y-3 text-light-text list-disc list-inside">
                  <li>Estimate dividend income across different timeframes.</li>
                  <li>Live share price and automatic dividend yield calculation.</li>
                  <li>View key metrics like dividend growth and TTM annual payout.</li>
                  <li>Visualize historical dividend payouts with an interactive chart.</li>
                  <li>Access a detailed dividend history table for reference.</li>
              </ul>
            </Card>
             <Card>
              <h3 className="text-xl font-bold mb-4">How To Use</h3>
              <ol className="space-y-3 text-light-text list-decimal list-inside">
                  <li><strong>Enter Your Investment:</strong> Simply input your total investment amount. The live share price and corresponding dividend yield are calculated automatically for you.</li>
                  <li><strong>Select a Timeframe:</strong> Click on the 'Daily', 'Monthly', 'Quarterly', or 'Annually' tabs to see your projected income for that period.</li>
                  <li><strong>Analyze & Explore:</strong> Scroll down to the statistics and interactive chart to understand SCHD's historical performance and dividend growth.</li>
              </ol>
            </Card>
          </div>
        </Section>

        {/* FAQ Section */}
        <Section id="faq" title="Frequently Asked Questions">
          <div className="max-w-3xl mx-auto">
            {FAQ_DATA.map((faq, index) => (
              <FaqItem
                key={index}
                question={faq.question}
                answer={faq.answer}
                isOpen={openFaqIndex === index}
                onToggle={() => setOpenFaqIndex(openFaqIndex === index ? null : index)}
              />
            ))}
          </div>
        </Section>
        
        {/* Disclaimer */}
        <section className="py-12 bg-gray-100">
          <div className="container mx-auto px-4 text-center text-sm text-gray-500 w-[95%] lg:w-[85%] max-w-4xl">
            <h3 className="font-bold text-base text-gray-600 mb-2">Disclaimer</h3>
            <p>This calculator is for educational and informational purposes only. It is not financial advice. The calculations are estimates based on the data you provide and do not guarantee future results. Dividend yields and payouts can change over time. Always conduct your own research and consult with a qualified financial advisor before making any investment decisions. Live share price data provided by <a href="https://finnhub.io/" target="_blank" rel="noopener noreferrer" className="text-accent hover:underline">Finnhub</a>.</p>
          </div>
        </section>

        {/* Featured Section */}
        <section className="py-12">
          <div className="container mx-auto px-4 w-[95%] lg:w-[85%] max-w-7xl">
            <div className="flex justify-center items-center gap-8 flex-wrap">
              <a href="https://fazier.com/launches/schddividendcalculator.netlify.app" target="_blank" rel="noopener noreferrer">
                <img src="https://fazier.com/api/v1//public/badges/launch_badges.svg?badge_type=launched&theme=light" width={120} alt="Fazier badge" />
              </a>
              <a href="https://dang.ai/" target="_blank" rel="noopener noreferrer">
                <img src="https://cdn.prod.website-files.com/63d8afd87da01fb58ea3fbcb/6487e2868c6c8f93b4828827_dang-badge.png" alt="Dang.ai" style={{width: '150px', height: '54px'}} width="150" height="54"/>
              </a>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-secondary text-white">
        <div className="container mx-auto px-4 py-6 text-center w-[95%] lg:w-[85%] max-w-7xl">
          <p>&copy; {new Date().getFullYear()} SCHD Dividend Calculator. All Rights Reserved.</p>
        </div>
      </footer>
      
      <ScrollToTopButton />
    </div>
  );
};

export default App;