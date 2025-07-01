/**
 * カテゴリマスターデータ
 */

import type { CategoryMaster, DetailMaster, CategoryDetailsMap } from '../types';

/**
 * 12種類のカテゴリ定義
 */
export const CATEGORIES: CategoryMaster[] = [
  {
    id: 'landscape',
    name: '風景',
    nameEn: 'Landscape',
    description: '山、海、森、都市などの風景',
    icon: '🏞️',
    order: 1,
    isActive: true,
  },
  {
    id: 'animal',
    name: '動物',
    nameEn: 'Animal',
    description: '様々な動物や生き物',
    icon: '🦁',
    order: 2,
    isActive: true,
  },
  {
    id: 'person',
    name: '人物',
    nameEn: 'Person',
    description: '人物やキャラクター',
    icon: '👤',
    order: 3,
    isActive: true,
  },
  {
    id: 'abstract',
    name: '抽象画',
    nameEn: 'Abstract',
    description: '抽象的なアートや模様',
    icon: '🎨',
    order: 4,
    isActive: true,
  },
  {
    id: 'flower',
    name: '花',
    nameEn: 'Flower',
    description: '花や植物',
    icon: '🌸',
    order: 5,
    isActive: true,
  },
  {
    id: 'food',
    name: '食べ物',
    nameEn: 'Food',
    description: '料理や食材',
    icon: '🍔',
    order: 6,
    isActive: true,
  },
  {
    id: 'building',
    name: '建物',
    nameEn: 'Building',
    description: '建築物や構造物',
    icon: '🏢',
    order: 7,
    isActive: true,
  },
  {
    id: 'vehicle',
    name: '乗り物',
    nameEn: 'Vehicle',
    description: '車、電車、飛行機など',
    icon: '🚗',
    order: 8,
    isActive: true,
  },
  {
    id: 'fantasy',
    name: 'ファンタジー',
    nameEn: 'Fantasy',
    description: '幻想的な世界や生き物',
    icon: '🦄',
    order: 9,
    isActive: true,
  },
  {
    id: 'space',
    name: '宇宙',
    nameEn: 'Space',
    description: '宇宙や天体',
    icon: '🌌',
    order: 10,
    isActive: true,
  },
  {
    id: 'object',
    name: '物',
    nameEn: 'Object',
    description: '日用品や道具',
    icon: '📦',
    order: 11,
    isActive: true,
  },
  {
    id: 'pattern',
    name: '模様',
    nameEn: 'Pattern',
    description: '幾何学模様やテクスチャ',
    icon: '🔷',
    order: 12,
    isActive: true,
  },
];

/**
 * カテゴリごとの詳細オプション（各12種類）
 */
export const CATEGORY_DETAILS: DetailMaster[] = [
  // 風景の詳細
  { id: 'landscape_mountain', categoryId: 'landscape', name: '山', nameEn: 'mountain', order: 1, isActive: true },
  { id: 'landscape_ocean', categoryId: 'landscape', name: '海', nameEn: 'ocean', order: 2, isActive: true },
  { id: 'landscape_forest', categoryId: 'landscape', name: '森', nameEn: 'forest', order: 3, isActive: true },
  { id: 'landscape_desert', categoryId: 'landscape', name: '砂漠', nameEn: 'desert', order: 4, isActive: true },
  { id: 'landscape_city', categoryId: 'landscape', name: '都市', nameEn: 'city', order: 5, isActive: true },
  { id: 'landscape_countryside', categoryId: 'landscape', name: '田舎', nameEn: 'countryside', order: 6, isActive: true },
  { id: 'landscape_river', categoryId: 'landscape', name: '川', nameEn: 'river', order: 7, isActive: true },
  { id: 'landscape_lake', categoryId: 'landscape', name: '湖', nameEn: 'lake', order: 8, isActive: true },
  { id: 'landscape_waterfall', categoryId: 'landscape', name: '滝', nameEn: 'waterfall', order: 9, isActive: true },
  { id: 'landscape_canyon', categoryId: 'landscape', name: '渓谷', nameEn: 'canyon', order: 10, isActive: true },
  { id: 'landscape_beach', categoryId: 'landscape', name: 'ビーチ', nameEn: 'beach', order: 11, isActive: true },
  { id: 'landscape_island', categoryId: 'landscape', name: '島', nameEn: 'island', order: 12, isActive: true },
  
  // 動物の詳細
  { id: 'animal_cat', categoryId: 'animal', name: '猫', nameEn: 'cat', order: 1, isActive: true },
  { id: 'animal_dog', categoryId: 'animal', name: '犬', nameEn: 'dog', order: 2, isActive: true },
  { id: 'animal_bird', categoryId: 'animal', name: '鳥', nameEn: 'bird', order: 3, isActive: true },
  { id: 'animal_fish', categoryId: 'animal', name: '魚', nameEn: 'fish', order: 4, isActive: true },
  { id: 'animal_elephant', categoryId: 'animal', name: '象', nameEn: 'elephant', order: 5, isActive: true },
  { id: 'animal_lion', categoryId: 'animal', name: 'ライオン', nameEn: 'lion', order: 6, isActive: true },
  { id: 'animal_bear', categoryId: 'animal', name: '熊', nameEn: 'bear', order: 7, isActive: true },
  { id: 'animal_rabbit', categoryId: 'animal', name: 'ウサギ', nameEn: 'rabbit', order: 8, isActive: true },
  { id: 'animal_horse', categoryId: 'animal', name: '馬', nameEn: 'horse', order: 9, isActive: true },
  { id: 'animal_dolphin', categoryId: 'animal', name: 'イルカ', nameEn: 'dolphin', order: 10, isActive: true },
  { id: 'animal_butterfly', categoryId: 'animal', name: '蝶', nameEn: 'butterfly', order: 11, isActive: true },
  { id: 'animal_penguin', categoryId: 'animal', name: 'ペンギン', nameEn: 'penguin', order: 12, isActive: true },
  
  // 人物の詳細
  { id: 'person_child', categoryId: 'person', name: '子供', nameEn: 'child', order: 1, isActive: true },
  { id: 'person_adult', categoryId: 'person', name: '大人', nameEn: 'adult', order: 2, isActive: true },
  { id: 'person_elderly', categoryId: 'person', name: '高齢者', nameEn: 'elderly', order: 3, isActive: true },
  { id: 'person_family', categoryId: 'person', name: '家族', nameEn: 'family', order: 4, isActive: true },
  { id: 'person_couple', categoryId: 'person', name: 'カップル', nameEn: 'couple', order: 5, isActive: true },
  { id: 'person_athlete', categoryId: 'person', name: 'アスリート', nameEn: 'athlete', order: 6, isActive: true },
  { id: 'person_artist', categoryId: 'person', name: 'アーティスト', nameEn: 'artist', order: 7, isActive: true },
  { id: 'person_worker', categoryId: 'person', name: '働く人', nameEn: 'worker', order: 8, isActive: true },
  { id: 'person_student', categoryId: 'person', name: '学生', nameEn: 'student', order: 9, isActive: true },
  { id: 'person_doctor', categoryId: 'person', name: '医者', nameEn: 'doctor', order: 10, isActive: true },
  { id: 'person_teacher', categoryId: 'person', name: '先生', nameEn: 'teacher', order: 11, isActive: true },
  { id: 'person_musician', categoryId: 'person', name: '音楽家', nameEn: 'musician', order: 12, isActive: true },
  
  // 抽象画の詳細
  { id: 'abstract_geometric', categoryId: 'abstract', name: '幾何学', nameEn: 'geometric', order: 1, isActive: true },
  { id: 'abstract_fluid', categoryId: 'abstract', name: '流体', nameEn: 'fluid', order: 2, isActive: true },
  { id: 'abstract_fractal', categoryId: 'abstract', name: 'フラクタル', nameEn: 'fractal', order: 3, isActive: true },
  { id: 'abstract_minimal', categoryId: 'abstract', name: 'ミニマル', nameEn: 'minimal', order: 4, isActive: true },
  { id: 'abstract_surreal', categoryId: 'abstract', name: 'シュール', nameEn: 'surreal', order: 5, isActive: true },
  { id: 'abstract_expressionist', categoryId: 'abstract', name: '表現主義', nameEn: 'expressionist', order: 6, isActive: true },
  { id: 'abstract_cubist', categoryId: 'abstract', name: 'キュビスト', nameEn: 'cubist', order: 7, isActive: true },
  { id: 'abstract_impressionist', categoryId: 'abstract', name: '印象派', nameEn: 'impressionist', order: 8, isActive: true },
  { id: 'abstract_organic', categoryId: 'abstract', name: '有機的', nameEn: 'organic', order: 9, isActive: true },
  { id: 'abstract_psychedelic', categoryId: 'abstract', name: 'サイケデリック', nameEn: 'psychedelic', order: 10, isActive: true },
  { id: 'abstract_digital', categoryId: 'abstract', name: 'デジタル', nameEn: 'digital', order: 11, isActive: true },
  { id: 'abstract_glitch', categoryId: 'abstract', name: 'グリッチ', nameEn: 'glitch', order: 12, isActive: true },
  
  // 花の詳細
  { id: 'flower_rose', categoryId: 'flower', name: 'バラ', nameEn: 'rose', order: 1, isActive: true },
  { id: 'flower_sakura', categoryId: 'flower', name: '桜', nameEn: 'cherry blossom', order: 2, isActive: true },
  { id: 'flower_sunflower', categoryId: 'flower', name: 'ひまわり', nameEn: 'sunflower', order: 3, isActive: true },
  { id: 'flower_tulip', categoryId: 'flower', name: 'チューリップ', nameEn: 'tulip', order: 4, isActive: true },
  { id: 'flower_lily', categoryId: 'flower', name: 'ユリ', nameEn: 'lily', order: 5, isActive: true },
  { id: 'flower_orchid', categoryId: 'flower', name: '蘭', nameEn: 'orchid', order: 6, isActive: true },
  { id: 'flower_daisy', categoryId: 'flower', name: 'デイジー', nameEn: 'daisy', order: 7, isActive: true },
  { id: 'flower_lotus', categoryId: 'flower', name: '蓮', nameEn: 'lotus', order: 8, isActive: true },
  { id: 'flower_carnation', categoryId: 'flower', name: 'カーネーション', nameEn: 'carnation', order: 9, isActive: true },
  { id: 'flower_iris', categoryId: 'flower', name: 'アイリス', nameEn: 'iris', order: 10, isActive: true },
  { id: 'flower_lavender', categoryId: 'flower', name: 'ラベンダー', nameEn: 'lavender', order: 11, isActive: true },
  { id: 'flower_wildflower', categoryId: 'flower', name: '野花', nameEn: 'wildflower', order: 12, isActive: true },
  
  // 食べ物の詳細
  { id: 'food_sushi', categoryId: 'food', name: '寿司', nameEn: 'sushi', order: 1, isActive: true },
  { id: 'food_ramen', categoryId: 'food', name: 'ラーメン', nameEn: 'ramen', order: 2, isActive: true },
  { id: 'food_pizza', categoryId: 'food', name: 'ピザ', nameEn: 'pizza', order: 3, isActive: true },
  { id: 'food_burger', categoryId: 'food', name: 'バーガー', nameEn: 'burger', order: 4, isActive: true },
  { id: 'food_cake', categoryId: 'food', name: 'ケーキ', nameEn: 'cake', order: 5, isActive: true },
  { id: 'food_fruit', categoryId: 'food', name: 'フルーツ', nameEn: 'fruit', order: 6, isActive: true },
  { id: 'food_vegetable', categoryId: 'food', name: '野菜', nameEn: 'vegetable', order: 7, isActive: true },
  { id: 'food_bread', categoryId: 'food', name: 'パン', nameEn: 'bread', order: 8, isActive: true },
  { id: 'food_pasta', categoryId: 'food', name: 'パスタ', nameEn: 'pasta', order: 9, isActive: true },
  { id: 'food_icecream', categoryId: 'food', name: 'アイスクリーム', nameEn: 'ice cream', order: 10, isActive: true },
  { id: 'food_coffee', categoryId: 'food', name: 'コーヒー', nameEn: 'coffee', order: 11, isActive: true },
  { id: 'food_tea', categoryId: 'food', name: 'お茶', nameEn: 'tea', order: 12, isActive: true },
  
  // 建物の詳細
  { id: 'building_house', categoryId: 'building', name: '家', nameEn: 'house', order: 1, isActive: true },
  { id: 'building_castle', categoryId: 'building', name: '城', nameEn: 'castle', order: 2, isActive: true },
  { id: 'building_temple', categoryId: 'building', name: '寺院', nameEn: 'temple', order: 3, isActive: true },
  { id: 'building_shrine', categoryId: 'building', name: '神社', nameEn: 'shrine', order: 4, isActive: true },
  { id: 'building_skyscraper', categoryId: 'building', name: '高層ビル', nameEn: 'skyscraper', order: 5, isActive: true },
  { id: 'building_bridge', categoryId: 'building', name: '橋', nameEn: 'bridge', order: 6, isActive: true },
  { id: 'building_tower', categoryId: 'building', name: '塔', nameEn: 'tower', order: 7, isActive: true },
  { id: 'building_church', categoryId: 'building', name: '教会', nameEn: 'church', order: 8, isActive: true },
  { id: 'building_lighthouse', categoryId: 'building', name: '灯台', nameEn: 'lighthouse', order: 9, isActive: true },
  { id: 'building_windmill', categoryId: 'building', name: '風車', nameEn: 'windmill', order: 10, isActive: true },
  { id: 'building_pagoda', categoryId: 'building', name: '塔', nameEn: 'pagoda', order: 11, isActive: true },
  { id: 'building_monument', categoryId: 'building', name: 'モニュメント', nameEn: 'monument', order: 12, isActive: true },
  
  // 乗り物の詳細
  { id: 'vehicle_car', categoryId: 'vehicle', name: '車', nameEn: 'car', order: 1, isActive: true },
  { id: 'vehicle_train', categoryId: 'vehicle', name: '電車', nameEn: 'train', order: 2, isActive: true },
  { id: 'vehicle_airplane', categoryId: 'vehicle', name: '飛行機', nameEn: 'airplane', order: 3, isActive: true },
  { id: 'vehicle_ship', categoryId: 'vehicle', name: '船', nameEn: 'ship', order: 4, isActive: true },
  { id: 'vehicle_bicycle', categoryId: 'vehicle', name: '自転車', nameEn: 'bicycle', order: 5, isActive: true },
  { id: 'vehicle_motorcycle', categoryId: 'vehicle', name: 'バイク', nameEn: 'motorcycle', order: 6, isActive: true },
  { id: 'vehicle_bus', categoryId: 'vehicle', name: 'バス', nameEn: 'bus', order: 7, isActive: true },
  { id: 'vehicle_truck', categoryId: 'vehicle', name: 'トラック', nameEn: 'truck', order: 8, isActive: true },
  { id: 'vehicle_helicopter', categoryId: 'vehicle', name: 'ヘリコプター', nameEn: 'helicopter', order: 9, isActive: true },
  { id: 'vehicle_rocket', categoryId: 'vehicle', name: 'ロケット', nameEn: 'rocket', order: 10, isActive: true },
  { id: 'vehicle_submarine', categoryId: 'vehicle', name: '潜水艦', nameEn: 'submarine', order: 11, isActive: true },
  { id: 'vehicle_balloon', categoryId: 'vehicle', name: '気球', nameEn: 'hot air balloon', order: 12, isActive: true },
  
  // ファンタジーの詳細
  { id: 'fantasy_dragon', categoryId: 'fantasy', name: 'ドラゴン', nameEn: 'dragon', order: 1, isActive: true },
  { id: 'fantasy_unicorn', categoryId: 'fantasy', name: 'ユニコーン', nameEn: 'unicorn', order: 2, isActive: true },
  { id: 'fantasy_phoenix', categoryId: 'fantasy', name: 'フェニックス', nameEn: 'phoenix', order: 3, isActive: true },
  { id: 'fantasy_fairy', categoryId: 'fantasy', name: '妖精', nameEn: 'fairy', order: 4, isActive: true },
  { id: 'fantasy_mermaid', categoryId: 'fantasy', name: '人魚', nameEn: 'mermaid', order: 5, isActive: true },
  { id: 'fantasy_wizard', categoryId: 'fantasy', name: '魔法使い', nameEn: 'wizard', order: 6, isActive: true },
  { id: 'fantasy_elf', categoryId: 'fantasy', name: 'エルフ', nameEn: 'elf', order: 7, isActive: true },
  { id: 'fantasy_dwarf', categoryId: 'fantasy', name: 'ドワーフ', nameEn: 'dwarf', order: 8, isActive: true },
  { id: 'fantasy_knight', categoryId: 'fantasy', name: '騎士', nameEn: 'knight', order: 9, isActive: true },
  { id: 'fantasy_pegasus', categoryId: 'fantasy', name: 'ペガサス', nameEn: 'pegasus', order: 10, isActive: true },
  { id: 'fantasy_griffin', categoryId: 'fantasy', name: 'グリフィン', nameEn: 'griffin', order: 11, isActive: true },
  { id: 'fantasy_centaur', categoryId: 'fantasy', name: 'ケンタウロス', nameEn: 'centaur', order: 12, isActive: true },
  
  // 宇宙の詳細
  { id: 'space_planet', categoryId: 'space', name: '惑星', nameEn: 'planet', order: 1, isActive: true },
  { id: 'space_star', categoryId: 'space', name: '星', nameEn: 'star', order: 2, isActive: true },
  { id: 'space_galaxy', categoryId: 'space', name: '銀河', nameEn: 'galaxy', order: 3, isActive: true },
  { id: 'space_nebula', categoryId: 'space', name: '星雲', nameEn: 'nebula', order: 4, isActive: true },
  { id: 'space_moon', categoryId: 'space', name: '月', nameEn: 'moon', order: 5, isActive: true },
  { id: 'space_sun', categoryId: 'space', name: '太陽', nameEn: 'sun', order: 6, isActive: true },
  { id: 'space_comet', categoryId: 'space', name: '彗星', nameEn: 'comet', order: 7, isActive: true },
  { id: 'space_asteroid', categoryId: 'space', name: '小惑星', nameEn: 'asteroid', order: 8, isActive: true },
  { id: 'space_blackhole', categoryId: 'space', name: 'ブラックホール', nameEn: 'black hole', order: 9, isActive: true },
  { id: 'space_satellite', categoryId: 'space', name: '衛星', nameEn: 'satellite', order: 10, isActive: true },
  { id: 'space_aurora', categoryId: 'space', name: 'オーロラ', nameEn: 'aurora', order: 11, isActive: true },
  { id: 'space_constellation', categoryId: 'space', name: '星座', nameEn: 'constellation', order: 12, isActive: true },
  
  // 物の詳細
  { id: 'object_book', categoryId: 'object', name: '本', nameEn: 'book', order: 1, isActive: true },
  { id: 'object_clock', categoryId: 'object', name: '時計', nameEn: 'clock', order: 2, isActive: true },
  { id: 'object_camera', categoryId: 'object', name: 'カメラ', nameEn: 'camera', order: 3, isActive: true },
  { id: 'object_phone', categoryId: 'object', name: '電話', nameEn: 'phone', order: 4, isActive: true },
  { id: 'object_computer', categoryId: 'object', name: 'コンピュータ', nameEn: 'computer', order: 5, isActive: true },
  { id: 'object_lamp', categoryId: 'object', name: 'ランプ', nameEn: 'lamp', order: 6, isActive: true },
  { id: 'object_chair', categoryId: 'object', name: '椅子', nameEn: 'chair', order: 7, isActive: true },
  { id: 'object_table', categoryId: 'object', name: 'テーブル', nameEn: 'table', order: 8, isActive: true },
  { id: 'object_mirror', categoryId: 'object', name: '鏡', nameEn: 'mirror', order: 9, isActive: true },
  { id: 'object_umbrella', categoryId: 'object', name: '傘', nameEn: 'umbrella', order: 10, isActive: true },
  { id: 'object_bag', categoryId: 'object', name: 'バッグ', nameEn: 'bag', order: 11, isActive: true },
  { id: 'object_jewelry', categoryId: 'object', name: 'ジュエリー', nameEn: 'jewelry', order: 12, isActive: true },
  
  // 模様の詳細
  { id: 'pattern_stripes', categoryId: 'pattern', name: 'ストライプ', nameEn: 'stripes', order: 1, isActive: true },
  { id: 'pattern_dots', categoryId: 'pattern', name: 'ドット', nameEn: 'dots', order: 2, isActive: true },
  { id: 'pattern_checkerboard', categoryId: 'pattern', name: 'チェッカー', nameEn: 'checkerboard', order: 3, isActive: true },
  { id: 'pattern_zigzag', categoryId: 'pattern', name: 'ジグザグ', nameEn: 'zigzag', order: 4, isActive: true },
  { id: 'pattern_wave', categoryId: 'pattern', name: '波', nameEn: 'wave', order: 5, isActive: true },
  { id: 'pattern_spiral', categoryId: 'pattern', name: 'スパイラル', nameEn: 'spiral', order: 6, isActive: true },
  { id: 'pattern_floral', categoryId: 'pattern', name: '花柄', nameEn: 'floral', order: 7, isActive: true },
  { id: 'pattern_geometric', categoryId: 'pattern', name: '幾何学', nameEn: 'geometric', order: 8, isActive: true },
  { id: 'pattern_paisley', categoryId: 'pattern', name: 'ペイズリー', nameEn: 'paisley', order: 9, isActive: true },
  { id: 'pattern_mandala', categoryId: 'pattern', name: 'マンダラ', nameEn: 'mandala', order: 10, isActive: true },
  { id: 'pattern_kaleidoscope', categoryId: 'pattern', name: '万華鏡', nameEn: 'kaleidoscope', order: 11, isActive: true },
  { id: 'pattern_mosaic', categoryId: 'pattern', name: 'モザイク', nameEn: 'mosaic', order: 12, isActive: true },
];

/**
 * カテゴリIDから詳細オプションを取得するマップ
 */
export const getCategoryDetailsMap = (): CategoryDetailsMap => {
  return CATEGORY_DETAILS.reduce((map, detail) => {
    if (!map[detail.categoryId]) {
      map[detail.categoryId] = [];
    }
    map[detail.categoryId].push(detail);
    return map;
  }, {} as CategoryDetailsMap);
};

/**
 * カテゴリIDからカテゴリマスターを取得
 */
export const getCategoryById = (id: string): CategoryMaster | undefined => {
  return CATEGORIES.find(category => category.id === id);
};

/**
 * カテゴリIDから詳細オプションを取得
 */
export const getDetailsByCategoryId = (categoryId: string): DetailMaster[] => {
  return CATEGORY_DETAILS.filter(detail => detail.categoryId === categoryId);
};