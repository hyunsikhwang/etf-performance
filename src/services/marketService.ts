import { assets } from "../data";

export interface PricePoint {
  date: string;
  [ticker: string]: number | string;
}

export async function fetchMarketData(): Promise<PricePoint[]> {
  try {
    const response = await fetch('/api/market-data');
    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }
    const data = await response.json();
    return data as PricePoint[];
  } catch (error) {
    console.error("Error fetching market data from server:", error);
    throw error;
  }
}

export function calculateReturns(prices: PricePoint[]): any[] {
  if (prices.length === 0) return [];

  prices.sort((a, b) => a.date.localeCompare(b.date));

  const results: any[] = [];

  for (let i = 0; i < prices.length; i++) {
    const current = prices[i];
    const prev = i > 0 ? prices[i - 1] : prices[0];
    
    // Find the price at the end of the previous year for yearly return
    const currentYear = current.date.split('.')[0].trim();
    const prevYearEntry = prices.find(p => {
      const parts = p.date.split('.').map(s => s.trim()).filter(s => s !== '');
      const pYear = parts[0];
      const pMonth = parts[1];
      // We want the end of previous year (Dec)
      return pYear === String(Number(currentYear) - 1) && pMonth === '12';
    }) || prices[0]; // Fallback to first entry if no prev year dec found

    const entry: any = { date: current.date };

    Object.keys(assets).forEach((key) => {
      const code = assets[key].code;
      const curNum = Number(current[code]);
      const prevNum = Number(prev[code]);
      const yearStartNum = Number(prevYearEntry[code]);

      // Monthly return
      if (!isNaN(curNum) && !isNaN(prevNum) && prevNum !== 0 && i > 0) {
        entry[`${key}_mon`] = Number(((curNum / prevNum - 1) * 100).toFixed(2));
      } else {
        entry[`${key}_mon`] = 0;
      }

      // Yearly return
      if (!isNaN(curNum) && !isNaN(yearStartNum) && yearStartNum !== 0) {
        entry[`${key}_year`] = Number(((curNum / yearStartNum - 1) * 100).toFixed(2));
      } else {
        entry[`${key}_year`] = 0;
      }
      
      const baseNum = Number(prices[0][code]);
      entry[`${key}_cum`] = (!isNaN(baseNum) && !isNaN(curNum) && baseNum !== 0) 
        ? Number(((curNum / baseNum - 1) * 100).toFixed(2)) 
        : 0;

      // Keep original price for raw data view
      entry[`${key}_price`] = curNum;
    });

    results.push(entry);
  }

  return results;
}
