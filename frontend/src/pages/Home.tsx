import { Link } from 'react-router-dom';
import { Palette, Clock, Heart } from 'lucide-react';

export function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      <div className="container max-w-7xl">
        <header className="py-6 sm:py-8 lg:py-12 text-center lg:text-left" role="banner">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900">
            ビジュアルプロンプトビルダー
          </h1>
          <p className="mt-2 text-base sm:text-lg lg:text-xl text-gray-600 max-w-2xl mx-auto lg:mx-0">
            ジグソーパズル用の美しい画像を簡単に生成
          </p>
        </header>

        <main className="py-8 sm:py-12 lg:py-16" role="main">
          <div className="grid gap-6 sm:gap-8 md:grid-cols-2 lg:grid-cols-3">
            <Link to="/builder" className="group" aria-label="プロンプト作成を開始">
              <div className="rounded-lg border border-gray-200 bg-white p-4 sm:p-6 lg:p-8 shadow-sm transition-all hover:shadow-lg hover:scale-105 duration-200">
                <Palette className="h-12 w-12 text-primary-600" aria-hidden="true" />
                <h2 className="mt-4 text-lg sm:text-xl font-semibold text-gray-900">
                  新しく作成
                </h2>
                <p className="mt-2 text-sm sm:text-base text-gray-600">
                  カテゴリや詳細を選んで、オリジナルの画像プロンプトを作成します
                </p>
                <div className="mt-4">
                  <span className="text-primary-600 group-hover:underline">
                    作成を開始 →
                  </span>
                </div>
              </div>
            </Link>

            <Link to="/history" className="group" aria-label="作成履歴を確認">
              <div className="rounded-lg border border-gray-200 bg-white p-4 sm:p-6 lg:p-8 shadow-sm transition-all hover:shadow-lg hover:scale-105 duration-200">
                <Clock className="h-12 w-12 text-primary-600" aria-hidden="true" />
                <h2 className="mt-4 text-lg sm:text-xl font-semibold text-gray-900">
                  履歴を見る
                </h2>
                <p className="mt-2 text-sm sm:text-base text-gray-600">
                  過去に作成したプロンプトを確認・再利用できます
                </p>
                <div className="mt-4">
                  <span className="text-primary-600 group-hover:underline">
                    履歴を確認 →
                  </span>
                </div>
              </div>
            </Link>

            <div className="opacity-50" aria-disabled="true">
              <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
                <Heart className="h-12 w-12 text-gray-400" aria-hidden="true" />
                <h2 className="mt-4 text-lg sm:text-xl font-semibold text-gray-900">
                  お気に入り
                </h2>
                <p className="mt-2 text-sm sm:text-base text-gray-600">
                  お気に入りのプロンプトをすぐに使えます（準備中）
                </p>
                <div className="mt-4">
                  <span className="text-gray-400">
                    準備中
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-8 sm:mt-12 lg:mt-16">
            <div className="rounded-lg bg-blue-50 p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto">
              <h3 className="text-lg lg:text-xl font-semibold text-gray-900">
                使い方のヒント
              </h3>
              <ul className="mt-4 space-y-2 text-sm sm:text-base lg:text-lg text-gray-700">
                <li>• カテゴリを選んで、詳細な要素を追加していきます</li>
                <li>• 色やスタイル、雰囲気を選んで、イメージを具体化します</li>
                <li>• 生成されたプロンプトを使って、画像を作成できます</li>
                <li>• 作成履歴は自動的に保存されます</li>
              </ul>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}