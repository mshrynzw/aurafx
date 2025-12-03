import { CandlestickChart } from '@/components/chart/candlestick-chart';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, TrendingUp, TrendingDown, BarChart3 } from 'lucide-react';

interface CandleData {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number | null;
}

function getData(): { data: CandleData[]; error: string | null } {
  try {
    const filePath = join(process.cwd(), 'data', 'USD_JPY_1h.json');
    
    if (!existsSync(filePath)) {
      return {
        data: [],
        error: 'Data file not found. Please fetch data using GitHub Actions or run the fetch-data command manually.',
      };
    }

    const fileContents = readFileSync(filePath, 'utf8');
    const jsonData = JSON.parse(fileContents);
    const values = jsonData.values || [];
    
    if (values.length === 0) {
      return {
        data: [],
        error: 'Data file exists but is empty.',
      };
    }

    return { data: values, error: null };
  } catch (error) {
    console.error('Error reading data file:', error);
    return {
      data: [],
      error: `Failed to read data file: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
}

function calculateStats(data: CandleData[]) {
  if (data.length === 0) return null;

  const latest = data[data.length - 1];
  const previous = data[data.length - 2] || latest;
  const change = latest.close - previous.close;
  const changePercent = ((change / previous.close) * 100).toFixed(2);
  const isPositive = change >= 0;

  const high = Math.max(...data.map(d => d.high));
  const low = Math.min(...data.map(d => d.low));
  const volumes = data.map(d => d.volume).filter((v): v is number => v !== null);
  const avgVolume = volumes.length > 0 ? volumes.reduce((sum, v) => sum + v, 0) / volumes.length : 0;

  return {
    current: latest.close,
    change,
    changePercent,
    isPositive,
    high,
    low,
    avgVolume,
    dataPoints: data.length,
  };
}

export default function Home() {
  const { data, error } = getData();
  const stats = data.length > 0 ? calculateStats(data) : null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      <main className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                AuraFX
              </h1>
              <p className="text-muted-foreground mt-1">FX Trading Analysis Tool</p>
            </div>
            <Badge variant="outline" className="text-sm">
              <BarChart3 className="w-4 h-4 mr-1" />
              USD/JPY
            </Badge>
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <Alert variant="destructive" className="mb-8">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Data Loading Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Chart Card */}
        <Card className="shadow-lg mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5" />
              Candlestick Chart
            </CardTitle>
            <CardDescription>USD/JPY 1-Hour Chart</CardDescription>
          </CardHeader>
          <CardContent>
            {data.length > 0 ? (
              <CandlestickChart data={data} symbol="USD/JPY" />
            ) : (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>No Data Available</AlertTitle>
                <AlertDescription>
                  Data is required to display the chart. Please fetch data using GitHub Actions or run the
                  <code className="px-1 py-0.5 bg-muted rounded mx-1">npm run fetch-data</code>
                  command.
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
        
        {/* Statistics Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Current Price</CardDescription>
                <CardTitle className="text-2xl">{stats.current.toFixed(2)}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className={`flex items-center ${stats.isPositive ? 'text-green-600' : 'text-red-600'}`}>
                  {stats.isPositive ? (
                    <TrendingUp className="w-4 h-4 mr-1" />
                  ) : (
                    <TrendingDown className="w-4 h-4 mr-1" />
                  )}
                  <span className="text-sm font-medium">
                    {stats.isPositive ? '+' : ''}{stats.change.toFixed(2)} ({stats.isPositive ? '+' : ''}{stats.changePercent}%)
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardDescription>High</CardDescription>
                <CardTitle className="text-2xl text-green-600">{stats.high.toFixed(2)}</CardTitle>
              </CardHeader>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Low</CardDescription>
                <CardTitle className="text-2xl text-red-600">{stats.low.toFixed(2)}</CardTitle>
              </CardHeader>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Data Points</CardDescription>
                <CardTitle className="text-2xl">{stats.dataPoints.toLocaleString()}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-muted-foreground">
                  Avg Volume: {stats.avgVolume.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                </p>
              </CardContent>
            </Card>
          </div>
        )}
      </main>
    </div>
  );
}