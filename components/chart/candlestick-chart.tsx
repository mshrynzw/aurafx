'use client';

import { useEffect, useRef, useState } from 'react';
import {
  createChart,
  CandlestickSeries,
  type IChartApi,
  type ISeriesApi,
} from 'lightweight-charts';

interface CandleData {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number | null;
}

interface CandlestickChartProps {
  data: CandleData[];
  symbol?: string;
}

export function CandlestickChart({ data }: CandlestickChartProps) {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const seriesRef = useRef<ISeriesApi<'Candlestick'> | null>(null);
  const [containerSize, setContainerSize] = useState({ width: 0, height: 500 });

  // Measure container size
  useEffect(() => {
    const updateSize = () => {
      if (chartContainerRef.current) {
        const width = chartContainerRef.current.clientWidth || 800;
        setContainerSize({ width, height: 500 });
      }
    };

    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, []);

  useEffect(() => {
    if (!chartContainerRef.current || data.length === 0 || containerSize.width === 0) {
      return;
    }

    // Clean up previous chart
    if (chartRef.current) {
      chartRef.current.remove();
      chartRef.current = null;
    }

    const chart = createChart(chartContainerRef.current, {
      width: containerSize.width,
      height: containerSize.height,
      layout: {
        background: { color: '#ffffff' },
        textColor: '#333',
      },
      grid: {
        vertLines: { color: '#f0f0f0' },
        horzLines: { color: '#f0f0f0' },
      },
      timeScale: {
        timeVisible: true,
        secondsVisible: false,
      },
    });

    const candlestickSeries = chart.addSeries(CandlestickSeries, {
      upColor: '#26a69a',
      downColor: '#ef5350',
      borderVisible: false,
      wickUpColor: '#26a69a',
      wickDownColor: '#ef5350',
    });

    const chartData = data.map((d) => ({
      time: d.time as any,
      open: d.open,
      high: d.high,
      low: d.low,
      close: d.close,
    }));

    candlestickSeries.setData(chartData);

    // Scroll to the latest data
    chart.timeScale().scrollToPosition(-1, false);

    chartRef.current = chart;
    seriesRef.current = candlestickSeries;

    const handleResize = () => {
      if (chartContainerRef.current && chartRef.current) {
        const newWidth = chartContainerRef.current.clientWidth || containerSize.width;
        chartRef.current.applyOptions({
          width: newWidth,
        });
      }
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      if (chartRef.current) {
        chartRef.current.remove();
        chartRef.current = null;
      }
    };
  }, [data, containerSize.width, containerSize.height]);

  if (data.length === 0) {
    return (
      <div className="w-full h-[500px] flex items-center justify-center text-muted-foreground">
        No data available
      </div>
    );
  }

  return (
    <div className="w-full">
      <div ref={chartContainerRef} className="w-full" style={{ minHeight: '500px' }} />
    </div>
  );
}