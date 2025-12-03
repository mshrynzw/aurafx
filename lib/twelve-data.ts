export interface CandleData {
    datetime: string;
    open: string;
    high: string;
    low: string;
    close: string;
    volume: string;
  }
  
  export interface TwelveDataResponse {
    meta: {
      symbol: string;
      interval: string;
      currency_base: string;
      currency_quote: string;
      exchange: string;
      type: string;
    };
    values: CandleData[];
    status: string;
  }
  
  export interface FetchCandleDataOptions {
    symbol?: string;
    interval?: string;
    startDate?: string; // YYYY-MM-DD形式
    endDate?: string;   // YYYY-MM-DD形式
    outputsize?: number; // 取得するデータポイント数
  }

  export async function fetchCandleData(
    apiKey: string,
    options: FetchCandleDataOptions = {}
  ): Promise<TwelveDataResponse> {
    const {
      symbol = 'USD/JPY',
      interval = '1h',
      startDate,
      endDate,
      outputsize,
    } = options;

    // URLパラメータの構築
    const params = new URLSearchParams({
      symbol,
      interval,
      apikey: apiKey,
      format: 'JSON',
    });

    // 過去3年分のデータを取得（デフォルト）
    if (!startDate && !endDate) {
      const end = new Date();
      const start = new Date();
      start.setFullYear(start.getFullYear() - 3);
      
      params.append('start_date', start.toISOString().split('T')[0]);
      params.append('end_date', end.toISOString().split('T')[0]);
    } else {
      if (startDate) params.append('start_date', startDate);
      if (endDate) params.append('end_date', endDate);
    }

    // outputsizeが指定されている場合は追加
    if (outputsize) {
      params.append('outputsize', outputsize.toString());
    }

    const url = `https://api.twelvedata.com/time_series?${params.toString()}`;
    
    const response = await fetch(url);
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to fetch data: ${response.statusText} - ${errorText}`);
    }
    
    const data = await response.json();
    
    // エラーレスポンスのチェック
    if (data.status === 'error' || data.message) {
      throw new Error(`API Error: ${data.message || JSON.stringify(data)}`);
    }
    
    return data;
  }

  // 後方互換性のための関数（旧API）
  export async function fetchCandleDataLegacy(
    symbol: string = 'USD/JPY',
    interval: string = '1h',
    apiKey: string
  ): Promise<TwelveDataResponse> {
    return fetchCandleData(apiKey, { symbol, interval });
  }
  
  export function transformCandleData(data: TwelveDataResponse) {
    return data.values
      .map((candle) => ({
        time: new Date(candle.datetime).getTime() / 1000,
        open: parseFloat(candle.open),
        high: parseFloat(candle.high),
        low: parseFloat(candle.low),
        close: parseFloat(candle.close),
        volume: parseFloat(candle.volume),
      }))
      .reverse(); // 時系列順にソート
  }