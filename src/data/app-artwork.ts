import type { ImageMetadata } from 'astro';
import type { Locale } from '../lib/catalog';
import oneclip from '../assets/oneclip-overview.png';

type Bilingual = Record<Locale, string>;
type Artwork = {
  image: ImageMetadata;
  kind: 'screen' | 'phone' | 'mark' | 'character';
  alt: Bilingual;
  caption: Bilingual;
};

const images = import.meta.glob<ImageMetadata>('../assets/app-art/*', {
  eager: true,
  import: 'default',
});

function figure(
  file: string,
  kind: Artwork['kind'],
  alt: Bilingual,
  caption: Bilingual,
): Artwork {
  const image = images[`../assets/app-art/${file}`];
  if (!image) throw new Error(`Missing app artwork: ${file}`);
  return { image, kind, alt, caption };
}

const logo = { ja: 'アプリアイコン', en: 'App icon' };
const store = {
  ja: 'App Storeの掲載画像',
  en: 'Image from the App Store listing',
};
const openWeb = { ja: 'Web版の画面', en: 'Screen from the web app' };
const storePreview = {
  ja: 'ストア掲載用に作成された画面',
  en: 'Screen prepared for the store listing',
};

export const appArtwork: Readonly<Record<string, Artwork | undefined>> = {
  oneclip: {
    image: oneclip,
    kind: 'screen',
    alt: {
      ja: '複数のキャプチャをまとめて番号とコメントを付けた出力例',
      en: 'Captures combined with numbered annotations and comments',
    },
    caption: {
      ja: '架空の画面を使ったOneClipの出力例',
      en: 'OneClip output example using fictional screens',
    },
  },
  charmshelf: figure(
    'charmshelf.png',
    'phone',
    {
      ja: 'カタログの操作項目が並ぶCharmShelfの画面',
      en: 'CharmShelf’s catalog actions screen',
    },
    {
      ja: 'リポジトリのカタログ操作例',
      en: 'Catalog example from the repository',
    },
  ),
  profilemaker: figure(
    'profilemaker.jpg',
    'phone',
    {
      ja: '写真とラベルを並べたプロフィールカードの例',
      en: 'A profile card example with a photo and labels',
    },
    store,
  ),
  yoriai: figure(
    'yoriai.jpg',
    'phone',
    {
      ja: '木目と暗い照明を使ったyoriAIのようこそ画面',
      en: 'yoriAI welcome screen with dark lighting and a wood texture',
    },
    store,
  ),
  'personal-color-check': figure(
    'personal-color-check.png',
    'screen',
    {
      ja: '写真を選んでパーソナルカラーを調べる画面',
      en: 'The photo selection screen for checking your personal colors',
    },
    openWeb,
  ),
  aimeter: figure(
    'aimeter-first-launch.webp',
    'screen',
    {
      ja: 'AIMeterの初回案内と対応するAIサービスの選択画面',
      en: 'AIMeter’s first-run guide and AI service selection',
    },
    {
      ja: 'リポジトリに掲載している初回案内',
      en: 'First-run guide from the repository',
    },
  ),
  imagecrate: figure(
    'imagecrate.png',
    'screen',
    {
      ja: 'ページ内の画像を一覧にして選ぶImageCrateの画面',
      en: 'ImageCrate’s grid for selecting images from a page',
    },
    storePreview,
  ),
  videoharbor: figure(
    'videoharbor.png',
    'screen',
    {
      ja: '保存できる動画の候補と録画画面が並ぶVideoHarborの画面',
      en: 'VideoHarbor with candidate videos beside the recording view',
    },
    storePreview,
  ),
  rabbittracker: figure(
    'rabbittracker.png',
    'mark',
    {
      ja: 'ピンクと紫のウサギを描いたRabbitTrackerのアイコン',
      en: 'RabbitTracker’s pink and purple rabbit icon',
    },
    logo,
  ),
  modoreta: figure(
    'modoreta-preview.webp',
    'phone',
    {
      ja: 'ひと呼吸する画面を試したあとのModoretaの案内',
      en: 'Modoreta’s guide after previewing the pause screen',
    },
    { ja: '開発時のプレビュー画面', en: 'Preview from development' },
  ),
  scriptlet: figure(
    'scriptlet.png',
    'screen',
    {
      ja: 'タスクやグラフの表示例を載せたScriptletウィジェット',
      en: 'A Scriptlet widget preview with tasks and a progress bar',
    },
    {
      ja: 'リポジトリにあるウィジェットのプレビュー素材',
      en: 'Widget preview artwork from the repository',
    },
  ),
  kikkake: figure(
    'kikkake.png',
    'mark',
    {
      ja: '濃いピンクに白い円と矢印を描いたkikkakeのアイコン',
      en: 'kikkake’s white circle and arrow on deep pink',
    },
    logo,
  ),
  'face-mbti': figure(
    'face-mbti.png',
    'screen',
    {
      ja: '顔写真の選択とサンプルで試すボタンのあるトップ画面',
      en: 'Face MBTI home screen with photo selection and a sample option',
    },
    openWeb,
  ),
  deeplik: figure(
    'deeplik.png',
    'mark',
    {
      ja: '暗い背景に青く光る吹き出しを描いたDeeplikのアイコン',
      en: 'Deeplik’s glowing blue speech bubble on a dark background',
    },
    logo,
  ),
  mori: figure(
    'mori.png',
    'screen',
    {
      ja: '葉や花の形と表情が異なるmoriのキャラクターたち',
      en: 'mori characters with different leaves, flowers, and expressions',
    },
    {
      ja: 'アプリで使うキャラクターの制作素材',
      en: 'Character artwork used in the app',
    },
  ),
  'hoshizora-watch': figure(
    'hoshizora-watch.png',
    'mark',
    {
      ja: '三日月と紫・緑の星を描いたHoshizora Watchのアイコン',
      en: 'A crescent Moon with purple and green stars on the Hoshizora Watch icon',
    },
    logo,
  ),
  deeple: figure(
    'deeple.png',
    'mark',
    {
      ja: '幾何学模様で描かれたペンギンのDeepleアイコン',
      en: 'Deeple’s geometric penguin icon',
    },
    { ja: '当時のアプリアイコン', en: 'Original app icon' },
  ),
  storegate: figure(
    'storegate.webp',
    'mark',
    {
      ja: 'チェックマークと緑のゲートを描いたStoreGateのアイコン',
      en: 'StoreGate icon with a mint-colored gate and checkmark',
    },
    logo,
  ),
  'open-screenshot-generator': figure(
    'tiger-screen-shot.webp',
    'screen',
    {
      ja: '紫色のストア画像を並べて編集しているスクリーンショット制作画面',
      en: 'The screenshot editor arranging a set of purple store graphics',
    },
    {
      ja: 'フォークのリポジトリに掲載されている編集画面',
      en: 'Editor screenshot from the fork’s repository',
    },
  ),
  'omamori-pet': figure(
    'omamori-pet.webp',
    'character',
    {
      ja: '丸いミント色の体に白い目を浮かべたお守りペット',
      en: 'A mint-colored round pet with two white eyes',
    },
    { ja: 'アプリ内のペット「おだやか」', en: 'The pet in its calm state' },
  ),
};
