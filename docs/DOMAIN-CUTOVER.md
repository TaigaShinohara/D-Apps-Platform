# dobulab.com の公開・DNS接続確認資料

2026-11-17に `https://dobulab.com` を正規URLとして公開しました。`www.dobulab.com` はパスを維持して正規URLに301転送します。配信先は Firebase Hosting の `d-apps-deepledeeple`、DNSの管理は Route 53 です。

## 初回接続の確認結果

正規URL・両Firebase標準ホストのHTTPS、`www` の301転送、OneClip ZIPのハッシュと部分取得を確認しました。既存メールのDNS設定は維持しました。切替時のDNS差分と復旧用の情報は非公開の運用記録に保存しています。

## ドメインを再接続する場合

1. 現在の Hosting の live 版とドメイン設定を確認する。コンテンツも変更する場合は[公開手順](DEPLOYMENT.md#reviewed-release-sequence)に従う。
2. Route 53 の既存ゾーンから、対象名の全レコード・TTL・Alias・ルーティングポリシーを非公開ファイルに退避する。公開DNSだけで「他のレコードがない」と判断しない。AWS rootによる常用運用は行わず、対象ゾーンに限定した運用者の接続で実施する。
3. Firebase で `dobulab.com` と `www.dobulab.com` の登録、`www` の転送先が `dobulab.com` であることを確認する。[公式の接続手順](https://firebase.google.com/docs/hosting/custom-domain)と `requiredDnsUpdates` を照合し、サービスが返した値で Route 53 の変更案を確定する。
4. 所有権確認用のTXTは独立した値として追加する。同名のTXTが既にある場合は全値を引き継ぐ。証明書用のTXT/CAAが必要なら、その名前と値も差分に含める。DKIM・DMARC・MX・NS・SOAや他のサブドメインは維持する。
5. 承認されたDNS差分を適用し、権威DNS・公開DNS・Firebaseのドメインと証明書の状態を確認する。HTTPS接続と既存サービスへの影響も確認する。

DNSの差分はFirebaseから取得した名前・種別・値と、Route 53の対象ゾーンを照合して確定します。DNS変更は実行承認後に進めます。

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
