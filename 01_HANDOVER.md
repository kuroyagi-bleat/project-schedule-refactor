# Project Handover Document

このドキュメントは、本プロジェクト（`project-schedule-refactor`）を新たに担当するAIエージェント/LLMに向けた引き継ぎ資料です。
このリポジトリの管理者（Supervisor LLM: Antigravity/kuroyagi）からの指示書として扱ってください。

## 1. プロジェクト概要
**Project Back-Scheduler**
プロジェクトのリリース日（完了日）から逆算してスケジュールを計画するためのWebアプリケーションです。
ブラウザ（Web版）およびChrome拡張機能（Extension版）として動作します。

## 2. 現在のステータス
- **バージョン**: v1.3.0 (2026-02-09 リリース済み)
- **状態**: 安定稼働中。主要機能（スプリント管理、逆算計算、ガントチャート、Undo/Redo、画像保存）は実装済み。
- **直近の変更**: Chrome拡張機能化、CSP対応（`html2canvas`ローカル化）、UI改善。

## 3. 技術スタック & アーキテクチャ
- **Frontend**: HTML5, CSS3, Vanilla JavaScript (ES Modules)
- **State**: `localStorage` (No Backend)
- **Platform**: Web, Chrome Extension (Manifest V3)
- **Test**: Manual (Jest導入は将来検討)

### ディレクトリ構成
```
src/
├── index.html       # エントリーポイント
├── main.js          # 初期化、イベントハンドリング
├── state.js         # 状態管理 (App State)
├── scheduler.js     # スケジュール計算ロジック
├── dateUtils.js     # 日付操作ユーティリティ
├── ui.js            # DOM操作、レンダリング
├── gantt.js         # ガントチャート描画
├── history.js       # Undo/Redo管理
├── config.js        # 定数設定
├── background.js    # Chrome Extension Service Worker
├── manifest.json    # Chrome Extension Manifest
└── lib/             # 外部ライブラリ (html2canvas)
```

## 4. 開発ルール
- **設定ファイル**: プロジェクトルートの `00_GEMINI.md` を**絶対的なルール**として参照すること。
- **ドキュメント**: `docs/` 配下の要件定義書 (`requirements.md`) や変更履歴 (`changelog.md`) を常に最新に保つこと。
- **Git運用**: `feature/xxx` ブランチで作業し、完了後に `master` へマージ。コミットメッセージは日本語で記述。
- **テスト計画**: 実装計画 (`15_implementation_plan.md`) 作成時に必ず `docs/docs/30_test_plan.md` を確認し、新規機能や変更点に対応するテストケースを追加・更新すること。

## 5. 次に取り組むべきタスク (Next Actions)
`11_TODO.md` に記載されている以下の機能追加が求められています。

1. **行程へのタグ機能追加**
   - 各フェーズに任意のタグ（例: "Design", "Dev", "QA"）を付与・表示する機能。
2. **ガントチャートのアコーディオン機能**
   - スプリント（タイムライン）ごとにガントチャートの行を折りたたみ/展開できる機能。

## 6. 既知の課題・注意点
- **Chrome拡張機能のCSP**: 外部CDNの使用は禁止。ライブラリは `src/lib/` に配置すること。
- **データ互換性**: Web版と拡張機能版は `localStorage` の領域が異なるため、データ共有には JSON Export/Import を使用する（実装済み）。

---

## ドキュメント番号の意味

- ファイル名先頭の番号は推奨読込順を表します。
- 数字が小さいほど先に読む運用です。
- `90`番台は評価・方針などの参照資料です。
