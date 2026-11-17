# D-Apps 専用 Google Cloud 接続

2026-11-17：AWS から Firebase Hosting へ方針変更。別プロジェクトの AWS 接続、root セッション、以前の IAM 作成承認は使用しません。本人の実行承認後、専用プロジェクト、既存請求先への接続、月次特典の適用、Firebase Hosting と GitHub WIF を設定しました。本番公開と DNS 切替は未実施です。請求先の識別子・残高・状態バックアップは非公開の運用記録に保存します。

## Google AI Pro の特典

[Google 公式 FAQ](https://developers.google.com/profile/help/benefits)では、有料 Google AI Pro と Developer Profile を連携すると毎月 US$10 の Google Cloud クレジットが提供されます。家族へのプラン共有だけではこの開発者特典は付与されません。本人のアカウントで資格と特典表示を確認します。

Cloud Billing アカウントを確認してから引き換えます。適用済みクレジットを別の請求先へ移すことはできません。将来の月次分の自動適用も、本人が対象を確認してから選びます。自動適用の選択で未適用の過去月分も同時に適用される場合があります。今回も11月の操作後に6〜10月が適用済み表示へ変わったため、本人に報告して非公開記録へ保存しました。公式条件と実際の請求画面で残高・期限・対象外製品・他プロジェクトとの共用を照合します。AI のトークン枠とは別の金銭クレジットです。

US$10 は料金への充当で、強制的な支出上限ではありません。Hosting の有料利用を充当するには、対象の請求アカウントにプロジェクトを結び、Blaze の扱いと適用条件を確認します。無料枠内ならクレジットを消費しません。プロジェクト作成・請求リンク・Blaze 切替・特典引き換えは、具体的な対象と見積りへの実行承認後に行います。

## 認証

既存の本人用 Google セッションで特典・請求先・専用プロジェクトを確認します。別プロジェクトの資格情報や既定プロジェクトにフォールバックしません。パスワード・OTP・回復コード・Cookie・秘密鍵をチャットや Git に保存しません。追加認証が必要な部分だけ本人へ戻します。

初期設定は対象プロジェクトを明示し、既存の本人セッションから Cloud Shell の一時認証を使いました。長期サービスアカウントキーは作りません。自動認証が必要な場合はユーザーの 1Password 共通手順とプロジェクトごとのアクセス範囲を守ります。今回の `prepare_worktree.py` は `SKIPPED_UNREGISTERED` であり、登録済み資格情報があるとは扱いません。

通常の公開は GitHub OIDC → Google WIF です。ステージ用ワークフローは `staging` 環境の subject からステージ用アカウントだけを借り、公開用ワークフローは `production` 環境の subject から公開用アカウントだけを借ります。Terraform は秘密キーを作成・保存しません。認証の成功、クラウド変更の許可、サイト公開の承認を区別します。

## 本人が確認する対象

- Google AI Pro 契約本人の Developer Profile のクレジット表示。
- D-Apps の Cloud Billing アカウントと、既存または新規の専用 Cloud プロジェクト。
- 月 1,000 円目標、Blaze 超過料金、予算通知先、クレジット未適用/失効時の運用。
- [公開手順](DEPLOYMENT.md)と設定差分を確認した後の、リソース作成・公開・DNS 変更の実行承認。

Route 53 は当面ドメイン/DNS 管理として残します。Google 側の確認だけのために AWS root へログインする必要はありません。

GitHub の OIDC 設定 API で `use_immutable_subject: true` を確認済みです。WIF の subject は名前だけの旧形式ではなく、所有者 ID とリポジトリ ID を含む完全一致を使います。ステージは `staging`、公開は `production` にそれぞれ結び、相手のワークフローでは借りられません。変更後の適用手順は [公開手順のチェックリスト](DEPLOYMENT.md#owner-checklist-before-the-next-stage-or-release) にあります。[GitHub の不変 subject 仕様](https://docs.github.com/en/actions/reference/security/oidc#immutable-subject-claims)を参照してください。
