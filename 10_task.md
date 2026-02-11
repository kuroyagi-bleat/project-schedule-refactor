# project-schedule-refactor タスク

## Phase 0: 現状評価 (As-Is Analysis)
- [x] コード品質評価 → `docs/docs/91_code_quality_report.md`
- [x] UI/UX評価 → `docs/docs/92_ui_ux_report.md`
- [x] 評価統合・方針決定 → `docs/docs/90_refactoring_strategy.md`

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
    - [x] 02_README.md 作成
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

## Phase 7: 行程へのタグ機能 (Tagging)
- [x] 要件定義・設計 (Requirements & Design)
    - [x] `docs/docs/20_requirements.md` 更新
    - [x] `docs/docs/21_design.md` 更新
- [x] 実装計画 (Implementation Plan)
    - [x] `15_implementation_plan.md` 作成
- [x] 実装 (Implementation)
    - [x] データ構造変更 (`state.js`)
    - [x] UI実装 (`ui.js`, `styles.css`)
    - [x] フィルタリング機能実装
- [x] 検証 (Verification)
    - [x] 動作確認 (Monkey Test)
    - [x] ドキュメント更新 (`walkthrough.md`, `10_task.md`, `docs/docs/30_test_plan.md`)
- [x] 追加修正 (Fixes)
    - [x] Phase Steps 日付同期バグの修正 (inputイベント対応)

## Phase 8: タグ表示のUI最適化 (UI Refinement)
- [x] 実装計画 (Implementation Plan)
    - [x] `15_implementation_plan.md` 作成
- [x] 実装 (Implementation)
    - [x] `ui.js`: 日付入力の縦並び化、タグ表示エリアの常設
    - [x] `style.css`: レイアウト調整
- [x] 検証 (Verification)
    - [x] 動作確認

## Phase 10: 基準日入力のフェーズ行内統合 (Inline Anchor Editing)
- [x] 実装計画 (Implementation Plan)
    - [x] `15_implementation_plan.md` 作成
- [x] 実装 (Implementation)
    - [x] `index.html`: ヘッダーの基準日入力削除
    - [x] `ui.js`: アンカーフェーズの日付入力有効化と連携処理
- [x] 検証 (Verification)
    - [x] 動作確認 (バグ修正含む)

## Phase 9: タグフィルタ位置の変更 (Layout Adjustment)
- [x] 実装計画 (Implementation Plan)
    - [x] `15_implementation_plan.md` 作成
- [x] 実装 (Implementation)
    - [x] `index.html`: タグフィルタの移動
    - [x] `style.css`: スタイル調整
- [x] 検証 (Verification)
    - [x] 動作確認




## Phase 6: Chrome拡張機能化 (Extension)
- [x] manifest.json 作成
- [x] アイコン作成・配置
- [x] バックグラウンドスクリプト作成 (新規タブで開く挙動)
- [x] 動作検証 (chrome://extensions)


## Phase 11: 並行工程の営業日考慮 (Parallel Phase Business Days)
- [x] 実装計画 (Implementation Plan)
    - [x] `15_implementation_plan.md` 作成
- [x] 実装 (Implementation)
    - [x] `dateUtils.js`: `getBusinessDaysDiff` 追加
    - [x] `scheduler.js`: 並行工程計算ロジック修正
- [x] 検証 (Verification)
    - [x] 動作確認 (Tests)

## Phase 12: 行程の複数選択・一括移動 (Multi-Phase Reordering)
- [ ] 実装計画 (Implementation Plan)
    - [ ] `15_implementation_plan.md` 更新 (Multi-Select対応)
- [ ] 実装 (Implementation)
    - [ ] `state.js`: 選択状態管理 (`selectedPhases`) 追加
    - [ ] `ui.js`: 選択操作 (Click, Shift+Click, Cmd+Click) イベント実装
    - [ ] `ui.js`: 複数ドラッグ＆ドロップロジック実装
    - [ ] `style.css`: 選択中・ドラッグ中のスタイル
- [ ] 検証 (Verification)
    - [ ] 動作確認 (Manual Test)

---

## ドキュメント番号の意味

- ファイル名先頭の番号は推奨読込順を表します。
- 数字が小さいほど先に読む運用です。
- `90`番台は評価・方針などの参照資料です。
