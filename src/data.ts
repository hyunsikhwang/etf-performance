export interface AssetInfo {
  name: string;
  subName: string;
  code: string;
  color: string;
}

export const assets: Record<string, AssetInfo> = {
  kospi: { name: 'KODEX 200', subName: 'KOSPI', code: '069500', color: '#1a73e8' },
  kosdaq: { name: 'KODEX 코스닥150', subName: 'KOSDAQ', code: '229200', color: '#ea4335' },
  sp500: { name: 'KODEX 미국S&P500', subName: 'S&P', code: '379800', color: '#f9ab00' },
  nasdaq: { name: 'KODEX 미국나스닥100', subName: 'NASDAQ', code: '379810', color: '#34a853' },
  china: { name: 'TIGER 차이나CSI300', subName: 'China', code: '192090', color: '#a142f4' },
  india: { name: 'KODEX 인도Nifty50', subName: 'India', code: '453810', color: '#24c1e0' },
  japan: { name: 'TIGER 일본니케이225', subName: 'Japan', code: '241180', color: '#ff6d01' },
  gold: { name: 'ACE KRX금현물', subName: 'Gold', code: '411060', color: '#fbc02d' },
  star50: { name: 'ACE 중국과창판STAR50', subName: 'Chasdaq', code: '416090', color: '#ec407a' },
  bitcoin: { name: 'BitCoin', subName: 'BitCoin', code: 'BITO', color: '#455a64' },
};
