import React from 'react';
import { AlertTriangle, X, Camera, Download, Wand2 } from 'lucide-react';
import { Button } from '@/components/common/Button';

interface CudaOomErrorDialogProps {
  isOpen: boolean;
  onClose: () => void;
  errorMessage?: string;
  onRetry?: () => void;
}

export const CudaOomErrorDialog: React.FC<CudaOomErrorDialogProps> = ({
  isOpen,
  onClose,
  errorMessage,
  onRetry,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* ヘッダー */}
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center gap-2 text-red-600">
            <AlertTriangle className="w-6 h-6" />
            <h2 className="text-lg font-semibold">メモリ不足エラー</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            aria-label="閉じる"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 本文 */}
        <div className="p-4 space-y-4">
          <div className="bg-red-50 border border-red-200 rounded-lg p-3">
            <p className="text-sm text-red-700">
              {errorMessage ||
                '画像生成に必要なメモリが不足しています。より小さい画像サイズで再試行してください。'}
            </p>
          </div>

          <div className="space-y-3">
            <h3 className="font-medium">対処法：</h3>

            <div className="space-y-2">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <Camera className="w-4 h-4 text-blue-600" />
                </div>
                <div>
                  <p className="font-medium text-sm">スマートフォンの設定を変更</p>
                  <p className="text-xs text-gray-600 mt-1">
                    カメラアプリの設定で画像サイズを「中」または「小」に変更してから撮影し直してください。
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                  <Download className="w-4 h-4 text-green-600" />
                </div>
                <div>
                  <p className="font-medium text-sm">画像編集アプリを使用</p>
                  <p className="text-xs text-gray-600 mt-1">
                    画像編集アプリで画像を1024x1024ピクセル以下にリサイズしてから再アップロードしてください。
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                  <Wand2 className="w-4 h-4 text-purple-600" />
                </div>
                <div>
                  <p className="font-medium text-sm">別のモデルを試す</p>
                  <p className="text-xs text-gray-600 mt-1">
                    「FLUX Variations」など、より軽量なモデルを選択してみてください。
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* 追加情報 */}
          <div className="bg-gray-50 rounded-lg p-3">
            <p className="text-xs text-gray-600">
              <strong>技術的な詳細：</strong>
              AI画像生成モデルは大量のGPUメモリを必要とします。
              高解像度の画像（特に8MP以上）は処理できない場合があります。
              画像は自動的に最適化されますが、元画像が大きすぎる場合はこのエラーが発生します。
            </p>
          </div>
        </div>

        {/* フッター */}
        <div className="flex justify-end gap-2 p-4 border-t">
          <Button variant="outline" onClick={onClose}>
            閉じる
          </Button>
          {onRetry && <Button onClick={onRetry}>再試行</Button>}
        </div>
      </div>
    </div>
  );
};
