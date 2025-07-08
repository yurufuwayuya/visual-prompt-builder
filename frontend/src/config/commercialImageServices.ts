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
  // コピペ型
  {
    id: 'chatgpt',
    name: 'ChatGPT 画像生成',
    type: 'copy',
    url: 'https://chat.openai.com',
    instructions: 'ChatGPTにログイン後、プロンプトを貼り付けて画像生成を依頼してください',
    instructionsEn: 'Login to ChatGPT and request image generation with the prompt',
    freeInfo: '無料プランで利用可能（DALL-E 3）',
    freeInfoEn: 'Available in free plan (DALL-E 3)',
    commercialUse: true,
    limitations: '無料プランは生成回数に制限',
    limitationsEn: 'Generation limit in free plan',
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
    id: 'stablediffusion-online',
    name: 'Stable Diffusion Online',
    type: 'copy',
    url: 'https://stablediffusionweb.com',
    instructions: 'プロンプトをコピーして、テキストボックスに貼り付けてGenerate Imageをクリック',
    instructionsEn: 'Copy the prompt and paste it into the text box, then click Generate Image',
    freeInfo: '完全無料、登録不要',
    freeInfoEn: 'Completely free, no registration required',
    commercialUse: true,
    limitations: 'サーバー負荷により生成速度が変動',
    limitationsEn: 'Generation speed varies by server load',
  },
  {
    id: 'imagefx',
    name: 'ImageFX by Google',
    type: 'copy',
    url: 'https://aitestkitchen.withgoogle.com/tools/image-fx',
    instructions: 'Googleアカウントでログイン後、プロンプトを入力してCreateをクリック',
    instructionsEn: 'Login with Google account, enter prompt and click Create',
    freeInfo: '完全無料、Googleアカウント必要',
    freeInfoEn: 'Completely free, Google account required',
    commercialUse: true,
    limitations: '1日の生成回数に制限あり',
    limitationsEn: 'Daily generation limit',
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
