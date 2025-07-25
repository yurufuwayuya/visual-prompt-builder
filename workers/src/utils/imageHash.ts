/**
 * 画像ハッシュ計算のユーティリティ
 * ストリーミング処理で大きな画像にも対応
 */

/**
 * Base64画像データのハッシュをストリーミングで計算
 * @param base64 Base64エンコードされた画像データ
 * @param chunkSize チャンクサイズ（デフォルト: 64KB）
 * @returns SHA-256ハッシュの16進数文字列
 */
export async function generateImageHashStream(
  base64: string,
  chunkSize: number = 64 * 1024 // 64KB chunks
): Promise<string> {
  // Web Crypto APIはストリーミングをサポートしていないため、
  // チャンク分割して処理負荷を分散
  const encoder = new TextEncoder();
  const chunks: Uint8Array[] = [];

  // base64をチャンクに分割してエンコード
  for (let i = 0; i < base64.length; i += chunkSize) {
    const chunk = base64.slice(i, Math.min(i + chunkSize, base64.length));
    chunks.push(encoder.encode(chunk));

    // 大きなチャンクごとにイベントループに制御を戻す
    if (i % (chunkSize * 10) === 0 && i > 0) {
      await new Promise((resolve) => setTimeout(resolve, 0));
    }
  }

  // すべてのチャンクを結合
  const totalLength = chunks.reduce((sum, chunk) => sum + chunk.length, 0);
  const combined = new Uint8Array(totalLength);
  let offset = 0;

  for (const chunk of chunks) {
    combined.set(chunk, offset);
    offset += chunk.length;
  }

  // ハッシュ計算
  const hashBuffer = await crypto.subtle.digest('SHA-256', combined);

  // 16進数文字列に変換
  return Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

/**
 * 画像ハッシュの短縮版を生成（キャッシュキー用）
 * @param base64 Base64エンコードされた画像データ
 * @param length 返すハッシュの長さ（デフォルト: 16文字）
 * @returns 短縮されたハッシュ文字列
 */
export async function generateShortImageHash(base64: string, length: number = 16): Promise<string> {
  const fullHash = await generateImageHashStream(base64);
  return fullHash.substring(0, length);
}

/**
 * 高速な画像フィンガープリント生成
 * 画像の最初と最後、中間部分をサンプリングしてハッシュを生成
 * @param base64 Base64エンコードされた画像データ
 * @param sampleSize 各サンプリングポイントのサイズ（デフォルト: 1KB）
 * @returns フィンガープリントハッシュ
 */
export async function generateImageFingerprint(
  base64: string,
  sampleSize: number = 1024
): Promise<string> {
  const encoder = new TextEncoder();
  const samples: Uint8Array[] = [];

  // 画像の開始部分
  if (base64.length > 0) {
    const startSample = base64.substring(0, Math.min(sampleSize, base64.length));
    samples.push(encoder.encode(startSample));
  }

  // 画像の中間部分
  if (base64.length > sampleSize * 2) {
    const midPoint = Math.floor(base64.length / 2);
    const midStart = midPoint - Math.floor(sampleSize / 2);
    const midSample = base64.substring(midStart, midStart + sampleSize);
    samples.push(encoder.encode(midSample));
  }

  // 画像の終了部分
  if (base64.length > sampleSize) {
    const endSample = base64.substring(base64.length - sampleSize);
    samples.push(encoder.encode(endSample));
  }

  // 画像サイズも含める
  const sizeBytes = encoder.encode(base64.length.toString());
  samples.push(sizeBytes);

  // すべてのサンプルを結合
  const totalLength = samples.reduce((sum, sample) => sum + sample.length, 0);
  const combined = new Uint8Array(totalLength);
  let offset = 0;

  for (const sample of samples) {
    combined.set(sample, offset);
    offset += sample.length;
  }

  // ハッシュ計算
  const hashBuffer = await crypto.subtle.digest('SHA-256', combined);

  // 16進数文字列に変換（最初の16文字のみ）
  return Array.from(new Uint8Array(hashBuffer))
    .slice(0, 8)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

/**
 * メモリ効率的なハッシュ計算のためのヘルパー関数
 */
export function bufferToHex(buffer: ArrayBuffer): string {
  return Array.from(new Uint8Array(buffer))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}
