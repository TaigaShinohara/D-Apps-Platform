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
  detail: Bilingual;
}

export function projectStatus(project: ProjectEntry, lang: Locale) {
  if (project.status) return project.status[lang];
  if (project.repository)
    return lang === 'ja' ? 'ソース公開' : 'Source available';
  return lang === 'ja' ? '配布準備中' : 'In development';
}

export const projects: readonly ProjectEntry[] = [
  {
    id: 'mochimori',
    name: 'もち守り',
    detail: {
      ja: '判定は2値で言い切ります。「節電できてる」時は静かでひんやりした淡青のバッテリー、「節電できてない」時は燃えさかる炎のバッテリー。残量が減ると明るさや消灯時間を自動で調整し、直すべき時は理由1つと直し方1タップだけを添えます。',
      en: 'The verdict is binary: a calm, cool pale-blue battery when power is being saved, and a flaming battery when it is not. As the charge drops it adjusts brightness and screen timeout automatically, and when something needs fixing it shows one reason and a one-tap fix.',
    },
    platform: 'Android',
    repository: 'mochimori',
    summary: {
      ja: 'バッテリーの「2つの顔」が、節電できているかを見守る自動節電アプリ。',
      en: 'An automatic battery-saver watched over by the battery\u2019s two faces, which show whether you are saving power or not.',
    },
  },
  {
    id: 'storegate',
    name: 'StoreGate',
    detail: {
      ja: 'App StoreとGoogle Playの審査前に、掲載文やプライバシーの申告、ビルドの確認に使えるプレイブックと点検ツールです。macOS版では配信案件ごとに、確認結果と次の一手を整理できます。',
      en: 'A playbook and set of checks for store listings, privacy declarations and builds before App Store or Google Play review. The macOS workspace helps you track checks and next steps for each submission.',
    },
    platform: 'macOS / CLI / AI Agents',
    repository: 'StoreGate',
    summary: {
      ja: 'App Store・Google Playの審査リジェクトを事前に点検して防ぐプレイブック＆ガード。',
      en: 'Open playbook and pre-submission guard to prevent App Store and Google Play rejections.',
    },
  },
  {
    id: 'open-screenshot-generator',
    name: 'tiger screen shot',
    detail: {
      ja: 'Idrees KhanのOpen Screenshot Generatorをフォークした制作ツールです。テンプレートを選び、端末フレームに画面を入れて、ストアに合うサイズで書き出せます。GUI、CLI、AIエージェント、MCPに対応します。',
      en: 'A fork of Idrees Khan’s Open Screenshot Generator. Start with a template, place your screens in device frames, and export at store-ready sizes. The project supports a GUI, CLI, AI agents and MCP.',
    },
    platform: 'Web / CLI / MCP',
    repository: 'tiger-screen-shot',
    summary: {
      ja: 'アプリの画面から、ストアで目を引くスクリーンショットやプレビュー動画を作る。',
      en: 'Turn app screens into store screenshots and preview videos.',
    },
  },
  {
    id: 'omamori-pet',
    name: 'お守りペット',
    detail: {
      ja: '静止中の心拍上昇に穏やかに気づき、4-2-6呼吸の触覚ガイドでひと息つくためのAndroid・Wear OS向けウェルネスアプリです。医療診断ではなく、日常の落ち着きを支えるお守りとして設計しました。',
      en: 'An Android and Wear OS wellness companion that gently notices elevated resting heart rate and guides 4-2-6 breathing with calm haptics. Designed for everyday calm rather than medical diagnosis.',
    },
    platform: 'Android / Wear OS',
    repository: 'omamori_pet',
    summary: {
      ja: '静止中の心拍上昇に穏やかに気づき、4-2-6呼吸の触覚ガイドで寄り添うお守りアプリ。',
      en: 'A calm wellness companion for Android and Wear OS with gentle resting heart-rate awareness and 4-2-6 breathing haptics.',
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
  {
    id: 'livefeel',
    name: 'LiveFeel',
    detail: {
      ja: 'Sunoなどで作った曲や手持ちの音源に、会場の響きと客席の空気感を重ねます。会場はライブハウス／ホール／ジャズクラブ／アリーナの4種、ライブ感は弱・中・強から。Before/Afterを切り替えて聴き比べながら仕上げられ、処理は端末内で完結します。',
      en: 'Layers the resonance of a venue and the air of an audience onto tracks you made (for example with Suno) or already own. Four venues — live house, hall, jazz club and arena — and three levels of live feel. Compare before and after as you listen; everything is processed on the device.',
    },
    platform: 'Android',
    summary: {
      ja: '自分の曲を入れて会場を選ぶだけ。「自分の曲がステージに立った」ライブ感に加工して書き出すアプリ。',
      en: 'Drop in your own track, pick a venue, and export it with the feel of a live stage performance.',
    },
  },
  {
    id: 'otona-level-100',
    name: 'オトナレベル100',
    detail: {
      ja: '道路標識・敬語・科学・漢字など、大人として知っておきたい常識をクイズと暗記カードで覚えていきます。1日5問のペースと、忘却曲線に合わせた復習で、レベル1から100を目指します。',
      en: 'Covers the common knowledge adults are expected to have — road signs, polite language, science, kanji and more — through quizzes and flashcards. Five questions a day plus review timed to the forgetting curve, on the way from level 1 to 100.',
    },
    platform: 'Android',
    repository: 'otona-level-100',
    summary: {
      ja: '「知らないと恥ずかしい常識」を1日5問だけ。スキマ時間で解く、大人の常識クイズ。',
      en: 'Five questions a day of the common knowledge it would be embarrassing not to know — a common-sense quiz for grown-ups, in spare moments.',
    },
  },
  {
    id: 'migakeru',
    name: 'ミガケル',
    detail: {
      ja: '今日やることは3つだけ。できたら、それが自信になります。身についた習慣は「卒業」として手放していくので、リストは育てるものではなく軽くしていくもの。連続記録で脅したりはしません（名称は仮称）。',
      en: 'Just three things to do today; doing them becomes confidence. Habits that stick "graduate" and leave the list, so the list gets lighter instead of longer, and nothing threatens you with a broken streak. The name is provisional.',
    },
    platform: 'Android',
    repository: 'migakeru',
    summary: {
      ja: '「自分のこと、昨日より少し好きになる」男磨きアプリ。今日やることは3つだけ。',
      en: '"Like yourself a little more than yesterday" — a self-care app for men, with just three things to do today.',
    },
  },
  {
    id: 'tenki-no-kotae',
    name: '天気のこたえ',
    detail: {
      ja: '朝、出かける前に1回開くだけで、昨日より寒いか暑いか、傘がいるか、日焼け止めが要るか、服装をどうするかが決まります。常時表示は、結論1文＋服装＋傘＋日焼け止めの4つだけです。',
      en: 'Open it once before leaving and you know how today differs from yesterday, whether you need an umbrella or sunscreen, and what to wear. The screen always shows just four things: one conclusion line, clothing, umbrella, and sunscreen.',
    },
    platform: 'Android',
    summary: {
      ja: '数値ではなく「結局どうしたらいいか」だけを出す天気アプリ。昨日との違い・傘・服装が玄関で決まる。',
      en: 'A weather app that shows not numbers, but what to do: how today differs from yesterday, umbrella, and clothing — decided at the door.',
    },
  },
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
    repository: 'uroboe',
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
    repository: 'kagecam',
    detail: {
      ja: '写真から影を切り出して、型や調整で不思議な姿に仕上げます。その場の短い音を添えて、影のコレクションに残せます。',
      en: 'Lift a shadow out of a photo, shape it into something eerie, and save it in your collection with a short clip of the sound around you.',
    },
    platform: 'Android',
    summary: {
      ja: '影を撮って、音を添えて。日常のなかにひそむ影を集めるカメラ。',
      en: 'A camera for collecting the shadows hiding in everyday life, with sound.',
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
];

export const skills: readonly SkillEntry[] = [
  {
    name: 'Concept-driven UX',
    repository: 'concept-driven-ux',
    detail: {
      ja: 'まず誰にどんな体験を届けるかを定めます。その意図をもとに既存の機能や導線を見直し、全体のバランスを点検して、独立したレビューにかけます。',
      en: 'Define who the experience is for and what it should feel like. Use that intent to evaluate features and flows, check the balance across the app, and prepare an independent review.',
    },
    members: ['concept-driven-ux', 'experience-balance', 'independent-review'],
    summary: {
      ja: 'アプリのコンセプトを軸に、使い方を設計し、体験のバランスや設計の整合性を点検するスキル集。',
      en: 'Skills for designing from a product concept, balancing the experience, and running an independent review.',
    },
  },
  {
    name: 'Mobile Onboarding',
    repository: 'mobile-onboarding',
    detail: {
      ja: '初回起動で覚える操作を絞り、画面ごとに伝えたいことを一つにします。説明を読んで終わる代わりに、手順を試しながらアプリ本編へ進める導線を作ります。',
      en: 'Decide what a first-time user needs to learn and give each screen a single job. Build a short sequence where people can try the key action before entering the app.',
    },
    summary: {
      ja: 'アプリの特徴を読み取り、初めて使う人が操作を覚えられるオンボーディングを設計・実装。',
      en: 'Design and implement onboarding that teaches people how to use a mobile app.',
    },
  },
  {
    name: 'Store Submission Skills',
    repository: 'store-submission-skills',
    detail: {
      ja: '審査前に必要事項を確認し、ストア向けの紹介文・キーワード・スクリーンショットを用意します。提出手順では、ストア側で入力や送信が必要な項目を追えます。',
      en: 'Check review requirements, prepare store descriptions, keywords and screenshots, then follow the submission steps to see what still needs to be entered or sent in the store console.',
    },
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
    detail: {
      ja: '画面の文言を意味のあるキーに置き換え、翻訳カタログを一か所に集めます。原文を更新したら、変更箇所に絞って翻訳を更新できます。',
      en: 'Give UI strings semantic keys and collect them in one translation catalog. When the original changes, update the translations for the affected strings.',
    },
    summary: {
      ja: '翻訳文を1つのICUカタログで管理し、変更した箇所から多言語対応を進めるスキル。',
      en: 'Keep translations in one ICU catalog and translate changed strings as the app evolves.',
    },
  },
  {
    name: 'Simple Glass',
    repository: 'simple-glass-skill',
    detail: {
      ja: '背景のぼかし、透明度、境界線を組み合わせてガラスの質感を作ります。Webとモバイルの実装例をもとに、背景が変わっても文字や操作が読み取れるように調整します。',
      en: 'Combine background blur, opacity and borders to give a surface a glass finish. Use implementation recipes for web and mobile to keep text and controls legible across backgrounds.',
    },
    summary: {
      ja: '透け感のあるUIを、さまざまなプラットフォームで設計・実装するためのスキル。',
      en: 'Design and implement translucent glass effects across app and web platforms.',
    },
  },
  {
    name: 'Minimal Information Design',
    repository: 'minimal-information-design-skill',
    detail: {
      ja: 'その場で必要な判断と操作を起点に、画面に残す情報を選びます。詳細を必要なときに開けるようにし、伝わる箇所はアイコンや操作自体に任せます。',
      en: 'Start with the decision or action a person needs to make. Keep that information up front, reveal details on demand, and let icons or controls carry meaning where they can.',
    },
    summary: {
      ja: 'アプリの情報量を減らし、文字に頼らずアイコン・図形・操作UIで伝える。分割・折りたたみ・段階表示で、読まなくても直感的に使える設計にするスキル。',
      en: 'A skill to reduce app information load — less text, more icons, shapes and UI, with paging, folding and progressive disclosure so apps feel intuitive without reading.',
    },
  },
  {
    name: 'Material Design 3 UI',
    repository: 'material-design-3-ui-skill',
    detail: {
      ja: '色・文字・形のトークンを定義し、画面幅や状態に合うコンポーネントを選びます。実装後のレビューでも、コントラストや操作領域などを確かめられます。',
      en: 'Define color, type and shape tokens and choose components for each screen size and state. Review details such as contrast and touch targets once the UI is implemented.',
    },
    summary: {
      ja: 'Material Design 3・Material You・アクセシビリティに沿ったUI設計と実装を支援するスキル。',
      en: 'A reusable skill for designing, reviewing, and implementing accessible UI with Material Design 3 and Material You.',
    },
  },
  {
    name: 'Skills Updater',
    repository: 'skills-updater',
    summary: {
      ja: '公開スキルのインストールと更新を、まとめて行うコマンドラインツール。',
      en: 'Install and update the published skills together from the command line.',
    },
    detail: {
      ja: 'スキルを使い始めるときや、新しい版にそろえたいときに使うツールです。対応する環境や実行コマンドはGitHubのREADMEから確認できます。',
      en: 'Use it to get started with the collection or bring installed skills up to date. The GitHub README lists the supported environments and the commands to run.',
    },
  },
];
