import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import YahooFinance from "yahoo-finance2";

async function startServer() {
  const app = express();
  const PORT = 3000;
  
  // Follow the linter's suggestion if the default export is the class
  const yf = new (YahooFinance as any)();

  // Asset configuration
  const assets: Record<string, { code: string; yahooTickers: string[] }> = {
    kospi: { code: "069500", yahooTickers: ["069500.KS"] },
    kosdaq: { code: "229200", yahooTickers: ["229200.KQ", "229200.KS"] }, 
    sp500: { code: "379800", yahooTickers: ["379800.KS"] },
    nasdaq: { code: "379810", yahooTickers: ["379810.KS"] },
    china: { code: "192090", yahooTickers: ["192090.KS"] },
    india: { code: "453810", yahooTickers: ["453810.KS"] },
    japan: { code: "241180", yahooTickers: ["241180.KS"] },
    gold: { code: "411060", yahooTickers: ["411060.KS"] },
    star50: { code: "416090", yahooTickers: ["416090.KS"] },
    bitcoin: { code: "BITO", yahooTickers: ["BITO", "BTC-USD", "BITO.K"] }, 
  };

  // Diagnostic API to check raw ticker data
  app.get("/api/check-ticker/:ticker", async (req, res) => {
    try {
      const { ticker } = req.params;
      const startDate = new Date("2024-12-01");
      const endDate = new Date();
      const result = await yf.historical(ticker, {
        period1: startDate,
        period2: endDate,
        interval: "1d",
      });
      res.json({ ticker, count: result?.length || 0, sample: result?.slice(-1) });
    } catch (error: any) {
      res.status(500).json({ ticker: req.params.ticker, error: error.message });
    }
  });

  // API route to fetch market data from Yahoo Finance
  app.get("/api/market-data", async (req, res) => {
    try {
      console.log("Fetching market data series...");
      const startDate = new Date("2024-12-01"); 
      const endDate = new Date();

      const promises = Object.entries(assets).map(async ([key, asset]) => {
        let lastError = null;
        for (const ticker of asset.yahooTickers) {
          try {
            console.log(`Trying ${ticker} for ${key}...`);
            const result = await yf.historical(ticker, {
              period1: startDate,
              period2: endDate,
              interval: "1d",
            });
            
            if (result && result.length > 0) {
              console.log(`Successfully fetched ${result.length} points for ${key} using ${ticker}`);
              return { key, code: asset.code, data: result as any[] };
            }
          } catch (e) {
            lastError = e;
            console.warn(`Failed to fetch ${key} using ${ticker}:`, (e as any).message);
          }
        }
        console.error(`All tickers failed for ${key}.`);
        return { key, code: asset.code, data: [] };
      });

      const allResults = await Promise.all(promises);
      
      // Pivot data by month
      const monthlyDataMap: Record<string, any> = {};

      allResults.forEach(({ code, data }) => {
        // Group by month and pick the last available quote in that month
        const monthlyGroups: Record<string, any> = {};
        data.forEach((point: any) => {
          if (!point || !point.date) return;
          const d = new Date(point.date);
          const monthKey = `${d.getFullYear()}. ${String(d.getMonth() + 1).padStart(2, '0')}.`;
          
          if (!monthlyGroups[monthKey] || new Date(monthlyGroups[monthKey].date) < d) {
            monthlyGroups[monthKey] = point;
          }
        });

        // Add to the aligned monthly map
        Object.entries(monthlyGroups).forEach(([monthKey, point]) => {
          if (!monthlyDataMap[monthKey]) {
            const d = new Date(point.date);
            const dateStr = `${d.getFullYear()}. ${String(d.getMonth() + 1).padStart(2, '0')}. ${String(d.getDate()).padStart(2, '0')}.`;
            monthlyDataMap[monthKey] = { date: dateStr };
          }
          const price = point.close || point.adjClose;
          if (price !== undefined && price !== null) {
            monthlyDataMap[monthKey][code] = price;
          }
        });
      });

      const finalData = Object.values(monthlyDataMap).sort((a: any, b: any) => {
        return a.date.localeCompare(b.date);
      });

      res.json(finalData);
    } catch (error: any) {
      console.error("Error fetching from Yahoo Finance:", error);
      res.status(500).json({ 
        error: "Failed to fetch market data", 
        message: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
