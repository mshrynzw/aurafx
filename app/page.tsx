import { CandlestickChart } from '@/components/chart/candlestick-chart';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';

interface CandleData {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

function getData(): { data: CandleData[]; error: string | null } {
  try {
    const filePath = join(process.cwd(), 'data', 'USD_JPY_1h.json');
    
    if (!existsSync(filePath)) {
      return {
        data: [],
        error: 'データファイルが見つかりません。GitHub Actionsでデータを取得するか、手動でデータを取得してください。',
      };
    }

    const fileContents = readFileSync(filePath, 'utf8');
    const jsonData = JSON.parse(fileContents);
    const values = jsonData.values || [];
    
    if (values.length === 0) {
      return {
        data: [],
        error: 'データファイルは存在しますが、データが空です。',
      };
    }

    return { data: values, error: null };
  } catch (error) {
    console.error('Error reading data file:', error);
    return {
      data: [],
      error: `データファイルの読み込みに失敗しました: ${error instanceof Error ? error.message : '不明なエラー'}`,
    };
  }
}

export default function Home() {
  const { data, error } = getData();

  return (
    <main className="container mx-auto p-4">
      <h1 className="text-4xl font-bold mb-8">aurafx</h1>
      
      {error ? (
        <Alert variant="destructive" className="mb-8">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>データ読み込みエラー</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}
      
      <div className="mb-8">
        {data.length > 0 ? (
          <CandlestickChart data={data} symbol="USD/JPY" />
        ) : (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>データがありません</AlertTitle>
            <AlertDescription>
              チャートを表示するには、データが必要です。GitHub Actionsでデータを取得するか、
              <code className="px-1 py-0.5 bg-muted rounded">npm run fetch-data</code>
              コマンドを実行してください。
            </AlertDescription>
          </Alert>
        )}
      </div>
    </main>
  );
}