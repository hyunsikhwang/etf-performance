import { useState, useMemo, useEffect } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  BarChart,
  Bar,
  ReferenceLine,
  Cell,
  LabelList,
} from 'recharts';
import {
  TrendingUp,
  TrendingDown,
  BarChart3,
  LineChart as LineChartIcon,
  Table as TableIcon,
  ChevronRight,
  Info,
  Maximize2,
  Calendar,
  RefreshCw,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { assets } from './data';
import { cn } from './lib/utils';
import { fetchMarketData, calculateReturns } from './services/marketService';

export default function App() {
  const [performanceData, setPerformanceData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedAssets, setSelectedAssets] = useState<string[]>(Object.keys(assets));
  const [viewMode, setViewMode] = useState<'chart' | 'table'>('chart');
  const [chartType, setChartType] = useState<'yearly' | 'monthly'>('yearly');

  const [selectedYear, setSelectedYear] = useState<string>('2026');
  const [selectedMonth, setSelectedMonth] = useState<string>('');

  useEffect(() => {
    if (performanceData.length > 0) {
      const latest = performanceData[performanceData.length - 1];
      setSelectedMonth(latest.date);
      setSelectedYear(latest.date.split('.')[0].trim());
    }
  }, [performanceData]);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const prices = await fetchMarketData();
      const processedData = calculateReturns(prices);
      console.log("App Performance Data (Processed):", processedData); 
      if (processedData.length === 0) {
        throw new Error("No market data returned from intelligence service.");
      }
      setPerformanceData(processedData);
    } catch (err: any) {
      setError(err.message || "Failed to sync with market data service.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const toggleAsset = (key: string) => {
    setSelectedAssets((prev) =>
      prev.includes(key) ? prev.filter((a) => a !== key) : [...prev, key]
    );
  };

  const latestData = performanceData && performanceData.length > 0 ? performanceData[performanceData.length - 1] : null;

  const chartData = useMemo(() => {
    if (!performanceData.length) return [];

    let targetRecord = null;
    if (chartType === 'yearly') {
      // For yearly, we want the "latest" record of that year in our data
      targetRecord = [...performanceData].reverse().find(p => p.date.startsWith(selectedYear));
    } else {
      targetRecord = performanceData.find(p => p.date === selectedMonth);
    }

    if (!targetRecord) return [];

    const fieldSuffix = chartType === 'yearly' ? '_year' : '_mon';
    
    return selectedAssets.map(key => ({
      name: assets[key].subName,
      value: Number(targetRecord[`${key}${fieldSuffix}`]) || 0,
      color: assets[key].color,
    })).sort((a, b) => b.value - a.value);
  }, [performanceData, chartType, selectedYear, selectedMonth, selectedAssets]);

  const availableYears = useMemo(() => {
    const years = new Set(performanceData.map(p => p.date.split('.')[0].trim()));
    return Array.from(years).sort().reverse();
  }, [performanceData]);

  const availableMonths = useMemo(() => {
    return performanceData
      .filter(p => !p.date.includes('2024. 12.')) // Skip baseline month
      .map(p => p.date)
      .reverse();
  }, [performanceData]);

  const sortedStats = useMemo(() => {
    if (!latestData || !performanceData.length) return [];
    return Object.keys(assets)
      .map((key) => ({
        key,
        name: assets[key].subName,
        value: Number(latestData[`${key}_year`]) || 0,
        color: assets[key].color,
      }))
      .sort((a, b) => b.value - a.value);
  }, [latestData, performanceData]);

  const topPerformer = sortedStats[0];
  const worstPerformer = sortedStats[sortedStats.length - 1];

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F0F2F5] flex flex-col items-center justify-center p-6 text-center">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white p-12 rounded-3xl border border-[#D2D2D7] shadow-xl max-w-md w-full space-y-6"
        >
          <div className="relative w-20 h-20 mx-auto">
            <motion.div 
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
              className="absolute inset-0 rounded-full border-t-2 border-b-2 border-blue-600"
            />
            <div className="absolute inset-0 flex items-center justify-center">
              <TrendingUp className="text-blue-600" size={32} />
            </div>
          </div>
          <div>
            <h2 className="text-xl font-semibold tracking-tight text-[#1D1D1F]">Syncing Market Data</h2>
            <p className="text-sm text-[#86868B] mt-2 leading-relaxed">
              Gemini is searching Google Finance for the latest ETF historical prices and calculating performance metrics...
            </p>
          </div>
          <div className="flex gap-1 justify-center">
            {[0, 1, 2].map((i) => (
              <motion.div
                key={i}
                animate={{ opacity: [0.3, 1, 0.3] }}
                transition={{ repeat: Infinity, duration: 1.5, delay: i * 0.2 }}
                className="w-2 h-2 rounded-full bg-blue-600"
              />
            ))}
          </div>
        </motion.div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#F0F2F5] flex flex-col items-center justify-center p-6 text-center">
        <div className="bg-white p-12 rounded-3xl border border-red-100 shadow-xl max-w-md w-full space-y-6">
          <div className="w-16 h-16 bg-red-50 text-red-600 rounded-2xl flex items-center justify-center mx-auto">
            <AlertCircle size={32} />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-[#1D1D1F]">Connection Failed</h2>
            <p className="text-sm text-[#86868B] mt-2">{error}</p>
          </div>
          <button 
            onClick={loadData}
            className="w-full py-3 bg-[#1D1D1F] text-white rounded-xl font-medium hover:bg-black transition-colors flex items-center justify-center gap-2"
          >
            <RefreshCw size={18} /> Retry Sync
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F0F2F5] text-[#1D1D1F] font-sans selection:bg-blue-100 selection:text-blue-900">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-[#D2D2D7] px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#1D1D1F] rounded-xl flex items-center justify-center text-white">
              <TrendingUp size={24} />
            </div>
            <div>
              <h1 className="text-xl font-semibold tracking-tight">ETF Performance</h1>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <button 
              onClick={loadData}
              className="p-2 hover:bg-[#F5F5F7] rounded-lg transition-colors border border-transparent hover:border-[#D2D2D7]"
              title="Refresh Data"
            >
              <RefreshCw size={18} className="text-[#86868B]" />
            </button>
            <div className="flex bg-[#F5F5F7] p-1 rounded-lg border border-[#D2D2D7]">
              <button
                onClick={() => setViewMode('chart')}
                className={cn(
                  "px-4 py-1.5 rounded-md text-sm font-medium transition-all duration-200 flex items-center gap-2",
                  viewMode === 'chart' ? "bg-white text-[#1D1D1F] shadow-sm" : "text-[#86868B] hover:text-[#1D1D1F]"
                )}
              >
                <LineChartIcon size={16} /> Dashboard
              </button>
              <button
                onClick={() => setViewMode('table')}
                className={cn(
                  "px-4 py-1.5 rounded-md text-sm font-medium transition-all duration-200 flex items-center gap-2",
                  viewMode === 'table' ? "bg-white text-[#1D1D1F] shadow-sm" : "text-[#86868B] hover:text-[#1D1D1F]"
                )}
              >
                <TableIcon size={16} /> Raw Data
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8 space-y-8">
        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white p-6 rounded-2xl border border-[#D2D2D7] shadow-sm group hover:shadow-md transition-shadow"
          >
            <div className="flex justify-between items-start mb-4">
              <div className="p-2 bg-green-50 text-green-600 rounded-lg">
                <TrendingUp size={20} />
              </div>
              <span className="text-[10px] font-bold text-[#86868B] uppercase tracking-widest">Top Performer</span>
            </div>
            <h3 className="text-sm font-medium text-[#86868B] mb-1">{topPerformer?.name || 'N/A'}</h3>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-semibold tracking-tight text-green-600">
                +{topPerformer?.value.toFixed(1) || '0.0'}%
              </span>
              <span className="text-xs font-medium text-[#86868B]">Yearly</span>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white p-6 rounded-2xl border border-[#D2D2D7] shadow-sm group hover:shadow-md transition-shadow"
          >
            <div className="flex justify-between items-start mb-4">
              <div className="p-2 bg-red-50 text-red-600 rounded-lg">
                <TrendingDown size={20} />
              </div>
              <span className="text-[10px] font-bold text-[#86868B] uppercase tracking-widest">Bottom Performer</span>
            </div>
            <h3 className="text-sm font-medium text-[#86868B] mb-1">{worstPerformer?.name || 'N/A'}</h3>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-semibold tracking-tight text-red-600">
                {worstPerformer?.value.toFixed(1) || '0.0'}%
              </span>
              <span className="text-xs font-medium text-[#86868B]">Yearly</span>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white p-6 rounded-2xl border border-[#D2D2D7] shadow-sm group hover:shadow-md transition-shadow"
          >
            <div className="flex justify-between items-start mb-4">
              <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                <Calendar size={20} />
              </div>
              <span className="text-[10px] font-bold text-[#86868B] uppercase tracking-widest">Last Updated</span>
            </div>
            <h3 className="text-sm font-medium text-[#86868B] mb-1">Market Period</h3>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-semibold tracking-tight">
                {latestData?.date || 'Syncing...'}
              </span>
            </div>
          </motion.div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar Filters */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-white p-6 rounded-2xl border border-[#D2D2D7] shadow-sm">
              <h2 className="text-sm font-semibold mb-4 flex items-center gap-2">
                <Info size={16} className="text-[#86868B]" />
                Asset Allocation
              </h2>
              <div className="space-y-2">
                {Object.entries(assets).map(([key, asset]) => (
                  <button
                    key={key}
                    onClick={() => toggleAsset(key)}
                    className={cn(
                      "w-full flex items-center justify-between p-2.5 rounded-xl text-sm font-medium transition-all",
                      selectedAssets.includes(key) 
                        ? "bg-[#F5F5F7] text-[#1D1D1F]" 
                        : "text-[#86868B] hover:bg-[#F5F5F7]/50"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <div 
                        className="w-3 h-3 rounded-full shrink-0" 
                        style={{ backgroundColor: selectedAssets.includes(key) ? asset.color : '#D2D2D7' }}
                      />
                      <div className="text-left">
                        <div className="truncate w-32">{asset.subName}</div>
                        <div className="text-[10px] opacity-60 tabular-nums">{asset.code}</div>
                      </div>
                    </div>
                    <ChevronRight size={14} className={cn("transition-transform", selectedAssets.includes(key) ? "rotate-90 text-[#1D1D1F]" : "text-[#D2D2D7]")} />
                  </button>
                ))}
              </div>
              <div className="mt-6 pt-6 border-t border-[#D2D2D7] flex gap-2">
                <button 
                  onClick={() => setSelectedAssets(Object.keys(assets))}
                  className="text-[11px] font-bold uppercase tracking-wider text-blue-600 hover:text-blue-700"
                >
                  Select All
                </button>
                <span className="text-[#D2D2D7]">|</span>
                <button 
                  onClick={() => setSelectedAssets([])}
                  className="text-[11px] font-bold uppercase tracking-wider text-[#86868B] hover:text-[#1D1D1F]"
                >
                  Clear
                </button>
              </div>
            </div>
          </div>

          {/* Main Visual Content */}
          <div className="lg:col-span-3 space-y-6">
            <div className="w-full">
              {viewMode === 'chart' ? (
                <div
                  className="bg-white p-8 rounded-3xl border border-[#D2D2D7] shadow-sm min-h-[600px] flex flex-col"
                >
                  <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
                    <div>
                      <h2 className="text-2xl font-semibold tracking-tight">Performance Analytics</h2>
                      <div className="flex items-center gap-2 text-sm text-[#86868B]">
                        <span>Comparing returns across all global markets</span>
                        {performanceData.length > 0 && (
                          <>
                            <span className="text-[#D2D2D7]">|</span>
                            <span className="text-[10px] uppercase font-bold tracking-widest text-green-600">
                              Direct Yahoo Data
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-3">
                      {/* Period Switcher */}
                      <div className="flex bg-[#F5F5F7] p-1 rounded-xl border border-[#D2D2D7]">
                        <button
                          onClick={() => setChartType('yearly')}
                          className={cn(
                            "px-4 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wider transition-all",
                            chartType === 'yearly' ? "bg-white text-blue-600 shadow-sm" : "text-[#86868B] hover:text-[#1D1D1F]"
                          )}
                        >
                          Yearly
                        </button>
                        <button
                          onClick={() => setChartType('monthly')}
                          className={cn(
                            "px-4 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wider transition-all",
                            chartType === 'monthly' ? "bg-white text-blue-600 shadow-sm" : "text-[#86868B] hover:text-[#1D1D1F]"
                          )}
                        >
                          Monthly
                        </button>
                      </div>

                      {/* Detail Selector */}
                      {chartType === 'yearly' ? (
                        <select 
                          value={selectedYear}
                          onChange={(e) => setSelectedYear(e.target.value)}
                          className="bg-white border border-[#D2D2D7] rounded-xl px-3 py-1.5 text-xs font-semibold outline-none focus:ring-2 focus:ring-blue-500/20"
                        >
                          {availableYears.map(year => (
                            <option key={year} value={year}>{year}</option>
                          ))}
                        </select>
                      ) : (
                        <select 
                          value={selectedMonth}
                          onChange={(e) => setSelectedMonth(e.target.value)}
                          className="bg-white border border-[#D2D2D7] rounded-xl px-3 py-1.5 text-xs font-semibold outline-none focus:ring-2 focus:ring-blue-500/20 max-w-[140px]"
                        >
                          {availableMonths.map(month => (
                            <option key={month} value={month}>{month}</option>
                          ))}
                        </select>
                      )}
                    </div>
                  </div>

                  <div className="flex-1 w-full relative" style={{ height: '500px', minHeight: '500px' }}>
                    {chartData.length > 0 ? (
                      <div className="absolute inset-0 w-full h-full">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart
                            layout="vertical"
                            data={chartData}
                            margin={{ top: 5, right: 30, left: 40, bottom: 5 }}
                          >
                            <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#E5E7EB" />
                            <XAxis 
                              type="number" 
                              fontSize={10} 
                              stroke="#86868B"
                              tickFormatter={(val) => `${val}%`}
                              axisLine={{ stroke: '#D2D2D7' }}
                            />
                            <YAxis 
                              type="category" 
                              dataKey="name" 
                              fontSize={11} 
                              width={80}
                              stroke="#1D1D1F" 
                              axisLine={{ stroke: '#D2D2D7' }}
                              tickLine={false}
                            />
                            <Tooltip
                              cursor={{ fill: '#F9F9FB' }}
                              contentStyle={{ borderRadius: '12px', border: '1px solid #D2D2D7', fontSize: '12px' }}
                              formatter={(value: number) => [`${value.toFixed(2)}%`, 'Return']}
                            />
                            <ReferenceLine x={0} stroke="#1D1D1F" strokeWidth={1} />
                            <Bar 
                              dataKey="value" 
                              radius={[0, 4, 4, 0]}
                              isAnimationActive={true}
                              animationDuration={1000}
                            >
                              {chartData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.color} />
                              ))}
                              <LabelList 
                                dataKey="value" 
                                position="right" 
                                style={{ fontSize: '10px', fontWeight: '600', fill: '#1D1D1F' }} 
                                formatter={(val: number) => `${val.toFixed(2)}%`}
                              />
                            </Bar>
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    ) : (
                      <div className="h-full w-full flex items-center justify-center text-[#86868B] text-sm italic">
                        No data found for the selected period.
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div
                  className="bg-white rounded-3xl border border-[#D2D2D7] shadow-sm overflow-hidden"
                >
                  <div className="p-6 border-b border-[#D2D2D7] flex justify-between items-center">
                    <h2 className="text-xl font-semibold">Live Performance Data</h2>
                    <button className="p-2 hover:bg-[#F5F5F7] rounded-lg transition-colors">
                      <Maximize2 size={18} className="text-[#86868B]" />
                    </button>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left border-collapse">
                      <thead>
                        <tr className="bg-[#F5F5F7] border-b border-[#D2D2D7]">
                          <th className="px-6 py-4 font-semibold text-[#1D1D1F] sticky left-0 bg-[#F5F5F7] z-10 border-r border-[#D2D2D7]">Date</th>
                          {selectedAssets.map((key) => (
                            <th key={key} className="px-6 py-4 font-semibold text-[#1D1D1F] border-r border-[#D2D2D7]">
                              <div className="truncate w-24">{assets[key].subName}</div>
                              <div className="text-[10px] text-[#86868B] font-mono">{assets[key].code}</div>
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {performanceData.map((row, idx) => (
                          <tr 
                            key={row.date} 
                            className={cn(
                              "border-b border-[#D2D2D7] transition-colors",
                              idx % 2 === 0 ? "bg-white" : "bg-[#F9F9FB]",
                              "hover:bg-blue-50/30"
                            )}
                          >
                            <td className="px-6 py-4 font-medium text-[#1D1D1F] sticky left-0 z-10 border-r border-[#D2D2D7] bg-inherit whitespace-nowrap">
                              {row.date}
                            </td>
                            {selectedAssets.map((key) => {
                              const val = row[`${key}_price`] as number;
                              // Korean stocks have 6-digit numeric codes
                              const isIntegerAsset = /^\d{6}$/.test(assets[key].code);
                              
                              return (
                                <td key={key} className="px-6 py-4 border-r border-[#D2D2D7] font-mono text-right">
                                  <span className="font-medium text-[#1D1D1F]">
                                    {val 
                                      ? (isIntegerAsset 
                                          ? Math.round(val).toLocaleString() 
                                          : (val > 1000 ? val.toLocaleString(undefined, {minimumFractionDigits: 0, maximumFractionDigits: 2}) : val.toFixed(2))) 
                                      : 'N/A'
                                    }
                                  </span>
                                </td>
                              );
                            })}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      <footer className="max-w-7xl mx-auto px-6 py-12 border-t border-[#D2D2D7]">
        <div className="flex flex-col md:flex-row justify-between items-start gap-8">
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-[#1D1D1F] rounded-md flex items-center justify-center text-white">
                <TrendingUp size={14} />
              </div>
              <span className="font-semibold tracking-tight">KODEX Analytics Live</span>
            </div>
            <p className="text-xs text-[#86868B] max-w-xs leading-relaxed">
              Performance calculated automatically based on historical closing prices.
            </p>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-3 gap-12">
            <div>
              <h4 className="text-[10px] font-bold uppercase tracking-widest text-[#86868B] mb-4">Resources</h4>
              <ul className="space-y-3 text-xs font-medium">
                <li className="hover:text-blue-600 cursor-pointer transition-colors">Market methodology</li>
                <li className="hover:text-blue-600 cursor-pointer transition-colors">Gemini Grounding</li>
                <li className="hover:text-blue-600 cursor-pointer transition-colors">ETF Tickers</li>
              </ul>
            </div>
            <div>
              <h4 className="text-[10px] font-bold uppercase tracking-widest text-[#86868B] mb-4">Integrations</h4>
              <ul className="space-y-3 text-xs font-medium">
                <li className="hover:text-blue-600 cursor-pointer transition-colors flex items-center gap-1"><Info size={12} /> Google Search</li>
                <li className="hover:text-blue-600 cursor-pointer transition-colors flex items-center gap-1"><Info size={12} /> Gemini 3.1</li>
              </ul>
            </div>
          </div>
        </div>
        <div className="mt-12 pt-8 border-t border-[#D2D2D7] text-[10px] text-[#86868B] flex flex-col md:flex-row justify-between items-center gap-4">
          <p>© 2026 KODEX Global Market Intelligence. All rights reserved.</p>
          <div className="flex gap-6">
            <span className="flex items-center gap-1">Data: Intelligence-Augmented</span>
            <span className="flex items-center gap-1"><TableIcon size={12} /> V3.1-live</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
