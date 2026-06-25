import type { ReactNode } from 'react';

export interface DividendData {
  date: string;
  dividend: number;
}

export interface FaqItem {
  question: string;
  answer: ReactNode;
}
