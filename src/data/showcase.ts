import type { Locale } from '../lib/catalog';

type Bilingual = Record<Locale, string>;

export interface ShowcaseEntry {
  name: string;
  summary: Bilingual;
  repository?: string;
  members?: readonly string[];
}

export interface ProjectEntry extends ShowcaseEntry {
  id: string;
  platform?: string;
  status?: Bilingual;
  detail: Bilingual;
}

export interface SkillEntry extends ShowcaseEntry {
  repository: string;
}

export function projectStatus(project: ProjectEntry, lang: Locale) {
  if (project.status) return project.status[lang];
  if (project.repository)
    return lang === 'ja' ? 'ソース公開' : 'Source available';
  return lang === 'ja' ? '配布準備中' : 'In development';
}

export const projects: readonly ProjectEntry[] = [
  {
    id: 'aimeter',
    name: 'AIMeter',
    detail: {
      ja: 'メニューバーから、対応するAIツールの利用状況を手早く確認できます。Macのウィジェットにも表示できます。',
      en: 'Check supported AI tools at a glance from the menu bar, or put the information on your Mac desktop with a widget.',
    },
    platform: 'macOS',
    repository: 'AIMeter-public',
    summary: {
      ja: 'AIツールの利用状況を、Macのメニューバーやウィジェットで確認。',
      en: 'Check your AI tool usage from the Mac menu bar or a widget.',
    },
  },
  {
    id: 'imagecrate',
    name: 'ImageCrate',
    detail: {
      ja: 'ページ内の画像を一覧に集め、大きなプレビューで候補を確認してから、使いたい画像だけを保存できます。',
      en: 'Gather images from a page into a grid, inspect the candidates at a larger size, and save the ones you need.',
    },
    platform: 'Chrome / Safari',
    repository: 'ImageCrate-public',
    summary: {
      ja: 'Webページの画像をプレビューし、選んだ画像をまとめて保存。',
      en: 'Preview images on a web page and save the ones you select together.',
    },
  },
  {
    id: 'videoharbor',
    name: 'VideoHarbor',
    detail: {
      ja: '動画を取得できるページではファイルを保存し、必要なシーンだけを残したいときは録画範囲を選べます。使える方法はサイトによって変わります。',
      en: 'Save a video file where supported, or choose a segment to record when you only need a short scene. Available modes depend on the site.',
    },
    platform: 'Chrome / Safari',
    repository: 'VideoHarbor-public',
    summary: {
      ja: 'Webページ上の動画を保存したり、必要な場面だけ録画したりできるブラウザ拡張。',
      en: 'A browser extension for saving video from a page or recording a selected segment.',
    },
  },
  {
    id: 'rabbittracker',
    name: 'RabbitTracker',
    detail: {
      ja: 'チェック式と数値式の習慣を記録できます。達成だけでなく、休んだ日や小さく再開した日も振り返れます。',
      en: 'Track checklists or numeric habits. Look back at rest days and small restarts as well as completions.',
    },
    platform: 'iOS / Android',
    summary: {
      ja: '習慣の小さな達成や休みを記録し、自分のペースで再開するためのアプリ。',
      en: 'Record small wins and rest days, then pick up your habits at your own pace.',
    },
  },
  {
    id: 'modoreta',
    name: 'Modoreta',
    detail: {
      ja: '対象に選んだアプリを開こうとすると、ひと呼吸する画面が現れます。今は開かずに戻るか、5分だけ使うかを自分で選べます。',
      en: 'A brief pause appears when you open an app you have selected. You then choose whether to go back or use it for five minutes.',
    },
    platform: 'Android',
    summary: {
      ja: 'つい開いてしまうアプリの前でひと呼吸。今使うかどうかを自分で選べます。',
      en: 'Take a breath before opening a distracting app and decide whether to use it now.',
    },
  },
  {
    id: 'scriptlet',
    name: 'Scriptlet',
    detail: {
      ja: '書いたJavaScriptを使って、Androidのホーム画面に表示するウィジェットを作れます。',
      en: 'Use a script you write to create a widget that lives on your Android home screen.',
    },
    platform: 'Android',
    repository: 'Scriptlet',
    summary: {
      ja: 'JavaScriptを書いて、Androidのホーム画面で動く自分だけのウィジェットを作る。',
      en: 'Write JavaScript to make your own Android home screen widgets.',
    },
  },
  {
    id: 'kikkake',
    name: 'kikkake',
    detail: {
      ja: '最初に動き出す条件を選び、続けて行う操作を組み合わせます。仕組みを一つずつ組み立てられます。',
      en: 'Start with the condition that triggers an automation and pair it with the action to run. Build one routine at a time.',
    },
    platform: 'Android',
    repository: 'kikkake',
    summary: {
      ja: 'きっかけと動作を選んで、スマホで繰り返す操作を自動化する。',
      en: 'Choose a trigger and an action to automate repeated tasks on your phone.',
    },
  },
  {
    id: 'uroboe',
    name: 'うろぼえ',
    detail: {
      ja: '書き残したメモを、記憶が薄れてきそうな時期に読み返すためのアプリです。',
      en: 'Revisit notes when the ideas they capture are likely to start fading from memory.',
    },
    platform: 'Android',
    summary: {
      ja: '忘却曲線をもとに、忘れそうな頃に自分のメモを見返せる。',
      en: 'Review your notes around the time you are likely to forget them, using a forgetting curve.',
    },
  },
  {
    id: 'face-mbti',
    name: '顔写真 MBTI診断',
    detail: {
      ja: '写真の明るさや色などをブラウザで判定します。結果は写真の写り方によって変わるエンタメ向けです。',
      en: 'The browser reads properties such as brightness and color. The result is for entertainment and changes with how the photo was taken.',
    },
    platform: 'Web',
    repository: 'face-mbti',
    summary: {
      ja: '顔写真の明るさや色味から、MBTI風のタイプを表示するエンタメアプリ。',
      en: 'An entertainment app that uses photo brightness and color to show an MBTI-style result.',
    },
  },
  {
    id: 'qr-ikki-yomi',
    name: 'QR一気よみ',
    detail: {
      ja: '複数あるQRコードを順番に確認したいときに、読み取りを繰り返せるAndroidアプリです。',
      en: 'An Android app for scanning a series of QR codes in one session.',
    },
    platform: 'Android',
    summary: {
      ja: '複数のQRコードを続けて読み取るためのアプリ。',
      en: 'Scan several QR codes in a row.',
    },
  },
  {
    id: 'kagecam',
    name: 'KageCam',
    detail: {
      ja: '写真のすぐあとに短い音を録ることで、その瞬間を目と耳の両方で振り返れます。',
      en: 'Record a short sound right after taking a photo, so you can revisit what the moment sounded like as well as what it looked like.',
    },
    platform: 'Android',
    summary: {
      ja: 'シャッターを切ったあと、その場の音を短く録って写真と一緒に残すカメラ。',
      en: 'Capture a short clip of ambient sound after taking a photo and keep them together.',
    },
  },
  {
    id: 'deeplik',
    name: 'Deeplik',
    detail: {
      ja: 'プロフィールから友だちとつながり、1対1の会話やグループトークを始められるように設計しました。',
      en: 'The app was designed around meeting friends through profiles and talking in private or group conversations.',
    },
    platform: 'iOS / Android',
    status: { ja: '開発休止中', en: 'Development paused' },
    summary: {
      ja: 'プロフィールを共有し、選んだ友だちと個別・グループで話せるアプリ。',
      en: 'Share a profile and talk with friends in one-to-one or group chats.',
    },
  },
  {
    id: 'mori',
    name: 'mori',
    detail: {
      ja: '安静時の心拍数を自分の基準と比べて確認します。日々のウェルネスを振り返るための参考情報です。',
      en: 'Compare resting heart rate with your personal baseline as a reference for reflecting on daily wellbeing.',
    },
    platform: 'Android / Wear OS / iOS / watchOS',
    summary: {
      ja: '安静時の心拍数を自分の過去の値と比べ、日々の体調を振り返るウェルネスアプリ。',
      en: 'Reflect on your wellbeing by comparing your resting heart rate with your own past readings.',
    },
  },
  {
    id: 'hoshizora-watch',
    name: 'Hoshizora Watch',
    detail: {
      ja: '腕元で今の月相を見たり、次の流星群の時期を確かめたりできます。月明かりの表示は照面率をもとにした目安です。',
      en: 'Check the current Moon phase on your wrist and see when the next meteor shower is due. The moonlight indicator estimates illumination from the Moon’s lit fraction.',
    },
    platform: 'Android / Wear OS / iOS / watchOS',
    summary: {
      ja: '月齢や次の流星群を、スマホや腕時計から確認できる星空時計。',
      en: 'Check the Moon’s age and upcoming meteor showers from a phone or watch.',
    },
  },
  {
    id: 'deeple',
    name: 'Deeple',
    detail: {
      ja: '相手に感じた印象をラベルで伝えると、集まったラベルがその人のプロフィールになっていく交流サービスでした。',
      en: 'Friends could describe their impressions with tags. Over time, the tags they received became part of their profile.',
    },
    status: { ja: '提供終了', en: 'Discontinued' },
    summary: {
      ja: '友だち同士でお互いの印象をラベルにし、そのラベルがプロフィールになるSNS。',
      en: 'A social app where friends tagged their impressions of one another to build profiles.',
    },
  },
  {
    id: 'hyper-capslock',
    name: 'ハイパーCapsLock',
    detail: {
      ja: 'スターター8点（Hyper+CでAIチャット、Hyper+Enterで送信、Hyper+1/2/3で固定席の切替、Hyper+Q/Wでウィンドウ左右、Hyper+Tでターミナル、Hyper+Spaceでランチャー、Hyper+Vでクリップボード履歴）を、macOSはKarabiner-Elements設定、WindowsはKanata設定とAutoHotkey v2スクリプトで提供します。',
      en: 'Provides the eight starter bindings (Hyper+C for AI chat, Hyper+Enter to send, Hyper+1/2/3 for pinned seats, Hyper+Q/W for window left/right, Hyper+T for the terminal, Hyper+Space for the launcher, Hyper+V for clipboard history) as a Karabiner-Elements config on macOS and Kanata plus AutoHotkey v2 scripts on Windows.',
    },
    platform: 'macOS / Windows',
    repository: 'hyper-capslock',
    summary: {
      ja: 'CapsLockを、AI開発のコックピットに。単押し=Esc、長押し=Hyper（Ctrl+Alt+Shift+Cmd/Win）。バイブコーディング特化のキー配置。',
      en: 'Turn CapsLock into an AI-development cockpit: tap for Esc, hold for Hyper (Ctrl+Alt+Shift+Cmd/Win). A vibe-coding keymap for macOS (Karabiner) and Windows (Kanata + AutoHotkey).',
    },
  },
];

export const skills: readonly SkillEntry[] = [
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
  {
    name: 'Minimal Information Design',
    repository: 'minimal-information-design-skill',
    summary: {
      ja: 'アプリの情報量を減らし、文字に頼らずアイコン・図形・操作UIで伝える。分割・折りたたみ・段階表示で、読まなくても直感的に使える設計にするスキル。',
      en: 'A skill to reduce app information load — less text, more icons, shapes and UI, with paging, folding and progressive disclosure so apps feel intuitive without reading.',
    },
  },
];
