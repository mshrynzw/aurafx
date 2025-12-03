import { config } from 'dotenv';
import { resolve } from 'path';
import { existsSync } from 'fs';
import { fetchCandleData, transformCandleData } from '../lib/twelve-data';
import * as fs from 'fs';
import * as path from 'path';

// .env.localファイルが存在する場合のみ読み込む（GitHub Actionsでは環境変数から直接読み込む）
const envLocalPath = resolve(process.cwd(), '.env.local');
if (existsSync(envLocalPath)) {
  config({ path: envLocalPath });
}

async function main() {
  const apiKey = process.env.TWELVE_DATA_API_KEY;
  
  if (!apiKey) {
    throw new Error('TWELVE_DATA_API_KEY is not set');
  }

  const symbol = process.env.SYMBOL || 'USD/JPY';
  const interval = process.env.INTERVAL || '1h';
  
  // 過去3年分のデータを取得（環境変数で上書き可能）
  const startDate = process.env.START_DATE; // YYYY-MM-DD形式
  const endDate = process.env.END_DATE;     // YYYY-MM-DD形式
  
  try {
    const data = await fetchCandleData(apiKey, {
      symbol,
      interval,
      startDate,
      endDate,
    });
    
    // APIレスポンスの検証
    if (!data || !data.values || !Array.isArray(data.values)) {
      console.error('Invalid API response:', JSON.stringify(data, null, 2));
      throw new Error('Invalid API response: values array not found');
    }
    
    if (data.values.length === 0) {
      console.warn('Warning: No data returned from API');
    }
    
    const transformed = transformCandleData(data);
    
    const dataDir = path.join(process.cwd(), 'data');
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    
    const filename = `${symbol.replace('/', '_')}_${interval}.json`;
    const filepath = path.join(dataDir, filename);
    
    fs.writeFileSync(
      filepath,
      JSON.stringify({ meta: data.meta, values: transformed }, null, 2)
    );
    
    console.log(`✓ Data saved to ${filepath}`);
    console.log(`  - Records: ${transformed.length}`);
    console.log(`  - Symbol: ${data.meta?.symbol || symbol}`);
    console.log(`  - Interval: ${data.meta?.interval || interval}`);
    
    // データの期間を表示
    if (transformed.length > 0) {
      const firstDate = new Date(transformed[transformed.length - 1].time * 1000);
      const lastDate = new Date(transformed[0].time * 1000);
      console.log(`  - Period: ${firstDate.toLocaleDateString('ja-JP')} ~ ${lastDate.toLocaleDateString('ja-JP')}`);
    }
  } catch (error) {
    console.error('Error fetching data:', error);
    if (error instanceof Error) {
      console.error('Error message:', error.message);
    }
    process.exit(1);
  }
}

main();