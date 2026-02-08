# project-schedule-refactor タスク

## Phase 0: 現状評価 (As-Is Analysis)
- [x] コード品質評価 → `docs/code_quality_report.md`
- [x] UI/UX評価 → `docs/ui_ux_report.md`
- [x] 評価統合・方針決定 → `docs/refactoring_strategy.md`

## Phase 1: リファクタリング (Refactoring)
- [x] コードのモジュール分割 (7ファイル)
- [x] XSSエスケープ導入
- [x] 動作検証

## Phase 2: UI/UXリデザイン (Redesign)
- [x] Timeline選択をヘッダーに移動
- [x] マージン縮小 (`2rem` → `1rem`)
- [x] デザイントーン変更 (glassmorphism削除)
- [x] **Anchor設定をPhase Stepsに統合** ← NEW
    - [x] 開始/完了ラジオボタン追加
    - [x] Anchor Barを日付のみに簡素化
- [x] 動作検証

## Phase 3: 機能強化 (Enhancement)
- [x] Undo/Redo実装
- [x] キーボードショートカット

## Phase 4: リリース (Release)
- [x] GitHub登録準備
    - [x] feature/phase3 を master にマージ
    - [x] README.md 作成
    - [x] .gitignore 確認・整備
- [x] ドキュメント整備
    - [x] v1.1.0 タグ付け

## Phase 5: UI/UX改善

### ユーザー追加要望
- [x] 基準日をPhase Stepsパネル右上に移動
- [x] Phase Steps左側に現在のスプリント名を表示
- [x] 完了ラジオボタンを終了日の前に配置
- [x] ガントチャート描画不具合修正 (v1.0.1)

### 改善候補
- [x] 1. Settingsセクションをトグル式に（デフォルト閉じ）
- [x] 2. Phase Steps行の改善（密度、ホバーエフェクト）
- [x] 3. 左カラム（Schedule）の視覚的改善
- [x] 4. ガントチャートの視認性向上
- [x] 5. レスポンシブ対応
- [ ] ~~6. ダークモード/ライトモード切替~~ → 見送り（Phase 5スコープ外）

## Phase 6: Chrome拡張機能化 (Extension)
- [x] manifest.json 作成
- [x] アイコン作成・配置
- [x] バックグラウンドスクリプト作成 (新規タブで開く挙動)
- [x] 動作検証 (chrome://extensions)

