# D-Apps

An open, bilingual app directory for deepledeeple.com. Built around clear distribution information and no visitor tracking.

D-Apps は、アプリの用途・配布元・データの扱いを確認してダウンロードできる、Astro + TypeScript の静的サイトです。日本語 `/ja/` と英語 `/en/` に対応し、最初の掲載アプリは OneClip 1.0.1 です。

フォーム、ログイン、アップロード、広告、解析 SDK、外部フォント、追跡 Cookie はありません。検索用のサーバーや公開 API、データベースもありません。6 件以上掲載した場合だけ、ブラウザ内で完結する絞り込みを表示します。JavaScript を無効にしても、説明・言語切替・ダウンロードは利用できます。

## ローカルで確認する

Node.js 24 LTS、npm、Python 3 を使用します。依存関係は lockfile に固定しています。

```sh
npm ci
npm run check
npm run lint
npm test
npm run build
npm run verify:site
npm run verify:distribution
npm run verify:release -- --fetch
npm run verify:firebase
npm run preview
```

プレビューは `http://127.0.0.1:4321/ja/` にだけ公開されます。配布ファイルは `.artifacts/releases/` に取得し、Git には含めません。macOS では `npm run verify:release -- --fetch --macos` で ZIP のパス安全性、署名、公証チケット、Gatekeeper も検証できます。アプリを起動するコマンドではありません。

```sh
npx playwright install --with-deps chromium firefox webkit
npm run test:e2e
npm audit --audit-level=moderate
```

Mac の既存 Chrome を使う場合は `PLAYWRIGHT_USE_SYSTEM_CHROME=1` を設定します。ブラウザの保存場所を変更した場合はインストールと実行で同じ `PLAYWRIGHT_BROWSERS_PATH` を使用します。ビルドの前には、実行中のビルド・メモリ・ディスク空き容量を確認してください。

## 更新する

- アプリ情報：`src/data/*.json`。日英の必須項目、公開判定、配布 URL をビルド時に検証します。
- 運営ページ：`src/content/pages/{ja,en}/*.md`。対応する翻訳がない場合はビルドを止めます。
- 配信停止：`config/revoked-downloads.json`。停止した版はリンクと公開バンドルから除き、再公開後に 404 を確認します。
- 直接配布：正式リリースの ZIP を加工せず、版ごとの URL で配布します。新しい配布物には検証スクリプト・公開判定・アップロード処理の更新が必要です。JSON の追加だけでは配布を有効にできません。
- ストア配布：公式 HTTPS URL を登録します。架空のストア登録はテストだけに置き、公開データには含めません。

## 公開と運用

**マージだけでは本番公開されません。** Google Firebase Hosting を採用し、手動ワークフローで検証済みの版を非公開で準備した後、別の手動ワークフローで公開します。両方とも `main` と承認付きの `production` 環境に限定します。Google Cloud の専用プロジェクト・請求先とクレジット適用は未設定です。

Google は Firebase Hosting の不正利用検出・利用状況分析のため、訪問者の IP アドレスを数か月保持します。この扱いは日英のプライバシー方針に明記しています。D-Apps は入力受付・追跡・追加の訪問者ログ保存を行いません。

- [Firebase Hosting の構成・公開・復旧手順](docs/DEPLOYMENT.md)
- [Google Cloud の専用認証とクレジット確認](docs/GOOGLE-CLOUD-AUTH.md)
- [公開前の確認事項と費用の前提](docs/RELEASE-READINESS.md)
- [検証記録](docs/QA.md)
- [Google Modern Web Guidance の適用](docs/MODERN-WEB-GUIDANCE.md)
- [脆弱性の報告](SECURITY.md)
- [アプリ・素材の出典と権利](THIRD-PARTY.md)

Site code is licensed under [MIT](LICENSE). Apps and third-party materials retain their respective licenses; the site license does not grant rights to every distributed app or third-party trademark.
