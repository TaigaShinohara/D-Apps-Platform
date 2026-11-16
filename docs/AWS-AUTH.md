# D-Apps 専用の AWS 接続

状態：ローカルの接続入口を準備済み。AWS へのログイン・対象アカウント・IAM 権限の確認は別の完了条件です。既存の `default` / `taiga_deeple_dev` / `deeplink-dev`、他プロジェクトの 1Password 参照は読み込まず、コピーしません。

## 認証方法

AWS CLI の `aws login` でブラウザから短期認証を取得します。長期アクセスキーを新規作成しません。コンソールのサインインには既存の 1Password 登録を本人が利用し、パスワード・MFA・認証 URL・コードをチャットへ貼り付けません。

専用の `d-apps-readonly` プロファイル、設定ファイル、ログインキャッシュを `.artifacts/aws-auth/` に分離します。ディレクトリは 0700、設定ファイルは 0600、Git 追跡対象外です。AWS が作る短期認証キャッシュには秘密値が含まれるため、内容を表示・共有・コミットしません。HOME や `~/.aws/`、既存 CLI は変更しません。

**プロファイルの分離は IAM の権限制限ではありません。** ブラウザでは D-Apps の管理先として意図した、読み取り用の非 root IAM 利用者またはロールを選びます。既存の Deeplink 用主体を選び直して流用しません。D-Apps 用主体がまだない場合はそこで止め、管理者が付与する権限・信頼先を具体化してから作成します。権限を自動的に拡大しません。

コンソール IAM ログインには `SignInLocalDevelopmentAccess` 相当の権限が必要です。IAM Identity Center (SSO) 利用者は別の専用 SSO 設定が必要で、この入口に既存 SSO プロファイルを渡しません。

## この Mac の CLI

既存 CLI 2.17.46 は `aws login` に未対応のため、公式 macOS パッケージ 2.40.3 をプロジェクト内へ展開しました。システムへのインストールや更新はしていません。

- 取得元：`https://awscli.amazonaws.com/AWSCLIV2-2.40.3.pkg`
- SHA-256：`be032742ff205f7f2d7c189010bbb1f3891d0a67be0b1df0fe9d3e7f5fc5ad30`
- `pkgutil --check-signature`：Apple が信頼する署名・公証を確認。
- 署名者：`Developer ID Installer: AMZN Mobile LLC (94KV3E626L)`
- 展開先：`.artifacts/tools/awscli-2.40.3/`
- 実行結果：`aws-cli/2.40.3` / arm64。

別の Mac では公式パッケージの署名を確認してから `pkgutil --expand-full` で上記ディレクトリへ展開します。未検証の実行ファイルを同じ場所へ置かないでください。Linux/Windows 用の自動セットアップは含めません。

## 操作

リポジトリのルートから実行します。

```sh
node scripts/aws-readonly.mjs setup
node scripts/aws-readonly.mjs login
node scripts/aws-readonly.mjs identity
node scripts/aws-readonly.mjs zones
```

`login` は通常のブラウザを開き、本人のサインインを最大 5 分待ちます。CLI の認証 URL やコードは出力しません。本人操作が終わるまで、接続成功とは扱いません。選択した主体が root の場合は、アカウント照会を拒否します。

`identity` でアカウントと非 root 主体を確認し、`zones` で `deepledeeple.com.` の公開 hosted zone を照合します。この入口はこの 2 つの読み取り API と専用セッションのログイン・ログアウトだけに対応します。AWS の任意コマンド、別プロファイル、endpoint、debug、認証情報の出力、リソース作成・変更は渡せません。親プロセスの `AWS_*` 変数も継承しません。これは操作ミスを防ぐ入口であり、IAM ポリシーの代わりではありません。

STS `GetCallerIdentity` の成功と業務 API の認可は別に確認します。AdministratorAccess や IAM 書き込み権限をこの入口のために付与しません。

```sh
# D-Apps の CLI セッションだけを終了する
node scripts/aws-readonly.mjs logout
```

ログイン成功でも公開承認済みとは扱いません。AWS リソース作成・DNS 切替は [公開手順](DEPLOYMENT.md) の確認後に行います。

## 専用 IAM 利用者の作成案（未実行）

本人がブラウザで選択した初回の主体は root でした。入口が検出して業務 API の実行を止め、D-Apps 用 CLI セッションだけをログアウト済みです。ブラウザのコンソールセッションは変更していません。

`infra/auth-readonly.json` は、IAM 利用者 `DAppsReadOnly` と、そのインラインポリシーを作成するためのレビュー用 CloudFormation テンプレートです。**まだ AWS には適用していません。** 権限を新設するため、本人の実行承認後に、対象アカウントと同名利用者の有無を確認して適用します。既存利用者の上書き・権限追加は行いません。

| 項目               | 設定案                                                                                                                                   |
| ------------------ | ---------------------------------------------------------------------------------------------------------------------------------------- |
| ローカル認証       | 同じ端末の `aws login` のみ                                                                                                              |
| 読み取り範囲       | Route 53 のゾーン/レコード、CloudFront/WAF/CloudTrail/ログ配信の設定、契約プラン、組織所属、利用可能リージョン、GitHub OIDC プロバイダー |
| S3                 | `d-apps-*` バケットの設定だけ。オブジェクト・訪問者ログ本文は読まない                                                                    |
| 書き込み           | サイト配置、DNS変更、プラン契約、IAM変更、削除の許可なし                                                                                 |
| 秘密情報           | 長期アクセスキーとパスワードをテンプレートで作らない。Secrets Manager/SSM の秘密取得権限なし                                             |
| コンソール初回設定 | 作成後、本人が AWS コンソールでパスワードを 1Password に設定し、MFA を登録する。秘密値は AI に渡さない                                   |

ログの保存経路は複数の既存サービスにまたがるため、その設定の照会はアカウント内の一覧権限を含みます。ホストゾーン等の識別子が判明したら、リソース単位の権限をさらに限定します。組織側で別途拒否される場合は確認不能として記録し、権限を広げて迂回しません。IAM ポリシー追加やコンソールの初回設定は、ローカルプロファイルの作成とは別の操作です。

## 公式資料

- [AWS CLI のコンソールログイン](https://docs.aws.amazon.com/cli/latest/userguide/cli-configure-sign-in.html)
- [login コマンドとキャッシュの分離](https://docs.aws.amazon.com/cli/latest/reference/login/)
- [SignInLocalDevelopmentAccess](https://docs.aws.amazon.com/aws-managed-policy/latest/reference/SignInLocalDevelopmentAccess.html)
- [AWS CLI の公式インストール手順](https://docs.aws.amazon.com/cli/latest/userguide/getting-started-install.html)
