# Implementation Plan - Phase 17: リファクタリングとUI改善

CodeXによるコードレビュー結果 (`docs/32_ui_source_review_2026-02-11.md`) に基づき、バグ修正とコード品質の向上、UIの微調整を行います。

## User Review Required
> [!IMPORTANT]
> `src/ui.js` 内の `attachPhaseListeners` を削除します。これは `main.js` に移行済みの機能の残骸（デッドコード）であり、削除による機能影響はないはずですが、念のため各種操作（アンカー変更、日付入力など）の動作確認を入念に行います。

## Proposed Changes

### P0: バグ修正 (Critical)
#### [MODIFY] [main.js](file:///Users/wakaumekenji/Desktop/work/project-schedule-refactor/src/main.js)
- `restoreState` を `state.js` からインポートするように修正（Undo/Redo時のクラッシュ防止）。

### P1: 保守性・品質向上 (High)
#### [MODIFY] [main.js](file:///Users/wakaumekenji/Desktop/work/project-schedule-refactor/src/main.js)
- モーダル (`showConfirm`, `showAlert`) のイベントリスナー（keydown）が確実に削除されるようにクリーンアップ処理を強化。
- `initUI` 等の初期化フローを再確認。

#### [MODIFY] [ui.js](file:///Users/wakaumekenji/Desktop/work/project-schedule-refactor/src/ui.js)
- 未使用の `attachPhaseListeners` 関数を削除。

### U1-U4: UI/UX改善 (Low)
#### [MODIFY] [index.html](file:///Users/wakaumekenji/Desktop/work/project-schedule-refactor/src/index.html)
- 英語・日本語が混在しているラベルを日本語に統一（例: `Save (Env)` -> `保存`）。
- 設定パネル開閉ボタンに `aria-expanded` 属性などを追加し、状態を分かりやすくする。

#### [MODIFY] [main.js](file:///Users/wakaumekenji/Desktop/work/project-schedule-refactor/src/main.js)
- クリップボードコピー時の日付フォーマットを `YYYY-MM-DD` (`2026-02-11`) に修正（余分なスペース削除）。
- 設定パネル開閉時にボタンのラベルやアイコン状態を更新するロジックを追加。

#### [MODIFY] [style.css](file:///Users/wakaumekenji/Desktop/work/project-schedule-refactor/src/style.css)
- 重複しているCSS定義（`.phase-days`, `.phase-name-input` 等）を整理・統合。

## Verification Plan

### Automated Tests (Browser Subagent)
- **UI Text Check**: ボタンやラベルが日本語に統一されているか確認。
- **Copy Text Check**: 「テキストコピー」ボタンを押し、クリップボードの内容（またはalert用のテキスト生成ロジック）が正しいフォーマットか確認。
- **Undo/Redo**: フェーズ削除などの操作を行い、Undo/Redo がエラーなく動作するか確認。

### Manual Verification
- **Settings Panel**: 開閉ボタンの表示切り替え確認。
- **Interaction**: デッドコード削除後も、フェーズ入力、アンカー変更、タグ操作などが正常に動くか確認。
