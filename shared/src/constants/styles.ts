/**
 * スタイル関連のマスターデータ
 */

import type { ColorMaster, StyleMaster, MoodMaster, LightingMaster } from '../types';

/**
 * 色マスターデータ
 */
export const COLORS: ColorMaster[] = [
  { id: 'red', name: '赤', nameEn: 'red', hex: '#FF0000', order: 1 },
  { id: 'blue', name: '青', nameEn: 'blue', hex: '#0000FF', order: 2 },
  { id: 'yellow', name: '黄', nameEn: 'yellow', hex: '#FFFF00', order: 3 },
  { id: 'green', name: '緑', nameEn: 'green', hex: '#00FF00', order: 4 },
  { id: 'orange', name: 'オレンジ', nameEn: 'orange', hex: '#FFA500', order: 5 },
  { id: 'purple', name: '紫', nameEn: 'purple', hex: '#800080', order: 6 },
  { id: 'pink', name: 'ピンク', nameEn: 'pink', hex: '#FFC0CB', order: 7 },
  { id: 'brown', name: '茶', nameEn: 'brown', hex: '#964B00', order: 8 },
  { id: 'black', name: '黒', nameEn: 'black', hex: '#000000', order: 9 },
  { id: 'white', name: '白', nameEn: 'white', hex: '#FFFFFF', order: 10 },
  { id: 'gray', name: '灰', nameEn: 'gray', hex: '#808080', order: 11 },
  { id: 'gold', name: '金', nameEn: 'gold', hex: '#FFD700', order: 12 },
  { id: 'silver', name: '銀', nameEn: 'silver', hex: '#C0C0C0', order: 13 },
  { id: 'pastel', name: 'パステル', nameEn: 'pastel', hex: '#FFB3E6', order: 14 },
  { id: 'neon', name: 'ネオン', nameEn: 'neon', hex: '#39FF14', order: 15 },
  { id: 'rainbow', name: '虹色', nameEn: 'rainbow', hex: '#FF0000', order: 16 },
];

/**
 * スタイルマスターデータ
 */
export const STYLES: StyleMaster[] = [
  {
    id: 'realistic',
    name: 'リアル',
    nameEn: 'realistic',
    description: '写実的で詳細な表現',
    keywords: ['photorealistic', 'hyperrealistic', 'detailed', 'high quality'],
    order: 1,
  },
  {
    id: 'anime',
    name: 'アニメ',
    nameEn: 'anime',
    description: '日本のアニメーション風',
    keywords: ['anime style', 'japanese animation', 'manga style'],
    order: 2,
  },
  {
    id: 'watercolor',
    name: '水彩画',
    nameEn: 'watercolor',
    description: '水彩絵の具で描いたような表現',
    keywords: ['watercolor painting', 'watercolor art', 'soft colors'],
    order: 3,
  },
  {
    id: 'oil_painting',
    name: '油絵',
    nameEn: 'oil painting',
    description: '油彩画のような重厚な表現',
    keywords: ['oil painting', 'oil on canvas', 'thick paint', 'impasto'],
    order: 4,
  },
  {
    id: 'pencil_sketch',
    name: '鉛筆画',
    nameEn: 'pencil sketch',
    description: '鉛筆でスケッチしたような表現',
    keywords: ['pencil drawing', 'pencil sketch', 'graphite', 'sketch'],
    order: 5,
  },
  {
    id: 'digital_art',
    name: 'デジタルアート',
    nameEn: 'digital art',
    description: 'デジタルツールで作成されたアート',
    keywords: ['digital art', 'digital painting', 'digital illustration'],
    order: 6,
  },
  {
    id: '3d_render',
    name: '3Dレンダー',
    nameEn: '3D render',
    description: '3DCGで作成されたような表現',
    keywords: ['3D render', '3D art', 'CGI', 'computer graphics'],
    order: 7,
  },
  {
    id: 'pixel_art',
    name: 'ピクセルアート',
    nameEn: 'pixel art',
    description: 'ドット絵のような表現',
    keywords: ['pixel art', '8-bit style', 'retro game art', 'pixelated'],
    order: 8,
  },
  {
    id: 'comic',
    name: 'コミック',
    nameEn: 'comic',
    description: '漫画やコミックブック風',
    keywords: ['comic book style', 'comic art', 'manga', 'graphic novel'],
    order: 9,
  },
  {
    id: 'vintage',
    name: 'ビンテージ',
    nameEn: 'vintage',
    description: '古い写真や絵画のような表現',
    keywords: ['vintage', 'retro', 'old photograph', 'antique'],
    order: 10,
  },
  {
    id: 'minimalist',
    name: 'ミニマリスト',
    nameEn: 'minimalist',
    description: 'シンプルで洗練された表現',
    keywords: ['minimalist', 'minimal', 'simple', 'clean design'],
    order: 11,
  },
  {
    id: 'pop_art',
    name: 'ポップアート',
    nameEn: 'pop art',
    description: 'ポップアート風の鮮やかな表現',
    keywords: ['pop art', 'pop art style', 'andy warhol style', 'roy lichtenstein style'],
    order: 12,
  },
];

/**
 * 雰囲気マスターデータ
 */
export const MOODS: MoodMaster[] = [
  {
    id: 'happy',
    name: '楽しい',
    nameEn: 'happy',
    icon: '😊',
    keywords: ['happy', 'joyful', 'cheerful', 'bright'],
    order: 1,
  },
  {
    id: 'peaceful',
    name: '穏やか',
    nameEn: 'peaceful',
    icon: '😌',
    keywords: ['peaceful', 'calm', 'serene', 'tranquil'],
    order: 2,
  },
  {
    id: 'energetic',
    name: '元気',
    nameEn: 'energetic',
    icon: '💪',
    keywords: ['energetic', 'dynamic', 'vibrant', 'lively'],
    order: 3,
  },
  {
    id: 'mysterious',
    name: '神秘的',
    nameEn: 'mysterious',
    icon: '🔮',
    keywords: ['mysterious', 'mystical', 'enigmatic', 'magical'],
    order: 4,
  },
  {
    id: 'romantic',
    name: 'ロマンチック',
    nameEn: 'romantic',
    icon: '💕',
    keywords: ['romantic', 'lovely', 'sweet', 'tender'],
    order: 5,
  },
  {
    id: 'dramatic',
    name: 'ドラマチック',
    nameEn: 'dramatic',
    icon: '🎭',
    keywords: ['dramatic', 'theatrical', 'intense', 'emotional'],
    order: 6,
  },
  {
    id: 'nostalgic',
    name: '懐かしい',
    nameEn: 'nostalgic',
    icon: '🕰️',
    keywords: ['nostalgic', 'vintage', 'retro', 'memories'],
    order: 7,
  },
  {
    id: 'dreamy',
    name: '夢のような',
    nameEn: 'dreamy',
    icon: '💭',
    keywords: ['dreamy', 'dreamlike', 'ethereal', 'surreal'],
    order: 8,
  },
  {
    id: 'cool',
    name: 'クール',
    nameEn: 'cool',
    icon: '😎',
    keywords: ['cool', 'stylish', 'modern', 'sleek'],
    order: 9,
  },
  {
    id: 'warm',
    name: '温かい',
    nameEn: 'warm',
    icon: '🌞',
    keywords: ['warm', 'cozy', 'comfortable', 'inviting'],
    order: 10,
  },
  {
    id: 'melancholic',
    name: '物悲しい',
    nameEn: 'melancholic',
    icon: '🌧️',
    keywords: ['melancholic', 'sad', 'melancholy', 'somber'],
    order: 11,
  },
  {
    id: 'festive',
    name: 'お祝い',
    nameEn: 'festive',
    icon: '🎉',
    keywords: ['festive', 'celebration', 'party', 'joyous'],
    order: 12,
  },
];

/**
 * 照明マスターデータ
 */
export const LIGHTINGS: LightingMaster[] = [
  {
    id: 'natural',
    name: '自然光',
    nameEn: 'natural light',
    icon: '☀️',
    keywords: ['natural lighting', 'sunlight', 'daylight'],
    order: 1,
  },
  {
    id: 'golden_hour',
    name: 'ゴールデンアワー',
    nameEn: 'golden hour',
    icon: '🌅',
    keywords: ['golden hour', 'sunset lighting', 'warm light', 'magic hour'],
    order: 2,
  },
  {
    id: 'blue_hour',
    name: 'ブルーアワー',
    nameEn: 'blue hour',
    icon: '🌆',
    keywords: ['blue hour', 'twilight', 'dusk lighting'],
    order: 3,
  },
  {
    id: 'studio',
    name: 'スタジオ照明',
    nameEn: 'studio lighting',
    icon: '💡',
    keywords: ['studio lighting', 'professional lighting', 'softbox'],
    order: 4,
  },
  {
    id: 'dramatic',
    name: 'ドラマチック',
    nameEn: 'dramatic lighting',
    icon: '🎭',
    keywords: ['dramatic lighting', 'chiaroscuro', 'high contrast', 'rembrandt lighting'],
    order: 5,
  },
  {
    id: 'soft',
    name: 'ソフト',
    nameEn: 'soft lighting',
    icon: '☁️',
    keywords: ['soft lighting', 'diffused light', 'gentle light'],
    order: 6,
  },
  {
    id: 'neon',
    name: 'ネオン',
    nameEn: 'neon lighting',
    icon: '🌃',
    keywords: ['neon lights', 'neon glow', 'cyberpunk lighting'],
    order: 7,
  },
  {
    id: 'candlelight',
    name: 'キャンドルライト',
    nameEn: 'candlelight',
    icon: '🕯️',
    keywords: ['candlelight', 'warm glow', 'intimate lighting'],
    order: 8,
  },
  {
    id: 'moonlight',
    name: '月光',
    nameEn: 'moonlight',
    icon: '🌙',
    keywords: ['moonlight', 'lunar light', 'night lighting'],
    order: 9,
  },
  {
    id: 'backlit',
    name: '逆光',
    nameEn: 'backlit',
    icon: '🔦',
    keywords: ['backlit', 'backlighting', 'silhouette lighting'],
    order: 10,
  },
  {
    id: 'ambient',
    name: '環境光',
    nameEn: 'ambient lighting',
    icon: '💫',
    keywords: ['ambient lighting', 'atmospheric light', 'mood lighting'],
    order: 11,
  },
  {
    id: 'spotlight',
    name: 'スポットライト',
    nameEn: 'spotlight',
    icon: '🔆',
    keywords: ['spotlight', 'focused light', 'stage lighting'],
    order: 12,
  },
];

/**
 * ヘルパー関数
 */

/**
 * 色IDから色マスターを取得
 */
export const getColorById = (id: string): ColorMaster | undefined => {
  return COLORS.find(color => color.id === id);
};

/**
 * スタイルIDからスタイルマスターを取得
 */
export const getStyleById = (id: string): StyleMaster | undefined => {
  return STYLES.find(style => style.id === id);
};

/**
 * 雰囲気IDから雰囲気マスターを取得
 */
export const getMoodById = (id: string): MoodMaster | undefined => {
  return MOODS.find(mood => mood.id === id);
};

/**
 * 照明IDから照明マスターを取得
 */
export const getLightingById = (id: string): LightingMaster | undefined => {
  return LIGHTINGS.find(lighting => lighting.id === id);
};

