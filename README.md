# D-Apps

An open, bilingual app directory for dobulab.com. Built around clear distribution information and no visitor tracking.

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

Microsoft Edge も確認する環境では `npx playwright install msedge` の後に `PLAYWRIGHT_INCLUDE_EDGE=1 npm run test:e2e` を実行します。CI はこの設定で Edge を含めます。ブラウザ導入は実行環境のシステム領域に影響するため、この Mac に追加することは必須にしていません。

## 更新する

- アプリ情報：`src/data/*.json`。日英の必須項目、公開判定、配布 URL をビルド時に検証します。
- 運営ページ：`src/content/pages/{ja,en}/*.md`。対応する翻訳がない場合はビルドを止めます。
- 配信停止：`config/revoked-downloads.json`。停止した版はリンク・配布ファイルの検証・公開バンドルから除き、再公開後に 404 を確認します。
- 直接配布：正式リリースの ZIP を加工せず、版ごとの URL で配布します。新しい配布物には検証スクリプト・公開判定・アップロード処理の更新が必要です。JSON の追加だけでは配布を有効にできません。
- ストア配布：公式 HTTPS URL を登録します。架空のストア登録はテストだけに置き、公開データには含めません。

## 公開と運用

[dobulab.com](https://dobulab.com/ja/) は2026年11月17日に Google Firebase Hosting で公開しました。`www.dobulab.com` は正規ドメインに転送します。更新時は `main` の検証済みの版を `staging` 環境の手動ワークフローでステージし、`production` 環境の別の手動ワークフローから公開します。**マージだけでは本番の配信内容は変わりません。**

Google は Firebase Hosting の不正利用検出・利用状況分析のため、訪問者の IP アドレスを数か月保持します。この扱いは日英のプライバシー方針に明記しています。D-Apps は入力受付・追跡・追加の訪問者ログ保存を行いません。

- [Firebase Hosting の構成・公開・復旧手順](docs/DEPLOYMENT.md)
- [Google Cloud の専用認証とクレジット確認](docs/GOOGLE-CLOUD-AUTH.md)
- [初回公開の記録・残る確認事項・費用の前提](docs/RELEASE-READINESS.md)
- [ドメイン接続の確認資料と切戻し](docs/DOMAIN-CUTOVER.md)
- [検証記録](docs/QA.md)
- [Google Modern Web Guidance の適用](docs/MODERN-WEB-GUIDANCE.md)
- [脆弱性の報告](SECURITY.md)
- [アプリ・素材の出典と権利](THIRD-PARTY.md)

Site code is licensed under [MIT](LICENSE). Apps and third-party materials retain their respective licenses; the site license does not grant rights to every distributed app or third-party trademark.
