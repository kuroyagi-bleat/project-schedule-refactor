# Phase 18 実装計画: 重要バグ修正と残存課題対応

## 目的 (Goal)
`docs/33_ui_source_recheck_2026-02-12.md` で指摘された、モーダルダイアログ（`showConfirm`, `showAlert`）のイベントハンドラ欠落による操作不能バグ（P0）を修正します。
あわせて、軽微なCSS重複（`.date-separator`）を整理します。

## ユーザーレビュー事項 (User Review Required)
特になし（バグ修正のため）。

## 変更内容 (Proposed Changes)

### `src/main.js`
- **[修正]** `showConfirm` および `showAlert` 関数内で、`okBtn` と `cancelBtn` の `onclick` イベントハンドラを復元します。
- **[修正]** Promiseが正しく解決（resolve）され、同時にイベントリスナーのクリーンアップ（`cleanup`）が確実に実行されるようにします。

### `src/style.css`
- **[リファクタリング]** 重複して定義されている `.date-separator` のスタイル定義を検索し、一つに統合します。

## 検証計画 (Verification Plan)

### 自動検証 (Automated Verification)
1. **確認ダイアログ (Confirm Dialog)**:
   - 削除操作などをトリガーしてダイアログを表示させる。
   - 「キャンセル」をクリック -> ダイアログが閉じ、処理が中断されること。
   - 「OK」をクリック -> ダイアログが閉じ、処理が実行されること。
2. **アラートダイアログ (Alert Dialog)**:
   - アラート（例: JSONエクスポート成功時など）を表示させる。
   - 「OK」をクリック -> ダイアログが閉じること。

### 手動検証 (Manual Verification)
- ブラウザ上で実際に削除ボタン等を押し、ダイアログの応答性を確認します。
