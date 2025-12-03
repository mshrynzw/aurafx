import { transformCandleData, type TwelveDataResponse } from '@/lib/twelve-data';

describe('transformCandleData', () => {
  it('should transform candle data correctly', () => {
    const mockData: TwelveDataResponse = {
      meta: {
        symbol: 'USD/JPY',
        interval: '1h',
        currency_base: 'USD',
        currency_quote: 'JPY',
        exchange: 'FX',
        type: 'Forex',
      },
      values: [
        {
          datetime: '2024-01-01 10:00:00',
          open: '150.00',
          high: '150.50',
          low: '149.90',
          close: '150.20',
          volume: '1000',
        },
      ],
      status: 'ok',
    };

    const result = transformCandleData(mockData);
    
    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({
      open: 150.00,
      high: 150.50,
      low: 149.90,
      close: 150.20,
      volume: 1000,
    });
    expect(result[0].time).toBeDefined();
  });

  it('should reverse the order of candles', () => {
    const mockData: TwelveDataResponse = {
      meta: {
        symbol: 'USD/JPY',
        interval: '1h',
        currency_base: 'USD',
        currency_quote: 'JPY',
        exchange: 'FX',
        type: 'Forex',
      },
      values: [
        {
          datetime: '2024-01-01 10:00:00',
          open: '150.00',
          high: '150.50',
          low: '149.90',
          close: '150.20',
          volume: '1000',
        },
        {
          datetime: '2024-01-01 11:00:00',
          open: '150.20',
          high: '150.60',
          low: '150.10',
          close: '150.40',
          volume: '1100',
        },
      ],
      status: 'ok',
    };

    const result = transformCandleData(mockData);
    
    expect(result).toHaveLength(2);
    // 時系列順にソートされていることを確認（後の時刻が先に来る）
    expect(result[0].time).toBeGreaterThan(result[1].time);
  });
});

