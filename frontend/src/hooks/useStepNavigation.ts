import { useCallback } from 'react';

/**
 * ステップナビゲーション用の共通フック
 * 
 * @param onNext - 次のステップへ進む関数
 * @param isValid - 次へ進むボタンの有効/無効を判定する関数
 * @param onBeforeNext - 次へ進む前に実行する処理（データ保存など）
 */
export function useStepNavigation(
  onNext: () => void,
  isValid: () => boolean,
  onBeforeNext?: () => void
) {
  const handleNext = useCallback(() => {
    if (!isValid()) return;
    
    // 次へ進む前の処理
    if (onBeforeNext) {
      onBeforeNext();
    }
    
    // 次のステップへ
    onNext();
  }, [onNext, isValid, onBeforeNext]);
  
  return {
    handleNext,
    canProceed: isValid(),
  };
}