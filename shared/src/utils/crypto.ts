/**
 * 暗号化関連のユーティリティ関数
 */

/**
 * SHA-256ハッシュを生成する
 * @param data ハッシュ化するデータ
 * @returns 16進数文字列のハッシュ値
 */
export async function generateSHA256Hash(data: string): Promise<string> {
  const encoder = new TextEncoder();
  const dataBuffer = encoder.encode(data);
  const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  return hashHex;
}

/**
 * キャッシュキーを生成する
 * @param prefix キーのプレフィックス
 * @param data キーの元となるデータ
 * @returns ハッシュ化されたキャッシュキー
 */
export async function generateCacheKey(prefix: string, data: unknown): Promise<string> {
  const jsonData = JSON.stringify(data);
  const hash = await generateSHA256Hash(jsonData);
  return `${prefix}:${hash}`;
}