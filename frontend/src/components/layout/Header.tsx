import React from 'react';
import { Link } from 'react-router-dom';
import { Palette, Image, Clock, Home } from 'lucide-react';

export const Header: React.FC = () => {
  return (
    <header className="bg-white shadow-sm" role="banner">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <Link 
            to="/" 
            className="flex items-center space-x-2 text-gray-900 hover:text-gray-700 min-h-[44px] min-w-[44px]"
            aria-label="ビジュアルプロンプトビルダー ホーム"
          >
            <Palette className="h-6 w-6" />
            <span className="font-semibold text-lg">ビジュアルプロンプトビルダー</span>
          </Link>

          <nav className="flex items-center space-x-6" role="navigation" aria-label="主要ナビゲーション">
            <Link
              to="/"
              className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors min-h-[44px] px-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded"
              aria-label="ホームページ"
            >
              <Home className="h-4 w-4" />
              <span className="text-sm font-medium">ホーム</span>
            </Link>
            <Link
              to="/builder"
              className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors min-h-[44px] px-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded"
              aria-label="プロンプト作成ページ"
            >
              <Palette className="h-4 w-4" />
              <span className="text-sm font-medium">プロンプト作成</span>
            </Link>
            <Link
              to="/i2i"
              className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors min-h-[44px] px-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded"
              aria-label="画像生成ページ"
            >
              <Image className="h-4 w-4" />
              <span className="text-sm font-medium">i2i生成</span>
            </Link>
            <Link
              to="/history"
              className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors min-h-[44px] px-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded"
              aria-label="履歴ページ"
            >
              <Clock className="h-4 w-4" />
              <span className="text-sm font-medium">履歴</span>
            </Link>
          </nav>
        </div>
      </div>
    </header>
  );
};
