import React from 'react';
import type { DividendData, FaqItem } from './types';

export const DIVIDEND_HISTORY: DividendData[] = [
  { date: "6/25/2025", dividend: 0.26 },
  { date: "3/26/2025", dividend: 0.25 },
  { date: "12/11/2024", dividend: 0.26 },
  { date: "9/25/2024", dividend: 0.25 },
  { date: "6/26/2024", dividend: 0.27 },
  { date: "3/20/2024", dividend: 0.20 },
  { date: "12/6/2023", dividend: 0.25 },
  { date: "9/20/2023", dividend: 0.22 },
  { date: "6/21/2023", dividend: 0.22 },
  { date: "3/22/2023", dividend: 0.20 },
  { date: "12/7/2022", dividend: 0.23 },
  { date: "9/21/2022", dividend: 0.21 },
  { date: "6/22/2022", dividend: 0.23 },
  { date: "3/23/2022", dividend: 0.17 },
  { date: "12/8/2021", dividend: 0.21 },
  { date: "9/22/2021", dividend: 0.20 },
  { date: "6/23/2021", dividend: 0.18 },
  { date: "3/24/2021", dividend: 0.17 },
  { date: "12/10/2020", dividend: 0.20 },
  { date: "9/23/2020", dividend: 0.18 },
];

export const FAQ_DATA: FaqItem[] = [
  {
    question: "What is SCHD?",
    answer: "SCHD stands for the Schwab U.S. Dividend Equity ETF™. It is an exchange-traded fund designed to track the performance of the Dow Jones U.S. Dividend 100™ Index, which is composed of high-dividend-yielding U.S. stocks with a history of consistent dividend payments and strong fundamental characteristics."
  },
  {
    question: "How often does SCHD pay dividends?",
    answer: "SCHD typically pays dividends to its shareholders on a quarterly basis, usually in March, June, September, and December."
  },
  {
    question: "Is this calculator's data live?",
    answer: React.createElement(
      React.Fragment,
      null,
      'Yes, the SCHD share price is automatically fetched from a live data source (',
      React.createElement(
        'a',
        {
          href: 'https://finnhub.io/',
          target: '_blank',
          rel: 'noopener noreferrer',
          className: 'text-accent hover:underline',
        },
        'Finnhub'
      ),
      ') when you load the page. For the most accurate dividend projection, you should manually update the dividend yield percentage from a trusted financial source like Yahoo Finance.'
    )
  },
  {
    question: "Does this calculator account for dividend reinvestment (DRIP)?",
    answer: "This tool calculates simple dividend income based on your initial investment and does not automatically compound or reinvest dividends. It provides a snapshot of your potential income for a given period based on the inputs."
  },
  {
    question: "What is a dividend yield?",
    answer: "The dividend yield is a financial ratio that shows how much a company pays out in dividends each year relative to its stock price. It is calculated by dividing the annual dividend per share by the current market price per share and is expressed as a percentage."
  }
];