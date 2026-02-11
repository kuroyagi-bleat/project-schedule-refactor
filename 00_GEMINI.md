# project-schedule-refactor Configuration

## プロジェクト概要
プロジェクトのスケジュールを**逆算**で計画できるWebアプリケーション「Project Back-Scheduler」。
リリース日（完了日）を基準に、各工程の所要日数を入力することで、開始日や中間期限を自動計算します。
Chrome拡張機能としても動作し、ブラウザの新規タブで利用可能です。

## 技術スタック
- **Frontend**: HTML5, CSS3, Vanilla JavaScript (ES Modules)
- **State Management**: LocalStorage
- **Platform**: Web, Chrome Extension (Manifest V3)
- **Build Tool**: なし (Standard Web Technologies)

## 開発フロー
Antigravity Standard Flow (`00_GEMINI.md` Global) に準拠。

### テスト実行時の例外処理 (Browser Launch Failure)
自動テスト実行時、ブラウザの起動に失敗した場合（E2Eテスト等）は、以下の手順で処理を中断し、ユーザーへ通知してください。

1. **即時中断**: エラーを検知した時点でテストプロセスを終了する。
2. **通知**: `notify_user` ツールを使用し、「ブラウザ起動に失敗しました。GUI環境での確認をお願いします」と伝える。
3. **対処**: 無理にヘッドレスモードでの再試行を行わず、人間の目視確認を促す。

---

## ドキュメント番号の意味

- ファイル名先頭の番号は推奨読込順を表します。
- 数字が小さいほど先に読む運用です。
- `90`番台は評価・方針などの参照資料です。
