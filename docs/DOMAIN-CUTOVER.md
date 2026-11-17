# deepledeeple.com の公開・DNS接続確認資料

2026-11-17。配信先は Firebase Hosting の専用サイト `d-apps-deepledeeple`。この資料の作成では Hosting release、カスタムドメイン登録、DNS変更を行っていません。ドメイン登録とネームサーバーは Route 53 のまま使用します。

## 読み取りで確認した現状

2026-11-17 05:10 UTC に公開DNSを照会しました。記録はローカルの `.artifacts/qa/site-readiness/dns-before.json` に保存しています。これは公開応答の確認であり、Route 53 のゾーン全体を取得した結果ではありません。

| 名前                   | 種別                              | 公開応答                                                                                           | 接続時の扱い      |
| ---------------------- | --------------------------------- | -------------------------------------------------------------------------------------------------- | ----------------- |
| `deepledeeple.com`     | NS                                | `ns-508.awsdns-63.com`, `ns-939.awsdns-53.net`, `ns-1428.awsdns-50.org`, `ns-1814.awsdns-34.co.uk` | 維持              |
| `deepledeeple.com`     | MX / TTL 300                      | `10 inbound-smtp.us-east-1.amazonaws.com.`                                                         | メール用。維持    |
| `deepledeeple.com`     | TXT / TTL 300                     | `v=spf1 include:amazonses.com ~all`                                                                | SPF。置換せず維持 |
| `deepledeeple.com`     | A / AAAA / CNAME / CAA            | 応答なし                                                                                           | 実行直前に再確認  |
| `www.deepledeeple.com` | A / AAAA / CNAME / MX / TXT / CAA | 応答なし                                                                                           | 実行直前に再確認  |

Firebase REST の [customDomains.create](https://firebase.google.com/docs/reference/hosting/rest/v1beta1/projects.sites.customDomains/create) を `validateOnly=true` で実行し、apex と `www`（`redirectTarget=deepledeeple.com`）の両方が HTTP 200 を返しました。直後の一覧は空で、カスタムドメインが作成されていないことを確認しました。この検証は証明書の発行・接続完了を意味しません。dry-run の操作IDは永続化されず、読み戻しは404でした。接続先のIPや証明書チャレンジは返されていません。

## 公開承認後に確定・実行する差分

1. 公開する main コミット、成功したCI、非公開ステージの版名・bundle digestを照合する。OneClipの基本動作と、人による残りの利用確認を完了する。初回は現在の live が `NONE` であることを再確認する。
2. Route 53 の既存ゾーンから、対象名の全レコード・TTL・Alias・ルーティングポリシーを非公開ファイルに退避する。公開DNSだけで「他のレコードがない」と判断しない。AWS rootによる常用運用は行わず、対象ゾーンに限定した運用者の接続で実施する。
3. Firebase に apex を登録し、`www` は apex への301転送として登録する。[公式の接続手順](https://firebase.google.com/docs/hosting/custom-domain)とサービスが返す `requiredDnsUpdates` を照合する。**実際に返された値だけ**で Route 53 の変更バッチを作る。一般的なIPや未取得の検証値を埋めて実行しない。
4. TXTの所有権確認が要求された場合、既存SPFと同じTXTレコードセットに独立した値として追加する。既存値を消さず、SPF文字列の中へ連結しない。証明書用の追加TXT/CAAが必要なら、その名前と値も差分に含める。DKIM・DMARC・MX・NS・SOAや他のサブドメインは変更しない。
5. 承認された Hosting release を公開する。この時点で `d-apps-deepledeeple.web.app` と `d-apps-deepledeeple.firebaseapp.com` に一般公開される。標準ホストでもHTTPS・日英ページ・404・ダウンロードのハッシュを検証する。
6. 対象名だけのDNS変更を適用し、権威DNS・公開DNS・Firebaseのドメイン/証明書状態を確認する。TLSエラーを回避して公開成功扱いにしない。現在はA等が未設定のため旧Webサイトからの移行ではないが、メール配信への影響がないことを確認する。

ここまでの準備時点では、最終的なIP・所有権/証明書値とAWSゾーン内の差分は未確定です。これはサイトコードの不足ではなく、承認後の実接続に伴う確認です。自動的なNS移管・DNS全置換は行いません。

## 公開直後の確認

以下はローカル試験で代替せず、実際の配信結果を記録します。

- apex・`www`・両標準ホストのHTTPS、HTTPからの転送、`www`からapexへのパス維持、`/`から`/ja/`への案内。
- 日英ページ、言語切替、canonical/hreflang、404、配布停止URL、予約 `/__/` パス。Googleが生成する応答は通常ページと分けてヘッダーを記録する。
- OneClip ZIPのGET/HEAD/Range、サイズ、SHA-256、Content-Type・Content-Disposition・キャッシュ方針。
- CSP、nosniff、クリックジャッキング対策、Referrer制限、Permissions-Policy、HSTS。非GET/HEADの応答を記録し、静的内容が変化しないことを確認する。
- 新規ブラウザで不要な外部通信・Cookie・ブラウザ保存がないこと。プロジェクトの追加ログ転送・Analytics接続が増えていないこと。
- モバイル条件のLighthouseと主要導線。費用/転送量/保存量の集計値と共用クレジット残高。

## 停止と切戻し

コンテンツ不具合は、直前の検証済み内容を新しいコミットで復元し、現在の配布停止リストと配布URLの固定記録を維持して、同じステージ/公開手順を通します。旧版をコンソールで直接再公開すると停止済みの配布物が戻るため使用しません。

配布物の問題では、対象URLを停止リストに追加した版を公開し、全ホストでリンク除外・GET/HEAD/Rangeの404を確認します。既に利用者が取得したファイルは回収できません。

DNSの切戻しは事前退避した**対象レコードだけ**を復元します。今回追加した値も、その後の変更がないことを確認してから戻します。DNSを戻しても標準ホストの公開は止まりません。サイト全体の停止が必要なら、その範囲を確認してHostingの停止操作と全ホストの検証を別に実施します。
