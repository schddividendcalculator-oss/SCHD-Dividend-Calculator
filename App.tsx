import React, { useState, useEffect, useCallback } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { DIVIDEND_HISTORY, FAQ_DATA } from './constants';
import type { DividendData } from './types';

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
  answer: string;
}

const FaqItem: React.FC<FaqItemProps> = ({ question, answer }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="border-b border-gray-200 py-4">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex justify-between items-center text-left text-lg font-semibold text-dark-text hover:text-primary transition-colors"
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
    <div className="container mx-auto px-4 w-[95%] lg:w-4/5 max-w-7xl">
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

// --- Main App Component ---

type Period = 'daily' | 'monthly' | 'quarterly' | 'annually';

const App: React.FC = () => {
  const [investment, setInvestment] = useState<number>(1000);
  const [sharePrice, setSharePrice] = useState<number>(26);
  const [dividendYield, setDividendYield] = useState<number>(3.55);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [activePeriod, setActivePeriod] = useState<Period>('annually');

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
  }, [investment, dividendYield]);

  const dividends = calculateDividends();

  const formatCurrency = (value: number) => {
    return value.toLocaleString('en-US', { style: 'currency', currency: 'USD' });
  };
  
  const chartData = DIVIDEND_HISTORY.map(d => ({
    ...d,
    date: new Date(d.date).toLocaleDateString('en-US', { year: 'numeric', month: 'short' })
  })).reverse();
  
  const dividendGrowth = (() => {
      const lastYearDividend = DIVIDEND_HISTORY.slice(0, 4).reduce((acc, curr) => acc + curr.dividend, 0);
      const prevYearDividend = DIVIDEND_HISTORY.slice(4, 8).reduce((acc, curr) => acc + curr.dividend, 0);
      return ((lastYearDividend - prevYearDividend) / prevYearDividend * 100).toFixed(2);
  })();

  const avgAnnualDividend = (DIVIDEND_HISTORY.slice(0, 4).reduce((acc, curr) => acc + curr.dividend, 0)).toFixed(2);
  
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
        <div className="container mx-auto px-4 py-4 flex justify-between items-center w-[95%] lg:w-4/5 max-w-7xl">
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
          <div className="container mx-auto px-4 grid md:grid-cols-2 gap-8 md:gap-12 items-center w-[95%] lg:w-4/5 max-w-7xl">
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
                  <input type="number" id="sharePrice" value={sharePrice} onChange={e => setSharePrice(Number(e.target.value))} className="mt-1 block w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-primary focus:border-primary text-lg"/>
                </div>
                <div>
                  <label htmlFor="yield" className="block text-sm font-medium text-gray-700">Dividend Yield (%)</label>
                  <input type="number" id="yield" value={dividendYield} onChange={e => setDividendYield(Number(e.target.value))} className="mt-1 block w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-primary focus:border-primary text-lg"/>
                </div>
              </div>
               <div className="bg-accent/10 border-l-4 border-accent text-accent-dark p-4 rounded-r-lg">
                <div className="flex">
                  <div className="py-1"><svg className="fill-current h-6 w-6 text-accent mr-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M2.93 17.07A10 10 0 1 1 17.07 2.93 10 10 0 0 1 2.93 17.07zM9 11v4h2v-4h-2zm0-4h2v2h-2V7z"/></svg></div>
                  <div>
                    <p className="font-semibold">For accurate results, use the latest data.</p>
                    <a href="https://finance.yahoo.com/quote/SCHD/" target="_blank" rel="noopener noreferrer" className="text-sm font-medium underline hover:opacity-80">
                      Get live SCHD data from Yahoo Finance &rarr;
                    </a>
                  </div>
                </div>
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
                        {formatCurrency(dividends[activePeriod])}
                    </p>
                </div>
            </Card>
          </div>
        </section>

        {/* About Section */}
        <Section id="about" title="What is SCHD?">
          <div className="max-w-3xl mx-auto text-center text-lg text-light-text space-y-4">
             <p>The Schwab U.S. Dividend Equity ETF™ (SCHD) is one of the most popular dividend-focused exchange-traded funds. It aims to track the total return of the Dow Jones U.S. Dividend 100™ Index.</p>
             <p>This index is comprised of 100 high-quality, dividend-paying U.S. stocks that have a record of consistently paying dividends and the financial strength to continue doing so. The fund is known for its low expense ratio and focus on fundamentally sound companies, making it a cornerstone for many dividend income investors.</p>
          </div>
        </Section>
        
        {/* Dividend Stats Section */}
        <Section id="stats" title="Dividend Statistics & History">
          <div className="grid md:grid-cols-3 gap-4 md:gap-6 mb-12">
            <StatCard color="primary" title="Current Dividend Yield" value={`${dividendYield.toFixed(2)}%`} icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>}/>
            <StatCard color="accent" title="Avg. Annual Dividend (TTM)" value={`$${avgAnnualDividend}`} icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v.01" /></svg>}/>
            <StatCard color="primary" title="1-Year Dividend Growth" value={`${dividendGrowth}%`} icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" /></svg>} />
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
                  <li>Estimate dividend income across five different timeframes.</li>
                  <li>Adjust investment amount, share price, and yield for custom scenarios.</li>
                  <li>View key metrics like dividend growth and average annual payout.</li>
                  <li>Visualize historical dividend payouts with an interactive chart.</li>
                  <li>Access a detailed dividend history table.</li>
              </ul>
            </Card>
             <Card>
              <h3 className="text-xl font-bold mb-4">How To Use</h3>
              <ol className="space-y-3 text-light-text list-decimal list-inside">
                  <li><strong>Enter Your Data:</strong> Input your total investment amount, the current SCHD share price, and the annual dividend yield.</li>
                  <li><strong>Review Projections:</strong> Instantly see your estimated dividend income for daily, weekly, monthly, quarterly, and yearly periods.</li>
                  <li><strong>Analyze Trends:</strong> Scroll down to the statistics and chart to understand SCHD's historical dividend performance.</li>
              </ol>
            </Card>
          </div>
        </section>

        {/* FAQ Section */}
        <Section id="faq" title="Frequently Asked Questions">
          <div className="max-w-3xl mx-auto">
            {FAQ_DATA.map((faq, index) => (
              <FaqItem key={index} question={faq.question} answer={faq.answer} />
            ))}
          </div>
        </Section>
        
        {/* Disclaimer */}
        <section className="py-12 bg-gray-100">
          <div className="container mx-auto px-4 text-center text-sm text-gray-500 w-[95%] lg:w-4/5 max-w-4xl">
            <h3 className="font-bold text-base text-gray-600 mb-2">Disclaimer</h3>
            <p>This calculator is for educational and informational purposes only. It is not financial advice. The calculations are estimates based on the data you provide and do not guarantee future results. Dividend yields and payouts can change over time. Always conduct your own research and consult with a qualified financial advisor before making any investment decisions.</p>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-secondary text-white">
        <div className="container mx-auto px-4 py-6 text-center w-[95%] lg:w-4/5 max-w-7xl">
          <p>&copy; {new Date().getFullYear()} SCHD Dividend Calculator. All Rights Reserved.</p>
        </div>
      </footer>
      
      <ScrollToTopButton />
    </div>
  );
};

export default App;