# dobulab.com の公開・DNS接続確認資料

2026-11-17。正規URLは `https://dobulab.com`、`www.dobulab.com` は正規URLへの301転送として接続します。配信先は既存の Firebase Hosting サイト `d-apps-deepledeeple` です。登録とDNSの管理は Route 53 を使います。旧 `deepledeeple.com` 向けの変更案は適用対象から外しています。

## 読み取りで確認した現状

2026-11-17に公開DNSを照会し、Route 53 の委任を確認しました。切替前の状態を把握するための照会で、ゾーン全体の設定は対象アカウントで確認します。

| 名前              | 種別                      | 公開応答                                                                                           | 接続時の扱い     |
| ----------------- | ------------------------- | -------------------------------------------------------------------------------------------------- | ---------------- |
| `dobulab.com`     | NS                        | `ns-1403.awsdns-47.org`, `ns-1564.awsdns-03.co.uk`, `ns-351.awsdns-43.com`, `ns-873.awsdns-45.net` | 維持             |
| `dobulab.com`     | A / AAAA / MX / TXT / CAA | 該当レコードの回答なし                                                                             | 実行直前に再確認 |
| `www.dobulab.com` | A / CNAME                 | NXDOMAIN                                                                                           | 実行直前に再確認 |

Firebaseで `dobulab.com` と `www.dobulab.com` の登録と転送先を読み戻しました。所有権・証明書は検証待ちです。DNS要求値と証明書の検証値は非公開の作業記録に保存しています。適用前にFirebaseの最新値と対象ゾーンの現状を照合します。

## 公開承認後に確定・実行する差分

1. 公開する main コミット、成功したCI、非公開ステージの版名・bundle digestを照合する。OneClipの基本動作と、人による残りの利用確認を完了する。初回は現在の live が `NONE` であることを再確認する。
2. Route 53 の既存ゾーンから、対象名の全レコード・TTL・Alias・ルーティングポリシーを非公開ファイルに退避する。公開DNSだけで「他のレコードがない」と判断しない。AWS rootによる常用運用は行わず、対象ゾーンに限定した運用者の接続で実施する。
3. Firebase で `dobulab.com` と `www.dobulab.com` の登録、`www` の転送先が `dobulab.com` であることを確認する。[公式の接続手順](https://firebase.google.com/docs/hosting/custom-domain)と `requiredDnsUpdates` を照合し、サービスが返した値で Route 53 の変更案を確定する。
4. 所有権確認用のTXTは独立した値として追加する。同名のTXTが既にある場合は全値を引き継ぐ。証明書用のTXT/CAAが必要なら、その名前と値も差分に含める。DKIM・DMARC・MX・NS・SOAや他のサブドメインは維持する。
5. 承認された Hosting release を公開する。この時点で `d-apps-deepledeeple.web.app` と `d-apps-deepledeeple.firebaseapp.com` に一般公開される。標準ホストでもHTTPS・日英ページ・404・ダウンロードのハッシュを検証する。
6. 承認されたDNS差分を適用し、権威DNS・公開DNS・Firebaseのドメイン/証明書状態を確認する。HTTPS接続と既存サービスへの影響も確認する。

DNSの最終差分はFirebaseから取得した名前・種別・値と、Route 53の対象ゾーンを照合して確定します。本番公開とDNS適用は実行承認後に進めます。

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
