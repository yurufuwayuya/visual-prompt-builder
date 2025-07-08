/**
 * 商用利用可能な画像生成サービスの設定
 */

export interface ImageGenerationService {
  id: string;
  name: string;
  type: 'url' | 'copy' | 'both';
  urlTemplate?: string;
  url?: string;
  instructions: string;
  instructionsEn: string;
  freeInfo: string;
  freeInfoEn: string;
  commercialUse: boolean;
  limitations?: string;
  limitationsEn?: string;
}

export const commercialImageServices: ImageGenerationService[] = [
  // URL連携型
  {
    id: 'pollinations',
    name: 'Pollinations.ai',
    type: 'url',
    urlTemplate: 'https://image.pollinations.ai/prompt/{prompt}',
    instructions: '自動的に画像が生成されます',
    instructionsEn: 'Image will be generated automatically',
    freeInfo: '完全無料、登録不要',
    freeInfoEn: 'Completely free, no registration required',
    commercialUse: true,
  },
  {
    id: 'huggingface',
    name: 'Hugging Face Spaces',
    type: 'both',
    url: 'https://huggingface.co/spaces',
    urlTemplate: 'https://huggingface.co/spaces/stabilityai/stable-diffusion?prompt={prompt}',
    instructions: 'Spacesから商用可能なモデルを選択してください',
    instructionsEn: 'Select a commercially available model from Spaces',
    freeInfo: '多数の無料モデル利用可能',
    freeInfoEn: 'Many free models available',
    commercialUse: true,
    limitations: 'モデルのライセンスを要確認',
    limitationsEn: 'Check model license',
  },
  // コピペ型
  {
    id: 'bing',
    name: 'Bing Image Creator',
    type: 'copy',
    url: 'https://www.bing.com/images/create',
    instructions: 'プロンプトをコピーして、テキストボックスに貼り付けてください',
    instructionsEn: 'Copy the prompt and paste it into the text box',
    freeInfo: 'Microsoftアカウントで無料',
    freeInfoEn: 'Free with Microsoft account',
    commercialUse: true,
    limitations: '1日の生成回数制限あり',
    limitationsEn: 'Daily generation limit',
  },
  {
    id: 'leonardo',
    name: 'Leonardo.ai',
    type: 'copy',
    url: 'https://app.leonardo.ai',
    instructions: 'プロンプトをコピーして、生成画面に貼り付けてください',
    instructionsEn: 'Copy the prompt and paste it in the generation screen',
    freeInfo: '無料プラン: 1日150トークン',
    freeInfoEn: 'Free plan: 150 tokens per day',
    commercialUse: true,
    limitations: '高解像度は有料プラン必要',
    limitationsEn: 'High resolution requires paid plan',
  },
  {
    id: 'perchance',
    name: 'Perchance AI',
    type: 'copy',
    url: 'https://perchance.org/ai-text-to-image-generator',
    instructions: 'テキストボックスにプロンプトを貼り付けて、Generateボタンをクリック',
    instructionsEn: 'Paste the prompt into the text box and click Generate',
    freeInfo: '完全無料、無制限、登録不要',
    freeInfoEn: 'Completely free, unlimited, no sign-up',
    commercialUse: true,
    limitations: '広告表示あり',
    limitationsEn: 'Ad-supported',
  },
];

/**
 * サービスIDからサービス情報を取得
 */
export function getServiceById(id: string): ImageGenerationService | undefined {
  return commercialImageServices.find((service) => service.id === id);
}

/**
 * URL連携可能なサービスのみを取得
 */
export function getUrlServices(): ImageGenerationService[] {
  return commercialImageServices.filter(
    (service) => service.type === 'url' || service.type === 'both'
  );
}

/**
 * コピペ型サービスのみを取得
 */
export function getCopyServices(): ImageGenerationService[] {
  return commercialImageServices.filter(
    (service) => service.type === 'copy' || service.type === 'both'
  );
}
