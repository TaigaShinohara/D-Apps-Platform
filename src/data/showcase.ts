import type { Locale } from '../lib/catalog';

type Bilingual = Record<Locale, string>;

export interface ShowcaseEntry {
  name: string;
  summary: Bilingual;
  platform?: string;
  repository?: string;
  members?: readonly string[];
  status?: Bilingual;
}

export const projects: readonly ShowcaseEntry[] = [
  {
    name: 'AIMeter',
    platform: 'macOS',
    repository: 'AIMeter-public',
    summary: {
      ja: 'AIツールの利用状況を、Macのメニューバーやウィジェットで確認。',
      en: 'Check your AI tool usage from the Mac menu bar or a widget.',
    },
  },
  {
    name: 'ImageCrate',
    platform: 'Chrome / Safari',
    repository: 'ImageCrate-public',
    summary: {
      ja: 'Webページの画像をプレビューし、選んだ画像をまとめて保存。',
      en: 'Preview images on a web page and save the ones you select together.',
    },
  },
  {
    name: 'VideoHarbor',
    platform: 'Chrome / Safari',
    repository: 'VideoHarbor-public',
    summary: {
      ja: 'Webページ上の動画を保存したり、必要な場面だけ録画したりできるブラウザ拡張。',
      en: 'A browser extension for saving video from a page or recording a selected segment.',
    },
  },
  {
    name: 'RabbitTracker',
    platform: 'iOS / Android',
    summary: {
      ja: '習慣の小さな達成や休みを記録し、自分のペースで再開するためのアプリ。',
      en: 'Record small wins and rest days, then pick up your habits at your own pace.',
    },
  },
  {
    name: 'Modoreta',
    platform: 'Android',
    summary: {
      ja: 'つい開いてしまうアプリの前でひと呼吸。今使うかどうかを自分で選べます。',
      en: 'Take a breath before opening a distracting app and decide whether to use it now.',
    },
  },
  {
    name: 'Scriptlet',
    platform: 'Android',
    repository: 'Scriptlet',
    summary: {
      ja: 'JavaScriptを書いて、Androidのホーム画面で動く自分だけのウィジェットを作る。',
      en: 'Write JavaScript to make your own Android home screen widgets.',
    },
  },
  {
    name: 'kikkake',
    platform: 'Android',
    repository: 'kikkake',
    summary: {
      ja: 'きっかけと動作を選んで、スマホで繰り返す操作を自動化する。',
      en: 'Choose a trigger and an action to automate repeated tasks on your phone.',
    },
  },
  {
    name: 'うろぼえ',
    platform: 'Android',
    summary: {
      ja: '忘却曲線をもとに、忘れそうな頃に自分のメモを見返せる。',
      en: 'Review your notes around the time you are likely to forget them, using a forgetting curve.',
    },
  },
  {
    name: '顔写真 MBTI診断',
    platform: 'Web',
    repository: 'face-mbti',
    summary: {
      ja: '顔写真の明るさや色味から、MBTI風のタイプを表示するエンタメアプリ。',
      en: 'An entertainment app that uses photo brightness and color to show an MBTI-style result.',
    },
  },
  {
    name: 'QR一気よみ',
    platform: 'Android',
    summary: {
      ja: '複数のQRコードを続けて読み取るためのアプリ。',
      en: 'Scan several QR codes in a row.',
    },
  },
  {
    name: 'KageCam',
    platform: 'Android',
    summary: {
      ja: 'シャッターを切ったあと、その場の音を短く録って写真と一緒に残すカメラ。',
      en: 'Capture a short clip of ambient sound after taking a photo and keep them together.',
    },
  },
  {
    name: 'Deeplik',
    platform: 'iOS / Android',
    status: { ja: '開発休止中', en: 'Development paused' },
    summary: {
      ja: 'プロフィールを共有し、選んだ友だちと個別・グループで話せるアプリ。',
      en: 'Share a profile and talk with friends in one-to-one or group chats.',
    },
  },
  {
    name: 'mori',
    platform: 'Android / Wear OS / iOS / watchOS',
    summary: {
      ja: '安静時の心拍数を自分の過去の値と比べ、日々の体調を振り返るウェルネスアプリ。',
      en: 'Reflect on your wellbeing by comparing your resting heart rate with your own past readings.',
    },
  },
  {
    name: 'Hoshizora Watch',
    platform: 'Android / Wear OS / iOS / watchOS',
    summary: {
      ja: '月齢や次の流星群を、スマホや腕時計から確認できる星空時計。',
      en: 'Check the Moon’s age and upcoming meteor showers from a phone or watch.',
    },
  },
  {
    name: 'Deeple',
    status: { ja: '提供終了', en: 'Discontinued' },
    summary: {
      ja: '友だち同士でお互いの印象をラベルにし、そのラベルがプロフィールになるSNS。',
      en: 'A social app where friends tagged their impressions of one another to build profiles.',
    },
  },
  {
    name: 'ハイパーCapsLock',
    platform: 'macOS / Windows',
    repository: 'hyper-capslock',
    summary: {
      ja: 'CapsLockを、AI開発のコックピットに。単押し=Esc、長押し=Hyper（Ctrl+Alt+Shift+Cmd/Win）。バイブコーディング特化のキー配置。',
      en: 'Turn CapsLock into an AI-development cockpit: tap for Esc, hold for Hyper (Ctrl+Alt+Shift+Cmd/Win). A vibe-coding keymap for macOS (Karabiner) and Windows (Kanata + AutoHotkey).',
    },
  },
];

export const skills: readonly ShowcaseEntry[] = [
  {
    name: 'Concept-driven UX',
    repository: 'concept-driven-ux',
    members: ['concept-driven-ux', 'experience-balance', 'independent-review'],
    summary: {
      ja: 'アプリのコンセプトを軸に、使い方を設計し、体験のバランスや設計の整合性を点検するスキル集。',
      en: 'Skills for designing from a product concept, balancing the experience, and running an independent review.',
    },
  },
  {
    name: 'Mobile Onboarding',
    repository: 'mobile-onboarding',
    summary: {
      ja: 'アプリの特徴を読み取り、初めて使う人が操作を覚えられるオンボーディングを設計・実装。',
      en: 'Design and implement onboarding that teaches people how to use a mobile app.',
    },
  },
  {
    name: 'Store Submission Skills',
    repository: 'store-submission-skills',
    members: [
      'store_review_readiness',
      'store_listing_pack',
      'store_submission_ops',
    ],
    summary: {
      ja: 'アプリストアの審査準備、掲載素材の作成、提出手順を支援する3つのスキル。',
      en: 'Three skills for store review readiness, listing assets, and submission.',
    },
  },
  {
    name: 'Easy i18n',
    repository: 'easy-i18n-skill',
    summary: {
      ja: '翻訳文を1つのICUカタログで管理し、変更した箇所から多言語対応を進めるスキル。',
      en: 'Keep translations in one ICU catalog and translate changed strings as the app evolves.',
    },
  },
  {
    name: 'Simple Glass',
    repository: 'simple-glass-skill',
    summary: {
      ja: '透け感のあるUIを、さまざまなプラットフォームで設計・実装するためのスキル。',
      en: 'Design and implement translucent glass effects across app and web platforms.',
    },
  },
];
