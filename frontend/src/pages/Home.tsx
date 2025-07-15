import { Link } from 'react-router-dom';
import { Palette, Clock, Sparkles, Zap, Heart, Image } from 'lucide-react';

export function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      <div className="container max-w-7xl xl:max-w-screen-xl 2xl:max-w-screen-2xl px-4 sm:px-6 lg:px-8">
        <header className="py-10 sm:py-16 lg:py-20 xl:py-24 text-center">
          <div className="relative inline-block">
            <Sparkles className="absolute -top-4 -right-4 h-6 w-6 text-yellow-400 animate-pulse" />
            <h1 className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
              ビジュアルプロンプトビルダー
            </h1>
          </div>
          <p className="mt-4 text-lg sm:text-xl lg:text-2xl xl:text-3xl text-gray-700 max-w-3xl mx-auto font-medium">
            ジグソーパズル用の美しい画像を簡単に生成
          </p>
          <p className="mt-2 text-base sm:text-lg text-gray-500 max-w-2xl mx-auto">
            AIの力で、あなたの想像を形に変える魔法のツール
          </p>
        </header>

        <main className="py-8 sm:py-12 lg:py-16">
          <div className="grid gap-6 sm:gap-8 md:grid-cols-2 lg:grid-cols-3 max-w-5xl mx-auto">
            <Link
              to="/builder"
              className="group relative overflow-hidden"
              aria-label="プロンプト作成を開始"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-indigo-500 to-purple-500 opacity-0 group-hover:opacity-10 transition-opacity duration-300"></div>
              <div className="relative rounded-xl border-2 border-gray-100 bg-white p-6 sm:p-8 shadow-lg transition-all hover:shadow-xl hover:scale-[1.02] hover:border-indigo-200 duration-300">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-indigo-100 rounded-xl group-hover:bg-indigo-200 transition-colors">
                    <Palette className="h-8 w-8 text-indigo-600" aria-hidden="true" />
                  </div>
                  <Zap className="h-5 w-5 text-yellow-400 animate-pulse" />
                </div>
                <h2 className="text-xl sm:text-2xl font-bold text-gray-900">新しく作成</h2>
                <p className="mt-2 text-sm sm:text-base text-gray-600 leading-relaxed">
                  カテゴリや詳細を選んで、オリジナルの画像プロンプトを作成します
                </p>
                <div className="mt-4 flex items-center text-indigo-600 font-semibold text-base group-hover:text-indigo-700">
                  <span>作成を開始</span>
                  <svg
                    className="ml-2 h-4 w-4 transform group-hover:translate-x-1 transition-transform"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13 7l5 5m0 0l-5 5m5-5H6"
                    />
                  </svg>
                </div>
              </div>
            </Link>

            <Link
              to="/history"
              className="group relative overflow-hidden"
              aria-label="作成履歴を確認"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-purple-500 to-pink-500 opacity-0 group-hover:opacity-10 transition-opacity duration-300"></div>
              <div className="relative rounded-xl border-2 border-gray-100 bg-white p-6 sm:p-8 shadow-lg transition-all hover:shadow-xl hover:scale-[1.02] hover:border-purple-200 duration-300">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-purple-100 rounded-xl group-hover:bg-purple-200 transition-colors">
                    <Clock className="h-8 w-8 text-purple-600" aria-hidden="true" />
                  </div>
                  <Heart className="h-5 w-5 text-pink-400 animate-pulse" />
                </div>
                <h2 className="text-xl sm:text-2xl font-bold text-gray-900">履歴を見る</h2>
                <p className="mt-2 text-sm sm:text-base text-gray-600 leading-relaxed">
                  過去に作成したプロンプトを確認・再利用できます
                </p>
                <div className="mt-4 flex items-center text-purple-600 font-semibold text-base group-hover:text-purple-700">
                  <span>履歴を確認</span>
                  <svg
                    className="ml-2 h-4 w-4 transform group-hover:translate-x-1 transition-transform"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13 7l5 5m0 0l-5 5m5-5H6"
                    />
                  </svg>
                </div>
              </div>
            </Link>

            <Link
              to="/i2i"
              className="group relative overflow-hidden"
              aria-label="Image-to-Image生成"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-green-500 to-teal-500 opacity-0 group-hover:opacity-10 transition-opacity duration-300"></div>
              <div className="relative rounded-xl border-2 border-gray-100 bg-white p-6 sm:p-8 shadow-lg transition-all hover:shadow-xl hover:scale-[1.02] hover:border-green-200 duration-300">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-green-100 rounded-xl group-hover:bg-green-200 transition-colors">
                    <Image className="h-8 w-8 text-green-600" aria-hidden="true" />
                  </div>
                  <Sparkles className="h-5 w-5 text-teal-400 animate-pulse" />
                </div>
                <h2 className="text-xl sm:text-2xl font-bold text-gray-900">画像から生成</h2>
                <p className="mt-2 text-sm sm:text-base text-gray-600 leading-relaxed">
                  参考画像をベースに新しい画像を生成します
                </p>
                <div className="mt-4 flex items-center text-green-600 font-semibold text-base group-hover:text-green-700">
                  <span>i2i生成</span>
                  <svg
                    className="ml-2 h-4 w-4 transform group-hover:translate-x-1 transition-transform"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13 7l5 5m0 0l-5 5m5-5H6"
                    />
                  </svg>
                </div>
              </div>
            </Link>
          </div>

          <div className="mt-12 sm:mt-16 lg:mt-20">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-indigo-400 to-purple-400 opacity-10 blur-3xl"></div>
              <div className="relative rounded-2xl bg-gradient-to-br from-indigo-50 to-purple-50 border border-indigo-100 p-6 sm:p-8 lg:p-10 max-w-3xl mx-auto">
                <div className="flex items-center mb-5">
                  <div className="p-2 bg-indigo-100 rounded-lg mr-3">
                    <Sparkles className="h-5 w-5 text-indigo-600" />
                  </div>
                  <h3 className="text-xl lg:text-2xl font-bold text-gray-900">使い方のヒント</h3>
                </div>
                <div className="grid sm:grid-cols-2 gap-5 mt-6">
                  <div className="space-y-3">
                    <div className="flex items-start">
                      <div className="flex-shrink-0 h-7 w-7 rounded-full bg-indigo-100 flex items-center justify-center mt-0.5">
                        <span className="text-indigo-600 font-semibold text-sm">1</span>
                      </div>
                      <p className="ml-3 text-sm lg:text-base text-gray-700">
                        カテゴリを選んで、詳細な要素を追加していきます
                      </p>
                    </div>
                    <div className="flex items-start">
                      <div className="flex-shrink-0 h-7 w-7 rounded-full bg-purple-100 flex items-center justify-center mt-0.5">
                        <span className="text-purple-600 font-semibold text-sm">2</span>
                      </div>
                      <p className="ml-3 text-sm lg:text-base text-gray-700">
                        色やスタイル、雰囲気を選んで、イメージを具体化します
                      </p>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-start">
                      <div className="flex-shrink-0 h-7 w-7 rounded-full bg-pink-100 flex items-center justify-center mt-0.5">
                        <span className="text-pink-600 font-semibold text-sm">3</span>
                      </div>
                      <p className="ml-3 text-sm lg:text-base text-gray-700">
                        生成されたプロンプトを使って、画像を作成できます
                      </p>
                    </div>
                    <div className="flex items-start">
                      <div className="flex-shrink-0 h-7 w-7 rounded-full bg-yellow-100 flex items-center justify-center mt-0.5">
                        <span className="text-yellow-600 font-semibold text-sm">4</span>
                      </div>
                      <p className="ml-3 text-sm lg:text-base text-gray-700">
                        作成履歴は自動的に保存されます
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
